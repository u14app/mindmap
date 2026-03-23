import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading } from "../components/SectionHeading";

export default function UtilityFunctions() {
  return (
    <>
          <SectionHeading id="utility-functions">
            Utility Functions
          </SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            The following functions are exported for advanced use cases:
          </p>

          <CodeBlock lang="typescript">{`import {
  // Markdown parsing
  parseMarkdownList,            // md string → single MindMapData
  toMarkdownList,               // single MindMapData → md string
  parseMarkdownMultiRoot,       // md string → MindMapData[]
  toMarkdownMultiRoot,          // MindMapData[] → md string
  parseMarkdownWithFrontMatter, // md string → MindMapData[] (with plugins)

  // Inline Markdown
  parseInlineMarkdown,          // text → inline tokens
  stripInlineMarkdown,          // remove Markdown formatting from text

  // Export
  buildExportSVG,               // programmatic SVG generation
  exportToPNG,                  // SVG string → PNG Blob

  // i18n
  resolveMessages,              // build full MindMapMessages object
  detectLocale,                 // detect browser language

  // Plugins
  allPlugins,                   // all 7 built-in plugins
  frontMatterPlugin,
  dottedLinePlugin,
  foldingPlugin,
  multiLinePlugin,
  tagsPlugin,
  crossLinkPlugin,
  latexPlugin,

  // Lightweight Viewer
  MindMapViewer,                  // read-only viewer (also via @xiangfa/mindmap/viewer)
} from "@xiangfa/mindmap";`}</CodeBlock>
    </>
  );
}
