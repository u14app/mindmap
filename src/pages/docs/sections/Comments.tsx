import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading } from "../components/SectionHeading";

export default function Comments() {
  return (
    <>
          <SectionHeading id="comments">Comments</SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Use <code className="text-xs">%%</code> to add comments that are
            only visible in the text editor and will not be rendered in the
            mind map:
          </p>

          <CodeBlock lang="mindmap">{`%% This is a comment, it won't appear in the mind map
Machine Learning
%% Core learning paradigms
- Supervised Learning
  - Classification
  - Regression
- Unsupervised Learning
  %% TODO: add more examples
  - Clustering`}</CodeBlock>

          <p className="text-sm text-slate-500 dark:text-slate-500 mt-3 mb-4">
            A line is treated as a comment only when{" "}
            <code className="text-xs">%%</code> appears at the beginning of
            the line (optionally preceded by whitespace). Inline occurrences
            like <code className="text-xs">test%%demo</code> are not treated
            as comments.
          </p>
    </>
  );
}
