import type { MindMapAIGenerator, MindMapAIGeneratorInput } from './ai-generation'

export type MindMapAICompletionPolicy = 'strict' | 'legacy'
export type MindMapAICompletionStatus = 'normal' | 'incomplete' | 'blocked' | 'unknown'
export interface MindMapAICompletion {
  readonly status: MindMapAICompletionStatus
  readonly finishReason: string | null
  readonly responseType: 'sse' | 'json'
}
export type MindMapAIErrorCode = 'incomplete' | 'content_filter' | 'invalid_response' | 'provider_error'

const AI_ERROR_MESSAGES: Record<MindMapAIErrorCode, string> = {
  incomplete: 'AI generation ended before completion.',
  content_filter: 'AI generation was stopped by the provider.',
  invalid_response: 'AI provider returned an invalid or unverified response.',
  provider_error: 'AI provider request failed.',
}

export class MindMapAIError extends Error {
  readonly code: MindMapAIErrorCode
  readonly finishReason: string | null

  constructor(code: MindMapAIErrorCode, options: { finishReason?: string | null; cause?: unknown } = {}) {
    super(AI_ERROR_MESSAGES[code], { cause: options.cause })
    this.name = 'MindMapAIError'
    this.code = code
    this.finishReason = options.finishReason ?? null
  }
}

export type AIAttachmentType = 'text' | 'image' | 'pdf'
export class MindMapAttachmentError extends Error {
  readonly code: 'size' | 'type' | 'read' | 'count' | 'total-size'

  constructor(code: 'size' | 'type' | 'read' | 'count' | 'total-size') {
    super(`Attachment ${code} error`)
    this.code = code
    this.name = 'MindMapAttachmentError'
  }
}
export interface MindMapAIAttachment {
  name: string
  type: AIAttachmentType
  mimeType: string
  text?: string
  dataUrl?: string
}
export type MindMapAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; file_data: string } }
export interface MindMapAIRequestPayload {
  apiUrl: string
  apiKey?: string
  model: string
  messages: Array<{ role: 'system' | 'user'; content: string | MindMapAIContentPart[] }>
  headers: Record<string, string>
  body: string
  signal: AbortSignal
  attachments: readonly MindMapAIAttachment[]
}
export interface MindMapAIAttachmentLimits {
  /** Per-file byte limit; defaults to 5 MiB. */
  maxAttachmentSize?: number
  /** Total selected file count; defaults to 10. */
  maxAttachments?: number
  /** Total selected source bytes; defaults to 20 MiB. */
  maxTotalAttachmentSize?: number
  /** Concurrent file readers; defaults to 3. */
  attachmentReadConcurrency?: number
}

export interface MindMapAIConfig extends MindMapAIAttachmentLimits {
  /** Use a host/server proxy endpoint to keep provider credentials off the client. */
  apiUrl: string
  apiKey?: string
  model: string
  systemPrompt?: string
  attachments?: readonly AIAttachmentType[]
  headers?: Record<string, string>
  request?: (payload: MindMapAIRequestPayload) => Promise<Response>
  /** Legacy (default) permits missing completion reasons; strict requires stop. Explicit failures always reject. */
  completionPolicy?: MindMapAICompletionPolicy
  /** Provider completion metadata, without generated content. Unknown in legacy mode is not verified completion. */
  onCompletion?: (completion: MindMapAICompletion) => void
}

export function buildMindMapAIRequest(config: MindMapAIConfig, input: MindMapAIGeneratorInput): MindMapAIRequestPayload {
  const content: MindMapAIContentPart[] = [{ type: 'text', text: `Current mind map:\n${input.markdown}\n\nRequest:\n${input.prompt}` }]
  for (const attachment of input.attachments ?? []) {
    if (attachment.type === 'text') content.push({ type: 'text', text: `[${attachment.name}]\n${attachment.text ?? ''}` })
    if (attachment.type === 'image' && attachment.dataUrl) content.push({ type: 'image_url', image_url: { url: attachment.dataUrl } })
    // Chat Completions file input preserves actual PDF bytes for host adapters/providers.
    if (attachment.type === 'pdf' && attachment.dataUrl) content.push({ type: 'file', file: { filename: attachment.name, file_data: attachment.dataUrl } })
  }
  const messages: MindMapAIRequestPayload['messages'] = [
    { role: 'system', content: config.systemPrompt ?? 'Return only a Markdown mind map. Use a root title and indented list items. Do not wrap the output in a code fence.' },
    { role: 'user', content },
  ]
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}), ...config.headers }
  return { apiUrl: config.apiUrl, apiKey: config.apiKey, model: config.model, messages, headers, body: JSON.stringify({ model: config.model, messages, stream: true }), signal: input.signal, attachments: input.attachments ?? [] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseResponse(data: string): Record<string, unknown> {
  let value: unknown
  try { value = JSON.parse(data) } catch (cause) { throw new MindMapAIError('invalid_response', { cause }) }
  if (!isRecord(value)) throw new MindMapAIError('invalid_response')
  if (value.error !== undefined && value.error !== null) throw new MindMapAIError('provider_error', { cause: value.error })
  return value
}

function readChoice(value: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!Array.isArray(value.choices)) throw new MindMapAIError('invalid_response')
  const choices: Record<string, unknown>[] = []
  for (const choice of value.choices) {
    if (!isRecord(choice) || (choice.index !== undefined && (!Number.isSafeInteger(choice.index) || Number(choice.index) < 0))) {
      throw new MindMapAIError('invalid_response')
    }
    choices.push(choice)
  }
  if (choices.filter((choice) => choice.index === 0).length > 1) throw new MindMapAIError('invalid_response')
  // Some compatible services omit index; never mix a different indexed choice into choice zero.
  return choices.find((choice) => choice.index === 0) ?? (choices.every((choice) => choice.index === undefined) ? choices[0] : undefined)
}

