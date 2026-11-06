import { promises as fs } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

async function openPlayground(page: Page): Promise<void> {
  await page.goto('/live/')
  await expect(page.locator('.legacy-playground--fullscreen')).toBeVisible()
  const tree = page.getByRole('tree', { name: 'Editable Open MindMap demo' })
  await expect(tree).toBeVisible()
  await expect(page.locator('astro-island').filter({ has: tree })).not.toHaveAttribute('ssr', '')
}

async function treeLabels(page: Page): Promise<string[]> {
  return page.locator('[role="treeitem"]').evaluateAll((items) => items.map((item) => item.getAttribute('aria-label') ?? ''))
}

function moveLabelAfter(labels: string[], source: string, target: string): string[] {
  const result = labels.filter((label) => label !== source)
  const targetIndex = result.indexOf(target)
  if (targetIndex < 0) throw new Error(`Unable to find ${target} in the tree labels.`)
  result.splice(targetIndex + 1, 0, source)
  return result
}

async function dragNode(page: Page, sourceName: string, targetName: string, placement: 'before' | 'after' | 'child'): Promise<void> {
  const source = page.getByRole('treeitem', { name: sourceName, exact: true })
  const target = page.getByRole('treeitem', { name: targetName, exact: true })
  await expect(source).toBeVisible()
  await expect(target).toBeVisible()
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Unable to resolve the SVG node bounds for pointer drag.')
  const sourceX = sourceBox.x + sourceBox.width / 2
  const sourceY = sourceBox.y + sourceBox.height / 2
  const targetX = targetBox.x + targetBox.width / 2
  const targetY = targetBox.y + targetBox.height * (placement === 'before' ? 0.1 : placement === 'after' ? 0.9 : 0.5)
  await page.mouse.move(sourceX, sourceY)
  await page.mouse.down()
  await page.mouse.move(sourceX + 20, sourceY + 20)
  await page.mouse.move(targetX, targetY, { steps: 8 })
  await page.mouse.up()
}

async function cancelNodeDrag(page: Page, sourceName: string): Promise<void> {
  const source = page.getByRole('treeitem', { name: sourceName, exact: true })
  const tree = page.getByRole('tree', { name: 'Editable Open MindMap demo' })
  await expect(source).toBeVisible()
  const sourceBox = await source.boundingBox()
  if (!sourceBox) throw new Error('Unable to resolve the SVG node bounds for pointer cancellation.')
  const sourceX = sourceBox.x + sourceBox.width / 2
  const sourceY = sourceBox.y + sourceBox.height / 2
  await page.mouse.move(sourceX, sourceY)
  await page.mouse.down()
  await page.mouse.move(sourceX + 20, sourceY + 20)
  await tree.dispatchEvent('pointercancel', {
    bubbles: true,
    pointerId: 1,
    clientX: sourceX + 20,
    clientY: sourceY + 20,
  })
  await page.mouse.up()
}

async function importContent(page: Page, format: 'Markdown' | 'JSON', value: string): Promise<void> {
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Import' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: format, exact: true }).click()
  await dialog.getByRole('textbox', { name: 'Mind map content to import' }).fill(value)
  await dialog.getByRole('button', { name: 'Import', exact: true }).click()
  await expect(dialog).toBeHidden()
}

async function downloadFromExport(page: Page, label: string): Promise<{ filename: string; path: string }> {
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: label, exact: true }).click()
  const download = await downloadPromise
  const path = await download.path()
  if (!path) throw new Error(`The ${label} download did not expose a file path.`)
  return { filename: download.suggestedFilename(), path }
}

