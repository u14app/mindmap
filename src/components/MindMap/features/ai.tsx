import { useControllerSession } from '../runtime/useControllerSession'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { runMindMapGeneration, type MindMapAIGenerator } from './ai-generation'
import type { MindMapController } from '../core/types'
import { createOpenAICompatibleGenerator, readMindMapAttachments, MindMapAttachmentError, MindMapAIError, type AIAttachmentType, type MindMapAIAttachment, type MindMapAIConfig, type MindMapAIAttachmentLimits } from './ai-provider'
export { createOpenAICompatibleGenerator } from './ai-provider'
export type { AIAttachmentType, MindMapAIAttachment, MindMapAIAttachmentLimits, MindMapAIConfig, MindMapAIContentPart, MindMapAIRequestPayload, MindMapAICompletion, MindMapAICompletionPolicy, MindMapAICompletionStatus, MindMapAIErrorCode } from './ai-provider'
import type { MindMapEditorFeature, MindMapEditorFeatureComponentProps } from '../runtime/editor-types'
export type { MindMapAIGenerator, MindMapAIGeneratorInput, MindMapAIGeneratorResult } from './ai-generation'

export interface AIFeatureOptions extends MindMapAIAttachmentLimits {
  generate?: MindMapAIGenerator
  generator?: MindMapAIGenerator
  placeholder?: string
  buttonLabel?: string
  config?: MindMapAIConfig
  attachments?: readonly AIAttachmentType[]
  onError?: (error: unknown) => void
}

function attachmentAcceptTypes(type: AIAttachmentType): string[] {
  switch (type) {
    case 'image': return ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    case 'pdf': return ['application/pdf']
    default: return ['text/*', '.md', '.json', '.csv']
  }
}

