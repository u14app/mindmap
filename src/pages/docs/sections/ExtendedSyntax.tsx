import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading, SubHeading } from "../components/SectionHeading";

export default function ExtendedSyntax() {
  return (
    <>
          <SectionHeading id="extended-syntax">Extended Syntax</SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Extended syntax features are provided through plugins. All 7
            built-in plugins are enabled by default.
          </p>

          {/* Dotted Lines */}
          <SubHeading>Dotted Lines</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Use <code className="text-xs">-.</code> instead of{" "}
            <code className="text-xs">-</code> to render nodes with dotted edges
            for weak relationships:
          </p>
          <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  - Classification
  -. Feature Engineering`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Syntax</th>
                  <th>Line Style</th>
                  <th>Semantics</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>-</code>
                  </td>
                  <td>Solid</td>
                  <td>Standard parent-child relationship</td>
                </tr>
                <tr>
                  <td>
                    <code>-.</code>
                  </td>
                  <td>Dotted</td>
                  <td>Weak association / Optional / TBD</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Multi-line */}
          <SubHeading>Multi-line Node Content</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Lines starting with <code className="text-xs">|</code> are appended
            to the content of the preceding node and rendered as multi-line text
            within that node:
          </p>
          <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  - Classification
    | **Definition**: Mapping inputs to discrete categories.
    | **Input**: Feature vector X
    | **Output**: Class label Y
  - Regression
    | Continuous output values.
    | Commonly used for prediction scenarios.`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Syntax</th>
                  <th>Display Mode</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>&gt; text</code>
                  </td>
                  <td>Tooltip / Hover</td>
                  <td>Supplementary notes; space-saving</td>
                </tr>
                <tr>
                  <td>
                    <code>| text</code>
                  </td>
                  <td>In-node display</td>
                  <td>When the node requires multi-line content</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tags */}
          <SubHeading>Tags</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Use <code className="text-xs">#tag</code> to label nodes for easy
            filtering and categorization:
          </p>
          <CodeBlock lang="mindmap">{`Tech Stack
- React #frontend #javascript
  - Next.js #framework #ssr
  - Redux #state-management
- Python #backend #ml
  - FastAPI #framework
  - PyTorch #ml #deep-learning
- PostgreSQL #database #backend`}</CodeBlock>

          {/* Cross-links */}
          <SubHeading>Cross-node Connections</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Use <code className="text-xs">{"{#id}"}</code> to define node
            anchors and <code className="text-xs">{"-> {#id}"}</code> to create
            cross-branch connections:
          </p>
          <CodeBlock lang="mindmap">{`System Architecture
- Frontend {#frontend}
  - React
  - API Call -> {#api-gateway}
- Backend
  - API Gateway {#api-gateway}
    - REST
    - GraphQL
  - Data Processing
    - ETL Pipeline -> {#data-warehouse}
- Data Layer
  - Data Warehouse {#data-warehouse}
  - Cache -> {#frontend}`}</CodeBlock>

          <p className="text-sm text-slate-500 dark:text-slate-500 mt-3 mb-2">
            Optional annotated connections:
          </p>
          <CodeBlock>{`- API Call -> {#api-gateway} "HTTP/REST"`}</CodeBlock>

          <ul className="list-disc list-inside text-sm text-slate-500 space-y-1 mt-3 mb-6">
            <li>
              <code className="text-xs">{"{#id}"}</code> — Define an anchor on a
              node
            </li>
            <li>
              <code className="text-xs">{"-> {#id}"}</code> — Solid cross-link
              to anchor
            </li>
            <li>
              <code className="text-xs">{'-> {#id} "label"'}</code> — Cross-link
              with label
            </li>
            <li>
              <code className="text-xs">{"-.> {#id}"}</code> — Dotted cross-link
            </li>
          </ul>

          {/* Folding */}
          <SubHeading>Folding Markers</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Use <code className="text-xs">+</code> instead of{" "}
            <code className="text-xs">-</code> to indicate that a node is
            collapsed by default:
          </p>
          <CodeBlock lang="mindmap">{`Project Structure
- src/
  - components/
    - Button.tsx
    - Modal.tsx
  + utils/
    - format.ts
    - validate.ts
  + hooks/
    - useAuth.ts
    - useFetch.ts
- README.md`}</CodeBlock>

          <ul className="list-disc list-inside text-sm text-slate-500 space-y-1 mt-3 mb-6">
            <li>
              <code className="text-xs">-</code> = Expanded (default)
            </li>
            <li>
              <code className="text-xs">+</code> = Collapsed (click to expand)
            </li>
          </ul>

          {/* LaTeX */}
          <SubHeading>Formula Support (LaTeX)</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Render math formulas via{" "}
            <a
              href="https://katex.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              KaTeX
            </a>
            :
          </p>
          <CodeBlock lang="mindmap">{`Loss Functions
- MSE
  | $L = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2$
- Cross Entropy
  | $L = -\\sum_{i} y_i \\log(\\hat{y}_i)$
- KL Divergence
  | $D_{KL}(P \\| Q) = \\sum P(x) \\log\\frac{P(x)}{Q(x)}$`}</CodeBlock>

          <p className="text-sm text-slate-500 dark:text-slate-500 mt-3 mb-6">
            Supports inline formulas with <code className="text-xs">$...$</code>{" "}
            and block-level formulas with{" "}
            <code className="text-xs">$$...$$</code>.
          </p>

          {/* Frontmatter */}
          <SubHeading>Global Configuration (Front Matter)</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Control overall behavior and styling with YAML front matter:
          </p>
          <CodeBlock lang="mindmap">{`---
direction: right
theme: auto
---

Machine Learning
- Supervised Learning
- Unsupervised Learning`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Values</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>direction</code>
                  </td>
                  <td>
                    <code>right</code> | <code>left</code> | <code>both</code>
                  </td>
                  <td>Layout direction</td>
                </tr>
                <tr>
                  <td>
                    <code>theme</code>
                  </td>
                  <td>
                    <code>auto</code> | <code>light</code> | <code>dark</code>
                  </td>
                  <td>Color theme</td>
                </tr>
              </tbody>
            </table>
          </div>
    </>
  );
}
