import { describe, expect, it, vi } from 'vitest'
import { applyMindMapPatches, applyMindMapPatchesWithInverse, createMarkdownStream, createMindMapParser, createMindMapController, DEFAULT_THEME, diffMindMapDocuments, layoutMindMap, measureMindMapNodeContent, parseMindMap, renderMindMapToSvg, sanitizeMindMapUrl, serializeMindMap, validateMindMapDocument } from '../index'
import type { MindMapDocument, MindMapPatch } from '../index'

const initial: MindMapDocument = { roots: [{ id: 'root', text: 'Root', children: [
  { id: 'a', text: 'A', children: [{ id: 'leaf', text: 'Leaf' }] },
  { id: 'b', text: 'B' },
] }, { id: 'other', text: 'Other' }] }

describe('document runtime invariants', () => {
  it('projects only actual document or layout-option changes', () => {
    const controller = createMindMapController(initial)
    const before = controller.getSnapshot()
    const listener = vi.fn()
    controller.subscribe(listener)
    controller.setLayoutOptions({})
    controller.setLayoutOptions({ theme: {}, extensions: [], foldOverrides: {}, splitByRoot: {} })
    controller.setLayoutOptions({ theme: { rootFontSize: DEFAULT_THEME.rootFontSize } })
    expect(controller.getSnapshot()).toBe(before)
    expect(listener).not.toHaveBeenCalled()
    controller.setLayoutOptions({ theme: { rootFontSize: 24 } })
    const themed = controller.getSnapshot()
    controller.setLayoutOptions({ theme: { rootFontSize: 24 } })
    expect(controller.getSnapshot()).toBe(themed)
    expect(listener).toHaveBeenCalledTimes(1)
    const extension = { id: 'same', transformNode: (node: MindMapDocument['roots'][number]) => node }
    controller.setLayoutOptions({ extensions: [extension] })
    const extended = controller.getSnapshot()
    controller.setLayoutOptions({ extensions: [{ ...extension }] })
    expect(controller.getSnapshot()).toBe(extended)
    controller.updateNode('a', { text: 'Changed' })
    expect(listener).toHaveBeenCalledTimes(3)
    expect(controller.getSnapshot().layout).not.toBe(extended.layout)
  })

  it('keeps explicit direction commands coherent with prior view overrides', () => {
    const controller = createMindMapController(initial, { direction: 'right' })
    controller.setLayoutOptions({ direction: 'left' })
    expect(controller.getSnapshot().layout.nodeById.get('a')?.side).toBe('left')
    controller.setDirection('right')
    expect(controller.getSnapshot().document.direction).toBe('right')
    expect(controller.getSnapshot().layout.nodeById.get('a')?.side).toBe('right')
  })
  it('explicit equal-content host replacement invalidates provisional generation', async () => {
    const controller = createMindMapController(initial)
    const stream = controller.createMarkdownStream()
    stream.append('Provisional')
    await stream.flush()
    const accepted = structuredClone(controller.getSnapshot().document)
    controller.replaceDocument(accepted)
    stream.append(' late')
    expect(stream.isActive()).toBe(false)
    expect(await stream.commit()).toBe(false)
    expect(controller.getSnapshot().document).toEqual(accepted)
    expect(controller.getSnapshot().canUndo).toBe(false)
  })

  it('rejects edits to provisional-only nodes without interrupting the stream', async () => {
    const controller = createMindMapController(initial)
    const stream = controller.createMarkdownStream()
    stream.append('Root\n- A\n  - Leaf\n- B\n- New generated child')
    await stream.flush()
    const preview = controller.getSnapshot()
    const listener = vi.fn()
    controller.subscribeEvents(listener)
    const createdId = controller.getSnapshot().document.roots[0].children![2].id
    expect(controller.updateNode(createdId, { text: 'Concurrent edit' })).toBe(false)
    expect(stream.isActive()).toBe(true)
    expect(controller.getSnapshot()).toBe(preview)
    expect(listener).not.toHaveBeenCalled()
    expect(await stream.commit()).toBe(true)
    expect(controller.getSnapshot().document).toEqual(preview.document)
    controller.undo()
    expect(controller.getSnapshot().document).toEqual(initial)
    controller.dispose()
  })
  it('preserves history and active transaction for identical controlled echoes', () => {
    const controller = createMindMapController('Root\n- Child')
    controller.updateNode('mm-0-0', { text: 'Updated' })
    const edited = controller.getSnapshot()
    controller.setDocument(structuredClone(edited.document))
    controller.setMarkdown('Root\n- Updated', 'external')
    expect(controller.getSnapshot()).toBe(edited)
    expect(edited.canUndo).toBe(true)
    const tx = controller.beginTransaction()
    tx.setMarkdown('Root\n- Streaming')
    controller.setDocument(structuredClone(controller.getSnapshot().document))
    expect(tx.isActive()).toBe(true)
    expect(tx.commit()).toBe(true)
  })

  it('keeps semantic node ids through head insertion and reorder', () => {
    const controller = createMindMapController('Root\n- A\n- B')
    controller.selectNode('mm-0-0')
    controller.setMarkdown('Root\n- New\n- B\n- A')
    const nodes = controller.getSnapshot().document.roots[0].children!
    expect(nodes.map((node) => node.text)).toEqual(['New', 'B', 'A'])
    expect(nodes[1].id).toBe('mm-0-1')
    expect(nodes[2].id).toBe('mm-0-0')
    expect(controller.getSnapshot().selectedNodeId).toBe('mm-0-0')
    expect(new Set(nodes.map((node) => node.id)).size).toBe(3)
  })

  it('rejects malformed, duplicate, cyclic, and excessively deep documents', () => {
    expect(() => validateMindMapDocument({ roots: 'bad' })).toThrow()
    expect(() => createMindMapController({ roots: [{ id: 'a', text: 'A' }, { id: 'a', text: 'Again' }] })).toThrow(/Duplicate/)
    const cycle = { id: 'cycle', text: 'Cycle', children: [] as MindMapDocument['roots'] }
    cycle.children.push(cycle)
    expect(() => createMindMapController(cycle)).toThrow()
    let deep = { id: 'deep', text: 'Deep', children: [] as MindMapDocument['roots'] }
    for (let i = 0; i < 258; i++) deep = { id: 'deep-' + i, text: 'Deep', children: [deep] }
    expect(() => createMindMapController(deep)).toThrow(/nesting/)
  })

  it('owns and freezes document snapshots so caller mutation cannot corrupt history', () => {
    const input = structuredClone(initial)
    const controller = createMindMapController(input)
    input.roots[0].text = 'Caller mutation'
    expect(controller.getSnapshot().document.roots[0].text).toBe('Root')
    expect(() => { controller.getSnapshot().document.roots[0].text = 'Silent mutation' }).toThrow()
    expect(() => { controller.getSnapshot().layout.nodes[0].x = 100 }).toThrow()
    expect(() => { controller.getSnapshot().layout.nodes.splice(0, 1) }).toThrow()
    expect('set' in controller.getSnapshot().layout.nodeById).toBe(false)
    controller.getSnapshot().layout.nodeById.forEach((_node, _id, map) => expect('set' in map).toBe(false))
    const tx = controller.beginTransaction()
    expect(tx.applyPatches([{ type: 'update', nodeId: 'a', attributes: { arbitrary: 1n } }])).toBe(false)
    expect(controller.getSnapshot().document).toEqual(initial)
  })
  it('copies only changed paths and leaves prior snapshots untouched', () => {
    const controller = createMindMapController(initial)
    const before = controller.getSnapshot()
    controller.updateNode('leaf', { text: 'Changed' })
    const after = controller.getSnapshot()
    expect(after.document.roots[0]).not.toBe(before.document.roots[0])
    expect(after.document.roots[0].children?.[1]).toBe(before.document.roots[0].children?.[1])
    expect(after.document.roots[1]).toBe(before.document.roots[1])
    expect(before.document.roots[0].children?.[0].children?.[0].text).toBe('Leaf')
    expect(controller.undo()).toBe(true)
    expect(controller.getSnapshot().document).toEqual(before.document)
    expect(controller.redo()).toBe(true)
    expect(controller.getSnapshot().document).toEqual(after.document)
  })

  it.each<MindMapPatch>([
    { type: 'move', nodeId: 'a', parentId: 'missing', index: 0 },
    { type: 'move', nodeId: 'a', parentId: 'a', index: 0 },
    { type: 'move', nodeId: 'a', parentId: 'leaf', index: 0 },
    { type: 'move', nodeId: 'missing', parentId: null, index: 0 },
    { type: 'insert', parentId: 'root', index: 0, node: { id: 'b', text: 'Duplicate' } },
  ])('rejects an invalid batch atomically: %j', (patch) => {
    const controller = createMindMapController(initial)
    const tx = controller.beginTransaction()
    const before = controller.getSnapshot()
    expect(tx.applyPatches([{ type: 'update', nodeId: 'b', text: 'Must not apply' }, patch])).toBe(false)
    expect(controller.getSnapshot()).toBe(before)
    tx.cancel()
    expect(controller.getSnapshot().canUndo).toBe(false)
  })

  it('does not publish or create history for a no-op', () => {
    const controller = createMindMapController(initial)
    const listener = vi.fn()
    controller.subscribe(listener)
    const before = controller.getSnapshot()
    controller.updateNode('a', { text: 'A' })
    controller.moveNode('a', 'root', 0)
    expect(controller.getSnapshot()).toBe(before)
    expect(listener).not.toHaveBeenCalled()
  })

  it('groups updates and moves into one undo and redo entry', () => {
    const controller = createMindMapController(initial)
    const tx = controller.beginTransaction()
    tx.applyPatches([{ type: 'update', nodeId: 'a', text: 'First' }])
    tx.applyPatches([{ type: 'update', nodeId: 'a', text: 'Second' }, { type: 'move', nodeId: 'a', parentId: 'other', index: 0 }])
    expect(controller.getSnapshot().canUndo).toBe(false)
    expect(tx.commit()).toBe(true)
    const final = controller.getSnapshot().document
    expect(controller.undo()).toBe(true)
    expect(controller.getSnapshot().document).toEqual(initial)
    expect(controller.undo()).toBe(false)
    expect(controller.redo()).toBe(true)
    expect(controller.getSnapshot().document).toEqual(final)
  })

  it('cancels a transaction and restores selection without consuming redo', () => {
    const controller = createMindMapController(initial)
    controller.updateNode('a', { text: 'Edited' })
    controller.undo()
    controller.selectNode('a')
    const tx = controller.beginTransaction()
    tx.applyPatches([{ type: 'remove', nodeId: 'a' }])
    expect(tx.cancel()).toBe(true)
    expect(controller.getSnapshot().document).toEqual(initial)
    expect(controller.getSnapshot().selectedNodeId).toBe('a')
    expect(controller.getSnapshot().canRedo).toBe(true)
  })

  it('external replacement invalidates all late writes and cancellation', () => {
    const controller = createMindMapController(initial)
    const tx = controller.beginTransaction('stream')
    tx.setMarkdown('Generated\n- Partial')
    const replacement = parseMindMap('Host replacement')
    controller.setDocument(replacement)
    const before = controller.getSnapshot()
    expect(tx.setMarkdown('Late')).toBe(false)
    expect(tx.cancel()).toBe(false)
    expect(tx.commit()).toBe(false)
    expect(controller.getSnapshot()).toBe(before)
    expect(before.document).toEqual(replacement)
    expect(before.canUndo).toBe(false)
  })

  it('concurrent edit rolls back generated content before applying the edit', () => {
    const controller = createMindMapController(initial)
    const tx = controller.beginTransaction('stream')
    tx.setMarkdown('Generated')
    controller.updateNode('b', { text: 'User edit' })
    expect(tx.isActive()).toBe(false)
    expect(controller.getSnapshot().document.roots[0].children?.[1].text).toBe('User edit')
    controller.undo()
    expect(controller.getSnapshot().document).toEqual(initial)
  })

  it('bounds history and reuses projection for selection and transaction commit', () => {
    const controller = createMindMapController(initial, { historyLimit: 2 })
    const layout = controller.getSnapshot().layout
    controller.selectNode('a')
    expect(controller.getSnapshot().layout).toBe(layout)
    const tx = controller.beginTransaction()
    tx.applyPatches([{ type: 'update', nodeId: 'a', text: 'One' }])
    const projected = controller.getSnapshot().layout
    tx.commit()
    expect(controller.getSnapshot().layout).toBe(projected)
    controller.updateNode('a', { text: 'Two' })
    controller.updateNode('a', { text: 'Three' })
    controller.undo(); controller.undo()
    expect(controller.undo()).toBe(false)
    expect(controller.getSnapshot().document.roots[0].children?.[0].text).toBe('One')
    const previous = controller.getSnapshot().layout
    controller.setLayoutOptions({ direction: 'left' })
    expect(controller.getSnapshot().layout).not.toBe(previous)
    expect(controller.getSnapshot().layout.nodeById.get('a')?.side).toBe('left')
  })
})

