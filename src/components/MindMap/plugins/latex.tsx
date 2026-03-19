import type { MindMapPlugin } from "./types";
import type { InlineToken } from "../utils/inline-markdown";
import {
  parseInlineMarkdown,
  computeTokenLayouts,
} from "../utils/inline-markdown";

const MONO_FONT =
  "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

/**
 * Synchronous KaTeX loading: begins import eagerly at module scope,
 * provides a synchronous getter for use in render paths.
 */
let _katex: any = null;
let _katexReady = false;
let _katexPromise: Promise<void> | null = null;
let _onReadyCallbacks: Array<() => void> = [];

export function initKatex(): Promise<void> {
  if (_katexPromise) return _katexPromise;
  _katexPromise = import("katex")
    .then((mod) => {
      _katex = mod.default || mod;
      _katexReady = true;
      loadKatexStyle();
      // Notify listeners
      for (const cb of _onReadyCallbacks) cb();
      _onReadyCallbacks = [];
    })
    .catch(() => {
      _katexReady = true; // Mark checked even on failure
    });
  return _katexPromise;
}

/** Get KaTeX module synchronously (returns null if not yet loaded) */
export function getKatexSync(): any {
  return _katex;
}

/** Whether KaTeX loading has completed (success or failure) */
export function isKatexReady(): boolean {
  return _katexReady;
}

/** Register a callback for when KaTeX becomes available */
export function onKatexReady(cb: () => void): void {
  if (_katexReady) {
    cb();
  } else {
    _onReadyCallbacks.push(cb);
  }
}

// Begin loading immediately when this module is imported
initKatex();

export function loadKatexStyle() {
  if (typeof document === "undefined") return;
  if (!document.getElementById("katex-style")) {
    const link = document.createElement("link");
    link.id = "katex-style";
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css";
    document.head.appendChild(link);
  }
}

/**
 * Render a LaTeX string to HTML using KaTeX.
 * Returns null if KaTeX is not loaded yet.
 */
export function renderLatexToHtml(
  content: string,
  displayMode: boolean,
): string | null {
  const katex = getKatexSync();
  if (!katex) return null;
  try {
    return katex.renderToString(content, {
      throwOnError: false,
      displayMode,
    });
  } catch {
    return null;
  }
}

/**
 * Render a LaTeX string to MathML using KaTeX (no CSS dependency).
 * Returns null if KaTeX is not loaded yet.
 */
export function renderLatexToMathML(
  content: string,
  displayMode: boolean,
): string | null {
  const katex = getKatexSync();
  if (!katex) return null;
  try {
    return katex.renderToString(content, {
      throwOnError: false,
      displayMode,
      output: "mathml",
    });
  } catch {
    return null;
  }
}

