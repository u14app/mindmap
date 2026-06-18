export type TaskStatus = 'todo' | 'doing' | 'done'

export interface CrossLink {
  targetAnchorId: string
  label?: string
  dotted?: boolean
}

export interface MindMapData {
  id: string
  text: string
  children?: MindMapData[]
  remark?: string
  taskStatus?: TaskStatus
  // Plugin extension fields (all optional, populated by corresponding plugins)
  dottedLine?: boolean           // Plugin: dotted-line
  multiLineContent?: string[]    // Plugin: multi-line
  tags?: string[]                // Plugin: tags
  anchorId?: string              // Plugin: cross-link
  crossLinks?: CrossLink[]       // Plugin: cross-link
  collapsed?: boolean            // Plugin: folding
  placeholder?: boolean           // Streaming: empty placeholder node
  listRoot?: boolean              // Root node uses list marker syntax (- Root)
}

export type LayoutDirection = 'left' | 'right' | 'both'

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ToolbarConfig {
  zoom?: boolean
  history?: boolean
  search?: boolean
  tags?: boolean
}

export interface LayoutNode {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  color: string
  depth: number
  side: 'left' | 'right' | 'root'
  parentId?: string
  remark?: string
  taskStatus?: TaskStatus
  branchIndex?: number
  // Plugin extension fields
  dottedLine?: boolean
  multiLineContent?: string[]
  tags?: string[]
  anchorId?: string
  crossLinks?: CrossLink[]
  collapsed?: boolean
  placeholder?: boolean
}

export interface Edge {
  key: string
  path: string
  color: string
  fromId: string
  toId: string
  // Plugin extension fields
  strokeDasharray?: string
  label?: string
  isCrossLink?: boolean
}

export type MindMapEvent =
  | { type: 'nodeAdd'; node: MindMapData; parentId: string | null }
  | { type: 'nodeDelete'; nodeId: string }
  | { type: 'nodeTextChange'; nodeId: string; oldText: string; newText: string }
  | { type: 'nodeSelect'; nodeId: string | null }
  | { type: 'nodeFocus'; nodeId: string }
  | { type: 'nodeCollapse'; nodeId: string }
  | { type: 'nodeExpand'; nodeId: string }
  | { type: 'import'; source: 'markdown' | 'json'; data: MindMapData[] }
  | { type: 'undo'; canUndo: boolean; canRedo: boolean }
  | { type: 'redo'; canUndo: boolean; canRedo: boolean }
  | { type: 'historyChange'; canUndo: boolean; canRedo: boolean }
  | { type: 'searchChange'; query: string; matchCount: number }
  | { type: 'tagFilterChange'; tags: string[] }
  | { type: 'modeChange'; mode: 'view' | 'text' }
  | { type: 'directionChange'; direction: LayoutDirection }
  | { type: 'zoomChange'; zoom: number }
  | { type: 'fullscreenChange'; fullscreen: boolean }

export type AIAttachmentType = 'text' | 'image' | 'pdf'

export type MindMapAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export interface MindMapAIRequestPayload {
  apiUrl: string
  apiKey: string
  model: string
  messages: Array<{
    role: 'system' | 'user'
    content: string | MindMapAIContentPart[]
  }>
  headers: Record<string, string>
  body: string
  signal: AbortSignal
}

export interface MindMapAIConfig {
  apiUrl: string
  apiKey: string
  model: string
  systemPrompt?: string
  attachments?: AIAttachmentType[]
  maxAttachmentSize?: number
  headers?: Record<string, string>
  request?: (payload: MindMapAIRequestPayload) => Promise<Response>
}

export interface MindMapProps {
  data?: MindMapData | MindMapData[]
  markdown?: string
  defaultDirection?: LayoutDirection
  theme?: ThemeMode
  locale?: string
  messages?: Partial<import('./utils/i18n').MindMapMessages>
  readonly?: boolean
  toolbar?: boolean | ToolbarConfig
  ai?: MindMapAIConfig
  selectedNodeId?: string | null
  onSelectedNodeChange?: (nodeId: string | null) => void
  searchQuery?: string
  activeTags?: string[]
  onSearchChange?: (query: string) => void
  onActiveTagsChange?: (tags: string[]) => void
  onDataChange?: (data: MindMapData[]) => void
  onEvent?: (event: MindMapEvent) => void
  plugins?: import('./plugins/types').MindMapPlugin[]
  textEditor?: React.ComponentType<{ value: string; onChange: (text: string) => void; readOnly?: boolean }>
}

export interface MindMapRef {
  exportToSVG(): string
  exportToPNG(): Promise<Blob>
  exportToOutline(): string
  getMarkdown(): string
  getData(): MindMapData[]
  setData(data: MindMapData | MindMapData[]): void
  setMarkdown(md: string): void
  importMarkdown(md: string): void
  importData(data: MindMapData | MindMapData[]): void
  selectNode(nodeId: string | null): void
  focusNode(nodeId: string): void
  expandNode(nodeId: string): void
  collapseNode(nodeId: string): void
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean
  fitView(): void
  setDirection(dir: LayoutDirection): void
}

export interface MindMapViewerProps {
  data?: MindMapData | MindMapData[]
  markdown?: string
  defaultDirection?: LayoutDirection
  theme?: ThemeMode
  locale?: string
  messages?: Partial<import('./utils/i18n').MindMapMessages>
  toolbar?: boolean | ToolbarConfig
  plugins?: import('./plugins/types').MindMapPlugin[]
  searchQuery?: string
  activeTags?: string[]
  onEvent?: (event: MindMapEvent) => void
}

export interface MindMapViewerRef {
  getData(): MindMapData[]
  fitView(): void
  setDirection(dir: LayoutDirection): void
}
