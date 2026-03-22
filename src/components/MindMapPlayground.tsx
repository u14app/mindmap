import { useState, useRef, useCallback } from "react";
import { MindMap, allPlugins } from "./MindMap";
import type { MindMapRef } from "./MindMap";
import { MindMapTextEditor } from "./MindMap/components/MindMapTextEditor";

const DEFAULT_MARKDOWN = `Open MindMap
- Getting Started
  - Installation
    > npm install @xiangfa/mindmap
  - Quick Setup
  - Configuration
- Core Features
  - [x] Markdown Syntax
  - [x] Real-time Rendering
  - [-] AI Generation
  - [ ] Plugin System
- Integrations
  - React
  - TypeScript
  - Tailwind CSS
- Use Cases
  - Project Planning
  - Knowledge Base
  - Brainstorming`;

interface MindMapPlaygroundProps {
  defaultMarkdown?: string;
  className?: string;
  fullscreen?: boolean;
}

function MindMapPlayground({
  defaultMarkdown = DEFAULT_MARKDOWN,
  className = "",
  fullscreen = false,
}: MindMapPlaygroundProps) {
  const mindMapRef = useRef<MindMapRef>(null);
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // ---- AI Generation ----
  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      const response = await fetch(
        `https://open-mindmap-ai.u14.app/api/mindmap?text=${encodeURIComponent(aiPrompt)}`,
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        const clean = accumulated
          .replace(/<think>[\s\S]*?<\/think>/g, "")
          .replace(/<think>[\s\S]*$/, "")
          .replace(/^```(?:markdown)?\n?/, "")
          .replace(/\n?```$/, "");
        mindMapRef.current?.setMarkdown(clean);
        setMarkdown(clean);
      }

      // Final cleanup
      const finalMarkdown = accumulated
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/<think>[\s\S]*$/, "")
        .replace(/^```(?:markdown)?\n?/, "")
        .replace(/\n?```$/, "");
      setMarkdown(finalMarkdown);
      mindMapRef.current?.setMarkdown(finalMarkdown);
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setIsGenerating(false);
      setAiPrompt("");
    }
  }, [aiPrompt, isGenerating]);

  // ---- Handle Enter key in AI input ----
  const handleAIKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAIGenerate();
      }
    },
    [handleAIGenerate],
  );

  const outerClass = fullscreen
    ? "bg-white dark:bg-slate-900 h-full w-full overflow-hidden"
    : "relative bg-white dark:bg-slate-900 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] overflow-hidden border border-slate-200/60 dark:border-slate-700/60";

  const gridClass = fullscreen
    ? "grid grid-cols-1 lg:grid-cols-12 h-full"
    : "grid grid-cols-1 lg:grid-cols-12 lg:min-h-[720px]";

  return (
    <div className={`${outerClass} ${className}`}>
      <div className={gridClass}>
        {/* Left: Editor Panel */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700">
          <div className="p-4 md:p-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              <a href="https://github.com/u14app/mindmap" target="_blank">
                Open MindMap
              </a>
            </span>
          </div>

          <div className="font-mono text-[12px] md:text-[13px] leading-relaxed flex-grow overflow-auto editor-scroll min-h-0">
            <MindMapTextEditor
              value={markdown}
              onChange={(text) => {
                setMarkdown(text);
                mindMapRef.current?.setMarkdown(text);
              }}
              className="landing-text-editor"
            />
          </div>

          {/* AI Command Bar */}
          <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
            <div
              className={`flex items-center gap-2 md:gap-3 bg-slate-50 dark:bg-slate-800 border rounded-full p-2 transition-all ${
                isGenerating
                  ? "border-primary/30 ring-2 ring-primary/10"
                  : "border-slate-200 dark:border-slate-600 focus-within:ring-2 ring-primary/10"
              }`}
            >
              <input
                className="bg-transparent border-none focus:ring-0 focus:outline-none flex-grow text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white min-w-0"
                placeholder="Ask AI to generate a mind map..."
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={handleAIKeyDown}
                disabled={isGenerating}
              />
              <button
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shrink-0 transition-all hover:bg-primary dark:hover:bg-primary dark:hover:text-white disabled:opacity-50"
              >
                {isGenerating ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">
                    bolt
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Visualization Canvas */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 relative overflow-hidden min-h-[400px] lg:min-h-0">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
          <div className="demo-mindmap-container relative">
            <MindMap
              ref={mindMapRef}
              markdown={markdown}
              plugins={allPlugins}
              theme="auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MindMapPlayground;
