import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading, SubHeading } from "../components/SectionHeading";

export default function GettingStarted() {
  return (
    <>
          <SectionHeading id="getting-started">Getting Started</SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Open MindMap is a zero-dependency React component library for
            interactive SVG-based mind maps. It supports Markdown input (AI
            streaming ready), a plugin system for extended syntax, and exports
            to SVG/PNG/Markdown.
          </p>

          <SubHeading>Installation</SubHeading>
          <CodeBlock lang="bash">{`# npm
npm install @xiangfa/mindmap

# pnpm
pnpm add @xiangfa/mindmap

# yarn
yarn add @xiangfa/mindmap`}</CodeBlock>

          <p className="text-sm text-slate-500 dark:text-slate-500 mt-3 mb-6">
            For LaTeX math formula rendering, also install KaTeX (optional):
          </p>
          <CodeBlock lang="bash">npm install katex</CodeBlock>

          <SubHeading>Quick Start</SubHeading>
          <CodeBlock lang="tsx">{`import { MindMap } from "@xiangfa/mindmap";
import "@xiangfa/mindmap/style.css";

const data = \`
My Mind Map
  - First Topic
    - Sub-topic A
    - Sub-topic B
  - Second Topic
\`;

function App() {
  return <MindMap markdown={data} />;
}`}</CodeBlock>

          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl p-4 mt-4 mb-6">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              <span className="font-bold text-primary">Note:</span> The
              component fills its parent container. Ensure the parent has an
              explicit width and height.
            </p>
          </div>

          <SubHeading>Markdown Input</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Pass a Markdown list directly — ideal for streaming AI responses:
          </p>
          <CodeBlock lang="tsx">{`const markdown = \`
Machine Learning
  - Supervised Learning
    - Classification
    - Regression
  - Unsupervised Learning

Application Areas
  - Natural Language Processing
  - Computer Vision
\`;

<MindMap markdown={markdown} />`}</CodeBlock>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 mb-6">
            Separate different root node trees with blank lines in the Markdown.
          </p>

          <SubHeading>Dark Mode</SubHeading>
          <CodeBlock lang="tsx">{`<MindMap data={data} theme="auto" />  {/* Follow system (default) */}
<MindMap data={data} theme="dark" />  {/* Always dark */}
<MindMap data={data} theme="light" /> {/* Always light */}`}</CodeBlock>

          <SubHeading>Layout Direction</SubHeading>
          <CodeBlock lang="tsx">{`<MindMap data={data} defaultDirection="both" />  {/* Balanced (default) */}
<MindMap data={data} defaultDirection="right" /> {/* All children on right */}
<MindMap data={data} defaultDirection="left" />  {/* All children on left */}`}</CodeBlock>

          <SubHeading>Readonly Mode</SubHeading>
          <CodeBlock lang="tsx">{`<MindMap data={data} readonly />`}</CodeBlock>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 mb-6">
            Users can still pan, zoom, and select nodes but cannot create, edit,
            or delete. The context menu hides edit actions.
          </p>

          <SubHeading>Lightweight Viewer</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            For read-only use cases where bundle size matters (dashboards, documentation, embeds),
            use <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded text-sm">MindMapViewer</code> —
            a standalone component with ~48% smaller bundle that excludes editing hooks, AI input,
            context menu, and export utils.
          </p>
          <CodeBlock lang="tsx">{`// Minimal bundle via sub-path import:
import { MindMapViewer } from "@xiangfa/mindmap/viewer";
import "@xiangfa/mindmap/style.css";

<MindMapViewer markdown={markdown} />

// Or from the main entry (tree-shakeable):
import { MindMapViewer } from "@xiangfa/mindmap";`}</CodeBlock>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 mb-6">
            Supports all rendering features: themes, plugins, pan/zoom, fold toggle,
            remark tooltips, and keyboard shortcuts. Does not include editing, drag-drop,
            AI generation, context menu, export, or text editor.
          </p>

          <SubHeading>Text Editor Mode</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Pass the <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded text-sm">MindMapTextEditor</code> component
            to enable a built-in text editing mode with syntax highlighting. Users can toggle between the visual mind map and a
            markdown text editor via a button in the bottom-right corner.
          </p>
          <CodeBlock lang="tsx">{`import { MindMap, MindMapTextEditor } from "@xiangfa/mindmap";

<MindMap markdown={markdown} textEditor={MindMapTextEditor} />`}</CodeBlock>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 mb-6">
            The text editor is opt-in and tree-shakeable — it is only bundled
            when you import and pass it. If omitted, the text mode toggle button
            is hidden.
          </p>

          <SubHeading>Plugins</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            All 7 built-in plugins are enabled by default. You can selectively
            enable only what you need:
          </p>
          <CodeBlock lang="tsx">{`import {
  MindMap,
  allPlugins,          // All 7 plugins
  frontMatterPlugin,   // YAML frontmatter
  dottedLinePlugin,    // Dotted edges
  foldingPlugin,       // Collapsible nodes
  multiLinePlugin,     // Multi-line content
  tagsPlugin,          // Tag support
  crossLinkPlugin,     // Cross-node references
  latexPlugin,         // LaTeX math (requires KaTeX)
} from "@xiangfa/mindmap";

{/* Use all plugins (default) */}
<MindMap data={data} plugins={allPlugins} />

{/* Only selected plugins */}
<MindMap data={data} plugins={[foldingPlugin, tagsPlugin]} />

{/* Disable all plugins */}
<MindMap data={data} plugins={[]} />`}</CodeBlock>

          <SubHeading>Ref API</SubHeading>
          <CodeBlock lang="tsx">{`import { useRef } from "react";
import { MindMap, type MindMapRef } from "@xiangfa/mindmap";

function App() {
  const ref = useRef<MindMapRef>(null);

  const handleExportPNG = async () => {
    const blob = await ref.current!.exportToPNG();
    // ... download blob
  };

  return <MindMap ref={ref} data={data} />;
}`}</CodeBlock>

          <SubHeading>Listening for Changes</SubHeading>
          <CodeBlock lang="tsx">{`<MindMap
  data={data}
  onDataChange={(newData) => {
    console.log("Mind map updated:", newData);
  }}
/>`}</CodeBlock>

          <SubHeading>i18n / Localization</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            UI language is automatically detected from the browser. Built-in
            support for Chinese (<code className="text-xs">zh-CN</code>) and
            English (<code className="text-xs">en-US</code>), with fallback to
            English.
          </p>
          <CodeBlock lang="tsx">{`{/* Auto-detect (default) */}
<MindMap data={data} />

{/* Force locale */}
<MindMap data={data} locale="zh-CN" />

{/* Override specific strings */}
<MindMap data={data} locale="zh-CN" messages={{ newNode: "New" }} />

{/* Fully custom language */}
<MindMap
  data={data}
  messages={{
    newNode: "Nuevo nodo",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    // ... override any key from MindMapMessages
  }}
/>`}</CodeBlock>
    </>
  );
}
