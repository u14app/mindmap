export interface MindMapMessages {
  editorLabel: string
  viewportControls: string
  importContent: string
  importTooLarge: string
  commandError: string
  moveBefore: string
  moveAfter: string
  indent: string
  outdent: string
  clipboardUnavailable: string
  exportError: string
  exportImageResolverRequired: string
  fullscreenUnavailable: string
  attachmentReadError: string
  aiUnconfigured: string
  expandNode: string
  collapseNode: string
  addSibling: string
  task: string
  remark: string
  save: string
  source: string
  generate: string
  stop: string
  attach: string
  removeAttachment: string
  exportJSON: string
  exportOutline: string
  nodeText: string
  // Node defaults
  newNode: string

  // Controls
  zoomIn: string
  zoomOut: string
  resetView: string
  layoutLeft: string
  layoutBoth: string
  layoutRight: string
  textMode: string
  viewMode: string
  fullscreen: string
  exitFullscreen: string

  // Context menu
  newRootNode: string
  export: string
  exportSVG: string
  exportPNG: string
  exportMarkdown: string
  layout: string

  // Node context menu
  addChild: string
  editNode: string
  deleteNode: string
  copy: string
  cut: string
  paste: string

  // Import
  import: string
  importAuto: string
  importMarkdown: string
  importJSON: string
  importPlaceholder: string
  importConfirm: string
  importInvalidJSON: string
  importInvalidData: string
  importEmpty: string

  // History / search / tags
  undo: string
  redo: string
  search: string
  searchPlaceholder: string
  searchPrevious: string
  searchNext: string
  searchNoResults: string
  tagFilter: string
  clearFilters: string

  // AI
  aiPlaceholder: string
  aiGenerating: string
  aiError: string
  aiIncomplete?: string
  aiContentFiltered?: string
  aiInvalidResponse?: string
  aiFileTooLarge: string
  aiTooManyAttachments: string
  aiAttachmentsTooLarge: string
  aiUnsupportedFile: string

  // Shared
  close: string
  cancel: string
}

const zhCN: MindMapMessages = {
  editorLabel: '思维导图编辑器', viewportControls: '视图控制', importContent: '待导入的思维导图内容',
  importTooLarge: '导入内容超过 100 万字符限制。',
  commandError: '无法执行此操作。',
  moveBefore: '上移', moveAfter: '下移', indent: '缩进', outdent: '减少缩进',
  clipboardUnavailable: '无法读取剪贴板，请允许访问或先复制一个节点。', exportError: '导出失败，请检查图片解析器或数学渲染配置。', exportImageResolverRequired: 'PNG 导出中的远程图片需要配置图片解析器。', fullscreenUnavailable: '无法进入全屏。', attachmentReadError: '无法读取附件。', aiUnconfigured: '请配置 AI 生成器。',
  expandNode: '展开节点', collapseNode: '折叠节点',
  addSibling: '添加同级', task: '任务状态', remark: '备注', save: '保存', source: 'Markdown 源码', generate: '生成', stop: '停止', attach: '添加附件', removeAttachment: '移除附件', exportJSON: '导出 JSON', exportOutline: '文本大纲', nodeText: '节点文本',
  newNode: '新节点',

  zoomIn: '放大',
  zoomOut: '缩小',
  resetView: '重置视图',
  layoutLeft: '向左排版',
  layoutBoth: '左右排版',
  layoutRight: '向右排版',
  textMode: '文本模式',
  viewMode: '视图模式',
  fullscreen: '全屏',
  exitFullscreen: '退出全屏',

  newRootNode: '新建主节点',
  export: '导出',
  exportSVG: '导出为 SVG',
  exportPNG: '导出为 PNG',
  exportMarkdown: '导出为 Markdown',
  layout: '布局',

  addChild: '添加子节点',
  editNode: '编辑',
  deleteNode: '删除',
  copy: '复制',
  cut: '剪切',
  paste: '粘贴',

  import: '导入',
  importAuto: '自动',
  importMarkdown: 'Markdown',
  importJSON: 'JSON',
  importPlaceholder: '粘贴 Markdown 大纲或 MindMapData JSON...',
  importConfirm: '导入',
  importInvalidJSON: 'JSON 格式无效',
  importInvalidData: '数据必须是 MindMapData 或 MindMapData[]',
  importEmpty: '请输入要导入的内容',

  undo: '撤销',
  redo: '重做',
  search: '搜索',
  searchPlaceholder: '搜索节点...',
  searchPrevious: '上一个匹配',
  searchNext: '下一个匹配',
  searchNoResults: '无匹配结果',
  tagFilter: '标签筛选',
  clearFilters: '清除筛选',

  aiPlaceholder: '让 AI 生成思维导图...',
  aiGenerating: '生成中...',
  aiError: '生成失败',
  aiIncomplete: '生成因输出长度限制未完成，原导图已保留。',
  aiContentFiltered: '生成被提供方中止，原导图已保留。',
  aiInvalidResponse: '无法确认生成结果完整，原导图已保留。',
  aiFileTooLarge: '文件过大',
  aiTooManyAttachments: '附件数量超过限制',
  aiAttachmentsTooLarge: '附件总大小超过限制',
  aiUnsupportedFile: '不支持的文件类型',

  close: '关闭',
  cancel: '取消',
}

