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
}

export type LayoutDirection = 'left' | 'right' | 'both'

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ToolbarConfig {
  zoom?: boolean
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
  | { type: 'modeChange'; mode: 'view' | 'text' }
  | { type: 'directionChange'; direction: LayoutDirection }
  | { type: 'zoomChange'; zoom: number }
  | { type: 'fullscreenChange'; fullscreen: boolean }

export type AIAttachmentType = 'text' | 'image' | 'pdf'

export interface MindMapAIConfig {
  apiUrl: string
  apiKey: string
  model: string
  systemPrompt?: string
  attachments?: AIAttachmentType[]
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
  onDataChange?: (data: MindMapData[]) => void
  onEvent?: (event: MindMapEvent) => void
  plugins?: import('./plugins/types').MindMapPlugin[]
}

export interface MindMapRef {
  exportToSVG(): string
  exportToPNG(): Promise<Blob>
  exportToOutline(): string
  getData(): MindMapData[]
  setData(data: MindMapData | MindMapData[]): void
  setMarkdown(md: string): void
  fitView(): void
  setDirection(dir: LayoutDirection): void
}