// Stable private renderer: this library module exports a feature factory, not a refresh boundary.
// eslint-disable-next-line react-refresh/only-export-components
function AIFeatureSession({ context, options: featureOptions }: MindMapEditorFeatureComponentProps) {
  const options = (featureOptions ?? {}) as AIFeatureOptions
  const generator = options.generate ?? options.generator ?? (options.config ? createOpenAICompatibleGenerator(options.config) : undefined)
  const allowedAttachments = options.attachments ?? options.config?.attachments ?? []
  const [prompt, setPrompt] = useState('')
  const [runningController, setRunningController] = useState<MindMapController | null>(null)
  const running = runningController === context.controller
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<Array<{ value: MindMapAIAttachment; bytes: number }>>([])
  const [readingFiles, setReadingFiles] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const readAbort = useRef<AbortController | null>(null)
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
      readAbort.current?.abort()
      readAbort.current = null
    }
  }, [context.controller])
  function stop() {
    abortRef.current?.abort()
    abortRef.current = null
    setRunningController(null)
  }
  async function submit() {
    if (!generator || !prompt.trim() || abortRef.current || readingFiles) return
    const abort = new AbortController()
    abortRef.current = abort
    setRunningController(context.controller)
    setError('')
    try {
      const committed = await runMindMapGeneration(context.controller, generator, {
        prompt: prompt.trim(),
        markdown: context.markdown,
        document: context.controller.getSnapshot().document,
        signal: abort.signal,
        attachments: attachments.map((attachment) => attachment.value),
      })
      if (committed && abortRef.current === abort) {
        setPrompt('')
        setAttachments([])
      }
    } catch (cause) {
      if (!abort.signal.aborted && abortRef.current === abort) {
        const messages = context.messages
        const message = cause instanceof MindMapAIError
          ? cause.code === 'content_filter' ? messages.aiContentFiltered
            : cause.code === 'incomplete' && cause.finishReason === 'length' ? messages.aiIncomplete
              : cause.code === 'invalid_response' || cause.code === 'incomplete' ? messages.aiInvalidResponse
                : messages.aiError
          : messages.aiError
        setError(message ?? messages.aiError)
        options.onError?.(cause)
      }
    } finally {
      if (abortRef.current === abort) {
        abortRef.current = null
        setRunningController(null)
      }
    }
  }

  function readFiles(event: ChangeEvent<HTMLInputElement>): void {
    if (readAbort.current) return
    const files = Array.from(event.target.files ?? [])
    const abort = new AbortController()
    readAbort.current = abort
    const limits = {
      maxAttachmentSize: options.maxAttachmentSize ?? options.config?.maxAttachmentSize,
      maxAttachments: options.maxAttachments ?? options.config?.maxAttachments,
      maxTotalAttachmentSize: options.maxTotalAttachmentSize ?? options.config?.maxTotalAttachmentSize,
      attachmentReadConcurrency: options.attachmentReadConcurrency ?? options.config?.attachmentReadConcurrency,
    }
    event.target.value = ''
    setReadingFiles(true)
    void readMindMapAttachments(files, allowedAttachments, limits, { count: attachments.length, bytes: attachments.reduce((sum, attachment) => sum + attachment.bytes, 0) }, abort.signal)
      .then((values) => {
        if (readAbort.current === abort) {
          setAttachments((current) => [...current, ...values.map((value, index) => ({ value, bytes: files[index].size }))])
        }
      })
      .catch((cause) => {
        if (readAbort.current !== abort) return
        abort.abort()
        if (cause instanceof MindMapAttachmentError && cause.code === 'size') {
          setError(context.messages.aiFileTooLarge)
        } else if (cause instanceof MindMapAttachmentError && cause.code === 'count') {
          setError(context.messages.aiTooManyAttachments)
        } else if (cause instanceof MindMapAttachmentError && cause.code === 'total-size') {
          setError(context.messages.aiAttachmentsTooLarge)
        } else if (cause instanceof MindMapAttachmentError && cause.code === 'type') {
          setError(context.messages.aiUnsupportedFile)
        } else {
          setError(context.messages.attachmentReadError)
        }
        options.onError?.(cause)
      })
      .finally(() => {
        if (readAbort.current === abort) {
          readAbort.current = null
          setReadingFiles(false)
        }
      })
  }

  return <div className={running ? 'mm-feature-ai-composer is-running' : 'mm-feature-ai-composer'}>
    <div className="mm-ai-orb" aria-hidden="true"><i /><i /></div>
    <div className="mm-ai-input-wrap">
      <input aria-label={context.messages.aiPlaceholder} value={prompt} disabled={!generator || running} placeholder={!generator ? context.messages.aiUnconfigured : options.placeholder ?? context.messages.aiPlaceholder} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit() } }} />
      {error && <span role="alert">{error}</span>}
      {attachments.length > 0 && <ul className="mm-ai-attachments">{attachments.map(({ value: attachment }, index) => <li key={`${attachment.name}-${index}`}>{attachment.name}<button type="button" aria-label={`${context.messages.removeAttachment}: ${attachment.name}`} disabled={running} onClick={() => setAttachments((files) => files.filter((_, position) => position !== index))}>×</button></li>)}</ul>}
    </div>
    {allowedAttachments.length > 0 && <>
      <input type="file" ref={fileInput} hidden multiple accept={allowedAttachments.flatMap(attachmentAcceptTypes).join(',')} onChange={readFiles} />
      <button type="button" disabled={running || readingFiles} onClick={() => fileInput.current?.click()} aria-label={context.messages.attach}>＋</button>
    </>}
    {running ? <button type="button" className="mm-ai-stop" onClick={stop}>{context.messages.stop}</button> : <button type="button" className="mm-ai-submit" onClick={() => void submit()} disabled={!generator || !prompt.trim() || readingFiles}>{options.buttonLabel ?? context.messages.generate} <b aria-hidden="true">↗</b></button>}
  </div>
}

// eslint-disable-next-line react-refresh/only-export-components
function AIFeature(props: MindMapEditorFeatureComponentProps) {
  const session = useControllerSession(props.context.controller)
  return <AIFeatureSession key={session} {...props} />
}

export function aiFeature(options: AIFeatureOptions = {}): MindMapEditorFeature {
  return { id: 'ai', placement: 'bottom', Component: AIFeature, options }
}
