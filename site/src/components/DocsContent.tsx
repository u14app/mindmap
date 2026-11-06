import type { ReactNode } from 'react'
import CodeHighlight from './codeHighlight'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section data-docs-section>
    <h2 id={id} className="docs-section mb-6 border-t border-slate-100 pt-10 text-2xl font-bold tracking-tight text-slate-900 dark:border-slate-800 dark:text-white md:text-3xl">{title}</h2>
    {children}
  </section>
}

function SubHeading({ children, id }: { children: ReactNode; id?: string }) {
  return <h3 id={id} className="mb-3 mt-8 text-lg font-bold text-slate-800 dark:text-slate-200">{children}</h3>
}

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  return <div className="docs-code-block my-4 overflow-hidden rounded-xl bg-slate-900 dark:border dark:border-slate-700/50 dark:bg-[#0d1117]" data-language={lang}>
    {lang && <div className="border-b border-slate-700/50 bg-slate-800/50 px-4 py-2"><span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{lang}</span></div>}
    <pre className="whitespace-pre"><code><CodeHighlight code={children} language={lang} /></code></pre>
  </div>
}

export default function DocsContent() {
  return <>
    <Section id="getting-started" title="Getting Started">
      <p>Open MindMap v0.9.0 is a modular React and TypeScript runtime. Choose the smallest public surface that matches the product: headless Core, Static SVG, an interactive Viewer, or the Editor Feature host.</p>
      <SubHeading>Installation</SubHeading>
      <CodeBlock lang="bash">{`# npm
npm install @xiangfa/mindmap

# pnpm
pnpm add @xiangfa/mindmap

# yarn
yarn add @xiangfa/mindmap`}</CodeBlock>
      <p>For LaTeX formula rendering, install the optional KaTeX peer as well:</p>
      <CodeBlock lang="bash">pnpm add katex</CodeBlock>
      <SubHeading>Quick Start</SubHeading>
      <CodeBlock lang="tsx">{`import { MindMapEditor } from '@xiangfa/mindmap/editor'
import '@xiangfa/mindmap/styles/editor.css'

const markdown = \`Project roadmap
- Research
- Build
- Launch\`

export function Roadmap() {
  return <MindMapEditor markdown={markdown} />
}`}</CodeBlock>
      <div className="docs-callout">The Editor fills the available surface. Give its parent an explicit height, or use a constrained grid or flex child as the website demo does.</div>
      <SubHeading>Markdown Input</SubHeading>
      <p>Pass a Markdown string directly. Controlled input is useful for streamed output, persistence, or a source editor; <code>defaultMarkdown</code> is the uncontrolled initial value.</p>
      <CodeBlock lang="tsx">{`const markdown = \`Machine Learning
- Supervised Learning
  - Classification
  - Regression
- Unsupervised Learning

Application Areas
- Natural Language Processing
- Computer Vision\`

<MindMapEditor
  markdown={markdown}
  onMarkdownChange={setMarkdown}
/>`}</CodeBlock>
      <p>Separate root trees with a blank line. For structured input, pass a <code>MindMapDocument</code> through <code>document</code>, or legacy-compatible node data through <code>data</code>.</p>
      <SubHeading>Theme and Layout Direction</SubHeading>
      <CodeBlock lang="tsx">{`<MindMapEditor markdown={markdown} theme="auto" />
<MindMapEditor markdown={markdown} theme="dark" />
<MindMapEditor markdown={markdown} theme="light" />

<MindMapEditor markdown={markdown} defaultDirection="both" />
<MindMapEditor markdown={markdown} defaultDirection="right" />
<MindMapEditor markdown={markdown} defaultDirection="left" />`}</CodeBlock>
      <p><code>theme</code> and <code>direction</code> are controlled props. Use <code>themeTokens</code> for literal rendering colors and <code>defaultDirection</code> when the surface should own direction changes.</p>
      <SubHeading>Read-only Editor</SubHeading>
      <CodeBlock lang="tsx">{`<MindMapEditor markdown={markdown} readOnly />`}</CodeBlock>
      <p>Read-only Editor mode keeps pan, zoom, selection, and folding available while disabling document mutations and edit commands.</p>
      <SubHeading>Lightweight Viewer</SubHeading>
      <p>Use the dedicated Viewer entry for dashboards, documentation, and embeds that need interaction but not mutation. It excludes Editor commands and opt-in Features without making an unsupported bundle-size claim.</p>
      <CodeBlock lang="tsx">{`import { MindMapViewer } from '@xiangfa/mindmap/viewer'
import '@xiangfa/mindmap/styles/viewer.css'

<MindMapViewer
  markdown={markdown}
  extensions={extensions}
  selectable
/>`}</CodeBlock>
      <p>For a non-interactive React SVG, use <code>StaticMindMap</code> from <code>@xiangfa/mindmap/static</code> with <code>styles/static.css</code>.</p>
      <SubHeading>Markdown Editor Feature</SubHeading>
      <p>The source editor is an opt-in Editor Feature. Its draft stays synchronized through the same controller transaction used by visual edits.</p>
      <CodeBlock lang="tsx">{`import { markdownEditorFeature } from '@xiangfa/mindmap/features/markdown-editor'
import '@xiangfa/mindmap/styles/features/markdown-editor.css'

const features = [markdownEditorFeature({ title: 'Markdown source' })]
<MindMapEditor markdown={markdown} features={features} />`}</CodeBlock>
      <SubHeading>Pick a public surface</SubHeading>
      <div className="docs-table-wrap"><table className="docs-table">
        <thead><tr><th>Entry</th><th>Purpose</th><th>Stylesheet</th></tr></thead>
        <tbody>
          <tr><td><code>@xiangfa/mindmap/core</code></td><td>Parser, serializer, layout, patches, controller, streaming, and portable SVG</td><td>None</td></tr>
          <tr><td><code>@xiangfa/mindmap/static</code></td><td>Non-interactive React SVG</td><td><code>styles/static.css</code></td></tr>
          <tr><td><code>@xiangfa/mindmap/viewer</code></td><td>Read-only pan, zoom, focus, selection, and folding</td><td><code>styles/viewer.css</code></td></tr>
          <tr><td><code>@xiangfa/mindmap/editor</code></td><td>Editing, commands, toolbar, context menu, and Feature slots</td><td><code>styles/editor.css</code></td></tr>
        </tbody>
      </table></div>
      <SubHeading>Compose Features and Extensions</SubHeading>
      <CodeBlock lang="tsx">{`import { MindMapEditor } from '@xiangfa/mindmap/editor'
import { basicMindMapExtensions } from '@xiangfa/mindmap/extensions'
import { historyFeature } from '@xiangfa/mindmap/features/history'
import { searchFeature } from '@xiangfa/mindmap/features/search'
import '@xiangfa/mindmap/styles/editor.css'
import '@xiangfa/mindmap/styles/features/history.css'
import '@xiangfa/mindmap/styles/features/search.css'

const extensions = basicMindMapExtensions()
const features = [historyFeature(), searchFeature()]

<MindMapEditor
  markdown={markdown}
  extensions={extensions}
  features={features}
  onMarkdownChange={setMarkdown}
/>`}</CodeBlock>
      <SubHeading>All Seven Extensions</SubHeading>
      <CodeBlock lang="tsx">{`import {
  basicMindMapExtensions,
  crossLinkExtension,
  frontmatterExtension,
  latexExtension,
} from '@xiangfa/mindmap/extensions'

const extensions = [
  ...basicMindMapExtensions(), // tags, folding, multiline, dotted lines
  frontmatterExtension(),
  crossLinkExtension(),
  latexExtension(),
]`}</CodeBlock>
      <p>Extensions are opt-in in v0.9. Pass an empty array to keep the core grammar only.</p>
      <SubHeading>Ref API</SubHeading>
      <CodeBlock lang="tsx">{`import { useRef } from 'react'
import { MindMapEditor, type MindMapEditorRef } from '@xiangfa/mindmap/editor'

const ref = useRef<MindMapEditorRef>(null)

async function focusResearch() {
  ref.current?.fitView(true)
  ref.current?.focusNode('research')
}

<MindMapEditor ref={ref} markdown={markdown} />`}</CodeBlock>
      <p>The ref exposes the current Document, Markdown and controller; data import; SVG and outline export; undo/redo; commands; viewport focus; selection; direction; and node editing helpers.</p>
      <SubHeading>Listening for Changes</SubHeading>
      <CodeBlock lang="tsx">{`<MindMapEditor
  defaultMarkdown="Roadmap\n- Research"
  onMarkdownChange={(nextMarkdown) => saveSource(nextMarkdown)}
  onDocumentChange={(nextDocument) => saveDocument(nextDocument)}
  onEvent={(event) => {
    if (event.phase === 'commit') persist(event.current.document)
  }}
/>`}</CodeBlock>
      <p><code>preview</code> events are transient. Persist on <code>commit</code>, and reconcile to <code>current.document</code> after <code>rollback</code>.</p>
      <SubHeading>i18n / Localization</SubHeading>
      <p>The runtime detects the browser locale and includes English and Simplified Chinese messages. Supply <code>locale</code> or override individual strings through <code>messages</code>.</p>
      <CodeBlock lang="tsx">{`<MindMapEditor markdown={markdown} locale="en-US" />

<MindMapEditor
  markdown={markdown}
  locale="zh-CN"
  messages={{ newNode: 'New', zoomIn: 'Zoom in' }}
/>`}</CodeBlock>
      <div className="docs-callout">Migrating from v0.7.1? Prefer explicit package entries, use v0.9 Extension factories, and adopt <code>MindMapDocument</code> plus namespaced node <code>attributes</code>. See <a href="https://github.com/u14app/mindmap/blob/HEAD/MIGRATION-v0.9.md">MIGRATION-v0.9.md</a>.</div>
    </Section>

    <Section id="basic-syntax" title="Basic Syntax">
      <p>The first non-empty line creates a root. Indented list items create descendants. Multiple unindented lines create independent roots on the same surface.</p>
      <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  - Classification
    - Logistic Regression
    - Decision Trees
  - Regression
    - Linear Regression
- Unsupervised Learning
  - Clustering
  - Dimensionality Reduction

Computer Vision
- Image Classification
- Object Detection`}</CodeBlock>
      <p>Use two spaces per nesting level. Empty lines are ignored, and node IDs remain stable when the parser can reconcile an updated Markdown structure with the current Document.</p>
    </Section>

    <Section id="text-formatting" title="Text Formatting">
      <p>Node labels support inline Markdown. Formatting is parsed as display tokens; it is never executed as HTML.</p>
      <CodeBlock lang="mindmap">{`Machine Learning
- **Bold Topic**
- *Italic Topic*
- ~~Deprecated Topic~~
- \`code or identifier\`
- ==Highlighted Topic==`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table">
        <thead><tr><th>Syntax</th><th>Effect</th><th>Use case</th></tr></thead>
        <tbody>
          <tr><td><code>**bold**</code></td><td>Strong emphasis</td><td>Important nodes</td></tr>
          <tr><td><code>*italic*</code></td><td>Emphasis</td><td>Supplementary descriptions</td></tr>
          <tr><td><code>~~text~~</code></td><td>Strikethrough</td><td>Deprecated or completed items</td></tr>
          <tr><td><code>`code`</code></td><td>Inline code</td><td>Technical terms and identifiers</td></tr>
          <tr><td><code>==text==</code></td><td>Highlight</td><td>Key concepts</td></tr>
        </tbody>
      </table></div>
    </Section>

    <Section id="links-images" title="Links & Images">
      <p>Use standard Markdown links and image tokens inside node labels.</p>
      <CodeBlock lang="mindmap">{`Resources
- [Open MindMap](https://github.com/u14app/mindmap)
- ![Architecture diagram](data:image/png;base64,...)
- [Documentation](/docs/)`}</CodeBlock>
      <ul>
        <li><code>[text](url)</code> creates a clickable hyperlink inside the node label.</li>
        <li><code>![alt](url)</code> creates an image token and preserves its alt text when loading is not authorized.</li>
      </ul>
      <div className="docs-callout">URL schemes are sanitized. Remote HTTP(S) images are denied by default and remain readable as alt text. Authorize intended origins with <code>remoteImagePolicy</code>; PNG export additionally requires a host <code>imageResolver</code> that embeds safe raster data URLs.</div>
    </Section>

    <Section id="remarks" title="Remarks">
      <p>A remark begins with <code>&gt;</code> under a node and stores supporting prose separately from its visible title.</p>
      <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  > Learn a mapping from labelled examples.
  > Output may be categorical or continuous.
  - Classification
  - Regression`}</CodeBlock>
      <p>Remarks do not become child nodes. They live in <code>node.attributes.remark.text</code> and appear through the Viewer or Editor's accessible description and tooltip behavior.</p>
    </Section>

    <Section id="comments" title="Comments">
      <p>Lines beginning with <code>%%</code> remain in the Markdown source but do not render as nodes.</p>
      <CodeBlock lang="mindmap">{`%% Internal planning note
Machine Learning
- Supervised Learning
  %% Revisit examples before publishing
  - Classification
- Clustering`}</CodeBlock>
      <p>A line is a comment only when <code>%%</code> begins the line after optional whitespace. Inline text such as <code>test%%demo</code> remains ordinary node content.</p>
    </Section>

    <Section id="task-status" title="Task Status">
      <p>Task markers become structured status attributes and can be changed by Editor commands.</p>
      <CodeBlock lang="mindmap">{`Learning Plan Q1
- [x] Linear Algebra
- [-] Probability
- [ ] Neural Networks
  - [x] Backpropagation
  - [ ] Image Segmentation`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Marker</th><th>Status</th><th>Meaning</th></tr></thead><tbody><tr><td><code>[ ]</code></td><td><code>todo</code></td><td>To do</td></tr><tr><td><code>[-]</code></td><td><code>doing</code></td><td>In progress</td></tr><tr><td><code>[x]</code></td><td><code>done</code></td><td>Completed</td></tr></tbody></table></div>
    </Section>

    <Section id="extended-syntax" title="Extended Syntax">
      <p>Extended syntax is provided by opt-in Extensions. The basic set contains tags, folding, multiline content, and dotted lines; frontmatter, cross-links, and LaTeX are explicit additions. Together they preserve the seven capabilities documented by v0.7.1.</p>
      <CodeBlock lang="tsx">{`import {
  basicMindMapExtensions,
  crossLinkExtension,
  frontmatterExtension,
  latexExtension,
} from '@xiangfa/mindmap/extensions'

const extensions = [
  ...basicMindMapExtensions(),
  frontmatterExtension(),
  crossLinkExtension(),
  latexExtension(),
]`}</CodeBlock>
      <SubHeading>Dotted Lines</SubHeading>
      <p>Use <code>-.</code> instead of <code>-</code> to render a dotted edge for a weak, optional, or tentative relationship.</p>
      <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  - Classification
  -. Feature Engineering`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Syntax</th><th>Line style</th><th>Meaning</th></tr></thead><tbody>
        <tr><td><code>-</code></td><td>Solid</td><td>Standard parent-child relationship</td></tr>
        <tr><td><code>-.</code></td><td>Dotted</td><td>Weak, optional, or tentative relationship</td></tr>
      </tbody></table></div>
      <SubHeading>Multi-line Node Content</SubHeading>
      <p>Lines beginning with <code>|</code> attach visible detail lines to the preceding node. Unlike remarks, these lines render inside the node.</p>
      <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  - Classification
    | **Definition**: Maps inputs to categories.
    | **Input**: Feature vector X
    | **Output**: Class label Y
  - Regression
    | Produces continuous values.`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Syntax</th><th>Display</th><th>Purpose</th></tr></thead><tbody>
        <tr><td><code>&gt; text</code></td><td>Remark / tooltip</td><td>Supplementary information outside the visible title</td></tr>
        <tr><td><code>| text</code></td><td>In-node detail</td><td>Visible multi-line node content</td></tr>
      </tbody></table></div>
      <SubHeading>Tags</SubHeading>
      <p>Use <code>#tag</code> tokens to classify nodes. The tags Extension stores them in <code>node.attributes.tags.values</code>; Viewer and Editor surfaces can filter them with <code>activeTags</code>.</p>
      <CodeBlock lang="mindmap">{`Tech Stack
- React #frontend #javascript
  - Astro #framework
  - Zustand #state-management
- TypeScript #language
- PostgreSQL #database #backend`}</CodeBlock>
      <SubHeading>Cross-node Connections</SubHeading>
      <p>Use <code>{'{#id}'}</code> to name an anchor and <code>{'-> {#id}'}</code> to connect a node outside the parent-child tree.</p>
      <CodeBlock lang="mindmap">{`System Architecture
- Frontend {#frontend}
- Backend
  - API Gateway {#api-gateway}
    - REST
    - GraphQL
  - Response -> {#frontend} "HTTP"
- Data Layer
  - Cache -.> {#api-gateway}`}</CodeBlock>
      <ul>
        <li><code>{'{#id}'}</code> defines an anchor.</li>
        <li><code>{'-> {#id}'}</code> creates a solid cross-link.</li>
        <li><code>{'-> {#id} "label"'}</code> adds a label.</li>
        <li><code>{'-.> {#id}'}</code> creates a dotted cross-link.</li>
      </ul>
      <SubHeading>Folding Markers</SubHeading>
      <p>Use <code>+</code> instead of <code>-</code> to store a branch as collapsed in <code>node.attributes.folding.collapsed</code>.</p>
      <CodeBlock lang="mindmap">{`Project Structure
- src/
  - components/
    - Button.tsx
    - Modal.tsx
  + utilities/
    - format.ts
    - validate.ts
- README.md`}</CodeBlock>
      <ul><li><code>-</code> starts expanded.</li><li><code>+</code> starts collapsed and can be expanded by the Viewer or Editor.</li></ul>
      <SubHeading>Formula Support (LaTeX)</SubHeading>
      <p>The LaTeX Extension recognizes inline <code>$...$</code> and block <code>$$...$$</code> formulas. Interactive React surfaces lazy-load the optional KaTeX peer; <code>StaticMindMap</code> accepts a trusted synchronous <code>renderMath</code> function for SSR, and portable export accepts that same hook or loads KaTeX when available.</p>
      <CodeBlock lang="mindmap">{`Loss Functions
- MSE
  | $L = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2$
- Cross Entropy
  | $$L = -\\sum_i y_i \\log(\\hat{y}_i)$$`}</CodeBlock>
      <SubHeading>Global Configuration (Frontmatter)</SubHeading>
      <p>The frontmatter Extension reads document-level direction and theme values from a YAML-style header.</p>
      <CodeBlock lang="mindmap">{`---
direction: right
theme: auto
---

Machine Learning
- Supervised Learning
- Unsupervised Learning`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Field</th><th>Values</th><th>Purpose</th></tr></thead><tbody>
        <tr><td><code>direction</code></td><td><code>left</code>, <code>right</code>, <code>both</code></td><td>Document layout direction</td></tr>
        <tr><td><code>theme</code></td><td><code>auto</code>, <code>light</code>, <code>dark</code></td><td>Document theme preference</td></tr>
      </tbody></table></div>
    </Section>

    <Section id="ai-generation" title="AI Generation">
      <p>AI generation is an optional Editor Feature. When configured, it adds a prompt bar to the Editor and accepts either a host-supplied generator or the built-in OpenAI-compatible adapter. The runtime owns Markdown parsing, incremental previews, one completed history entry, cancellation, and rollback.</p>
      <SubHeading>Basic Usage</SubHeading>
      <CodeBlock lang="tsx">{`import { MindMapEditor } from '@xiangfa/mindmap/editor'
import {
  aiFeature,
  createOpenAICompatibleGenerator,
} from '@xiangfa/mindmap/features/ai'
import '@xiangfa/mindmap/styles/editor.css'
import '@xiangfa/mindmap/styles/features/ai.css'

const generator = createOpenAICompatibleGenerator({
  apiUrl: '/api/chat/completions', // server-side proxy
  model: 'gpt-5',
  completionPolicy: 'strict',
})

const features = [aiFeature({ generator })]

export function Brainstorm() {
  return <MindMapEditor defaultMarkdown="Product" features={features} />
}`}</CodeBlock>
      <div className="docs-callout">Keep long-lived provider credentials on a server. The browser-facing <code>apiUrl</code> should normally be your own same-origin proxy.</div>
      <SubHeading>Custom Generator</SubHeading>
      <p>A generator receives the prompt, current Markdown, frozen Document, an <code>AbortSignal</code>, and optional prepared attachments. It returns a complete Markdown string or an async iterable of delta strings. Custom generators must throw when their provider returns incomplete output; their protocol is not validated by the built-in adapter.</p>
      <CodeBlock lang="tsx">{`import { aiFeature, type MindMapAIGenerator } from '@xiangfa/mindmap/features/ai'

const generate: MindMapAIGenerator = async function* ({ prompt, markdown, signal }) {
  const response = await fetch('/api/mindmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, markdown }),
    signal,
  })
  if (!response.ok || !response.body) throw new Error('Generation failed')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const cancel = () => { void reader.cancel() }
  signal.addEventListener('abort', cancel, { once: true })
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read()
      if (done) break
      const delta = decoder.decode(value, { stream: true })
      if (delta) yield delta
    }
    const tail = decoder.decode()
    if (!signal.aborted && tail) yield tail
  } finally {
    signal.removeEventListener('abort', cancel)
    if (signal.aborted) await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

const features = [aiFeature({ generate })]`}</CodeBlock>
      <CodeBlock lang="typescript">{`interface MindMapAIGeneratorInput {
  prompt: string
  markdown: string
  document: MindMapDocument
  signal: AbortSignal
  attachments?: readonly MindMapAIAttachment[]
}

type MindMapAIGeneratorResult =
  | string
  | AsyncIterable<string>
  | Promise<string | AsyncIterable<string>>`}</CodeBlock>
      <p>Async iterables must yield delta chunks. Adapt cumulative snapshot streams explicitly. Empty output, cancellation, parse failure, a replaced controller transaction, or a network error cancels the stream and restores the baseline Document.</p>
      <SubHeading>OpenAI-compatible Configuration</SubHeading>
      <CodeBlock lang="typescript">{`interface MindMapAIConfig {
  apiUrl: string
  model: string
  apiKey?: string
  systemPrompt?: string
  attachments?: readonly ('text' | 'image' | 'pdf')[]
  maxAttachmentSize?: number
  maxAttachments?: number
  maxTotalAttachmentSize?: number
  attachmentReadConcurrency?: number
  headers?: Record<string, string>
  request?: (payload: MindMapAIRequestPayload) => Promise<Response>
  completionPolicy?: 'strict' | 'legacy'
  onCompletion?: (completion: MindMapAICompletion) => void
}`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Field</th><th>Required</th><th>Purpose</th></tr></thead><tbody>
        <tr><td><code>apiUrl</code></td><td>Yes</td><td>Chat-completions endpoint or host proxy</td></tr>
        <tr><td><code>model</code></td><td>Yes</td><td>Provider model identifier</td></tr>
        <tr><td><code>apiKey</code></td><td>No</td><td>Optional browser Bearer token; prefer a server proxy</td></tr>
        <tr><td><code>systemPrompt</code></td><td>No</td><td>Override the Markdown-only generation instruction</td></tr>
        <tr><td><code>headers</code></td><td>No</td><td>Additional request headers</td></tr>
        <tr><td><code>request</code></td><td>No</td><td>Host adapter for proxy or provider-specific transport</td></tr>
        <tr><td><code>completionPolicy</code></td><td>No</td><td>Default legacy accepts a missing completion reason as unverified. Recommended strict requires stop. Both reject explicit failure.</td></tr>
        <tr><td><code>onCompletion</code></td><td>No</td><td>Completion metadata: status, finishReason and responseType. This diagnostic is not a document commit notification.</td></tr>
      </tbody></table></div>
      <p>For JSON and SSE, only <code>finish_reason: "stop"</code> is a verified normal completion. HTTP 200, nonempty text, EOF, or <code>[DONE]</code> alone does not verify completeness. The adapter rejects <code>length</code>, <code>content_filter</code>, and unsupported reasons in both policies. Strict also rejects missing or null reasons; legacy preserves compatibility and reports <code>unknown</code> through the optional diagnostic. Its default remains legacy, with no scheduled deprecation date. Check your proxy forwards terminal metadata before enabling strict.</p>
      <CodeBlock lang="tsx">{`import { aiFeature, MindMapAIError } from '@xiangfa/mindmap/features/ai'

const features = [aiFeature({
  generator,
  onError(error) {
    if (error instanceof MindMapAIError) {
      // code: incomplete | content_filter | invalid_response | provider_error
      // Map the code to safe UI text. Keep cause and raw reasons out of public UI/logs.
    }
  },
})]`}</CodeBlock>
      <p>Failed generation, stop, or external editing ends the preview and keeps the prompt and attachments for manual retry. A current successful commit clears them and creates one undo step. The adapter never retries or continues automatically, and completion metadata never contains generated text, prompts, attachments or credentials.</p>
      <SubHeading>File Attachments</SubHeading>
      <p>Enable attachments on <code>aiFeature</code> or its provider config. The Feature validates the allow-list and size limits before invoking the generator.</p>
      <CodeBlock lang="tsx">{`const features = [aiFeature({
  generator,
  attachments: ['text', 'image', 'pdf'],
  maxAttachmentSize: 5 * 1024 * 1024,
  maxAttachments: 10,
  maxTotalAttachmentSize: 20 * 1024 * 1024,
  attachmentReadConcurrency: 3,
})]`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Type</th><th>Accepted input</th><th>Generator value</th></tr></thead><tbody>
        <tr><td><code>text</code></td><td><code>text/*</code> and common source/data extensions</td><td>Decoded text</td></tr>
        <tr><td><code>image</code></td><td>PNG, JPEG, GIF, or WebP</td><td>Base64 data URL</td></tr>
        <tr><td><code>pdf</code></td><td><code>application/pdf</code></td><td>Base64 data URL for a provider-specific file part</td></tr>
      </tbody></table></div>
      <p>Defaults are 5 MiB per file, 10 files, 20 MiB total source bytes, and three concurrent readers. Abort signals stop both file reading and generation.</p>
      <SubHeading>Custom System Prompt</SubHeading>
      <CodeBlock lang="tsx">{`const generator = createOpenAICompatibleGenerator({
  apiUrl: '/api/chat/completions',
  model: 'gpt-5',
  systemPrompt: [
    'Return only a Markdown mind map.',
    'Use one root title and indented list items.',
    'Do not wrap the result in a code fence.',
  ].join(' '),
})`}</CodeBlock>
      <SubHeading>Website Demo Adapter</SubHeading>
      <p>The public website keeps the v0.7.1 GET endpoint for its shared Playground, but adapts the endpoint's cumulative <code>text/plain</code> body through <code>MindMapEditorRef.getController().createMarkdownStream()</code>. It strips reasoning blocks and fences, replaces previews, commits once, and rolls back on stop, unmount, empty output, parse errors, or network failures.</p>
      <div className="docs-callout">The demo sends prompt text to <code>https://open-mindmap-ai.u14.app/api/mindmap</code>. It does not send attachments. This disclosure appears next to the prompt input on both the homepage and Live editor.</div>
    </Section>

    <Section id="custom-styling" title="Custom Styling">
      <p>Import the stylesheet matching each runtime surface and Feature. v0.9 separates six runtime CSS variables from the typed <code>MindMapThemeTokens</code> projection: CSS controls the host surface and interaction UI, while theme tokens produce deterministic SVG geometry and literal export colors.</p>
      <SubHeading>Surface and Feature Styles</SubHeading>
      <CodeBlock lang="css">{`@import '@xiangfa/mindmap/styles/editor.css';
@import '@xiangfa/mindmap/styles/features/history.css';
@import '@xiangfa/mindmap/styles/features/search.css';

.product-map .mm-surface {
  --mm-background: #ffffff;
  --mm-text: #253044;
  --mm-muted: #748096;
  --mm-root: #334155;
  --mm-selection: #007aff;
  --mm-font: system-ui, sans-serif;
}`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>CSS variable</th><th>Controls</th></tr></thead><tbody>
        <tr><td><code>--mm-background</code></td><td>Canvas and child-node background</td></tr>
        <tr><td><code>--mm-text</code></td><td>Primary node text</td></tr>
        <tr><td><code>--mm-muted</code></td><td>Secondary labels and details</td></tr>
        <tr><td><code>--mm-root</code></td><td>Root-node fill</td></tr>
        <tr><td><code>--mm-selection</code></td><td>Selection treatment</td></tr>
        <tr><td><code>--mm-font</code></td><td>Runtime font family</td></tr>
      </tbody></table></div>
      <SubHeading>Theme Tokens</SubHeading>
      <CodeBlock lang="tsx">{`<MindMapEditor
  markdown={markdown}
  theme="light"
  themeTokens={{
    background: '#ffffff',
    text: '#253044',
    rootFill: '#334155',
    rootText: '#ffffff',
    selection: '#007aff',
    branches: ['#ff646b', '#43c6c3', '#6ca9ff'],
  }}
/>`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Group</th><th>Theme-token fields</th></tr></thead><tbody>
        <tr><td>Color</td><td><code>background</code>, <code>text</code>, <code>mutedText</code>, <code>rootFill</code>, <code>rootText</code>, <code>selection</code></td></tr>
        <tr><td>Branches</td><td><code>branches</code> — ordered literal branch colors</td></tr>
        <tr><td>Typography</td><td><code>fontFamily</code>, <code>rootFontSize</code>, <code>levelOneFontSize</code>, <code>nodeFontSize</code></td></tr>
        <tr><td>Layout</td><td><code>horizontalGap</code>, <code>verticalGap</code></td></tr>
        <tr><td>Padding</td><td><code>rootPaddingX</code>, <code>rootPaddingY</code>, <code>nodePaddingX</code>, <code>nodePaddingY</code></td></tr>
      </tbody></table></div>
      <SubHeading>CSS Class Selectors</SubHeading>
      <p>Runtime SVG and controls expose stable <code>mm-</code> classes. Rules can target the full surface or a named node without depending on generated layout coordinates.</p>
      <CodeBlock lang="css">{`/* Child node shape and underline accent */
.product-map .mm-node--child .mm-node-shape {
  stroke-width: 2;
}

.product-map .mm-node-accent {
  stroke-width: 3;
}

/* Connection lines */
.product-map .mm-edge {
  stroke-linecap: square;
}

/* One stable document node ID */
.product-map .mm-node[data-mm-node="release"] .mm-node-label {
  font-weight: 800;
}`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Class</th><th>Target</th></tr></thead><tbody>
        <tr><td><code>.mm-static</code></td><td>Static React surface</td></tr>
        <tr><td><code>.mm-surface</code></td><td>Interactive Viewer or Editor surface</td></tr>
        <tr><td><code>.mm-node--root</code> / <code>.mm-node--child</code></td><td>Root and child SVG groups</td></tr>
        <tr><td><code>.mm-node-shape</code></td><td>Node background shape</td></tr>
        <tr><td><code>.mm-node-label</code> / <code>.mm-node-detail</code></td><td>Primary and multiline text</td></tr>
        <tr><td><code>.mm-node-accent</code></td><td>Child-node accent line</td></tr>
        <tr><td><code>.mm-edge</code></td><td>Parent-child and cross-link paths</td></tr>
        <tr><td><code>.mm-fold-control</code></td><td>Fold and expand control</td></tr>
        <tr><td><code>.mm-viewport-controls</code></td><td>Pan, zoom, fit, and fullscreen controls</td></tr>
        <tr><td><code>.mm-editor-toolbar</code> / <code>.mm-context-menu</code></td><td>Editor commands and context menu</td></tr>
      </tbody></table></div>
      <SubHeading>Branch Colors</SubHeading>
      <p>Set branch colors with <code>themeTokens.branches</code>. The headless layout cycles this ordered palette and writes literal colors into each projected node and edge.</p>
      <CodeBlock lang="tsx">{`<MindMapEditor
  markdown={markdown}
  themeTokens={{
    branches: ['#e74c3c', '#2ecc71', '#3498db', '#f59e0b'],
  }}
/>`}</CodeBlock>
      <SubHeading>SVG and PNG Export</SubHeading>
      <p>Portable SVG output contains resolved colors, geometry, text, classes, and allowed embedded image data. It does not depend on the website's CSS variables. Prepare the SVG before rasterization so authorized remote images and trusted math output can be embedded.</p>
      <CodeBlock lang="typescript">{`import {
  prepareMindMapSvg,
  renderSvgToPng,
} from '@xiangfa/mindmap/features/export'

const svg = await prepareMindMapSvg(document, {
  extensions,
  theme: literalThemeTokens,
  imageResolver,
})
const png = await renderSvgToPng(svg)`}</CodeBlock>
      <p>Use literal tokens when exported SVG or PNG must remain self-contained. Host-page CSS is intentionally unavailable after a file is downloaded.</p>
    </Section>

    <Section id="api-reference" title="API Reference">
      <p>v0.9 separates the headless document runtime from React surfaces and optional Features. The root package retains compatibility aliases, but new integrations should prefer explicit entries.</p>
      <SubHeading>Public entrypoints</SubHeading>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Entry</th><th>Primary exports</th></tr></thead><tbody>
        <tr><td><code>@xiangfa/mindmap/core</code></td><td><code>parseMindMap</code>, <code>serializeMindMap</code>, <code>layoutMindMap</code>, <code>createMindMapController</code>, <code>createMarkdownStream</code>, <code>renderMindMapToSvg</code></td></tr>
        <tr><td><code>@xiangfa/mindmap/static</code></td><td><code>StaticMindMap</code></td></tr>
        <tr><td><code>@xiangfa/mindmap/viewer</code></td><td><code>MindMapViewer</code>, <code>MindMapViewerRef</code></td></tr>
        <tr><td><code>@xiangfa/mindmap/editor</code></td><td><code>MindMapEditor</code>, <code>MindMapEditorRef</code>, command types</td></tr>
        <tr><td><code>@xiangfa/mindmap/features/*</code></td><td>history, search, import, export, markdown-editor, and AI Feature factories</td></tr>
        <tr><td><code>@xiangfa/mindmap/extensions</code></td><td>Seven built-in Extension factories and <code>basicMindMapExtensions</code></td></tr>
      </tbody></table></div>
      <SubHeading>Props</SubHeading>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Prop</th><th>Type</th><th>Purpose</th></tr></thead><tbody>
        <tr><td><code>markdown</code> / <code>defaultMarkdown</code></td><td><code>string</code></td><td>Controlled or initial Markdown input</td></tr>
        <tr><td><code>document</code> / <code>data</code></td><td><code>MindMapDocument | MindMapNode[]</code></td><td>Structured input</td></tr>
        <tr><td><code>documentRevision</code></td><td><code>string | number</code></td><td>Explicit revision for authoritative controlled replacements</td></tr>
        <tr><td><code>controller</code></td><td><code>MindMapController</code></td><td>Share a headless controller</td></tr>
        <tr><td><code>extensions</code></td><td><code>readonly MindMapExtension[]</code></td><td>Parsing and layout hooks</td></tr>
        <tr><td><code>features</code></td><td><code>readonly MindMapEditorFeature[]</code></td><td>Optional Editor capabilities</td></tr>
        <tr><td><code>theme</code> / <code>themeTokens</code></td><td><code>MindMapThemeMode</code> / token overrides</td><td>Runtime appearance</td></tr>
        <tr><td><code>direction</code> / <code>defaultDirection</code></td><td><code>'left' | 'right' | 'both'</code></td><td>Controlled or initial layout direction</td></tr>
        <tr><td><code>toolbar</code></td><td><code>boolean | MindMapToolbarConfig</code></td><td>Show or configure the Editor toolbar</td></tr>
        <tr><td><code>readOnly</code></td><td><code>boolean</code></td><td>Disable Document mutations while keeping navigation</td></tr>
        <tr><td><code>locale</code> / <code>messages</code></td><td><code>string</code> / overrides</td><td>Localize runtime controls</td></tr>
        <tr><td><code>searchQuery</code> / <code>activeTags</code></td><td>controlled filters</td><td>Drive search and tag filtering from the host</td></tr>
        <tr><td><code>selectedNodeId</code></td><td><code>string | null</code></td><td>Controlled selection</td></tr>
        <tr><td><code>autoFit</code></td><td><code>'initial' | 'always' | 'never'</code></td><td>Viewport fitting policy</td></tr>
        <tr><td><code>culling</code></td><td><code>MindMapCullingOptions</code></td><td>Bound large-map DOM rendering</td></tr>
        <tr><td><code>remoteImagePolicy</code></td><td><code>'deny' | 'allow' | predicate</code></td><td>Authorize sanitized remote image URLs</td></tr>
        <tr><td><code>onMarkdownChange</code></td><td><code>(markdown) =&gt; void</code></td><td>Receive serializable Document changes</td></tr>
        <tr><td><code>onDocumentChange</code> / <code>onEvent</code></td><td>callbacks</td><td>Receive frozen Documents or phased controller events</td></tr>
        <tr><td><code>onInteractionEvent</code> / <code>onViewportChange</code></td><td>callbacks</td><td>Observe view-only interaction without treating it as a Document commit</td></tr>
      </tbody></table></div>
      <SubHeading>ToolbarConfig</SubHeading>
      <p>Pass <code>false</code> to hide the toolbar, or an object with <code>zoom</code>, <code>history</code>, <code>search</code>, <code>tags</code>, <code>editing</code>, <code>direction</code>, <code>textMode</code>, and <code>fullscreen</code> flags. Feature controls appear only when the matching Feature is installed.</p>
      <CodeBlock lang="tsx">{`<MindMapEditor
  markdown={markdown}
  features={[historyFeature(), searchFeature()]}
  toolbar={{
    zoom: true,
    history: true,
    search: true,
    tags: false,
    editing: true,
    direction: true,
    textMode: false,
    fullscreen: true,
  }}
/>`}</CodeBlock>
      <SubHeading>Ref Methods</SubHeading>
      <CodeBlock lang="tsx">{`const ref = useRef<MindMapEditorRef>(null)

ref.current?.fitView(true)
ref.current?.setMarkdown('Roadmap\n- Research')
const controller = ref.current?.getController()
const document = ref.current?.getDocument()`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Method group</th><th>Methods</th></tr></thead><tbody>
        <tr><td>Read</td><td><code>getDocument</code>, <code>getData</code>, <code>getMarkdown</code>, <code>getController</code>, <code>getCommands</code></td></tr>
        <tr><td>Replace / import</td><td><code>setData</code>, <code>setMarkdown</code>, <code>importData</code>, <code>importMarkdown</code></td></tr>
        <tr><td>Export</td><td><code>exportToSVG</code>, <code>exportToOutline</code></td></tr>
        <tr><td>History and commands</td><td><code>undo</code>, <code>redo</code>, <code>canUndo</code>, <code>canRedo</code>, <code>executeCommand</code></td></tr>
        <tr><td>Viewport</td><td><code>fitView</code>, <code>focusNode</code>, <code>selectNode</code>, <code>setDirection</code></td></tr>
        <tr><td>Editing</td><td><code>startEditing</code>, <code>addChild</code>, <code>addRoot</code>, <code>addSibling</code>, <code>removeNode</code></td></tr>
        <tr><td>Folding</td><td><code>expandNode</code>, <code>collapseNode</code></td></tr>
      </tbody></table></div>
      <SubHeading id="data-model">Data Structure</SubHeading>
      <CodeBlock lang="typescript">{`interface MindMapNode {
  id: string
  text: string
  children?: MindMapNode[]
  attributes?: MindMapNodeAttributes
}

interface MindMapDocument {
  roots: MindMapNode[]
  direction?: 'left' | 'right' | 'both'
  theme?: 'light' | 'dark' | 'auto'
  metadata?: Record<string, string>
  comments?: Array<{ text: string; afterNodeId: string | null }>
}`}</CodeBlock>
      <p>Node attributes use namespaces for tasks, remarks, tags, folding, multiline content, dotted connections, and custom Extension data. Controller snapshots and every reachable Document or layout value are frozen.</p>
      <SubHeading>MindMapViewer</SubHeading>
      <p>The Viewer accepts the same Document, Markdown, controller, Extension, theme, layout, filter, selection, locale, image-policy, culling, and viewport props that apply to reading. It intentionally omits Editor Features and mutations.</p>
      <CodeBlock lang="tsx">{`import { MindMapViewer, type MindMapViewerRef } from '@xiangfa/mindmap/viewer'
import '@xiangfa/mindmap/styles/viewer.css'

const viewerRef = useRef<MindMapViewerRef>(null)

<MindMapViewer
  ref={viewerRef}
  markdown={markdown}
  extensions={extensions}
  activeTags={['docs']}
  onSelectedNodeChange={setSelectedNodeId}
/>`}</CodeBlock>
      <h4 className="mb-3 mt-6 font-bold text-slate-900 dark:text-white">MindMapViewerRef Methods</h4>
      <p><code>getDocument</code>, <code>getData</code>, <code>getController</code>, <code>fitView</code>, <code>focusNode</code>, <code>selectNode</code>, <code>setDirection</code>, and <code>getViewport</code>.</p>
      <SubHeading id="input-boundaries">Input and image boundaries</SubHeading>
      <p>Every public Document boundary validates content before traversal, layout, rendering, patch application, or resolver callbacks. Shared <code>MAX_MINDMAP_*</code> constants cover document length, node count, nesting, attributes, images, and patch batches. Remote images remain denied unless the host authorizes them.</p>
      <SubHeading id="events">Controller events</SubHeading>
      <p>Controller events use <code>preview</code>, <code>commit</code>, <code>rollback</code>, and <code>change</code> phases. Persist completed edits on <code>commit</code>; treat previews as transient and reconcile rollback to <code>current.document</code>.</p>
      <CodeBlock lang="typescript">{`const controller = createMindMapController(markdown, { extensions })

const unsubscribe = controller.subscribeEvents((event) => {
  if (event.phase === 'commit') save(event.current.document)
  if (event.phase === 'rollback') restore(event.current.document)
})

const stream = controller.createMarkdownStream()
stream.replace('Roadmap\n- Research')
await stream.commit()

unsubscribe()
controller.dispose()`}</CodeBlock>
    </Section>

    <Section id="keyboard-shortcuts" title="Keyboard Shortcuts">
      <p>Editor commands apply while the surface has focus. Native inputs retain their normal editing behavior.</p>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Shortcut or gesture</th><th>Action</th></tr></thead><tbody>
        <tr><td>Arrow keys</td><td>Move selection through the tree</td></tr>
        <tr><td><code>Tab</code></td><td>Add a child to the selected node</td></tr>
        <tr><td><code>Shift + Enter</code></td><td>Add a sibling</td></tr>
        <tr><td><code>Enter</code> / <code>F2</code></td><td>Edit node text</td></tr>
        <tr><td><code>Delete</code> / <code>Backspace</code></td><td>Remove the selected node</td></tr>
        <tr><td>Double-click a node</td><td>Edit node text</td></tr>
        <tr><td><code>Space</code></td><td>Toggle folding</td></tr>
        <tr><td><code>Escape</code></td><td>Cancel editing, clear selection, or close an active Editor dialog</td></tr>
        <tr><td><code>Cmd/Ctrl + Z</code></td><td>Undo</td></tr>
        <tr><td><code>Cmd/Ctrl + Shift + Z</code> / <code>Cmd/Ctrl + Y</code></td><td>Redo</td></tr>
        <tr><td><code>Cmd/Ctrl + C/X/V</code></td><td>Copy, cut, or paste a subtree</td></tr>
        <tr><td><code>Alt + Arrow</code></td><td>Move or reparent a node</td></tr>
        <tr><td><code>Shift + 0</code></td><td>Fit the complete map</td></tr>
        <tr><td><code>Shift + L/R/M</code></td><td>Set left, right, or both-side layout</td></tr>
        <tr><td>Scroll wheel</td><td>Zoom around the pointer</td></tr>
        <tr><td>Drag empty canvas</td><td>Pan</td></tr>
        <tr><td>Drag a node</td><td>Place before, after, or under another node</td></tr>
        <tr><td>Right-click a node</td><td>Open the command menu</td></tr>
      </tbody></table></div>
    </Section>

    <Section id="utility-functions" title="Utility Functions">
      <p>Headless utilities are available from the Core entry; browser export helpers live with the Export Feature. These replace the v0.7 utility aliases with Document-first, explicitly named operations.</p>
      <CodeBlock lang="typescript">{`import {
  applyMindMapPatches,
  applyMindMapPatchesWithInverse,
  authorizeMindMapImageUrl,
  createMarkdownStream,
  createMindMapParser,
  createMindMapController,
  diffMindMapDocuments,
  findNode,
  layoutMindMap,
  normalizeDocument,
  parseMindMap,
  reconcileMindMapIds,
  renderMindMapToSvg,
  sanitizeMindMapUrl,
  serializeMindMap,
  tokenizeMindMapInline,
  validateMindMapDocument,
  walkNodes,
} from '@xiangfa/mindmap/core'

import {
  exportMindMapOutline,
  prepareMindMapSvg,
  renderSvgToPng,
} from '@xiangfa/mindmap/features/export'`}</CodeBlock>
      <div className="docs-table-wrap"><table className="docs-table"><thead><tr><th>Area</th><th>Functions</th><th>Use</th></tr></thead><tbody>
        <tr><td>Parse and serialize</td><td><code>parseMindMap</code>, <code>createMindMapParser</code>, <code>serializeMindMap</code></td><td>Convert between Markdown and <code>MindMapDocument</code></td></tr>
        <tr><td>Projection</td><td><code>layoutMindMap</code>, <code>renderMindMapToSvg</code></td><td>Compute deterministic geometry or portable SVG without React</td></tr>
        <tr><td>Patches</td><td><code>diffMindMapDocuments</code>, <code>applyMindMapPatches</code>, <code>applyMindMapPatchesWithInverse</code></td><td>Create, apply, and invert immutable edits</td></tr>
        <tr><td>Runtime</td><td><code>createMindMapController</code>, <code>createMarkdownStream</code></td><td>Own snapshots, history, transactions, and streaming previews</td></tr>
        <tr><td>Document utilities</td><td><code>normalizeDocument</code>, <code>validateMindMapDocument</code>, <code>reconcileMindMapIds</code>, <code>walkNodes</code>, <code>findNode</code></td><td>Normalize, validate, reconcile, traverse, and query</td></tr>
        <tr><td>Inline and URLs</td><td><code>tokenizeMindMapInline</code>, <code>sanitizeMindMapUrl</code>, <code>authorizeMindMapImageUrl</code></td><td>Inspect formatted labels and enforce URL policy</td></tr>
        <tr><td>Browser export</td><td><code>prepareMindMapSvg</code>, <code>renderSvgToPng</code>, <code>exportMindMapOutline</code></td><td>Embed authorized assets and download-friendly formats</td></tr>
      </tbody></table></div>
      <CodeBlock lang="typescript">{`const document = parseMindMap(markdown, { extensions })
const layout = layoutMindMap(document, { extensions })
const svg = renderMindMapToSvg(document, { extensions })
const prepared = await prepareMindMapSvg(document, { extensions })
const png = await renderSvgToPng(prepared)`}</CodeBlock>
      <p><code>renderMindMapToSvg</code> exports the complete Document without mounting React. <code>prepareMindMapSvg</code> can embed host-authorized images and optional math output before <code>renderSvgToPng</code> validates source and raster dimensions. Remote images must be embedded through an authorized resolver before PNG conversion.</p>
    </Section>
  </>
}
