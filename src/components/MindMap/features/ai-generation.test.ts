import { describe, expect, it, vi } from 'vitest'
import { createMindMapController } from '../core/controller'
import { runMindMapGeneration, type MindMapAIGeneratorInput } from './ai-generation'
import { createOpenAICompatibleGenerator } from './ai-provider'

function input(controller: ReturnType<typeof createMindMapController>, signal = new AbortController().signal): MindMapAIGeneratorInput {
  return { prompt: 'Generate', markdown: 'Original', document: controller.getSnapshot().document, signal }
}

describe('AI generation transaction', () => {
  it('appends repeated delta chunks literally and commits one undo entry', async () => {
    const controller = createMindMapController('Original')
    const completed = await runMindMapGeneration(controller, async function* () { yield 'Root\n'; yield '- A'; yield 'A' }, input(controller))
    expect(completed).toBe(true)
    expect(controller.getSnapshot().document.roots[0].children?.[0].text).toBe('AA')
    expect(controller.undo()).toBe(true)
    expect(controller.getSnapshot().document.roots[0].text).toBe('Original')
    expect(controller.undo()).toBe(false)
    controller.dispose()
  })
  it('rolls back a failed generator', async () => {
    const controller = createMindMapController('Original')
    await expect(runMindMapGeneration(controller, async function* () { yield 'Partial'; throw new Error('failed') }, input(controller))).rejects.toThrow('failed')
    expect(controller.getSnapshot().document.roots[0].text).toBe('Original')
    expect(controller.getSnapshot().canUndo).toBe(false)
    controller.dispose()
  })
  it('ignores a non-cooperative generator result after abort', async () => {
    const controller = createMindMapController('Original')
    const abort = new AbortController()
    let resolve!: (value: string) => void
    const task = runMindMapGeneration(controller, () => new Promise<string>((done) => { resolve = done }), input(controller, abort.signal))
    abort.abort()
    resolve('Late content')
    expect(await task).toBe(false)
    expect(controller.getSnapshot().document.roots[0].text).toBe('Original')
    controller.dispose()
  })
  it('preserves host replacement when old generation settles', async () => {
    const controller = createMindMapController('Original')
    let resolve!: (value: string) => void
    const task = runMindMapGeneration(controller, () => new Promise<string>((done) => { resolve = done }), input(controller))
    controller.setMarkdown('Host document', 'external')
    resolve('Late content')
    expect(await task).toBe(false)
    expect(controller.getSnapshot().document.roots[0].text).toBe('Host document')
    controller.dispose()
  })
  it('does not replace the document with an empty provider result', async () => {
    const controller = createMindMapController('Original')
    await expect(runMindMapGeneration(controller, () => '', input(controller))).rejects.toThrow('no mind map')
    expect(controller.getSnapshot().document.roots[0].text).toBe('Original')
  })
})

