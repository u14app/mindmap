import { expect, test, type Page } from '@playwright/test'
import type { AIIntegrityFixture } from './fixtures/ai-integrity/main'

declare global { interface Window { aiIntegrity: AIIntegrityFixture } }

async function snapshot(page: Page) {
  return page.evaluate(() => window.aiIntegrity.snapshot())
}

async function openComposer(page: Page, query = '') {
  await page.goto(`http://127.0.0.1:4322/${query}`)
  await expect(page.getByRole('tree', { name: 'AI integrity editor' })).toBeVisible()
  await page.waitForFunction(() => Boolean(window.aiIntegrity))
  await page.locator('.mm-ai-input-wrap input').fill('Organize my notes')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Synthetic test notes'),
  })
  await expect(page.locator('.mm-ai-attachments')).toContainText('notes.txt')
  await expect(page.locator('.mm-ai-submit')).toBeEnabled()
  return snapshot(page)
}

function body(format: 'sse' | 'json', reason: string | null) {
  const content = 'Generated\n- Complete detail'
  const finish = reason === null ? {} : { finish_reason: reason }
  return format === 'sse'
    ? `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content }, finish_reason: null }] })}\n\ndata: ${JSON.stringify({ choices: [{ index: 0, delta: {}, ...finish }] })}\n\ndata: [DONE]\n\n`
    : JSON.stringify({ choices: [{ index: 0, message: { content }, ...finish }] })
}

async function mockProvider(page: Page, format: 'sse' | 'json', reason: string | null) {
  await page.route('http://127.0.0.1:4322/api/ai', async (route) => {
    await route.fulfill({ status: 200, contentType: format === 'sse' ? 'text/event-stream' : 'application/json', body: body(format, reason) })
  })
}

async function expectInputsKept(page: Page) {
  await expect(page.locator('.mm-ai-input-wrap input')).toHaveValue('Organize my notes')
  await expect(page.locator('.mm-ai-attachments')).toContainText('notes.txt')
  await expect(page.locator('.mm-ai-submit')).toBeEnabled()
  await expect(page.locator('.mm-ai-stop')).toHaveCount(0)
}