test.describe('public site routes', () => {
  test('home renders the complete legacy page around the real v0.9 Editor', async ({ page }) => {
    await page.goto('/')

    const editor = page.getByRole('tree', { name: 'Editable Open MindMap demo' })
    await expect(editor).toBeVisible()
    await expect(editor.getByRole('treeitem', { name: 'Open MindMap', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Everything you need.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Extend with Extensions.' })).toBeVisible()
  })

  test('documentation route exposes all legacy sections with v0.9 content', async ({ page }) => {
    await page.goto('/docs/')

    await expect(page).toHaveTitle(/Documentation - Open MindMap/)
    await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Extended Syntax' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'API Reference' })).toBeAttached()
    await expect(page.getByText('@xiangfa/mindmap/core', { exact: true }).first()).toBeVisible()
    await expect(page.locator('[data-docs-section]')).toHaveCount(13)
  })

  test('legacy hash routes redirect to their Astro destinations', async ({ page }) => {
    await page.goto('/#/docs')
    await expect(page).toHaveURL(/\/docs\/$/)
    await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible()

    await page.goto('/#/live')
    await expect(page).toHaveURL(/\/live\/$/)
    await expect(page.locator('.legacy-playground--fullscreen')).toBeVisible()

    await page.goto('/playground/')
    await expect(page).toHaveURL(/\/live\/$/)
  })
})

test.describe('playground editor', () => {
  test('searches the shared document and reports the active match', async ({ page }) => {
    await openPlayground(page)

    const search = page.getByRole('search')
    const input = search.getByRole('textbox', { name: 'Search', exact: true })
    await input.fill('Markdown')
    await input.press('Enter')
    await expect(search).toContainText('1/1')
    await expect(page.getByRole('treeitem', { name: 'Markdown Syntax', exact: true })).toHaveAttribute('aria-selected', 'true')
  })

  test('rejects invalid import data and imports valid Markdown through the dialog', async ({ page }) => {
    await openPlayground(page)

    await page.getByRole('button', { name: 'Import', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Import' })
    await expect(dialog).toBeVisible()

    const textarea = dialog.getByRole('textbox', { name: 'Mind map content to import' })
    await dialog.getByRole('button', { name: 'JSON', exact: true }).click()
    await textarea.fill('{')
    await dialog.getByRole('button', { name: 'Import', exact: true }).click()
    await expect(dialog.getByRole('alert')).toBeVisible()
    await expect(textarea).toHaveAttribute('aria-invalid', 'true')

    await dialog.getByRole('button', { name: 'Markdown', exact: true }).click()
    await textarea.fill('Imported Root\n  - Imported Child')
    await dialog.getByRole('button', { name: 'Import', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('treeitem', { name: 'Imported Root', exact: true })).toBeVisible()
    await expect(page.getByRole('treeitem', { name: 'Imported Child', exact: true })).toBeVisible()
  })

  test('does not load remote images imported through Markdown or JSON without host authorization', async ({ page }) => {
    const remoteImage = 'https://attacker.invalid/tracking-pixel.png'
    const requested: string[] = []
    await page.route('https://attacker.invalid/**', async (route) => {
      requested.push(route.request().url())
      await route.abort()
    })
    await openPlayground(page)

    await importContent(page, 'Markdown', `Remote image\n- ![Tracking pixel](${remoteImage})`)
    await expect(page.getByRole('treeitem', { name: `![Tracking pixel](${remoteImage})`, exact: true })).toBeVisible()
    await expect(page.locator(`.mm-surface image[href="${remoteImage}"], .mm-surface img[src="${remoteImage}"]`)).toHaveCount(0)
    await expect(page.locator('.mm-surface').getByText('Tracking pixel', { exact: true })).toBeVisible()

    const json = JSON.stringify({ roots: [{ id: 'remote-image', text: `![JSON tracking pixel](${remoteImage})` }] })
    await importContent(page, 'JSON', json)
    await expect(page.getByRole('treeitem', { name: `![JSON tracking pixel](${remoteImage})`, exact: true })).toBeVisible()
    await expect(page.locator(`.mm-surface image[href="${remoteImage}"], .mm-surface img[src="${remoteImage}"]`)).toHaveCount(0)
    await expect(page.locator('.mm-surface').getByText('JSON tracking pixel', { exact: true })).toBeVisible()
    expect(requested).toEqual([])
  })

  test('traps import dialog focus and restores focus after Escape', async ({ page }) => {
    await openPlayground(page)

    const trigger = page.getByRole('button', { name: 'Import', exact: true })
    await trigger.focus()
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Import' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Mind map content to import' })).toBeFocused()

    const close = dialog.getByRole('button', { name: 'Close', exact: true })
    const confirm = dialog.getByRole('button', { name: 'Import', exact: true })
    await dialog.getByRole('textbox', { name: 'Mind map content to import' }).fill('Root')
    await close.focus()
    await page.keyboard.press('Shift+Tab')
    await expect(confirm).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('edits a node and Escape restores the pre-edit label', async ({ page }) => {
    await openPlayground(page)

    const tree = page.getByRole('tree', { name: 'Editable Open MindMap demo' })
    await tree.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')

    const editor = page.getByRole('textbox', { name: 'Node text' })
    await expect(editor).toBeVisible()
    await editor.fill('Edited without commit')
    await page.keyboard.press('Escape')
    await expect(editor).toBeHidden()
    await expect(page.getByRole('treeitem', { name: 'Open MindMap', exact: true })).toBeVisible()
    await expect(page.getByRole('treeitem', { name: 'Edited without commit', exact: true })).toHaveCount(0)
  })

  test('moves a sibling with the keyboard and restores it with history', async ({ page }) => {
    await openPlayground(page)

    const tree = page.getByRole('tree', { name: 'Editable Open MindMap demo' })
    const before = await treeLabels(page)
    const firstSiblingIndex = before.indexOf('Installation')
    const secondSiblingIndex = before.indexOf('Quick Setup')
    expect(firstSiblingIndex).toBeGreaterThan(-1)
    expect(secondSiblingIndex).toBeGreaterThan(firstSiblingIndex)

    const source = page.getByRole('treeitem', { name: 'Installation', exact: true })
    await source.click()
    await expect(source).toHaveAttribute('aria-selected', 'true')
    await tree.focus()
    await expect(source).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Alt+ArrowDown')
    await expect.poll(async () => {
      const labels = await treeLabels(page)
      return [labels.indexOf('Installation'), labels.indexOf('Quick Setup')]
    }).toEqual([secondSiblingIndex, firstSiblingIndex])

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
    await expect.poll(async () => {
      const labels = await treeLabels(page)
      return [labels.indexOf('Installation'), labels.indexOf('Quick Setup')]
    }).toEqual([firstSiblingIndex, secondSiblingIndex])
  })

  test('reorders siblings by pointer and restores the single edit with undo and redo', async ({ page }) => {
    await openPlayground(page)

    const before = await treeLabels(page)
    const expectedAfter = moveLabelAfter(before, 'Installation', 'Quick Setup')
    await dragNode(page, 'Installation', 'Quick Setup', 'after')
    await expect.poll(() => treeLabels(page)).toEqual(expectedAfter)

    const undo = page.getByRole('button', { name: 'Undo', exact: true })
    const redo = page.getByRole('button', { name: 'Redo', exact: true })
    await expect(undo).toBeEnabled()
    await undo.click()
    await expect.poll(() => treeLabels(page)).toEqual(before)
    await expect(redo).toBeEnabled()
    await redo.click()
    await expect.poll(() => treeLabels(page)).toEqual(expectedAfter)
  })

  test('reparents a node by pointer and restores the single move with undo and redo', async ({ page }) => {
    await openPlayground(page)

    const before = await treeLabels(page)
    const expectedAfter = moveLabelAfter(before, 'Installation', 'Extension System')
    await dragNode(page, 'Installation', 'Core Features', 'child')
    await expect.poll(() => treeLabels(page)).toEqual(expectedAfter)
    await expect(page.getByRole('treeitem', { name: 'Installation', exact: true })).toHaveAttribute('aria-level', '3')

    const undo = page.getByRole('button', { name: 'Undo', exact: true })
    const redo = page.getByRole('button', { name: 'Redo', exact: true })
    await expect(undo).toBeEnabled()
    await undo.click()
    await expect.poll(() => treeLabels(page)).toEqual(before)
    await expect(redo).toBeEnabled()
    await redo.click()
    await expect.poll(() => treeLabels(page)).toEqual(expectedAfter)
  })

  test('cancelling a pointer drag leaves the document and history unchanged', async ({ page }) => {
    await openPlayground(page)

    const before = await treeLabels(page)
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
    await cancelNodeDrag(page, 'Installation')
    await expect.poll(() => treeLabels(page)).toEqual(before)
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
  })

  test('folds and unfolds a branch without losing its semantic tree items', async ({ page }) => {
    await openPlayground(page)

    const branch = page.getByRole('treeitem', { name: 'Getting Started', exact: true })
    await expect(branch).toHaveAttribute('aria-expanded', 'true')
    await branch.getByRole('button', { name: 'Collapse node' }).click()
    await expect(branch).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('treeitem', { name: 'Installation', exact: true })).toHaveCount(0)

    await branch.getByRole('button', { name: 'Expand node' }).click()
    await expect(branch).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('treeitem', { name: 'Installation', exact: true })).toBeVisible()
  })

  test('adapts the public plain-text AI stream as one committed document update', async ({ page }) => {
    await page.route('https://open-mindmap-ai.u14.app/api/mindmap**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/plain', body: '<think>private</think>```markdown\nRelease plan\n- Validate\n- Ship\n```' })
    })
    await openPlayground(page)

    const prompt = page.getByRole('textbox', { name: 'AI mind map prompt' })
    await prompt.fill('Release plan')
    await page.getByRole('button', { name: 'Generate mind map', exact: true }).click()
    await expect(page.getByRole('treeitem', { name: 'Release plan', exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Generate mind map', exact: true })).toBeVisible()
    await expect(page.getByRole('treeitem', { name: 'Open MindMap', exact: true })).toHaveCount(0)

    const undo = page.getByRole('button', { name: 'Undo', exact: true })
    await expect(undo).toBeEnabled()
    await undo.click()
    await expect(page.getByRole('treeitem', { name: 'Open MindMap', exact: true })).toBeVisible()
    await expect(page.getByRole('treeitem', { name: 'Release plan', exact: true })).toHaveCount(0)
    await expect(undo).toBeDisabled()
  })

  test('shows provider failure and keeps the previous document committed', async ({ page }) => {
    await page.route('https://open-mindmap-ai.u14.app/api/mindmap**', async (route) => {
      await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Unavailable' })
    })
    await openPlayground(page)

    const before = await treeLabels(page)
    const prompt = page.getByRole('textbox', { name: 'AI mind map prompt' })
    await prompt.fill('Provider failure')
    await page.getByRole('button', { name: 'Generate mind map', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('AI request failed (503).')
    await expect(page.getByRole('button', { name: 'Generate mind map', exact: true })).toBeVisible()
    await expect.poll(() => treeLabels(page)).toEqual(before)
    await expect(page.getByRole('treeitem', { name: 'Provider failure', exact: true })).toHaveCount(0)
  })

  test('downloads a standalone SVG from the export feature', async ({ page }) => {
    await openPlayground(page)

    const download = await downloadFromExport(page, 'Export as SVG')
    expect(download.filename).toBe('mindmap.svg')
    const content = await fs.readFile(download.path, 'utf8')
    expect(content).toContain('<svg')
    expect(content).toContain('Open MindMap')
  })

  test('downloads a PNG image from the export feature', async ({ page }) => {
    await openPlayground(page)

    const download = await downloadFromExport(page, 'Export as PNG')
    expect(download.filename).toBe('mindmap.png')
    const content = await fs.readFile(download.path)
    expect(content.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  })

  test('round-trips exported Markdown and JSON through the import feature', async ({ page }) => {
    await openPlayground(page)

    const markdownDownload = await downloadFromExport(page, 'Export as Markdown')
    expect(markdownDownload.filename).toBe('mindmap.md')
    const markdown = await fs.readFile(markdownDownload.path, 'utf8')
    expect(markdown).toContain('Open MindMap')
    expect(markdown).toContain('Getting Started')

    const jsonDownload = await downloadFromExport(page, 'Export JSON')
    expect(jsonDownload.filename).toBe('mindmap.json')
    const json = await fs.readFile(jsonDownload.path, 'utf8')
    const parsed = JSON.parse(json) as { roots?: unknown[] }
    expect(Array.isArray(parsed.roots)).toBe(true)

    await importContent(page, 'Markdown', 'Temporary root\n- Temporary child')
    await expect(page.getByRole('treeitem', { name: 'Temporary root', exact: true })).toBeVisible()
    await importContent(page, 'Markdown', markdown)
    await expect(page.getByRole('treeitem', { name: 'Open MindMap', exact: true })).toBeVisible()
    await expect(page.getByRole('treeitem', { name: 'Temporary root', exact: true })).toHaveCount(0)

    await importContent(page, 'Markdown', 'Temporary root\n- Temporary child')
    await importContent(page, 'JSON', json)
    await expect(page.getByRole('treeitem', { name: 'Open MindMap', exact: true })).toBeVisible()
    await expect(page.getByRole('treeitem', { name: 'Temporary root', exact: true })).toHaveCount(0)
  })
})

test.describe('site controls and responsive layout', () => {
  test('follows the system color scheme in the page and runtime', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/live/')
    const surface = page.locator('.mm-surface')
    await expect(surface).toBeVisible()
    expect(await surface.evaluate((element) => getComputedStyle(element).getPropertyValue('--mm-background').trim().toLowerCase())).toBe('#1a1a2e')
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toContain('dark')
  })

  test('keeps the legacy mobile page within the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Docs', exact: true }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /AI-Native/ })).toBeVisible()

    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
  })
})