describe('AI completion integrity', () => {
  function provider(format: 'sse' | 'json', finishReason: string) {
    const content = 'Generated\n- Complete detail'
    const body = format === 'sse'
      ? `data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: null }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: finishReason }] })}\n\ndata: [DONE]\n\n`
      : JSON.stringify({ choices: [{ message: { content }, finish_reason: finishReason }] })
    return createOpenAICompatibleGenerator({
      apiUrl: '/mock-ai', model: 'mock', completionPolicy: 'strict',
      request: async () => new Response(body, { headers: { 'content-type': format === 'sse' ? 'text/event-stream' : 'application/json' } }),
    })
  }

  it.each([
    ['sse', 'length', 'incomplete'],
    ['sse', 'content_filter', 'content_filter'],
    ['json', 'length', 'incomplete'],
    ['json', 'content_filter', 'content_filter'],
  ] as const)('%s %s preserves the document, selection and pre-existing undo/redo', async (format, reason, code) => {
    const controller = createMindMapController('Original\n- Keep all details')
    controller.setMarkdown('Original\n- Keep all details\n- Prior edit')
    controller.setMarkdown('Original\n- Keep all details\n- Later edit')
    controller.undo()
    controller.selectNode(controller.getSnapshot().document.roots[0].children![0].id)
    const baseline = controller.getSnapshot()
    const commits: string[] = []
    controller.subscribeEvents((event) => { if (event.phase === 'commit') commits.push(event.reason) })
    try {
      await expect(runMindMapGeneration(controller, provider(format, reason), input(controller))).rejects.toMatchObject({ code, finishReason: reason })
      expect(controller.getSnapshot().document).toEqual(baseline.document)
      expect(controller.getSnapshot().selectedNodeId).toBe(baseline.selectedNodeId)
      expect(controller.getSnapshot().canUndo).toBe(true)
      expect(controller.getSnapshot().canRedo).toBe(true)
      expect(commits).toEqual([])
      expect(controller.redo()).toBe(true)
      expect(controller.getSnapshot().document.roots[0].children?.[1].text).toBe('Later edit')
      expect(controller.undo()).toBe(true)
      expect(controller.undo()).toBe(true)
      expect(controller.getSnapshot().document.roots[0].children).toHaveLength(1)
    } finally { controller.dispose() }
  })

  it.each(['sse', 'json'] as const)('%s stop commits exactly once and undoes in one step', async (format) => {
    const controller = createMindMapController('Original\n- Keep all details')
    const baseline = controller.getSnapshot().document
    const commits: string[] = []
    controller.subscribeEvents((event) => { if (event.phase === 'commit') commits.push(event.reason) })
    try {
      expect(await runMindMapGeneration(controller, provider(format, 'stop'), input(controller))).toBe(true)
      expect(controller.getSnapshot().document.roots[0].text).toBe('Generated')
      expect(controller.getSnapshot().document.roots[0].children?.[0].text).toBe('Complete detail')
      expect(commits).toEqual(['stream'])
      expect(controller.undo()).toBe(true)
      expect(controller.getSnapshot().document).toEqual(baseline)
      expect(controller.undo()).toBe(false)
    } finally { controller.dispose() }
  })

  it('rolls back a visible preview before a provider reports length', async () => {
    const controller = createMindMapController('Original\n- Keep all details')
    const baseline = controller.getSnapshot().document
    const encoder = new TextEncoder()
    let source!: ReadableStreamDefaultController<Uint8Array>
    const response = new Response(new ReadableStream<Uint8Array>({ start(value) { source = value } }), { headers: { 'content-type': 'text/event-stream' } })
    const generator = createOpenAICompatibleGenerator({ apiUrl: '/mock-ai', model: 'mock', request: async () => response })
    const task = runMindMapGeneration(controller, generator, input(controller))
    // Install a rejection handler before releasing the terminal failure.
    const failure = expect(task).rejects.toMatchObject({ code: 'incomplete' })
    try {
      source.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Partial\\n- First"}}]}\n\n'))
      await vi.waitFor(() => expect(controller.getSnapshot().document.roots[0].text).toBe('Partial'))
      source.enqueue(encoder.encode('data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n'))
      source.close()
      await failure
      expect(controller.getSnapshot().document).toEqual(baseline)
      expect(controller.getSnapshot().canUndo).toBe(false)
      expect(response.body?.locked).toBe(false)
    } finally { controller.dispose() }
  })

  it('cancels a visible preview and discards a non-cooperative late fragment', async () => {
    const controller = createMindMapController('Original\n- Keep all details')
    const baseline = controller.getSnapshot().document
    const abort = new AbortController()
    let release!: () => void
    let finish!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    const returned = new Promise<void>((resolve) => { finish = resolve })
    const task = runMindMapGeneration(controller, async function* () {
      try { yield 'Partial\n- First'; await gate; yield '\n- Late content' } finally { finish() }
    }, input(controller, abort.signal))
    try {
      await vi.waitFor(() => expect(controller.getSnapshot().document.roots[0].text).toBe('Partial'))
      abort.abort()
      expect(await task).toBe(false)
      release()
      await returned
      expect(controller.getSnapshot().document).toEqual(baseline)
      expect(controller.getSnapshot().canUndo).toBe(false)
    } finally { release(); controller.dispose() }
  })

  it.each(['success', 'failure'] as const)('preserves external editing after a preview and late %s', async (outcome) => {
    const controller = createMindMapController('Original\n- Keep all details')
    let release!: () => void
    let finish!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    const returned = new Promise<void>((resolve) => { finish = resolve })
    const task = runMindMapGeneration(controller, async function* () {
      try {
        yield 'Partial\n- First'
        await gate
        if (outcome === 'failure') throw new Error('Late provider failure')
        yield '\n- Late content'
      } finally { finish() }
    }, input(controller))
    try {
      await vi.waitFor(() => expect(controller.getSnapshot().document.roots[0].text).toBe('Partial'))
      controller.setMarkdown('External\n- Latest changes')
      const external = controller.getSnapshot().document
      expect(await task).toBe(false)
      release()
      await returned
      expect(controller.getSnapshot().document).toEqual(external)
      expect(controller.undo()).toBe(true)
      expect(controller.getSnapshot().document.roots[0].text).toBe('Original')
      expect(controller.undo()).toBe(false)
    } finally { release(); controller.dispose() }
  })
})
