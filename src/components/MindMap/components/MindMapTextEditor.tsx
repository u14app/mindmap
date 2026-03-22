import {
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react'
import { highlightMindmapHTML } from '../utils/highlight'

// ================================================================
//  Cursor utilities — save/restore caret as plain-text offset
//  Uses innerText-compatible counting: each <div> child = one line
// ================================================================

function saveCaret(el: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0

  const range = sel.getRangeAt(0)

  // Walk through el's child divs (lines) and count characters up to the caret
  let offset = 0
  const children = el.childNodes

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (range.startContainer === child || child.contains(range.startContainer)) {
      // Caret is inside this child — count offset within it
      const innerRange = document.createRange()
      innerRange.selectNodeContents(child)
      innerRange.setEnd(range.startContainer, range.startOffset)
      offset += innerRange.toString().length
      return offset
    }
    // Add this line's text length + 1 for the \n between lines
    offset += (child.textContent || '').length
    if (i < children.length - 1) offset += 1 // \n separator
  }

  // Fallback: caret might be directly in el (e.g. empty editor)
  return offset
}

function restoreCaret(el: HTMLElement, offset: number): void {
  const sel = window.getSelection()
  if (!sel) return

  // Walk through el's child divs (lines) to find the target line
  let remaining = offset
  const children = el.childNodes

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const lineLen = (child.textContent || '').length

    if (remaining <= lineLen) {
      // Caret is within this line — walk text nodes inside it
      const range = document.createRange()
      let found = false

      const walk = (node: Node): boolean => {
        if (node.nodeType === Node.TEXT_NODE) {
          const len = node.textContent!.length
          if (remaining <= len) {
            range.setStart(node, remaining)
            range.collapse(true)
            found = true
            return true
          }
          remaining -= len
        } else {
          for (let j = 0; j < node.childNodes.length; j++) {
            if (walk(node.childNodes[j])) return true
          }
        }
        return false
      }
      walk(child)

      if (!found) {
        // No text node found (e.g., empty line <div><br></div>)
        // Position caret at the start of the element itself
        range.setStart(child, 0)
        range.collapse(true)
      }
      sel.removeAllRanges()
      sel.addRange(range)
      return
    }

    remaining -= lineLen + 1 // +1 for the \n between lines
  }

  // Fallback: place caret at the end
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

/** Get the full plain text from the contentEditable */
function getPlainText(el: HTMLElement): string {
  // Walk child nodes directly and join with \n.
  // Do NOT use innerText — it double-counts newlines for <div><br></div>
  // (block boundary + <br>), causing empty lines to multiply on each re-highlight.
  const children = el.childNodes
  if (children.length === 0) return ''
  const lines: string[] = []
  for (let i = 0; i < children.length; i++) {
    // textContent gives raw text without extra \n for <br> or block boundaries
    lines.push(children[i].textContent || '')
  }
  return lines.join('\n').replace(/\u00a0/g, ' ')
}

// ================================================================
//  MindMapTextEditor component
// ================================================================

export interface MindMapTextEditorProps {
  value: string
  onChange: (text: string) => void
  readOnly?: boolean
  className?: string
  style?: React.CSSProperties
}