const enUS: MindMapMessages = {
  editorLabel: 'Mind map editor', viewportControls: 'Viewport controls', importContent: 'Mind map content to import',
  importTooLarge: 'Import exceeds the 1,000,000 character limit.',
  commandError: 'Unable to execute this command.',
  moveBefore: 'Move up', moveAfter: 'Move down', indent: 'Indent', outdent: 'Outdent',
  clipboardUnavailable: 'Clipboard unavailable. Allow access or copy a node first.', exportError: 'Export failed. Check image resolver or math rendering configuration.', exportImageResolverRequired: 'Remote PNG images require an image resolver.', fullscreenUnavailable: 'Fullscreen unavailable.', attachmentReadError: 'Unable to read attachment.', aiUnconfigured: 'Configure an AI generator.',
  expandNode: 'Expand node', collapseNode: 'Collapse node',
  addSibling: 'Add sibling', task: 'Task status', remark: 'Remark', save: 'Save', source: 'Markdown source', generate: 'Generate', stop: 'Stop', attach: 'Add attachment', removeAttachment: 'Remove attachment', exportJSON: 'Export JSON', exportOutline: 'Text outline', nodeText: 'Node text',
  newNode: 'New Node',

  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
  resetView: 'Reset View',
  layoutLeft: 'Left Layout',
  layoutBoth: 'Both Layout',
  layoutRight: 'Right Layout',
  textMode: 'Text Mode',
  viewMode: 'View Mode',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit Fullscreen',

  newRootNode: 'New Root Node',
  export: 'Export',
  exportSVG: 'Export as SVG',
  exportPNG: 'Export as PNG',
  exportMarkdown: 'Export as Markdown',
  layout: 'Layout',

  addChild: 'Add Child',
  editNode: 'Edit',
  deleteNode: 'Delete',
  copy: 'Copy',
  cut: 'Cut',
  paste: 'Paste',

  import: 'Import',
  importAuto: 'Auto',
  importMarkdown: 'Markdown',
  importJSON: 'JSON',
  importPlaceholder: 'Paste a Markdown outline or MindMapData JSON...',
  importConfirm: 'Import',
  importInvalidJSON: 'Invalid JSON',
  importInvalidData: 'Data must be MindMapData or MindMapData[]',
  importEmpty: 'Enter content to import',

  undo: 'Undo',
  redo: 'Redo',
  search: 'Search',
  searchPlaceholder: 'Search nodes...',
  searchPrevious: 'Previous match',
  searchNext: 'Next match',
  searchNoResults: 'No matches',
  tagFilter: 'Filter tags',
  clearFilters: 'Clear filters',

  aiPlaceholder: 'Ask AI to generate a mind map...',
  aiGenerating: 'Generating...',
  aiError: 'Generation failed',
  aiIncomplete: 'Generation reached the output limit before completion. Your original mind map was kept.',
  aiContentFiltered: 'The provider stopped generation. Your original mind map was kept.',
  aiInvalidResponse: 'The response could not be verified. Your original mind map was kept.',
  aiFileTooLarge: 'File is too large',
  aiTooManyAttachments: 'Too many attachments',
  aiAttachmentsTooLarge: 'Attachments exceed the total size limit',
  aiUnsupportedFile: 'Unsupported file type',

  close: 'Close',
  cancel: 'Cancel',
}

const LOCALE_MAP: Record<string, MindMapMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export function detectLocale(): string {
  if (typeof navigator === 'undefined') return 'en-US'
  const lang = navigator.language || ''
  if (LOCALE_MAP[lang]) return lang
  if (lang.startsWith('zh')) return 'zh-CN'
  const prefix = lang.split('-')[0]
  for (const key of Object.keys(LOCALE_MAP)) {
    if (key.startsWith(prefix)) return key
  }
  return 'en-US'
}

export function resolveMessages(
  locale: string = 'zh-CN',
  overrides?: Partial<MindMapMessages>,
): MindMapMessages {
  const base = LOCALE_MAP[locale] ?? zhCN
  return overrides ? { ...base, ...overrides } : base
}
