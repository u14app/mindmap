import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading } from "../components/SectionHeading";

export default function TaskStatus() {
  return (
    <>
          <SectionHeading id="task-status">Task Status</SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Reuses Markdown task list syntax, ideal for project or learning
            plans:
          </p>

          <CodeBlock lang="mindmap">{`Learning Plan Q1
- Basic Theory
  - [x] Linear Algebra
  - [x] Probability Theory
  - [-] Optimization Theory
  - [ ] Information Theory
- Practical Projects
  - [x] Handwritten Digit Recognition
  - [-] Text Classification
  - [ ] Image Segmentation`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Syntax</th>
                  <th>Meaning</th>
                  <th>Visual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>- [ ] text</code>
                  </td>
                  <td>To Do</td>
                  <td>&#9744;</td>
                </tr>
                <tr>
                  <td>
                    <code>- [-] text</code>
                  </td>
                  <td>In Progress</td>
                  <td>&#9684;</td>
                </tr>
                <tr>
                  <td>
                    <code>- [x] text</code>
                  </td>
                  <td>Completed</td>
                  <td>&#9745;</td>
                </tr>
              </tbody>
            </table>
          </div>
    </>
  );
}
