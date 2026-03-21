import type { MindMapPlugin } from "./types";
import { escapeXml } from "../utils/inline-markdown";

const TAG_TRAILING_RE = /((?:\s+#[\w-]+)+)$/;
const TAG_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#6366F1",
];

export const tagsPlugin: MindMapPlugin = {
  name: "tags",

  transformNodeData(node) {
    const match = node.text.match(TAG_TRAILING_RE);
    if (!match) return node;

    const tagsPart = match[1];
    const cleanText = node.text
      .slice(0, node.text.length - tagsPart.length)
      .trim();
    const tags: string[] = [];
    const tagRegex = /#([\w-]+)/g;
    let m;
    while ((m = tagRegex.exec(tagsPart)) !== null) {
      tags.push(m[1]);
    }

    if (tags.length > 0) {
      return { ...node, text: cleanText, tags };
    }
    return node;
  },

  serializeNodeText(node, baseText) {
    if (!node.tags || node.tags.length === 0) return baseText;
    return baseText + " " + node.tags.map((t) => "#" + t).join(" ");
  },

  adjustNodeSize(node, width, height, fontSize) {
    if (!node.tags || node.tags.length === 0) return { width, height };
    // Add width for tag badges
    const tagFontSize = fontSize * 0.65;
    let totalTagWidth = 0;
    for (const tag of node.tags) {
      totalTagWidth += tag.length * tagFontSize * 0.65 + 10 + 4;
    }
    const newWidth = Math.max(width, totalTagWidth + 16);
    // Add height for tag row
    const tagRowHeight = tagFontSize + 10;
    return { width: newWidth, height: height + tagRowHeight };
  },

  exportNodeDecoration(node, theme) {
    if (!node.tags || node.tags.length === 0) return "";

    const fontSize =
      node.depth === 0
        ? theme.root.fontSize
        : node.depth === 1
          ? theme.level1.fontSize
          : theme.node.fontSize;
    const fontFamily =
      node.depth === 0 ? theme.root.fontFamily : theme.node.fontFamily;
    const tagFontSize = fontSize * 0.65;
    const lineHeight = fontSize * 1.4;
    const multiLineOffset = node.multiLineContent
      ? node.multiLineContent.length * lineHeight
      : 0;
    const tagY = fontSize / 2 + 6 + multiLineOffset;
    const tagHeight = tagFontSize + 6;

    // Calculate total tag row width to center it
    let totalTagRowWidth = 0;
    const tagWidths: number[] = [];
    for (const tag of node.tags) {
      const w = tag.length * tagFontSize * 0.65 + 10;
      tagWidths.push(w);
      totalTagRowWidth += w;
    }
    totalTagRowWidth += (node.tags.length - 1) * 4; // gaps

    let tagX = -totalTagRowWidth / 2;
    const parts: string[] = [];

    for (let i = 0; i < node.tags.length; i++) {
      const tag = node.tags[i];
      const tagWidth = tagWidths[i];
      const color = TAG_COLORS[i % TAG_COLORS.length];

      parts.push(
        `<rect x="${tagX}" y="${tagY}" width="${tagWidth}" height="${tagHeight}" rx="3" fill="${color}" opacity="0.15"/>`,
      );
      parts.push(
        `<text x="${tagX + tagWidth / 2}" y="${tagY + tagHeight / 2}" text-anchor="middle" dominant-baseline="central" font-size="${tagFontSize}" fill="${color}" font-family="${fontFamily}">${escapeXml(tag)}</text>`,
      );

      tagX += tagWidth + 4;
    }

    return parts.join("");
  },
};
