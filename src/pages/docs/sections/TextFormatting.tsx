import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading } from "../components/SectionHeading";

export default function TextFormatting() {
  return (
    <>
          <SectionHeading id="text-formatting">Text Formatting</SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Node text natively supports Markdown inline formatting:
          </p>

          <CodeBlock lang="mindmap">{`Machine Learning
- **Supervised Learning**
- *Unsupervised Learning*
- ~~Deprecated Method~~
- \`K-Means Algorithm\`
- ==Highlighted Topic==`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Syntax</th>
                  <th>Effect</th>
                  <th>Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>**text**</code>
                  </td>
                  <td>
                    <strong>Bold</strong>
                  </td>
                  <td>Emphasize important nodes</td>
                </tr>
                <tr>
                  <td>
                    <code>*text*</code>
                  </td>
                  <td>
                    <em>Italic</em>
                  </td>
                  <td>Supplementary notes/descriptions</td>
                </tr>
                <tr>
                  <td>
                    <code>~~text~~</code>
                  </td>
                  <td>
                    <s>Strikethrough</s>
                  </td>
                  <td>Deprecated or completed items</td>
                </tr>
                <tr>
                  <td>
                    <code>`text`</code>
                  </td>
                  <td>
                    <code>Code</code>
                  </td>
                  <td>Technical terms or identifiers</td>
                </tr>
                <tr>
                  <td>
                    <code>==text==</code>
                  </td>
                  <td>Highlight</td>
                  <td>Highlight key concepts</td>
                </tr>
              </tbody>
            </table>
          </div>
    </>
  );
}
