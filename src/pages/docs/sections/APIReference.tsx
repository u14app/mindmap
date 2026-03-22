import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading, SubHeading } from "../components/SectionHeading";

export default function APIReference() {
  return (
    <>
          <SectionHeading id="api-reference">API Reference</SectionHeading>

          <SubHeading>Props</SubHeading>
          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>data</code>
                  </td>
                  <td>
                    <code>MindMapData | MindMapData[]</code>
                  </td>
                  <td>
                    <em>required</em>
                  </td>
                  <td>Tree data (single root or array of roots)</td>
                </tr>
                <tr>
                  <td>
                    <code>markdown</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>-</td>
                  <td>
                    Markdown list source (overrides <code>data</code> when set)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>defaultDirection</code>
                  </td>
                  <td>
                    <code>'left' | 'right' | 'both'</code>
                  </td>
                  <td>
                    <code>'both'</code>
                  </td>
                  <td>Initial layout direction</td>
                </tr>
                <tr>
                  <td>
                    <code>theme</code>
                  </td>
                  <td>
                    <code>'light' | 'dark' | 'auto'</code>
                  </td>
                  <td>
                    <code>'auto'</code>
                  </td>
                  <td>Color theme</td>
                </tr>
                <tr>
                  <td>
                    <code>locale</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>
                    <em>auto</em>
                  </td>
                  <td>
                    UI language (auto-detect, or <code>'zh-CN'</code>,{" "}
                    <code>'en-US'</code>)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>messages</code>
                  </td>
                  <td>
                    <code>{"Partial<MindMapMessages>"}</code>
                  </td>
                  <td>-</td>
                  <td>Override any UI text string</td>
                </tr>
                <tr>
                  <td>
                    <code>readonly</code>
                  </td>
                  <td>
                    <code>boolean</code>
                  </td>
                  <td>
                    <code>false</code>
                  </td>
                  <td>Display-only mode (no editing/creating)</td>
                </tr>
                <tr>
                  <td>
                    <code>toolbar</code>
                  </td>
                  <td>
                    <code>boolean | ToolbarConfig</code>
                  </td>
                  <td>
                    <code>true</code>
                  </td>
                  <td>Show/hide zoom controls</td>
                </tr>
                <tr>
                  <td>
                    <code>ai</code>
                  </td>
                  <td>
                    <code>MindMapAIConfig</code>
                  </td>
                  <td>-</td>
                  <td>
                    AI generation configuration (see{" "}
                    <a
                      href="#ai-generation"
                      className="text-primary hover:underline"
                    >
                      AI Generation
                    </a>
                    )
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>plugins</code>
                  </td>
                  <td>
                    <code>MindMapPlugin[]</code>
                  </td>
                  <td>
                    <code>allPlugins</code>
                  </td>
                  <td>Enabled extended syntax plugins</td>
                </tr>
                <tr>
                  <td>
                    <code>textEditor</code>
                  </td>
                  <td>
                    <code>ComponentType</code>
                  </td>
                  <td>
                    <code>-</code>
                  </td>
                  <td>Pass <code>MindMapTextEditor</code> to enable text editing mode with syntax highlighting. Opt-in for tree-shaking.</td>
                </tr>
                <tr>
                  <td>
                    <code>onDataChange</code>
                  </td>
                  <td>
                    <code>{"(data: MindMapData[]) => void"}</code>
                  </td>
                  <td>-</td>
                  <td>Called when the tree is modified by user interaction</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>ToolbarConfig</SubHeading>
          <CodeBlock lang="typescript">{`interface ToolbarConfig {
  zoom?: boolean; // Show zoom controls (default: true)
}`}</CodeBlock>

          <SubHeading>Ref Methods</SubHeading>
          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Returns</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>exportToSVG()</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>Export mind map as SVG string</td>
                </tr>
                <tr>
                  <td>
                    <code>exportToPNG()</code>
                  </td>
                  <td>
                    <code>{"Promise<Blob>"}</code>
                  </td>
                  <td>Render high-DPI PNG blob</td>
                </tr>
                <tr>
                  <td>
                    <code>exportToOutline()</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>Serialize tree to Markdown list</td>
                </tr>
                <tr>
                  <td>
                    <code>getData()</code>
                  </td>
                  <td>
                    <code>MindMapData[]</code>
                  </td>
                  <td>Return current tree data</td>
                </tr>
                <tr>
                  <td>
                    <code>setData(data)</code>
                  </td>
                  <td>
                    <code>void</code>
                  </td>
                  <td>Replace tree data</td>
                </tr>
                <tr>
                  <td>
                    <code>setMarkdown(md)</code>
                  </td>
                  <td>
                    <code>void</code>
                  </td>
                  <td>Parse Markdown and replace tree</td>
                </tr>
                <tr>
                  <td>
                    <code>fitView()</code>
                  </td>
                  <td>
                    <code>void</code>
                  </td>
                  <td>Reset zoom and pan to fit all nodes</td>
                </tr>
                <tr>
                  <td>
                    <code>setDirection(dir)</code>
                  </td>
                  <td>
                    <code>void</code>
                  </td>
                  <td>Change layout direction</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>Data Structure</SubHeading>
          <CodeBlock lang="typescript">{`interface MindMapData {
  id: string;
  text: string;
  children?: MindMapData[];
  remark?: string;              // Multi-line remark
  taskStatus?: "todo" | "doing" | "done";
  // Plugin extension fields (populated by plugins)
  dottedLine?: boolean;         // Dotted line plugin
  multiLineContent?: string[];  // Multi-line plugin
  tags?: string[];              // Tags plugin
  anchorId?: string;            // Cross-link plugin
  crossLinks?: CrossLink[];     // Cross-link plugin
  collapsed?: boolean;          // Folding plugin
}

interface CrossLink {
  targetAnchorId: string;
  label?: string;
  dotted?: boolean;
}`}</CodeBlock>
    </>
  );
}
