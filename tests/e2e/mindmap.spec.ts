import { expect, test } from '@playwright/test'

test('mind map editor supports search, import, undo, and redo', async ({ page }) => {
  await page.goto('/')

  const svg = page.locator('.mindmap-svg').first()
  await expect(svg).toBeVisible()

  const searchControls = page.locator('.mindmap-search-controls').first()
  await expect(searchControls).toBeVisible()
  await searchControls.locator('.mindmap-search-input').fill('React')
  await expect(searchControls.locator('.mindmap-search-count')).toHaveText('1/1')

  await svg.click()
  await svg.click({ button: 'right', position: { x: 320, y: 240 } })

  const menu = page.locator('.mindmap-context-menu')
  await expect(menu).toBeVisible()
  await expect(menu.locator('.mindmap-ctx-new-root')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(menu.locator('.mindmap-ctx-import')).toBeFocused()
  await page.keyboard.press('Enter')

  const dialog = page.locator('.mindmap-import-dialog')
  await expect(dialog).toBeVisible()

  const tabs = dialog.locator('[role="tab"]')
  await expect(tabs).toHaveCount(3)
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')

  const closeButton = dialog.locator('.mindmap-dialog-close')
  const primaryButton = dialog.locator('.mindmap-dialog-primary')
  await closeButton.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(primaryButton).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(closeButton).toBeFocused()

  await tabs.nth(0).press('End')
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')

  const textarea = dialog.locator('.mindmap-import-textarea')
  await textarea.fill('{')
  await primaryButton.click()
  await expect(dialog.locator('[role="alert"]')).toBeVisible()
  await expect(textarea).toHaveAttribute('aria-invalid', 'true')

  await tabs.nth(2).press('ArrowLeft')
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')

  await textarea.fill('- Imported Root\n  - Imported Child')
  await primaryButton.click()

  await expect(page.getByRole('treeitem', { name: 'Imported Root' })).toBeVisible()
  await expect(page.getByRole('treeitem', { name: 'Imported Child' })).toBeVisible()

  const undo = page.locator('.mindmap-ctrl-undo')
  const redo = page.locator('.mindmap-ctrl-redo')
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(page.getByRole('treeitem', { name: 'Open MindMap' })).toBeVisible()
  await expect(redo).toBeEnabled()
  await redo.click()
  await expect(page.getByRole('treeitem', { name: 'Imported Root' })).toBeVisible()
})