function completionStatus(reason: string | null): MindMapAICompletionStatus {
  if (reason === 'stop') return 'normal'
  if (reason === 'length') return 'incomplete'
  if (reason === 'content_filter') return 'blocked'
  return 'unknown'
}

export async function* readMindMapAIStream(
  response: Response,
  signal: AbortSignal,
  options: Pick<MindMapAIConfig, 'completionPolicy' | 'onCompletion'> = {},
): AsyncGenerator<string> {
  if (signal.aborted || !response.ok) {
    await response.body?.cancel().catch(() => undefined)
    if (signal.aborted) return
    throw new MindMapAIError('provider_error', { cause: { status: response.status } })
  }
  if (!response.body) throw new MindMapAIError('invalid_response')
  const isStream = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() === 'text/event-stream'
  const responseType = isStream ? 'sse' : 'json'
  let reader: ReadableStreamDefaultReader<Uint8Array>
  try { reader = response.body.getReader() } catch (cause) { throw new MindMapAIError('invalid_response', { cause }) }
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let buffer = ''
  let trailingCR = false
  let finishReason: string | null = null
  let hasContent = false
  const cancel = () => { void reader.cancel().catch(() => undefined) }
  const reportCompletion = () => options.onCompletion?.({ status: completionStatus(finishReason), finishReason, responseType })
  function readContent(value: Record<string, unknown>): string {
    const choice = readChoice(value)
    if (!choice) return '' // Empty usage chunks and other choices do not complete choice zero.
    const reason = choice.finish_reason
    if (reason !== undefined && reason !== null) {
      if (typeof reason !== 'string') throw new MindMapAIError('invalid_response', { cause: reason })
      if (reason !== 'stop') {
        finishReason = reason
        reportCompletion()
        throw new MindMapAIError(reason === 'length' ? 'incomplete' : reason === 'content_filter' ? 'content_filter' : 'invalid_response', { finishReason })
      }
    }
    const message = isStream ? choice.delta : choice.message
    if (message !== undefined && !isRecord(message)) throw new MindMapAIError('invalid_response')
    if (message === undefined && (!isStream || reason == null)) throw new MindMapAIError('invalid_response')
    const content = message?.content
    if (content !== undefined && content !== null && typeof content !== 'string') throw new MindMapAIError('invalid_response')
    const text = typeof content === 'string' ? content : ''
    if (finishReason !== null && text) throw new MindMapAIError('invalid_response', { finishReason })
    if (reason === 'stop') finishReason = reason
    if (text.trim()) hasContent = true
    return text
  }
  function finish(): void {
    if (!hasContent) throw new MindMapAIError('invalid_response', { finishReason })
    reportCompletion()
    if (finishReason === null && options.completionPolicy === 'strict') throw new MindMapAIError('invalid_response')
  }
  function readEvent(event: string): { done: boolean; text: string } {
    if (event.length > 1_000_000) throw new MindMapAIError('invalid_response')
    const lines = event.split('\n')
    const data = lines.filter((line) => line === 'data' || line.startsWith('data:')).map((line) => line.slice(5).replace(/^ /, '')).join('\n')
    if (!data) return { done: false, text: '' }
    if (data.trim() === '[DONE]') return { done: true, text: '' }
    const value = parseResponse(data)
    if (lines.some((line) => /^event: ?error$/.test(line))) throw new MindMapAIError('provider_error', { cause: value })
    return { done: false, text: readContent(value) }
  }
  signal.addEventListener('abort', cancel, { once: true })
  try {
    while (!signal.aborted) {
      let frame: ReadableStreamReadResult<Uint8Array>
      try { frame = await reader.read() } catch (cause) {
        if (signal.aborted) return
        throw new MindMapAIError('provider_error', { cause })
      }
      if (signal.aborted) return
      const { value, done } = frame
      let decoded: string
      try { decoded = done ? decoder.decode() : decoder.decode(value, { stream: true }) } catch (cause) {
        throw new MindMapAIError('invalid_response', { cause })
      }
      if (!isStream) {
        buffer += decoded
        if (buffer.length > 1_000_000) throw new MindMapAIError('invalid_response')
        if (!done) continue
        const content = readContent(parseResponse(buffer))
        finish()
        if (!signal.aborted) yield content
        return
      }
      // Normalize SSE line endings only after a split CRLF pair has been rejoined.
      if (trailingCR) decoded = '\r' + decoded
      trailingCR = !done && decoded.endsWith('\r')
      if (trailingCR) decoded = decoded.slice(0, -1)
      buffer += decoded.replace(/\r\n?/g, '\n')
      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const event = readEvent(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        if (event.done) { finish(); return }
        if (event.text && !signal.aborted) yield event.text
        if (signal.aborted) return
        boundary = buffer.indexOf('\n\n')
      }
      if (buffer.length > 1_000_000) throw new MindMapAIError('invalid_response')
      if (done) {
        const event = readEvent(buffer)
        if (event.text && !signal.aborted) yield event.text
        if (!signal.aborted) finish()
        return
      }
    }
  } finally {
    signal.removeEventListener('abort', cancel)
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export function createOpenAICompatibleGenerator(config: MindMapAIConfig): MindMapAIGenerator {
  return async function* (input) {
    if (input.signal.aborted) return
    const payload = buildMindMapAIRequest(config, input)
    let response: Response
    try {
      response = config.request ? await config.request(payload) : await fetch(payload.apiUrl, { method: 'POST', headers: payload.headers, body: payload.body, signal: input.signal })
    } catch (cause) {
      if (input.signal.aborted) return
      throw new MindMapAIError('provider_error', { cause })
    }
    yield* readMindMapAIStream(response, input.signal, config)
  }
}

export async function readMindMapAttachment(file: File, allowed: readonly AIAttachmentType[], maxBytes = 5 * 1024 * 1024, signal?: AbortSignal): Promise<MindMapAIAttachment> {
  signal?.throwIfAborted()
  if (file.size > maxBytes) throw new MindMapAttachmentError('size')
  let type: AIAttachmentType | undefined
  if (/^image\/(png|jpeg|gif|webp)$/i.test(file.type)) type = 'image'
  else if (file.type === 'application/pdf') type = 'pdf'
  else if (file.type.startsWith('text/') || /\.(txt|md|json|js|ts|xml|ya?ml|sql|sh|csv)$/i.test(file.name)) type = 'text'
  if (!type || !allowed.includes(type)) throw new MindMapAttachmentError('type')
  if (type === 'text') {
    const text = await file.text()
    signal?.throwIfAborted()
    return { name: file.name, mimeType: file.type, type, text }
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    const abort = () => { reader.abort(); reject(signal?.reason) }
    reader.onloadend = () => signal?.removeEventListener('abort', abort)
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new MindMapAttachmentError('read'))
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) { abort(); return }
    reader.readAsDataURL(file)
  })
  signal?.throwIfAborted()
  return { name: file.name, mimeType: file.type, type, dataUrl }
}

