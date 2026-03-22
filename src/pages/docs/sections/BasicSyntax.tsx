import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading } from "../components/SectionHeading";

export default function BasicSyntax() {
  return (
    <>
          <SectionHeading id="basic-syntax">Basic Syntax</SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Lines of text that do not begin with the{" "}
            <code className="text-xs">-</code> list syntax are treated as{" "}
            <strong>root nodes</strong>. A single mindmap can contain multiple
            root nodes. The levels of the <code className="text-xs">-</code>{" "}
            list syntax define the hierarchy of the node tree.
          </p>

          <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  - Classification
  - Regression
  - Decision Trees
- Unsupervised Learning
  - Clustering
  - Dimensionality Reduction

Application Areas
- Natural Language Processing
- Computer Vision`}</CodeBlock>
    </>
  );
}