describe('patch inversion and diff', () => {
  it('inverts a mixed sequence including sibling reorder and attribute deletion', () => {
    const patches: MindMapPatch[] = [
      { type: 'move', nodeId: 'a', parentId: 'root', index: 1 },
      { type: 'update', nodeId: 'b', attributes: { tags: { values: ['x'] } } },
      { type: 'remove', nodeId: 'leaf' },
      { type: 'insert', parentId: 'other', index: 0, node: { id: 'new', text: 'New' } },
    ]
    const result = applyMindMapPatchesWithInverse(initial, patches)
    expect(applyMindMapPatches(result.document, result.inversePatches)).toEqual(initial)
    expect(applyMindMapPatches(initial, diffMindMapDocuments(initial, result.document))).toEqual(result.document)
  })

  it('preserves a node promoted out of a removed parent', () => {
    const after: MindMapDocument = { roots: [{ id: 'leaf', text: 'Leaf' }, { id: 'new', text: 'New', children: [{ id: 'b', text: 'B' }] }] }
    expect(applyMindMapPatches(initial, diffMindMapDocuments(initial, after))).toEqual(after)
  })
})

describe('stream transactions and frame scheduling', () => {
  it('protects public parser and stream snapshots from corrupting future appends', async () => {
    const parser = createMindMapParser()
    parser.append('Root\n- A\n')
    const document = parser.getDocument()
    expect(() => { document.roots.push({ id: 'bad', text: 'Bad' }) }).toThrow()
    parser.append('- B\n')
    expect(parser.getDocument().roots[0].children?.map((node) => node.text)).toEqual(['A', 'B'])
    const stream = createMarkdownStream({ initialMarkdown: 'Root\n- A\n' })
    expect(() => { stream.getDocument().roots[0].text = 'Bad' }).toThrow()
    stream.append('- B\n')
    const update = await stream.flush()
    expect(Object.isFrozen(update)).toBe(true)
    expect(Object.isFrozen(update?.patches)).toBe(true)
    expect(stream.getDocument().roots[0].children?.map((node) => node.text)).toEqual(['A', 'B'])
    stream.dispose()
  })

  it('does not leak provisional frontmatter comments after its delimiter closes', async () => {
    const source = '---\n%% Inside metadata\ndirection: left\n---\nRoot\n%% Body comment\n- Child'
    const stream = createMarkdownStream()
    for (const character of source) { stream.append(character); await stream.flush() }
    expect(stream.getDocument()).toEqual(parseMindMap(source))
    expect(stream.getDocument().comments?.map((comment) => comment.text)).toEqual(['%% Body comment'])
    stream.dispose()
  })
  it('does not reparse completed lines and keeps CRLF and tail state', () => {
    const transformNode = vi.fn((node) => node)
    const parser = createMindMapParser({ extensions: [{ id: 'count', transformNode }] })
    parser.append('Root\r\n- A\r')
    expect(transformNode).toHaveBeenCalledTimes(2)
    parser.append('\n- B')
    expect(parser.getDocument()).toEqual(parseMindMap('Root\n- A\n- B'))
    expect(transformNode).toHaveBeenCalledTimes(3)
    parser.append('eta\n')
    const previous = parser.getDocument()
    parser.append('- C\n')
    expect(parser.getDocument().roots[0].children?.[0]).toBe(previous.roots[0].children?.[0])
    expect(transformNode).toHaveBeenCalledTimes(5)
  })

  it('preserves custom host ids when AI updates matching content', async () => {
    const controller = createMindMapController(initial)
    controller.selectNode('a')
    const stream = controller.createMarkdownStream()
    stream.append('Root\n- A\n  - Leaf\n- B\n- New\n')
    await stream.flush()
    expect(controller.getSnapshot().document.roots[0].id).toBe('root')
    expect(controller.getSnapshot().document.roots[0].children?.[0].id).toBe('a')
    expect(controller.getSnapshot().selectedNodeId).toBe('a')
    stream.cancel()
  })

  it('rolls back the controller when a stream parse fails', async () => {
    const controller = createMindMapController(initial)
    const stream = controller.createMarkdownStream()
    stream.append('Partial')
    await stream.flush()
    expect(() => stream.append('x'.repeat(1_000_001))).toThrow(/1000000/)
    expect(stream.isActive()).toBe(false)
    expect(controller.getSnapshot().document).toEqual(initial)
    expect(controller.getSnapshot().canUndo).toBe(false)
  })

  it('retains comment trivia and explicit anchors through round trips', () => {
    const source = '%% Leading\nRoot\n- A\n  %% Explains A\n  > Remark\n- B'
    const document = parseMindMap(source)
    expect(document.comments).toHaveLength(2)
    expect(parseMindMap(serializeMindMap(document))).toEqual(document)
    const extension = { id: 'anchor', transformNode: (node: MindMapDocument['roots'][number]) => ({ ...node, attributes: { crossLink: { anchor: 'stable', links: [] } } }) }
    expect(parseMindMap('Name', { extensions: [extension] }).roots[0].id).toBe('mm-anchor-stable')
    expect(() => parseMindMap('Root\n- Duplicate', { extensions: [extension] })).toThrow(/Duplicate/)
  })

  it('enforces aggregate input and node count limits across parsing and patches', () => {
    expect(() => parseMindMap('a'.repeat(1_000_001))).toThrow(/1000000/)
    expect(() => parseMindMap(Array.from({ length: 20_001 }, (_, i) => '- N' + i).join('\n'))).toThrow(/20000/)
    const nearLimit: MindMapDocument = { roots: Array.from({ length: 20_000 }, (_, i) => ({ id: 'n' + i, text: 'N' })) }
    const result = applyMindMapPatchesWithInverse(nearLimit, [{ type: 'insert', parentId: null, index: 0, node: { id: 'extra', text: 'Extra' } }])
    expect(result.valid).toBe(false)
    expect(result.document).toBe(nearLimit)
  })
  it('coalesces multiple chunks once and flush cancels the queued frame', async () => {
    let callback: (() => void) | undefined
    const cancel = vi.fn()
    const schedule = vi.fn((next: () => void) => { callback = next; return cancel })
    const stream = createMarkdownStream({ schedule })
    const listener = vi.fn()
    stream.subscribe(listener)
    stream.append('Root'); stream.append('\n- Child')
    expect(schedule).toHaveBeenCalledTimes(1)
    expect(listener).not.toHaveBeenCalled()
    await stream.flush()
    expect(cancel).toHaveBeenCalledOnce()
    callback?.()
    expect(listener).toHaveBeenCalledTimes(1)
    stream.dispose()
  })

  it('matches full parsing at every character boundary across extended syntax', async () => {
    const extensions = [{ id: 'multiline' }, { id: 'folding' }, { id: 'dotted-line' }]
    const source = '---\r\ndirection: left\r\n---\r\nRoot\n- [x] Child\n  > Remark\n  | Extra\n  + Fold\n    -. Dotted\n- [link](https://example.com)'
    const stream = createMarkdownStream({ extensions })
    for (const char of source) {
      stream.append(char)
      await stream.flush()
      expect(stream.getDocument()).toEqual(parseMindMap(stream.getMarkdown(), { extensions }))
    }
    expect(parseMindMap(serializeMindMap(stream.getDocument(), { extensions }), { extensions })).toEqual(stream.getDocument())
    stream.dispose()
  })

  it('success creates one undo, cancellation restores the baseline', async () => {
    const controller = createMindMapController(initial)
    const stream = controller.createMarkdownStream()
    stream.append('New'); await stream.flush()
    stream.append('\n- Child'); await stream.flush()
    expect(await stream.commit()).toBe(true)
    expect(controller.undo()).toBe(true)
    expect(controller.getSnapshot().document).toEqual(initial)
    expect(controller.undo()).toBe(false)
    const cancelled = controller.createMarkdownStream()
    cancelled.append('Partial'); await cancelled.flush()
    cancelled.cancel()
    expect(controller.getSnapshot().document).toEqual(initial)
  })

  it('blocks queued and late chunks after external replacement or disposal', async () => {
    const controller = createMindMapController(initial)
    const stream = controller.createMarkdownStream()
    stream.append('Queued')
    controller.setMarkdown('Host', 'external')
    stream.append('Late')
    expect(await stream.flush()).toBeNull()
    expect(await stream.commit()).toBe(false)
    expect(controller.getSnapshot().document.roots[0].text).toBe('Host')
    const next = controller.createMarkdownStream()
    next.append('Queued')
    controller.dispose()
    expect(await next.flush()).toBeNull()
  })
})