function positiveLimit(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isSafeInteger(value) && value > 0 ? value : fallback
}

export async function readMindMapAttachments(
  files: readonly File[],
  allowed: readonly AIAttachmentType[],
  limits: MindMapAIAttachmentLimits = {},
  existing: { count: number; bytes: number } = { count: 0, bytes: 0 },
  signal?: AbortSignal,
): Promise<MindMapAIAttachment[]> {
  signal?.throwIfAborted()
  const maxCount = positiveLimit(limits.maxAttachments, 10)
  const maxTotalSize = positiveLimit(limits.maxTotalAttachmentSize, 20 * 1024 * 1024)
  const maxSize = positiveLimit(limits.maxAttachmentSize, 5 * 1024 * 1024)
  if (existing.count + files.length > maxCount) throw new MindMapAttachmentError('count')
  if (existing.bytes + files.reduce((sum, file) => sum + file.size, 0) > maxTotalSize) throw new MindMapAttachmentError('total-size')
  if (files.some((file) => file.size > maxSize)) throw new MindMapAttachmentError('size')
  const results = new Array<MindMapAIAttachment>(files.length)
  let cursor = 0
  let failed = false
  async function readNext(): Promise<void> {
    try {
      while (!failed && cursor < files.length) {
        signal?.throwIfAborted()
        const index = cursor++
        results[index] = await readMindMapAttachment(files[index], allowed, maxSize, signal)
      }
    } catch (error) {
      failed = true
      throw error
    }
  }
  const concurrency = Math.min(files.length, positiveLimit(limits.attachmentReadConcurrency, 3))
  await Promise.all(Array.from({ length: concurrency }, readNext))
  return results
}
