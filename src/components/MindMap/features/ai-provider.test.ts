import { describe, expect, it, vi } from 'vitest'
import { buildMindMapAIRequest, readMindMapAIStream, createOpenAICompatibleGenerator, readMindMapAttachments, MindMapAIError, type MindMapAIConfig } from './ai-provider'

const signal = () => new AbortController().signal
const sseEvent = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`
const deltaEvent = (content: string, finishReason: string | null = null) => sseEvent({ choices: [{ index: 0, delta: { content }, finish_reason: finishReason }] })
const sseResponse = (body: string | ReadableStream<Uint8Array>) => new Response(body, { headers: { 'content-type': 'text/event-stream' } })
const jsonResponse = (content: unknown, finishReason?: unknown) => new Response(JSON.stringify({ choices: [{ index: 0, message: { content }, finish_reason: finishReason }] }), { headers: { 'content-type': 'application/json' } })
async function collect(response: Response, options: Pick<MindMapAIConfig, 'completionPolicy' | 'onCompletion'> = {}, abortSignal = signal()): Promise<string> {
  let result = ''
  for await (const chunk of readMindMapAIStream(response, abortSignal, options)) result += chunk
  return result
}

describe('attachment admission and readers', () => {
  function file(size: number, text = vi.fn(async () => 'text')): File {
    return { name: 'source.txt', type: 'text/plain', size, text } as unknown as File
  }

  it('rejects count and aggregate overflow before reading any file, including existing selections', async () => {
    const text = vi.fn(async () => 'text')
    await expect(readMindMapAttachments(Array.from({ length: 11 }, () => file(1, text)), ['text'])).rejects.toMatchObject({ code: 'count' })
    await expect(readMindMapAttachments([file(1, text)], ['text'], { maxAttachments: 2 }, { count: 2, bytes: 2 })).rejects.toMatchObject({ code: 'count' })
    await expect(readMindMapAttachments(Array.from({ length: 5 }, () => file(5 * 1024 * 1024, text)), ['text'])).rejects.toMatchObject({ code: 'total-size' })
    await expect(readMindMapAttachments([file(4, text)], ['text'], { maxTotalAttachmentSize: 6 }, { count: 1, bytes: 3 })).rejects.toMatchObject({ code: 'total-size' })
    expect(text).not.toHaveBeenCalled()
  })

  it('bounds reader concurrency, preserves order, and stops queued reads after abort', async () => {
    const releases: Array<(value: string) => void> = []
    const text = vi.fn(() => new Promise<string>((resolve) => releases.push(resolve)))
    const abort = new AbortController()
    const promise = readMindMapAttachments(Array.from({ length: 8 }, () => file(1, text)), ['text'], { attachmentReadConcurrency: 2 }, undefined, abort.signal)
    expect(text).toHaveBeenCalledTimes(2)
    abort.abort()
    releases.forEach((release) => release('done'))
    await expect(promise).rejects.toThrow()
    expect(text).toHaveBeenCalledTimes(2)
    const result = await readMindMapAttachments([file(1, vi.fn(async () => 'first')), file(1, vi.fn(async () => 'second'))], ['text'], { attachmentReadConcurrency: 1 })
    expect(result.map((attachment) => attachment.text)).toEqual(['first', 'second'])
  })
})

describe('OpenAI compatible host adapter', () => {
  it.each([
    ['text/event-stream', 'length', 'incomplete'],
    ['text/event-stream', 'content_filter', 'content_filter'],
    ['application/json', 'length', 'incomplete'],
    ['application/json', 'content_filter', 'content_filter'],
  ])('rejects incomplete %s responses ending with %s', async (contentType, finishReason, code) => {
    const body = contentType === 'text/event-stream'
      ? `data: ${JSON.stringify({ choices: [{ delta: { content: '# Partial\n- First' }, finish_reason: null }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: finishReason }] })}\n\ndata: [DONE]\n\n`
      : JSON.stringify({ choices: [{ message: { content: '# Partial\n- First' }, finish_reason: finishReason }] })
    const consume = async () => {
      for await (const chunk of readMindMapAIStream(new Response(body, { headers: { 'content-type': contentType } }), new AbortController().signal)) void chunk
    }
    await expect(consume()).rejects.toMatchObject({ code, finishReason })
  })

  it('preserves UTF-8 text, image and PDF bytes in request parts', () => {
    const payload = buildMindMapAIRequest({ apiUrl: '/api/ai', model: 'configured' }, {
      prompt: '更新', markdown: '原文', document: { roots: [] }, signal: new AbortController().signal,
      attachments: [
        { type: 'text', name: '说明.txt', mimeType: 'text/plain', text: '中文✓' },
        { type: 'image', name: 'photo.png', mimeType: 'image/png', dataUrl: 'data:image/png;base64,YQ==' },
        { type: 'pdf', name: 'paper.pdf', mimeType: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBERg==' },
      ],
    })
    const body = JSON.parse(payload.body)
    expect(body.messages[1].content[1].text).toContain('中文✓')
    expect(body.messages[1].content[2].image_url.url).toBe('data:image/png;base64,YQ==')
    expect(body.messages[1].content[3].file).toEqual({ filename: 'paper.pdf', file_data: 'data:application/pdf;base64,JVBERg==' })
    expect(payload.headers.Authorization).toBeUndefined()
    expect(payload.attachments).toHaveLength(3)
  })

  it('decodes split UTF-8, CRLF events and an unterminated final event', async () => {
    const text = 'data: {"choices":[{"delta":{"content":"你"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":"好"}}]}'
    const bytes = new TextEncoder().encode(text)
    const stream = new ReadableStream<Uint8Array>({ start(controller) { for (const value of bytes) controller.enqueue(new Uint8Array([value])); controller.close() } })
    const response = new Response(stream, { headers: { 'content-type': 'text/event-stream' } })
    let result = ''
    for await (const chunk of readMindMapAIStream(response, new AbortController().signal)) result += chunk
    expect(result).toBe('你好')
  })

  it('uses the host request hook and propagates provider errors', async () => {
    const signal = new AbortController().signal
    const providerError = { message: 'private provider detail' }
    const generator = createOpenAICompatibleGenerator({ apiUrl: '/api/ai', model: 'configured', request: async (payload) => {
      expect(payload.signal).toBe(signal)
      return sseResponse(sseEvent({ error: providerError }))
    } })
    const chunks = async () => { for await (const chunk of await generator({ prompt: 'map', markdown: '', document: { roots: [] }, signal }) as AsyncIterable<string>) { void chunk } }
    const error = await chunks().catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(MindMapAIError)
    expect(error).toMatchObject({ code: 'provider_error', cause: providerError })
    expect((error as Error).message).not.toContain(providerError.message)
  })

  it.each(['text/event-stream', 'application/json'])('bounds malformed %s response bodies before JSON parsing', async (contentType) => {
    const response = new Response('x'.repeat(1_000_001), { headers: { 'content-type': contentType } })
    const consume = async () => { for await (const chunk of readMindMapAIStream(response, new AbortController().signal)) void chunk }
    await expect(consume()).rejects.toMatchObject({ code: 'invalid_response' })
  })
})

describe('AI completion policy', () => {
  it.each(['sse', 'json'] as const)('accepts normal %s completion with safe diagnostic metadata', async (responseType) => {
    const onCompletion = vi.fn()
    const response = responseType === 'sse'
      ? sseResponse(deltaEvent('# Complete\n- Detail') + deltaEvent('', 'stop') + sseEvent({ choices: [], usage: { completion_tokens: 6 } }) + 'data: [DONE]\n\n')
      : jsonResponse('# Complete\n- Detail', 'stop')
    expect(await collect(response, { completionPolicy: 'strict', onCompletion })).toBe('# Complete\n- Detail')
    expect(onCompletion).toHaveBeenCalledExactlyOnceWith({ status: 'normal', finishReason: 'stop', responseType })
  })

  it.each(['eof', 'done', 'json'] as const)('keeps missing-reason %s compatibility explicit and diagnosable', async (ending) => {
    const response = () => ending === 'json' ? jsonResponse('# Legacy') : sseResponse(deltaEvent('# Legacy') + (ending === 'done' ? 'data: [DONE]\n\n' : ''))
    const onCompletion = vi.fn()
    expect(await collect(response(), { onCompletion })).toBe('# Legacy')
    expect(onCompletion).toHaveBeenCalledExactlyOnceWith({ status: 'unknown', finishReason: null, responseType: ending === 'json' ? 'json' : 'sse' })
    await expect(collect(response(), { completionPolicy: 'strict' })).rejects.toMatchObject({ code: 'invalid_response', finishReason: null })
    expect(await collect(response(), { completionPolicy: 'legacy' })).toBe('# Legacy')
  })

  it.each(['strict', 'legacy'] as const)('rejects all explicit failure reasons in %s mode', async (completionPolicy) => {
    for (const [finishReason, code, status] of [
      ['length', 'incomplete', 'incomplete'],
      ['content_filter', 'content_filter', 'blocked'],
      ['tool_calls', 'invalid_response', 'unknown'],
      ['function_call', 'invalid_response', 'unknown'],
      ['custom_reason', 'invalid_response', 'unknown'],
      ['', 'invalid_response', 'unknown'],
    ]) {
      for (const responseType of ['sse', 'json'] as const) {
        const onCompletion = vi.fn()
        const response = responseType === 'sse' ? sseResponse(deltaEvent('# Partial') + deltaEvent('', finishReason)) : jsonResponse('# Partial', finishReason)
        await expect(collect(response, { completionPolicy, onCompletion })).rejects.toMatchObject({ code, finishReason })
        expect(onCompletion).toHaveBeenCalledExactlyOnceWith({ status, finishReason, responseType })
      }
    }
  })

  it('validates JSON completion before yielding any partial content', async () => {
    const iterator = readMindMapAIStream(jsonResponse('# Partial', 'length'), signal())
    await expect(iterator.next()).rejects.toMatchObject({ code: 'incomplete' })
  })

  it('allows an SSE preview but rejects before normal iterator completion', async () => {
    const iterator = readMindMapAIStream(sseResponse(deltaEvent('# Preview') + deltaEvent('', 'length')), signal())
    await expect(iterator.next()).resolves.toEqual({ done: false, value: '# Preview' })
    await expect(iterator.next()).rejects.toMatchObject({ code: 'incomplete' })
  })

  it('passes policy and diagnostic options through the built-in generator', async () => {
    const onCompletion = vi.fn()
    const request = vi.fn(async () => jsonResponse('# Unverified'))
    const generator = createOpenAICompatibleGenerator({ apiUrl: '/api/ai', model: 'configured', request, completionPolicy: 'strict', onCompletion })
    const consume = async () => { for await (const chunk of await generator({ prompt: 'map', markdown: '', document: { roots: [] }, signal: signal() }) as AsyncIterable<string>) void chunk }
    await expect(consume()).rejects.toMatchObject({ code: 'invalid_response' })
    expect(request).toHaveBeenCalledTimes(1)
    expect(onCompletion).toHaveBeenCalledExactlyOnceWith({ status: 'unknown', finishReason: null, responseType: 'json' })
  })
})

describe('AI response validation and framing', () => {
  it.each(['\n', '\r\n', '\r'])('decodes byte-split UTF-8 and %j line endings with a strict final event', async (lineEnd) => {
    const body = (': keepalive\n\ndata: {"choices":\ndata: [{"index":0,"delta":{"content":"你好"},"finish_reason":null}]}\n\n' + deltaEvent('', 'stop').trimEnd()).replace(/\n/g, lineEnd)
    const bytes = new TextEncoder().encode(body)
    const stream = new ReadableStream<Uint8Array>({ start(controller) { for (const value of bytes) controller.enqueue(new Uint8Array([value])); controller.close() } })
    expect(await collect(sseResponse(stream), { completionPolicy: 'strict' })).toBe('你好')
  })

  it('does not mix indexed choices or borrow another choice completion', async () => {
    const unrelated = sseEvent({ choices: [{ index: 1, delta: { content: '# Wrong' }, finish_reason: 'stop' }] })
    const selected = sseEvent({ choices: [{ index: 1, delta: { content: 'Wrong' }, finish_reason: 'stop' }, { index: 0, delta: { content: '# Right' }, finish_reason: null }] })
    await expect(collect(sseResponse(unrelated + selected), { completionPolicy: 'strict' })).rejects.toMatchObject({ code: 'invalid_response' })
    expect(await collect(sseResponse(unrelated + selected + deltaEvent('', 'stop')), { completionPolicy: 'strict' })).toBe('# Right')
    const json = new Response(JSON.stringify({ choices: [{ index: 1, message: { content: '# Wrong' }, finish_reason: 'stop' }, { index: 0, message: { content: '# Right' }, finish_reason: 'stop' }] }))
    expect(await collect(json, { completionPolicy: 'strict' })).toBe('# Right')
  })

  it.each(['sse', 'json'] as const)('rejects malformed %s response values and reason types', async (responseType) => {
    for (const value of [null, [], 'wrong', {}, { choices: {} }, { choices: [null] }, { choices: [{ index: -1 }] }, { choices: [{ index: '0' }] },
      { choices: [{ index: 0, delta: { content: '# First' }, message: { content: '# First' }, finish_reason: 'stop' }, { index: 0, delta: {}, message: {}, finish_reason: 'length' }] },
      { choices: [{ delta: { content: 5 }, message: { content: 5 }, finish_reason: 'stop' }] },
      { choices: [{ delta: { content: '# Partial' }, message: { content: '# Partial' }, finish_reason: false }] },
    ]) {
      const response = responseType === 'sse' ? sseResponse(sseEvent(value)) : new Response(JSON.stringify(value))
      await expect(collect(response)).rejects.toMatchObject({ code: 'invalid_response' })
    }
  })

  it.each(['sse', 'json'] as const)('rejects missing or whitespace-only %s content', async (responseType) => {
    for (const content of ['', ' \n\t', null, undefined]) {
      const response = responseType === 'sse'
        ? sseResponse(sseEvent({ choices: [{ delta: { content }, finish_reason: 'stop' }] }) + 'data: [DONE]\n\n')
        : jsonResponse(content, 'stop')
      await expect(collect(response)).rejects.toMatchObject({ code: 'invalid_response' })
    }
  })

  it('rejects absent bodies, empty streams, and invalid UTF-8', async () => {
    for (const response of [new Response(null), sseResponse(''), sseResponse('data: [DONE]\n\n'), new Response(new Uint8Array([0xff]))]) {
      await expect(collect(response)).rejects.toMatchObject({ code: 'invalid_response' })
    }
  })

  it.each(['malformed', 'provider', 'content-after-stop', 'failure-after-stop'] as const)('rejects %s events after a preview', async (kind) => {
    const tail = kind === 'malformed' ? 'data: {broken\n\n'
      : kind === 'provider' ? sseEvent({ error: { message: 'private detail' } })
        : kind === 'content-after-stop' ? deltaEvent('', 'stop') + deltaEvent('unexpected')
          : deltaEvent('', 'stop') + deltaEvent('', 'length')
    const iterator = readMindMapAIStream(sseResponse(deltaEvent('# Preview') + tail), signal())
    expect((await iterator.next()).value).toBe('# Preview')
    await expect(iterator.next()).rejects.toMatchObject({ code: kind === 'provider' ? 'provider_error' : kind === 'failure-after-stop' ? 'incomplete' : 'invalid_response' })
  })

  it('retains provider details in cause, never in the safe JSON error message', async () => {
    const providerError = { message: 'secret prompt and provider details', code: 'provider_internal' }
    const error = await collect(new Response(JSON.stringify({ error: providerError }))).catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(MindMapAIError)
    expect(error).toMatchObject({ code: 'provider_error', cause: providerError })
    expect((error as Error).message).toBe('AI provider request failed.')
  })

  it('handles named provider-error events and malformed JSON with typed failures', async () => {
    await expect(collect(sseResponse('event: error\ndata: {"message":"private detail"}\n\n'))).rejects.toMatchObject({ code: 'provider_error', cause: { message: 'private detail' } })
    await expect(collect(new Response('{broken'))).rejects.toMatchObject({ code: 'invalid_response', cause: expect.any(SyntaxError) })
  })
})

describe('AI transport cleanup and cancellation', () => {
  it.each(['done', 'failure', 'early-return', 'abort'] as const)('cancels the reader and removes its listener on %s', async (ending) => {
    const cancel = vi.fn()
    const abort = new AbortController()
    const removeListener = vi.spyOn(abort.signal, 'removeEventListener')
    const onCompletion = vi.fn()
    const tail = ending === 'done' ? deltaEvent('', 'stop') + 'data: [DONE]\n\n' : ending === 'failure' ? deltaEvent('', 'length') : ''
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode(deltaEvent('# Preview') + tail)) }, cancel })
    const response = sseResponse(body)
    const iterator = readMindMapAIStream(response, abort.signal, { completionPolicy: 'strict', onCompletion })
    expect((await iterator.next()).value).toBe('# Preview')
    if (ending === 'failure') await expect(iterator.next()).rejects.toMatchObject({ code: 'incomplete' })
    else if (ending === 'early-return') await iterator.return(undefined)
    else if (ending === 'abort') { const pending = iterator.next(); abort.abort(); expect((await pending).done).toBe(true) }
    else expect((await iterator.next()).done).toBe(true)
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(response.body?.locked).toBe(false)
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function))
    if (ending === 'abort' || ending === 'early-return') expect(onCompletion).not.toHaveBeenCalled()
  })

  it('cancels rejected HTTP bodies and reports only safe status metadata', async () => {
    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({ cancel })
    await expect(collect(new Response(body, { status: 429 }))).rejects.toMatchObject({ code: 'provider_error', cause: { status: 429 } })
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('rejects read failures and preserves the transport cause', async () => {
    const cause = new Error('private transport detail')
    const response = sseResponse(new ReadableStream<Uint8Array>({ start(controller) { controller.error(cause) } }))
    await expect(collect(response)).rejects.toMatchObject({ code: 'provider_error', cause })
    expect(response.body?.locked).toBe(false)
  })

  it('reports an already locked response as invalid without disturbing its owner', async () => {
    const response = jsonResponse('# Complete', 'stop')
    const owner = response.body!.getReader()
    try {
      await expect(collect(response)).rejects.toMatchObject({ code: 'invalid_response', cause: expect.any(TypeError) })
      expect(response.body?.locked).toBe(true)
      expect((await owner.read()).value).toBeInstanceOf(Uint8Array)
    } finally { await owner.cancel(); owner.releaseLock() }
  })

  it('never starts a request that was already cancelled', async () => {
    const abort = new AbortController()
    abort.abort()
    const request = vi.fn(async () => jsonResponse('# Unexpected', 'stop'))
    const generator = createOpenAICompatibleGenerator({ apiUrl: '/api/ai', model: 'configured', request })
    for await (const chunk of await generator({ prompt: 'map', markdown: '', document: { roots: [] }, signal: abort.signal }) as AsyncIterable<string>) expect(chunk).toBeUndefined()
    expect(request).not.toHaveBeenCalled()
  })

  it('cancels a late response without parsing it after cancellation', async () => {
    const abort = new AbortController()
    const cancel = vi.fn()
    const request = vi.fn(async () => {
      abort.abort()
      return sseResponse(new ReadableStream<Uint8Array>({ cancel }))
    })
    const generator = createOpenAICompatibleGenerator({ apiUrl: '/api/ai', model: 'configured', request })
    for await (const chunk of await generator({ prompt: 'map', markdown: '', document: { roots: [] }, signal: abort.signal }) as AsyncIterable<string>) expect(chunk).toBeUndefined()
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('wraps request failures without retrying or exposing their messages', async () => {
    const cause = new Error('private network detail')
    const request = vi.fn(async () => { throw cause })
    const generator = createOpenAICompatibleGenerator({ apiUrl: '/api/ai', model: 'configured', request })
    const consume = async () => { for await (const chunk of await generator({ prompt: 'map', markdown: '', document: { roots: [] }, signal: signal() }) as AsyncIterable<string>) void chunk }
    const error = await consume().catch((cause: unknown) => cause)
    expect(error).toMatchObject({ code: 'provider_error', cause })
    expect((error as Error).message).not.toContain(cause.message)
    expect(request).toHaveBeenCalledTimes(1)
  })
})