export const latexPlugin: MindMapPlugin = {
  name: "latex",

  inlineTokenPattern() {
    // Block LaTeX ($$...$$) must come before inline ($...$)
    return {
      pattern: "\\$\\$(.+?)\\$\\$|\\$([^$]+?)\\$",
      priority: 3, // Higher priority than code backticks
    };
  },

  createInlineToken(match, groupOffset) {
    const blockContent = match[groupOffset + 1];
    const inlineContent = match[groupOffset + 2];

    if (blockContent !== undefined) {
      return { type: "latex-block", content: blockContent } as InlineToken;
    }
    if (inlineContent !== undefined) {
      return { type: "latex-inline", content: inlineContent } as InlineToken;
    }
    return null;
  },

  renderInlineToken(layout, key) {
    const { token } = layout;
    if (token.type !== "latex-inline" && token.type !== "latex-block")
      return null;

    const katex = getKatexSync();
    if (katex) {
      // Invisible spacer: actual rendering via foreignObject in SvgNodeContent
      return (
        <tspan key={key} opacity={0}>
          {token.content}
        </tspan>
      );
    }

    // Fallback: italic monospace text (KaTeX not yet loaded)
    return (
      <tspan
        key={key}
        fontFamily={MONO_FONT}
        fontStyle="italic"
        fontSize="0.9em"
      >
        {token.content}
      </tspan>
    );
  },

  exportInlineToken(layout, pngSafe) {
    const { token } = layout;
    if (token.type !== "latex-inline" && token.type !== "latex-block")
      return "";

    const content = token.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    // PNG mode: always use visible fallback (no foreignObject allowed)
    if (pngSafe) {
      return `<tspan font-family="${MONO_FONT}" font-style="italic" font-size="0.9em">${content}</tspan>`;
    }

    // SVG mode: if KaTeX is available, render invisible placeholder — actual rendering via exportNodeDecoration
    if (getKatexSync()) {
      return `<tspan opacity="0">${content}</tspan>`;
    }

    // Fallback: italic monospace when KaTeX not loaded
    return `<tspan font-family="${MONO_FONT}" font-style="italic" font-size="0.9em">${content}</tspan>`;
  },

  exportNodeDecoration(node, theme, plugins, pngSafe) {
    // No foreignObject in PNG mode
    if (pngSafe) return '';

    const katex = getKatexSync();
    if (!katex) return '';

    const parts: string[] = [];

    // Helper to render LaTeX overlays for a set of token layouts
    const renderLatexOverlays = (
      text: string,
      fontSize: number,
      fontWeight: number,
      fontFamily: string,
      textColor: string,
      baseY: number,
    ) => {
      const tokens = parseInlineMarkdown(text, plugins);
      const layouts = computeTokenLayouts(tokens, fontSize, fontWeight, fontFamily);
      const textContentWidth = layouts.length > 0
        ? layouts[layouts.length - 1].x + layouts[layouts.length - 1].width
        : 0;

      // Compute startX consistent with buildSvgNodeTextString
      const iconSize = fontSize * 0.85;
      const iconGap = node.taskStatus ? 4 : 0;
      const taskIconWidth = node.taskStatus ? iconSize + iconGap : 0;
      const remarkFontSize = fontSize * 0.7;
      const remarkGap = node.remark ? 4 : 0;
      const remarkWidth = node.remark ? remarkFontSize + remarkGap : 0;
      const totalWidth = taskIconWidth + textContentWidth + remarkWidth;
      const startX = -totalWidth / 2;
      const textStartX = startX + taskIconWidth;

      for (const layout of layouts) {
        const { token } = layout;
        if (token.type !== 'latex-inline' && token.type !== 'latex-block') continue;

        const mathml = renderLatexToMathML(token.content, token.type === 'latex-block');
        if (!mathml) continue;

        // Extract <math>...</math> from KaTeX output
        const mathMatch = mathml.match(/<math[\s\S]*<\/math>/);
        if (!mathMatch) continue;

        const tokenCenterX = textStartX + layout.x + layout.width / 2;
        const foWidth = Math.max(layout.width * 2.5, 120);
        const foHeight = fontSize * 2;

        parts.push(
          `<foreignObject x="${tokenCenterX - foWidth / 2}" y="${baseY - foHeight / 2}" width="${foWidth}" height="${foHeight}" style="overflow:visible">` +
          `<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${fontSize * 0.75}px;line-height:${foHeight}px;color:${textColor};white-space:nowrap;text-align:center">` +
          mathMatch[0] +
          `</div></foreignObject>`
        );
      }
    };

    // Helper to render overlays for multi-line LaTeX tokens (centered text)
    const renderMultiLineLatexOverlays = (
      text: string,
      fontSize: number,
      fontWeight: number,
      fontFamily: string,
      textColor: string,
      baseY: number,
    ) => {
      const tokens = parseInlineMarkdown(text, plugins);
      const layouts = computeTokenLayouts(tokens, fontSize, fontWeight, fontFamily);
      const textContentWidth = layouts.length > 0
        ? layouts[layouts.length - 1].x + layouts[layouts.length - 1].width
        : 0;
      const startX = -textContentWidth / 2;

      for (const layout of layouts) {
        const { token } = layout;
        if (token.type !== 'latex-inline' && token.type !== 'latex-block') continue;

        const mathml = renderLatexToMathML(token.content, token.type === 'latex-block');
        if (!mathml) continue;

        const mathMatch = mathml.match(/<math[\s\S]*<\/math>/);
        if (!mathMatch) continue;

        const tokenCenterX = startX + layout.x + layout.width / 2;
        const foWidth = Math.max(layout.width * 2.5, 120);
        const foHeight = fontSize * 2;

        parts.push(
          `<foreignObject x="${tokenCenterX - foWidth / 2}" y="${baseY - foHeight / 2}" width="${foWidth}" height="${foHeight}" style="overflow:visible">` +
          `<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${fontSize * 0.75}px;line-height:${foHeight}px;color:${textColor};white-space:nowrap;text-align:center;opacity:0.8">` +
          mathMatch[0] +
          `</div></foreignObject>`
        );
      }
    };

    // Main text line
    const fontSize = node.depth === 0
      ? theme.root.fontSize
      : node.depth === 1 ? theme.level1.fontSize : theme.node.fontSize;
    const fontWeight = node.depth === 0
      ? theme.root.fontWeight
      : node.depth === 1 ? theme.level1.fontWeight : theme.node.fontWeight;
    const fontFamily = node.depth === 0 ? theme.root.fontFamily : theme.node.fontFamily;
    const textColor = node.depth === 0 ? theme.root.textColor : theme.node.textColor;

    renderLatexOverlays(node.text, fontSize, fontWeight, fontFamily, textColor, 0);

    // Multi-line content
    if (node.multiLineContent && node.multiLineContent.length > 0) {
      const mlFontSize = fontSize * 0.85;
      const lineHeight = fontSize * 1.4;
      const multiLineStartY = fontSize / 2 + 8;

      for (let i = 0; i < node.multiLineContent.length; i++) {
        const y = multiLineStartY + i * lineHeight;
        renderMultiLineLatexOverlays(
          node.multiLineContent[i], mlFontSize, 400, fontFamily, textColor, y,
        );
      }
    }

    return parts.join('');
  },

  adjustNodeSize(node, width, height) {
    void node;
    return { width, height };
  },
};
