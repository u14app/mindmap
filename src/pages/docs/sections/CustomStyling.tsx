import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading, SubHeading } from "../components/SectionHeading";

export default function CustomStyling() {
  return (
    <>
          <SectionHeading id="custom-styling">Custom Styling</SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Open MindMap exposes <strong>30+ CSS custom properties</strong> and
            semantic CSS classes on every SVG element. You can customize colors,
            fonts, edges, and branch styles with plain CSS — no JavaScript
            needed.
          </p>

          <SubHeading>CSS Custom Properties</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Override CSS variables on <code>.mindmap-container</code> to change
            theme values globally:
          </p>
          <CodeBlock lang="css">{`.mindmap-container {
  --mindmap-canvas-bg: #f0f4f8;
  --mindmap-root-bg: #1a73e8;
  --mindmap-root-text: #ffffff;
  --mindmap-node-text: #1a1a2e;
  --mindmap-edge-width: 3;
}`}</CodeBlock>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-6 mb-4">
            Available variable groups:
          </p>
          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Variables</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Canvas</td>
                  <td>
                    <code>--mindmap-canvas-bg</code>
                  </td>
                </tr>
                <tr>
                  <td>Root Node</td>
                  <td>
                    <code>--mindmap-root-bg</code>,{" "}
                    <code>--mindmap-root-text</code>,{" "}
                    <code>--mindmap-root-font-size</code>,{" "}
                    <code>--mindmap-root-font-weight</code>,{" "}
                    <code>--mindmap-root-font-family</code>
                  </td>
                </tr>
                <tr>
                  <td>Child Nodes</td>
                  <td>
                    <code>--mindmap-node-text</code>,{" "}
                    <code>--mindmap-node-font-size</code>,{" "}
                    <code>--mindmap-node-font-weight</code>,{" "}
                    <code>--mindmap-node-font-family</code>
                  </td>
                </tr>
                <tr>
                  <td>Level 1</td>
                  <td>
                    <code>--mindmap-level1-font-size</code>,{" "}
                    <code>--mindmap-level1-font-weight</code>
                  </td>
                </tr>
                <tr>
                  <td>Edges</td>
                  <td>
                    <code>--mindmap-edge-width</code>
                  </td>
                </tr>
                <tr>
                  <td>Selection</td>
                  <td>
                    <code>--mindmap-selection-stroke</code>,{" "}
                    <code>--mindmap-selection-fill</code>
                  </td>
                </tr>
                <tr>
                  <td>Highlight</td>
                  <td>
                    <code>--mindmap-highlight-text</code>,{" "}
                    <code>--mindmap-highlight-bg</code>
                  </td>
                </tr>
                <tr>
                  <td>Add Button</td>
                  <td>
                    <code>--mindmap-addbtn-fill</code>,{" "}
                    <code>--mindmap-addbtn-hover</code>,{" "}
                    <code>--mindmap-addbtn-icon</code>
                  </td>
                </tr>
                <tr>
                  <td>Controls</td>
                  <td>
                    <code>--mindmap-controls-bg</code>,{" "}
                    <code>--mindmap-controls-text</code>,{" "}
                    <code>--mindmap-controls-hover</code>
                  </td>
                </tr>
                <tr>
                  <td>Context Menu</td>
                  <td>
                    <code>--mindmap-ctx-bg</code>,{" "}
                    <code>--mindmap-ctx-text</code>,{" "}
                    <code>--mindmap-ctx-hover</code>,{" "}
                    <code>--mindmap-ctx-border</code>,{" "}
                    <code>--mindmap-ctx-shadow</code>
                  </td>
                </tr>
                <tr>
                  <td>Branch Colors</td>
                  <td>
                    <code>--mindmap-branch-0</code> through{" "}
                    <code>--mindmap-branch-9</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>CSS Class Selectors</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            All SVG elements have semantic CSS classes that you can target
            directly. Since SVG presentation attributes have lower specificity
            than CSS rules, your styles will take precedence:
          </p>
          <CodeBlock lang="css">{`/* Change root node background */
.mindmap-node-root .mindmap-node-bg {
  fill: #6c5ce7;
}

/* Make edges thicker */
.mindmap-edge {
  stroke-width: 3;
}

/* Style node underlines */
.mindmap-node-underline {
  stroke-width: 3;
  stroke-linecap: square;
}`}</CodeBlock>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-6 mb-4">
            Key classes:
          </p>
          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>.mindmap-node-root</code>
                  </td>
                  <td>Root node group</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-node-child</code>
                  </td>
                  <td>Child node group</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-node-bg</code>
                  </td>
                  <td>Node background rect</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-node-text</code>
                  </td>
                  <td>Node text element</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-node-underline</code>
                  </td>
                  <td>Child node underline</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-edge</code>
                  </td>
                  <td>Connection line</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-edge-label</code>
                  </td>
                  <td>Edge label text</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-add-btn</code>
                  </td>
                  <td>Add child button</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-fold-btn</code>
                  </td>
                  <td>Fold/unfold toggle</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-tag</code>
                  </td>
                  <td>Tag badge</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>Branch Colors</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Every node and edge has a <code>data-branch-index</code> attribute
            (0–9) indicating which branch of the root it belongs to. Use this
            for per-branch styling:
          </p>
          <CodeBlock lang="css">{`/* Custom colors for first 3 branches */
.mindmap-edge[data-branch-index="0"] { stroke: #e74c3c; }
.mindmap-edge[data-branch-index="1"] { stroke: #2ecc71; }
.mindmap-edge[data-branch-index="2"] { stroke: #3498db; }

/* Also works on nodes */
.mindmap-node-g[data-branch-index="0"] .mindmap-node-underline {
  stroke: #e74c3c;
}`}</CodeBlock>

          <SubHeading>SVG Export</SubHeading>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Exported SVGs embed a <code>&lt;style&gt;</code> block with resolved
            values and include the same semantic classes and{" "}
            <code>data-branch-index</code> attributes. This means:
          </p>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 leading-relaxed mb-4 space-y-1">
            <li>Standalone SVG files render correctly without external CSS</li>
            <li>
              When embedded in HTML, the same CSS selectors can override the
              exported styles
            </li>
          </ul>
    </>
  );
}
