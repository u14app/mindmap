import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading } from "../components/SectionHeading";

export default function Remarks() {
  return (
    <>
          <SectionHeading id="remarks">Remarks</SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Use <code className="text-xs">&gt;</code> to add detailed
            descriptions to a node, displayed on hover as tooltips:
          </p>

          <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  > Learning mapping functions from labeled data
  > Goal is to make predictions on new data
  - Classification
    > Output consists of discrete category labels
  - Regression
    > Output consists of continuous numerical values`}</CodeBlock>

          <p className="text-sm text-slate-500 dark:text-slate-500 mt-3 mb-6">
            Remarks are not displayed as sub-nodes; they serve as additional
            node information (tooltips/sidebar).
          </p>
    </>
  );
}
