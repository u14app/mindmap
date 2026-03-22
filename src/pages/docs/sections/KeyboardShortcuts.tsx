import { SectionHeading } from "../components/SectionHeading";

export default function KeyboardShortcuts() {
  return (
    <>
          <SectionHeading id="keyboard-shortcuts">
            Keyboard Shortcuts
          </SectionHeading>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Shortcut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>Enter</code>
                  </td>
                  <td>Create child node under selected node</td>
                </tr>
                <tr>
                  <td>
                    <code>Delete</code> / <code>Backspace</code>
                  </td>
                  <td>Delete selected node</td>
                </tr>
                <tr>
                  <td>
                    <code>Double-click</code>
                  </td>
                  <td>Edit node text</td>
                </tr>
                <tr>
                  <td>
                    <code>Cmd/Ctrl + C</code>
                  </td>
                  <td>Copy subtree</td>
                </tr>
                <tr>
                  <td>
                    <code>Cmd/Ctrl + X</code>
                  </td>
                  <td>Cut subtree</td>
                </tr>
                <tr>
                  <td>
                    <code>Cmd/Ctrl + V</code>
                  </td>
                  <td>Paste subtree as child</td>
                </tr>
                <tr>
                  <td>
                    <code>Escape</code>
                  </td>
                  <td>Close context menu / dialog</td>
                </tr>
                <tr>
                  <td>
                    <code>Shift + +</code>
                  </td>
                  <td>Zoom in</td>
                </tr>
                <tr>
                  <td>
                    <code>Shift + -</code>
                  </td>
                  <td>Zoom out</td>
                </tr>
                <tr>
                  <td>
                    <code>Shift + 0</code>
                  </td>
                  <td>Reset view (fit all nodes)</td>
                </tr>
                <tr>
                  <td>
                    <code>Shift + L</code>
                  </td>
                  <td>Left layout</td>
                </tr>
                <tr>
                  <td>
                    <code>Shift + R</code>
                  </td>
                  <td>Right layout</td>
                </tr>
                <tr>
                  <td>
                    <code>Shift + M</code>
                  </td>
                  <td>Balanced layout (both sides)</td>
                </tr>
                <tr>
                  <td>Scroll wheel</td>
                  <td>Zoom in / out</td>
                </tr>
                <tr>
                  <td>Click-drag on canvas</td>
                  <td>Pan</td>
                </tr>
                <tr>
                  <td>Click-drag on node</td>
                  <td>Reorder among siblings</td>
                </tr>
                <tr>
                  <td>Right-click</td>
                  <td>Open context menu</td>
                </tr>
              </tbody>
            </table>
          </div>
    </>
  );
}
