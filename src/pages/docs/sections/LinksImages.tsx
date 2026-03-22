import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading } from "../components/SectionHeading";

export default function LinksImages() {
  return (
    <>
          <SectionHeading id="links-images">Links & Images</SectionHeading>

          <CodeBlock lang="mindmap">{`Machine Learning
- [Wikipedia](https://en.wikipedia.org/wiki/ML)
- Architecture Overview ![](./arch.png)
- Resources
  - [Paper](https://arxiv.org/xxx)
  - ![diagram](./flow.png)`}</CodeBlock>

          <ul className="list-disc list-inside text-slate-600 space-y-2 mt-4 mb-6">
            <li>
              <code className="text-xs">[text](url)</code> — Node text becomes a
              clickable hyperlink.
            </li>
            <li>
              <code className="text-xs">![alt](path)</code> — Embeds an image
              within a node.
            </li>
          </ul>
    </>
  );
}