export function MindMapTextEditor({
  value,
  onChange,
  readOnly,
  className,
  style,
}: MindMapTextEditorProps) {
  const editorRef = useRef<HTMLPreElement>(null)
  // Track whether the current update is from internal editing
  const isInternalEdit = useRef(false)
  // Track last value we set from external update to avoid loops
  const lastExternalValue = useRef(value)
  // Track IME composition state to avoid re-highlighting mid-composition
  const isComposing = useRef(false)
  // Undo/redo stacks
  const undoStack = useRef<{ text: string; caret: number }[]>([{ text: value, caret: 0 }])
  const redoStack = useRef<{ text: string; caret: number }[]>([])
  const lastUndoPush = useRef(0)

  // --- Initial render and external value changes ---
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    // Skip if this was triggered by our own onChange
    if (isInternalEdit.current) {
      isInternalEdit.current = false
      return
    }
    // Only update if value actually changed from outside
    if (value === lastExternalValue.current && el.innerHTML !== '') return
    lastExternalValue.current = value
    el.innerHTML = highlightMindmapHTML(value)
    undoStack.current = [{ text: value, caret: 0 }]
    redoStack.current = []
  }, [value])

  // --- Push to undo stack (with debounce to merge rapid keystrokes) ---
  const pushUndo = useCallback((text: string, caret: number) => {
    const now = Date.now()
    const stack = undoStack.current
    if (now - lastUndoPush.current < 300 && stack.length > 1) {
      stack[stack.length - 1] = { text, caret }
    } else {
      stack.push({ text, caret })
      if (stack.length > 100) stack.shift()
    }
    lastUndoPush.current = now
    redoStack.current = []
  }, [])

  // --- Input handler: re-highlight on every keystroke ---
  const handleInput = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    if (isComposing.current) return

    const pos = saveCaret(el)
    const text = getPlainText(el)

    isInternalEdit.current = true
    lastExternalValue.current = text

    el.innerHTML = highlightMindmapHTML(text)
    restoreCaret(el, pos)

    pushUndo(text, pos)
    onChange(text)
  }, [onChange, pushUndo])

  // --- Keyboard shortcuts ---
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLPreElement>) => {
      const el = editorRef.current
      if (!el) return

      // Skip all key handling during IME composition — the IME owns Enter/Tab/etc.
      if (isComposing.current) return

      // Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const stack = undoStack.current
        if (stack.length <= 1) return
        redoStack.current.push(stack.pop()!)
        const prev = stack[stack.length - 1]
        isInternalEdit.current = true
        lastExternalValue.current = prev.text
        el.innerHTML = highlightMindmapHTML(prev.text)
        restoreCaret(el, prev.caret)
        onChange(prev.text)
        return
      }

      // Redo
      if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault()
        const rStack = redoStack.current
        if (rStack.length === 0) return
        const entry = rStack.pop()!
        undoStack.current.push(entry)
        isInternalEdit.current = true
        lastExternalValue.current = entry.text
        el.innerHTML = highlightMindmapHTML(entry.text)
        restoreCaret(el, entry.caret)
        onChange(entry.text)
        return
      }

      // Handle Enter manually — browser-native Enter in contentEditable
      // creates unpredictable DOM (split divs, text \n nodes, etc.)
      // which breaks saveCaret/getPlainText round-tripping.
      if (e.key === 'Enter') {
        e.preventDefault()
        const pos = saveCaret(el)
        const text = getPlainText(el)
        const newText = text.slice(0, pos) + '\n' + text.slice(pos)

        isInternalEdit.current = true
        lastExternalValue.current = newText
        el.innerHTML = highlightMindmapHTML(newText)
        restoreCaret(el, pos + 1)
        pushUndo(newText, pos + 1)
        onChange(newText)
        return
      }

      // Handle Tab — prevent focus-move, insert 2 spaces
      if (e.key === 'Tab') {
        e.preventDefault()
        const pos = saveCaret(el)
        const text = getPlainText(el)

        if (e.shiftKey) {
          // Dedent: remove up to 2 leading spaces from the current line
          const lineStart = text.lastIndexOf('\n', pos - 1) + 1
          const lineText = text.slice(lineStart)
          const match = lineText.match(/^ {1,2}/)
          if (!match) return
          const removed = match[0].length
          const newText = text.slice(0, lineStart) + lineText.slice(removed)

          isInternalEdit.current = true
          lastExternalValue.current = newText
          el.innerHTML = highlightMindmapHTML(newText)
          restoreCaret(el, Math.max(lineStart, pos - removed))
          pushUndo(newText, Math.max(lineStart, pos - removed))
          onChange(newText)
        } else {
          // Indent: insert 2 spaces at caret
          const newText = text.slice(0, pos) + '  ' + text.slice(pos)

          isInternalEdit.current = true
          lastExternalValue.current = newText
          el.innerHTML = highlightMindmapHTML(newText)
          restoreCaret(el, pos + 2)
          pushUndo(newText, pos + 2)
          onChange(newText)
        }
        return
      }
    },
    [onChange, pushUndo],
  )

  // --- Paste: force plain text ---
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLPreElement>) => {
      e.preventDefault()
      const pastedText = e.clipboardData.getData('text/plain')
      const el = editorRef.current
      if (!el) return

      const text = getPlainText(el)
      const pos = saveCaret(el)

      const newText = text.slice(0, pos) + pastedText + text.slice(pos)
      const newPos = pos + pastedText.length

      isInternalEdit.current = true
      lastExternalValue.current = newText
      el.innerHTML = highlightMindmapHTML(newText)
      restoreCaret(el, newPos)
      pushUndo(newText, newPos)
      onChange(newText)
    },
    [onChange, pushUndo],
  )

  // --- IME composition handlers ---
  const handleCompositionStart = useCallback(() => {
    isComposing.current = true
  }, [])

  const handleCompositionEnd = useCallback(() => {
    isComposing.current = false
    handleInput()
  }, [handleInput])

  return (
    <pre
      ref={editorRef}
      className={`mindmap-text-editor${className ? ` ${className}` : ''}`}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      spellCheck={false}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      style={{
        ...(readOnly ? { opacity: 0.7 } : undefined),
        ...style,
      }}
    />
  )
}
