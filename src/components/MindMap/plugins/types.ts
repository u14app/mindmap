import type { MindMapData, LayoutNode, Edge, LayoutDirection } from "../types";
import type { InlineToken, TokenLayout } from "../utils/inline-markdown";
import type { ThemeColors } from "../utils/theme";

// --- Context types ---

export interface ParseContext {
  lines: string[];
  frontMatter: Record<string, string>;
}

export interface LayoutContext {
  direction: LayoutDirection;
  theme: ThemeColors;
  readonly: boolean;
  foldOverrides: Record<string, boolean>;
}

// --- Parse result ---

export interface ParsedLineResult {
  indent: number;
  text: string;
  taskStatus?: import("../types").TaskStatus;
  dottedLine?: boolean;
  collapsed?: boolean;
}

// --- Plugin interface ---

export interface MindMapPlugin {
  name: string;

  // ── Parsing ──

  /** Pre-process entire markdown string (e.g. extract frontmatter) */
  preParseMarkdown?(md: string, ctx: ParseContext): string;

  /** Match a non-standard line marker (-. or +). Return null to let core handle it. */
  parseLine?(
    line: string,
    index: number,
    ctx: ParseContext,
  ): ParsedLineResult | null;

  /** Collect follow-up lines after a node (e.g. | text). Return count of consumed lines. */
  collectFollowLines?(
    lines: string[],
    startIdx: number,
    node: MindMapData,
    ctx: ParseContext,
  ): number;

  /** Transform node data: extract #tags, @color(), {#id}, etc. from text into fields */
  transformNodeData?(
    node: MindMapData,
    rawText: string,
    ctx: ParseContext,
  ): MindMapData;

  /** Post-process the fully-built tree (e.g. resolve cross-link anchor references) */
  postParseTree?(roots: MindMapData[], ctx: ParseContext): MindMapData[];

  // ── Serialization ──

  /** Emit text before the markdown body (e.g. frontmatter block) */
  serializePreamble?(roots: MindMapData[]): string;

  /** Override list marker for a node. Default is '- '. */
  serializeListMarker?(node: MindMapData, defaultMarker: string): string;

  /** Transform node text when serializing (e.g. re-attach #tags, @color(), {#id}) */
  serializeNodeText?(node: MindMapData, baseText: string): string;

  /** Emit extra lines after a node line (e.g. | text). Returns array of line contents (caller adds indent). */
  serializeFollowLines?(node: MindMapData, indent: number): string[];

  // ── Inline Token Extension (for LaTeX) ──

  /** Additional regex pattern to splice into the inline markdown parser */
  inlineTokenPattern?(): { pattern: string; priority: number };

  /** Create an InlineToken from a regex match produced by this plugin's pattern */
  createInlineToken?(
    match: RegExpExecArray,
    groupOffset: number,
  ): InlineToken | null;

  // ── Layout ──

  /** Adjust a node's measured dimensions */
  adjustNodeSize?(
    node: MindMapData,
    width: number,
    height: number,
    fontSize: number,
  ): { width: number; height: number };

  /** Filter children before layout (folding plugin hides collapsed children) */
  filterChildren?(
    node: MindMapData,
    children: MindMapData[],
    ctx: LayoutContext,
  ): MindMapData[];

  /** Modify an edge's properties (e.g. set strokeDasharray for dotted lines) */
  transformEdge?(edge: Edge, fromNode: LayoutNode, toNode: LayoutNode): Edge;

  /** Produce additional edges after tree layout (e.g. cross-links) */
  generateExtraEdges?(
    nodes: LayoutNode[],
    roots: MindMapData[],
    ctx: LayoutContext,
  ): Edge[];

  /** Override node color (e.g. decorator plugin sets custom branch color) */
  transformNodeColor?(
    node: LayoutNode,
    data: MindMapData,
    parentColor: string,
  ): { color?: string; bgColor?: string };

  // ── Rendering (React SVG) ──

  /** Render additional SVG elements on a node */
  renderNodeDecoration?(node: LayoutNode, theme: ThemeColors): React.ReactNode;

  /** Render an inline token introduced by this plugin */
  renderInlineToken?(layout: TokenLayout, key: number): React.ReactNode;

  /** Render an SVG overlay layer (e.g. cross-link arrows) */
  renderOverlay?(
    nodes: LayoutNode[],
    edges: Edge[],
    theme: ThemeColors,
  ): React.ReactNode;

  // ── Export (SVG string) ──

  /** Build additional SVG string for a node during export. pngSafe=true means no foreignObject. */
  exportNodeDecoration?(node: LayoutNode, theme: ThemeColors, plugins?: MindMapPlugin[], pngSafe?: boolean): string;

  /** Build SVG tspan string for a custom inline token. pngSafe=true means no foreignObject. */
  exportInlineToken?(layout: TokenLayout, pngSafe?: boolean): string;

  /** Build SVG string for overlay elements during export */
  exportOverlay?(
    nodes: LayoutNode[],
    edges: Edge[],
    theme: ThemeColors,
  ): string;

  /** Load KaTex styles */
  loadKatexStyle?(): void;
}
