import { useMemo, useRef, useState } from 'react'
import type { MindMapData } from '../types'
import type { MindMapMessages } from '../utils/i18n'
import type { MindMapImportOptions, MindMapImportSource } from '../utils/import'
import type { MindMapPlugin } from '../plugins/types'
import { parseImportText } from '../utils/import'
import { IconClose } from './icons'

type ImportFormat = MindMapImportSource | 'auto'

const IMPORT_FORMATS: ImportFormat[] = ['auto', 'markdown', 'json']
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFormatLabel(format: ImportFormat, messages: MindMapMessages): string {
  if (format === 'auto') return messages.importAuto
  if (format === 'markdown') return messages.importMarkdown
  return messages.importJSON
}

export interface MindMapImportDialogProps {
  messages: MindMapMessages
  plugins?: MindMapPlugin[]
  onImport: (
    data: MindMapData[],
    source: MindMapImportSource,
    options?: MindMapImportOptions,
  ) => void
  onClose: () => void
}

export function MindMapImportDialog({
  messages,
  plugins,
  onImport,
  onClose,
}: MindMapImportDialogProps) {
  const [format, setFormat] = useState<ImportFormat>('auto')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const panelId = 'mindmap-import-panel'

  const errorText = useMemo(() => {
    if (!error) return null
    if (error === 'empty') return messages.importEmpty
    if (error === 'invalid-json') return messages.importInvalidJSON
    return messages.importInvalidData
  }, [error, messages])

  function handleSubmit() {
    const result = parseImportText(value, format, plugins)
    if (!result.ok) {
      setError(result.reason)
      return
    }
    onImport(result.data, result.source, {
      direction: result.direction,
      theme: result.theme,
    })
  }

  function selectFormat(nextFormat: ImportFormat) {
    setFormat(nextFormat)
    setError(null)
  }

  function handleFormatKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = IMPORT_FORMATS.indexOf(format)
    let nextIndex = currentIndex

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % IMPORT_FORMATS.length
    } else if (e.key === 'ArrowLeft') {
      nextIndex =
        (currentIndex - 1 + IMPORT_FORMATS.length) % IMPORT_FORMATS.length
    } else if (e.key === 'Home') {
      nextIndex = 0
    } else if (e.key === 'End') {
      nextIndex = IMPORT_FORMATS.length - 1
    } else {
      return
    }

    e.preventDefault()
    const nextFormat = IMPORT_FORMATS[nextIndex]
    selectFormat(nextFormat)
    const tabs = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    )
    tabs?.[nextIndex]?.focus()
  }

  function getFocusableElements() {
    return Array.from(
      modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
    ).filter((el) => el.offsetParent !== null)
  }

  function handleDialogKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    if (e.key !== 'Tab') return

    const focusable = getFocusableElements()
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className="mindmap-dialog-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        ref={modalRef}
        className="mindmap-dialog-modal mindmap-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mindmap-import-title"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="mindmap-dialog-header">
          <h2 id="mindmap-import-title" className="mindmap-dialog-title">
            {messages.import}
          </h2>
          <button
            className="mindmap-dialog-close"
            type="button"
            aria-label={messages.close}
            onClick={onClose}
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="mindmap-import-segmented" role="tablist" aria-label={messages.import}>
          {IMPORT_FORMATS.map((option) => {
            const selected = format === option
            return (
              <button
                key={option}
                id={`mindmap-import-tab-${option}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                className={selected ? 'is-active' : ''}
                onClick={() => selectFormat(option)}
                onKeyDown={handleFormatKeyDown}
              >
                {getFormatLabel(option, messages)}
              </button>
            )
          })}
        </div>

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`mindmap-import-tab-${format}`}
        >
          <textarea
            className="mindmap-import-textarea"
            value={value}
            placeholder={messages.importPlaceholder}
            aria-label={messages.importPlaceholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorText ? 'mindmap-import-error' : undefined}
            onChange={(e) => {
              setValue(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
              }
            }}
            autoFocus
          />

          {errorText && (
            <div id="mindmap-import-error" className="mindmap-import-error" role="alert">
              {errorText}
            </div>
          )}
        </div>

        <div className="mindmap-dialog-actions">
          <button type="button" className="mindmap-dialog-secondary" onClick={onClose}>
            {messages.cancel}
          </button>
          <button type="button" className="mindmap-dialog-primary" onClick={handleSubmit}>
            {messages.importConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}
