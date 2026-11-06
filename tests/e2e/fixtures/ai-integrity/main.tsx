import { createRoot } from 'react-dom/client'
import { createMindMapController } from '@xiangfa/mindmap/core'
import { MindMapEditor } from '@xiangfa/mindmap/editor'
import { aiFeature, MindMapAIError, type MindMapAICompletion, type MindMapAICompletionPolicy } from '@xiangfa/mindmap/features/ai'
import { historyFeature } from '@xiangfa/mindmap/features/history'
import '@xiangfa/mindmap/styles/editor.css'
import '@xiangfa/mindmap/styles/features/ai.css'
import '@xiangfa/mindmap/styles/features/history.css'

const params = new URLSearchParams(location.search)
const controller = createMindMapController('Original\n- Keep all details')
controller.selectNode(controller.getSnapshot().document.roots[0].children![0].id)
const events: Array<{ phase: string; reason: string }> = []
const errors: string[] = []
const completions: MindMapAICompletion[] = []
let requests = 0
let source: ReadableStreamDefaultController<Uint8Array> | undefined
const encoder = new TextEncoder()

controller.subscribeEvents(({ phase, reason }) => { events.push({ phase, reason }) })

function send(content: string, finishReason: string | null = null): boolean {
  if (!source) return false
  try {
    source.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content }, finish_reason: finishReason }] })}\n\n`))
    if (finishReason) source.close()
    return true
  } catch {
    // A late test packet can arrive after the adapter has cancelled its reader.
    return false
  }
}

const features = [historyFeature(), aiFeature({
  config: {
    apiUrl: '/api/ai',
    model: 'in-memory-test',
    completionPolicy: (params.get('policy') ?? 'strict') as MindMapAICompletionPolicy,
    attachments: ['text'],
    onCompletion(value) { completions.push(value) },
    async request(payload) {
      requests++
      if (params.get('controlled') === 'true') {
        return new Response(new ReadableStream<Uint8Array>({
          start(value) { source = value; send('Partial\n- First') },
        }), { headers: { 'content-type': 'text/event-stream' } })
      }
      return fetch(payload.apiUrl, { method: 'POST', headers: payload.headers, body: payload.body, signal: payload.signal })
    },
  },
  onError(error) { errors.push(error instanceof MindMapAIError ? error.code : 'custom_error') },
})]

const api = {
  snapshot() {
    const { document, selectedNodeId, canUndo, canRedo } = controller.getSnapshot()
    return { document, selectedNodeId, canUndo, canRedo, events, errors, completions, requests }
  },
  send,
  edit(markdown: string) { controller.setMarkdown(markdown) },
}

export type AIIntegrityFixture = typeof api
declare global { interface Window { aiIntegrity: AIIntegrityFixture } }
window.aiIntegrity = api

createRoot(document.getElementById('root')!).render(<MindMapEditor
  controller={controller}
  features={features}
  locale={params.get('locale') ?? 'en-US'}
  ariaLabel="AI integrity editor"
  autoFit="always"
/>)