test.describe('built-in AI completion integrity', () => {
  for (const locale of ['en-US', 'zh-CN']) {
    for (const format of ['sse', 'json'] as const) {
      for (const reason of ['length', 'content_filter']) {
        test(`${locale} ${format} ${reason} preserves the actual document and composer`, async ({ page }) => {
          await mockProvider(page, format, reason)
          const before = await openComposer(page, `?locale=${locale}`)
          await page.locator('.mm-ai-submit').click()
          const message = locale === 'zh-CN'
            ? reason === 'length' ? '生成因输出长度限制未完成，原导图已保留。' : '生成被提供方中止，原导图已保留。'
            : reason === 'length' ? 'Generation reached the output limit before completion. Your original mind map was kept.' : 'The provider stopped generation. Your original mind map was kept.'
          await expect(page.getByRole('alert')).toHaveText(message)
          await expectInputsKept(page)
          const after = await snapshot(page)
          expect(after.document).toEqual(before.document)
          expect(after.selectedNodeId).toBe(before.selectedNodeId)
          expect(after.canUndo).toBe(false)
          expect(after.events.filter((event) => event.phase === 'commit')).toEqual([])
          expect(after.errors).toEqual([reason === 'length' ? 'incomplete' : 'content_filter'])
          expect(after.requests).toBe(1)
        })
      }
    }
  }

  for (const format of ['sse', 'json'] as const) {
    test(`${format} stop clears inputs only after one commit and undoes in one step`, async ({ page }) => {
      await mockProvider(page, format, 'stop')
      const before = await openComposer(page)
      await page.locator('.mm-ai-submit').click()
      await expect(page.locator('.mm-ai-input-wrap input')).toHaveValue('')
      await expect(page.locator('.mm-ai-attachments')).toHaveCount(0)
      await expect(page.getByRole('treeitem', { name: 'Generated', exact: true })).toBeVisible()
      await expect(page.getByRole('treeitem', { name: 'Complete detail', exact: true })).toBeVisible()
      const after = await snapshot(page)
      expect(after.events.filter((event) => event.phase === 'commit')).toEqual([{ phase: 'commit', reason: 'stream' }])
      expect(after.completions).toEqual([{ status: 'normal', finishReason: 'stop', responseType: format }])
      await page.getByRole('button', { name: 'Undo', exact: true }).click()
      await expect(page.getByRole('treeitem', { name: 'Original', exact: true })).toBeVisible()
      expect((await snapshot(page)).document).toEqual(before.document)
      await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
    })
  }

  test('stop rolls back a visible preview, keeps inputs and rejects late packets', async ({ page }) => {
    const before = await openComposer(page, '?controlled=true')
    await page.locator('.mm-ai-submit').click()
    await expect(page.getByRole('treeitem', { name: 'Partial', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Stop', exact: true }).click()
    await expectInputsKept(page)
    await expect(page.getByRole('treeitem', { name: 'Original', exact: true })).toBeVisible()
    expect(await page.evaluate(() => window.aiIntegrity.send('\n- Late packet', 'stop'))).toBe(false)
    const after = await snapshot(page)
    expect(after.document).toEqual(before.document)
    expect(after.selectedNodeId).toBe(before.selectedNodeId)
    expect(after.canUndo).toBe(false)
    expect(after.errors).toEqual([])
    expect(after.events.filter((event) => event.phase === 'commit')).toEqual([])
  })

  test('external editing takes ownership without a stale rollback or input loss', async ({ page }) => {
    await openComposer(page, '?controlled=true')
    await page.locator('.mm-ai-submit').click()
    await expect(page.getByRole('treeitem', { name: 'Partial', exact: true })).toBeVisible()
    await page.evaluate(() => window.aiIntegrity.edit('External\n- Latest changes'))
    await expectInputsKept(page)
    expect(await page.evaluate(() => window.aiIntegrity.send('\n- Late packet', 'length'))).toBe(false)
    await expect(page.getByRole('treeitem', { name: 'External', exact: true })).toBeVisible()
    const after = await snapshot(page)
    expect(after.document.roots[0].children?.[0].text).toBe('Latest changes')
    expect(after.errors).toEqual([])
    expect(after.events.filter((event) => event.phase === 'commit' && event.reason === 'stream')).toEqual([])
  })

  for (const policy of ['strict', 'legacy']) {
    test(`${policy} handles missing finish_reason explicitly`, async ({ page }) => {
      await mockProvider(page, 'sse', null)
      const before = await openComposer(page, `?policy=${policy}`)
      await page.locator('.mm-ai-submit').click()
      if (policy === 'strict') {
        await expect(page.getByRole('alert')).toHaveText('The response could not be verified. Your original mind map was kept.')
        await expectInputsKept(page)
        expect((await snapshot(page)).document).toEqual(before.document)
      } else {
        await expect(page.locator('.mm-ai-input-wrap input')).toHaveValue('')
        await expect(page.getByRole('treeitem', { name: 'Generated', exact: true })).toBeVisible()
      }
      expect((await snapshot(page)).completions).toEqual([{ status: 'unknown', finishReason: null, responseType: 'sse' }])
    })
  }

  test('provider errors remain safe while retaining retry inputs and the original document', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.route('http://127.0.0.1:4322/api/ai', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ error: { message: 'SECRET provider detail' } }) })
    })
    const before = await openComposer(page)
    await page.locator('.mm-ai-submit').click()
    await expect(page.getByRole('alert')).toHaveText('Generation failed')
    await expectInputsKept(page)
    expect((await snapshot(page)).document).toEqual(before.document)
    expect((await snapshot(page)).errors).toEqual(['provider_error'])
    await expect(page.locator('body')).not.toContainText('SECRET')
    expect(pageErrors).toEqual([])
  })
})