describe('layout and URL contracts', () => {
  it.each(['left', 'right', 'both'] as const)('keeps all exported image rectangles inside measured nodes and the %s viewBox', (direction) => {
    const image = '![Image](data:image/png;base64,aGVsbG8=)'
    const document: MindMapDocument = { roots: [{ id: 'r', text: image + ' ' + image, attributes: { tags: { values: ['tag'] }, multiline: { lines: ['Extra ' + image, '$x^2$'] } }, children: [{ id: 'a', text: image }, { id: 'b', text: 'Neighbor ' + image }] }] }
    const layout = layoutMindMap(document, { direction })
    const svg = renderMindMapToSvg(document, { direction, padding: 0 })
    const viewBox = /viewBox="([^"]+)"/.exec(svg)![1].split(' ').map(Number)
    const groups = [...svg.matchAll(/<g transform="translate\(([-\d.]+) ([-\d.]+)\)"[^>]*>([\s\S]*?)<\/g>/g)]
    expect(groups).toHaveLength(layout.nodes.length)
    let count = 0
    groups.forEach((group, index) => {
      const node = layout.nodes[index]
      const metrics = measureMindMapNodeContent(node, node.depth)
      expect(node.width).toBe(metrics.width)
      expect(node.height).toBe(metrics.height)
      const rectangles = [...group[3].matchAll(/<image x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)]
      expect(rectangles).toHaveLength(metrics.images.length)
      count += rectangles.length
      rectangles.forEach((match, imageIndex) => {
        const [x, y, width, height] = match.slice(1).map(Number)
        expect(x).toBeCloseTo(metrics.images[imageIndex].x, 2)
        expect(y).toBeCloseTo(metrics.images[imageIndex].y, 2)
        expect(x).toBeGreaterThanOrEqual(-node.width / 2 - 0.01)
        expect(y).toBeGreaterThanOrEqual(-node.height / 2 - 0.01)
        expect(x + width).toBeLessThanOrEqual(node.width / 2 + 0.01)
        expect(y + height).toBeLessThanOrEqual(node.height / 2 + 0.01)
        expect(node.x + x).toBeGreaterThanOrEqual(viewBox[0] - 0.02)
        expect(node.y + y).toBeGreaterThanOrEqual(viewBox[1] - 0.02)
        expect(node.x + x + width).toBeLessThanOrEqual(viewBox[0] + viewBox[2] + 0.02)
        expect(node.y + y + height).toBeLessThanOrEqual(viewBox[1] + viewBox[3] + 0.02)
      })
    })
    expect(count).toBe(5)
    expect(svg).toContain('role="img"')
    expect(svg).toContain('<title>')
    expect(svg).toContain('<desc>')
    expect(svg).not.toContain('role="tree')
  })

  it('falls back to escaped math source when the optional renderer fails', () => {
    const svg = renderMindMapToSvg(parseMindMap('$x < y$'), { title: 'Math <map>', description: 'A & B', renderMath: () => { throw new Error('Bad math') } })
    expect(svg).toContain('$x &lt; y$')
    expect(svg).toContain('<title>Math &lt;map&gt;</title>')
    expect(svg).toContain('<desc>A &amp; B</desc>')
  })
  it('exports inline styling, safe URLs, images, remarks, multiline and labels', () => {
    const document: MindMapDocument = { roots: [{ id: 'r', text: '**Bold** [Safe](https://example.com) [Bad](javascript:alert) ![Image](data:image/png;base64,aGVsbG8=)', attributes: { remark: { text: '<note>' }, multiline: { lines: ['Extra `code`'] }, tags: { values: ['tag'] } }, children: [{ id: 'c', text: '$x^2$', attributes: { connection: { label: 'Edge label' } } }] }] }
    const svg = renderMindMapToSvg(document, { renderMath: () => '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math>' })
    expect(svg).toContain('font-weight="700">Bold')
    expect(svg).toContain('href="https://example.com"')
    expect(svg).not.toContain('href="javascript:')
    expect(svg).toContain('<image ')
    expect(svg).toContain('Extra <tspan font-family="monospace">code')
    expect(svg).toContain('>tag</text>')
    expect(svg).toContain('&lt;note&gt;')
    expect(svg).toContain('Edge label')
    expect(svg).toContain('<math ')
  })
  it('folds roots and invalidates dimensions when text, theme or attributes change', () => {
    const folded = applyMindMapPatches(initial, [{ type: 'update', nodeId: 'root', attributes: { folding: { collapsed: true } } }])
    expect(layoutMindMap(folded).nodes.map((node) => node.id)).toEqual(['root', 'other'])
    const before = layoutMindMap(initial).nodeById.get('a')!
    const changed = applyMindMapPatches(initial, [{ type: 'update', nodeId: 'a', text: 'A much longer label for measurement', attributes: { multiline: { lines: ['extra'] } } }])
    const after = layoutMindMap(changed).nodeById.get('a')!
    expect(after.width).toBeGreaterThan(before.width)
    expect(after.height).toBeGreaterThan(before.height)
    expect(layoutMindMap(initial, { theme: { levelOneFontSize: 32 } }).nodeById.get('a')!.height).toBeGreaterThan(before.height)
    expect(layoutMindMap(initial).nodeById.get('a')).toEqual(before)
  })

  it.each(['javascript:alert(1)', 'data:text/html,test', 'blob:https://example.com/id', 'file:///etc/passwd', 'java\nscript:alert(1)', '//example.com'])('rejects unsafe URL %s', (value) => {
    expect(sanitizeMindMapUrl(value)).toBeNull()
    expect(sanitizeMindMapUrl(value, true)).toBeNull()
  })
  it('accepts links and raster data while excluding SVG data', () => {
    expect(sanitizeMindMapUrl('#node')).toBe('#node')
    expect(sanitizeMindMapUrl('mailto:test@example.com')).toBe('mailto:test@example.com')
    expect(sanitizeMindMapUrl('https://example.com/a.png', true)).toBe('https://example.com/a.png')
    expect(sanitizeMindMapUrl('data:image/png;base64,aGVsbG8=', true)).toBeTruthy()
    expect(sanitizeMindMapUrl('data:image/svg+xml;base64,PHN2Zz4=', true)).toBeNull()
  })
})
