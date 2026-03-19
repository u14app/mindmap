export interface MindMapData {
  id: string
  text: string
  children?: MindMapData[]
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
}

export interface Edge {
  key: string
  path: string
  color: string
  fromId: string
  toId: string
}

export interface MindMapProps {
  data: MindMapData | MindMapData[]
  markdown?: string
  defaultDirection?: LayoutDirection
  theme?: ThemeMode
  locale?: string
  messages?: Partial<import('./utils/i18n').MindMapMessages>
  readonly?: boolean
  toolbar?: boolean | ToolbarConfig
  onDataChange?: (data: MindMapData[]) => void
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
