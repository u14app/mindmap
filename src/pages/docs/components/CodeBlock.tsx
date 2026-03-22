import { useState, useMemo } from "react";
import { highlightTsx, highlightBash, highlightCss } from "../highlight";
import { highlightMindmapHTML } from "../../../components/MindMap/utils/highlight";

export function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = useMemo(() => {
    if (lang === "tsx" || lang === "typescript") return highlightTsx(children);
    if (lang === "bash") return highlightBash(children);
    if (lang === "mindmap") return <span dangerouslySetInnerHTML={{ __html: highlightMindmapHTML(children) }} />;
    if (lang === "css") return highlightCss(children);
    return children;
  }, [children, lang]);

  return (
    <div className="docs-code-block bg-slate-900 dark:bg-[#0d1117] rounded-xl overflow-hidden my-4 dark:border dark:border-slate-700/50">
      {lang && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {lang}
          </span>
        </div>
      )}
      <pre className="text-[#cbd5e1] font-mono whitespace-pre overflow-x-auto">
        <code>{highlighted}</code>
      </pre>
      <button onClick={handleCopy} className="docs-copy-btn">
        <span className="material-symbols-outlined text-[16px]">
          {copied ? "check" : "content_copy"}
        </span>
      </button>
    </div>
  );
}
