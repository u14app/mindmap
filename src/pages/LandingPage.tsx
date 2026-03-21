import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { MindMap } from "../components/MindMap";
import type { MindMapRef } from "../components/MindMap";
import "../App.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const SYSTEM_PROMPT = `You are a mind map generator. Given a topic, generate a mind map using markdown list syntax.

Rules:
- First line is the root node (no dash prefix)
- Use "- " for child nodes, indent with 2 spaces for deeper levels
- Use "> " after a node for remarks/notes
- Use "- [ ] " for todo items, "- [x] " for done items, "- [-] " for in-progress
- Use **bold**, *italic*, \`code\`, ~~strikethrough~~, ==highlight== for inline formatting
- Generate 3-5 main branches with 2-4 children each
- Keep node text concise (2-6 words per node)
- Output ONLY the markdown, no explanation or code fences

Example:
Web Development
- **Frontend**
  > User-facing technologies
  - [x] HTML & CSS
  - [-] JavaScript
  - [ ] TypeScript
- *Backend*
  - Node.js
  - Python
  - Database
    - SQL
    - NoSQL
- DevOps
  - CI/CD
  - Docker
  - Cloud Services`;

// ---------------------------------------------------------------------------
// Syntax Highlighting Helper
// ---------------------------------------------------------------------------

function highlightSyntax(md: string): ReactNode[] {
  return md.split("\n").map((line, i) => {
    // Empty line
    if (!line.trim()) return <div key={i} className="h-4" />;

    // Root node (first non-empty line without dash prefix)
    if (i === 0 && !line.trimStart().startsWith("-")) {
      return (
        <div key={i}>
          <span className="text-slate-900 font-bold">{line}</span>
        </div>
      );
    }

    // Remark lines
    if (line.trim().startsWith(">")) {
      const indent = line.match(/^(\s*)/)?.[0] || "";
      return (
        <div key={i}>
          <span className="text-slate-300">{indent}</span>
          <span className="text-primary/50">{line.trim()}</span>
        </div>
      );
    }

    // Normal lines with dash prefix
    const match = line.match(/^(\s*)([-+]\.?\s*)(.*)/);
    if (match) {
      const [, indent, marker, text] = match;

      // Process inline formatting
      let processedText: ReactNode = text;
      const parts: ReactNode[] = [];
      let remaining = text;
      let keyIdx = 0;

      // Task markers
      const taskMatch = remaining.match(/^\[([ x-])\]\s*/);
      if (taskMatch) {
        const status = taskMatch[1];
        const color =
          status === "x"
            ? "text-green-600"
            : status === "-"
              ? "text-amber-500"
              : "text-slate-400";
        parts.push(
          <span key={keyIdx++} className={color}>
            [{status}]{" "}
          </span>,
        );
        remaining = remaining.slice(taskMatch[0].length);
      }

      // Simple inline formatting highlights
      const inlineRegex =
        /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~|==[^=]+==#[a-zA-Z][\w-]*)/g;
      let lastIndex = 0;
      let inlineMatch;
      while ((inlineMatch = inlineRegex.exec(remaining)) !== null) {
        if (inlineMatch.index > lastIndex) {
          parts.push(
            <span key={keyIdx++} className="text-slate-600">
              {remaining.slice(lastIndex, inlineMatch.index)}
            </span>,
          );
        }
        const token = inlineMatch[0];
        if (token.startsWith("**")) {
          parts.push(
            <span key={keyIdx++} className="text-slate-800 font-semibold">
              {token}
            </span>,
          );
        } else if (token.startsWith("~~")) {
          parts.push(
            <span key={keyIdx++} className="text-slate-400 line-through">
              {token}
            </span>,
          );
        } else if (token.startsWith("`")) {
          parts.push(
            <span key={keyIdx++} className="text-rose-500">
              {token}
            </span>,
          );
        } else if (token.startsWith("==")) {
          parts.push(
            <span key={keyIdx++} className="text-amber-600">
              {token}
            </span>,
          );
        } else if (token.startsWith("#")) {
          parts.push(
            <span key={keyIdx++} className="text-slate-400">
              {token}
            </span>,
          );
        } else if (token.startsWith("*")) {
          parts.push(
            <span key={keyIdx++} className="text-slate-700 italic">
              {token}
            </span>,
          );
        }
        lastIndex = inlineMatch.index + token.length;
      }
      if (lastIndex < remaining.length) {
        parts.push(
          <span key={keyIdx++} className="text-slate-600">
            {remaining.slice(lastIndex)}
          </span>,
        );
      }

      if (parts.length === 0) {
        processedText = <span className="text-slate-600">{text}</span>;
      } else {
        processedText = <>{parts}</>;
      }

      return (
        <div key={i}>
          <span className="text-slate-300">{indent}</span>
          <span className="text-primary/40">{marker}</span>
          {processedText}
        </div>
      );
    }

    return (
      <div key={i}>
        <span className="text-slate-600">{line}</span>
      </div>
    );
  });
}

// ---------------------------------------------------------------------------
// LandingPage Component
// ---------------------------------------------------------------------------

function LandingPage() {
  const mindMapRef = useRef<MindMapRef>(null);
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [copied, setCopied] = useState(false);

  // ---- Navbar scroll handler ----
  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---- Scroll-triggered animations ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    document
      .querySelectorAll("[data-animate]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ---- Copy install command ----
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText("npm install @xiangfa/mindmap");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ---- AI Generation ----
  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) return;

    const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL;
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const model = import.meta.env.VITE_OPENAI_MODEL;

    if (!baseUrl || !apiKey || !model) {
      console.warn(
        "AI generation requires VITE_OPENAI_BASE_URL, VITE_OPENAI_API_KEY, and VITE_OPENAI_MODEL env vars.",
      );
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: aiPrompt },
          ],
          stream: true,
        }),
      });

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
        const lines = chunk
          .split("\n")
          .filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              const clean = accumulated
                .replace(/^```(?:markdown)?\n?/, "")
                .replace(/\n?```$/, "");
              mindMapRef.current?.setMarkdown(clean);
              setMarkdown(clean);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      // Final cleanup
      const finalMarkdown = accumulated
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

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="min-h-screen">
      {/* ================================================================= */}
      {/* Navbar                                                            */}
      {/* ================================================================= */}
      <nav
        className={`fixed top-0 w-full z-50 glass-effect border-b transition-all duration-300 ${
          navScrolled
            ? "bg-white/95 border-surface-container-high shadow-sm"
            : "bg-white/80 border-surface-container-high/50"
        }`}
      >
        <div className="flex justify-between items-center px-4 md:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex">
            <a
              href="#/"
              className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 no-underline"
            >
              <span className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-xs">hub</span>
              </span>
              <span className="hidden sm:block">Open MindMap</span>
            </a>
            <div className="flex ml-10 items-center gap-8 text-[13px] font-medium">
              <a className="text-slate-900" href="#features">
                Home
              </a>
              <a
                className="text-slate-500 hover:text-slate-900 transition-colors"
                href="#/docs"
              >
                Docs
              </a>
              <a
                className="text-slate-500 hover:text-slate-900 transition-colors"
                href="https://github.com/u14app/mindmap"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#demo"
              className="bg-primary text-white px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all hover:bg-primary/90 hover:scale-105"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* Main Content                                                      */}
      {/* ================================================================= */}
      <main className="hero-gradient overflow-hidden">
        {/* --------------------------------------------------------------- */}
        {/* Hero Section                                                     */}
        {/* --------------------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-16 text-center">
          <div className="hero-animate inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold tracking-wider uppercase mb-6 md:mb-8">
            <span className="material-symbols-outlined text-[14px]">
              terminal
            </span>
            v0.3.0 &middot; Open Source
          </div>

          <h1 className="hero-animate text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 md:mb-8 text-gradient leading-tight">
            The AI-Native
            <br />
            Mindmap for React.
          </h1>

          <p className="hero-animate-delayed text-base md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8 md:mb-12 font-medium">
            Transform complex mental models into structured visual systems with
            natural language. Open source, extensible, and built for the modern
            web.
          </p>

          {/* npm install snippet */}
          <div className="hero-animate-delayed max-w-md mx-auto mb-10 md:mb-16 relative">
            <div className="bg-slate-900 rounded-xl p-3 text-left font-mono text-xs md:text-sm code-glow border border-slate-800 flex items-center justify-between group">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <span className="text-primary-fixed-dim shrink-0">$</span>
                <span className="text-slate-300 truncate">
                  npm install{" "}
                  <span className="text-white">@xiangfa/mindmap</span>
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="text-slate-500 hover:text-white transition-colors shrink-0 ml-2 p-1"
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          </div>

          <div className="hero-animate-delayed-2 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <a
              href="#demo"
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 md:py-3.5 rounded-full text-sm md:text-base font-semibold transition-all hover:bg-slate-800 hover:scale-[1.02] text-center"
            >
              Start Building
            </a>
            <a
              href="#demo"
              className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-8 py-3 md:py-3.5 rounded-full text-sm md:text-base font-semibold transition-all hover:bg-slate-50 hover:scale-[1.02] text-center"
            >
              View Demo
            </a>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* Interactive Experience Section                                   */}
        {/* --------------------------------------------------------------- */}
        <section
          id="demo"
          className="max-w-7xl mx-auto px-4 md:px-6 mb-20 md:mb-40"
          data-animate
        >
          <div className="relative bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-200/60">
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:min-h-[720px]">
              {/* Left: Editor Panel */}
              <div className="lg:col-span-4 bg-slate-50 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100">
                <div className="p-4 md:p-5 border-b border-slate-200/50 bg-white flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Workspace
                  </span>
                </div>

                <div className="p-4 md:p-6 font-mono text-[12px] md:text-[13px] leading-relaxed flex-grow overflow-auto editor-scroll max-h-[240px] lg:max-h-none">
                  <pre className="whitespace-pre-wrap">
                    {highlightSyntax(markdown)}
                  </pre>
                </div>

                {/* AI Command Bar */}
                <div className="p-3 md:p-4 bg-white border-t border-slate-100">
                  <div
                    className={`flex items-center gap-2 md:gap-3 bg-slate-50 border rounded-full p-2 transition-all ${
                      isGenerating
                        ? "border-primary/30 ring-2 ring-primary/10"
                        : "border-slate-200 focus-within:ring-2 ring-primary/10"
                    }`}
                  >
                    <input
                      className="bg-transparent border-none focus:ring-0 focus:outline-none flex-grow text-sm font-medium placeholder:text-slate-400 min-w-0"
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
                      className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 transition-all hover:bg-primary disabled:opacity-50"
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
              <div className="lg:col-span-8 bg-white relative overflow-hidden min-h-[400px] lg:min-h-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
                <div className="demo-mindmap-container relative">
                  <MindMap
                    ref={mindMapRef}
                    markdown={markdown}
                    readonly
                    theme="light"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* AI Streaming Feature Section                                     */}
        {/* --------------------------------------------------------------- */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-4 md:px-6 mb-20 md:mb-40"
          data-animate
        >
          <div className="bg-slate-50 rounded-2xl p-6 md:p-16 border border-slate-100 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 overflow-hidden relative">
            <div className="flex-1 z-10">
              <span className="text-primary font-bold text-[11px] uppercase tracking-widest mb-4 block">
                Core Engine
              </span>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 md:mb-6">
                Real-time AI Streaming.
              </h2>
              <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-6 md:mb-8">
                Experience zero-latency visualization. As your LLM generates
                tokens, Open MindMap constructs the layout in real-time,
                handling thousands of nodes with pure SVG efficiency.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    check_circle
                  </span>
                  Sub-10ms Layout Recalculation
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    check_circle
                  </span>
                  Native Streaming Support
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    check_circle
                  </span>
                  OpenAI-Compatible API
                </li>
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
                <div className="relative bg-white p-8 rounded-3xl shadow-xl border border-primary/10">
                  <div className="space-y-3">
                    <div className="h-2 w-48 bg-primary/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary w-2/3"
                        style={{
                          animation: "shimmer 2s infinite",
                        }}
                      />
                    </div>
                    <div className="h-2 w-32 bg-primary/10 rounded-full" />
                    <div className="h-2 w-40 bg-primary/10 rounded-full" />
                  </div>
                </div>
                <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-primary/20 animate-float" />
                <div className="absolute bottom-20 left-0 w-6 h-6 rounded-full bg-primary/10 animate-float-delayed" />
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* Feature Highlights Grid                                          */}
        {/* --------------------------------------------------------------- */}
        <section
          id="highlights"
          className="max-w-7xl mx-auto px-4 md:px-6 mb-20 md:mb-40"
          data-animate
        >
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              Everything you need.
            </h2>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
              A complete mind-mapping toolkit — zero dependencies, pure SVG,
              keyboard-first, and mobile-ready.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                icon: "image",
                title: "Pure SVG Rendering",
                desc: "No Canvas, no external layout engine. Crystal-sharp at any zoom level.",
              },
              {
                icon: "smartphone",
                title: "iOS-Style UI",
                desc: "Frosted glass controls, rounded corners, and smooth animations.",
              },
              {
                icon: "dark_mode",
                title: "Dark Mode",
                desc: "Auto-detects prefers-color-scheme, or explicitly set light / dark.",
              },
              {
                icon: "keyboard",
                title: "Keyboard First",
                desc: "Enter to create, Delete to remove, Cmd+C/V to copy-paste, and more.",
              },
              {
                icon: "inventory_2",
                title: "Zero Dependencies",
                desc: "Only React as a peer dependency. Tiny bundle, maximum performance.",
              },
              {
                icon: "touch_app",
                title: "Mobile & Touch",
                desc: "Single-finger pan, two-finger pinch-to-zoom. Works everywhere.",
              },
              {
                icon: "translate",
                title: "Internationalization",
                desc: "Auto-detects browser language. Built-in en-US and zh-CN.",
              },
              {
                icon: "file_download",
                title: "Export Anywhere",
                desc: "SVG, high-DPI PNG, and Markdown export out of the box.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {f.icon}
                  </span>
                </div>
                <div className="font-bold text-slate-900 mb-1">{f.title}</div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* Plugin Showcase                                                  */}
        {/* --------------------------------------------------------------- */}
        <section
          id="plugins"
          className="max-w-7xl mx-auto px-4 md:px-6 mb-20 md:mb-40"
          data-animate
        >
          <div className="text-center mb-10 md:mb-16">
            <span className="text-primary font-bold text-[11px] uppercase tracking-widest mb-4 block">
              Extensible
            </span>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              Extend with Plugins.
            </h2>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
              7 built-in plugins extend the core syntax. Mix and match, or build
              your own.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: "settings",
                name: "Frontmatter",
                syntax: "---\ndirection: right\ntheme: dark\n---",
                desc: "Set direction and theme via YAML header",
              },
              {
                icon: "line_style",
                name: "Dotted Lines",
                syntax: "-. Dashed child node",
                desc: "Dashed connections for weak relationships",
              },
              {
                icon: "unfold_less",
                name: "Folding",
                syntax: "+ Collapsed group\n  - Hidden child",
                desc: "Collapsible node groups",
              },
              {
                icon: "notes",
                name: "Multi-line",
                syntax: "- Title\n  | Detail line 1\n  | Detail line 2",
                desc: "Multi-line content within a single node",
              },
              {
                icon: "label",
                name: "Tags",
                syntax: "- React #frontend #lib",
                desc: "Visual categorization with color-coded tags",
              },
              {
                icon: "conversion_path",
                name: "Cross Links",
                syntax: '- Node {#a}\n  -> {#b} "ref"',
                desc: "Draw connections between any two nodes",
              },
              {
                icon: "function",
                name: "LaTeX Math",
                syntax: "- Inline: $E = mc^2$\n- Block: $$\\sum x_i$$",
                desc: "Render math formulas via KaTeX",
              },
            ].map((p) => (
              <div
                key={p.name}
                className="bg-slate-50 rounded-xl p-5 hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      {p.icon}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">{p.name}</span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{p.desc}</p>
                <pre className="text-[12px] font-mono text-slate-600 bg-white rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                  {p.syntax}
                </pre>
              </div>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* Rich Markdown Syntax                                             */}
        {/* --------------------------------------------------------------- */}
        <section
          id="syntax"
          className="max-w-7xl mx-auto px-4 md:px-6 mb-20 md:mb-40"
          data-animate
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 md:mb-6">
                Write Markdown.
                <br />
                See Mind Maps.
              </h2>
              <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-6 md:mb-8">
                Use familiar Markdown syntax to describe your ideas. Open
                MindMap parses it in real-time and renders a beautiful,
                interactive visualization.
              </p>
              <ul className="space-y-4">
                {[
                  "Inline formatting — bold, italic, code, strikethrough, highlight",
                  "Task checkboxes — todo, done, and in-progress states",
                  "Remarks — attach multi-line notes to any node",
                  "Multi-root — multiple independent trees on one canvas",
                  "Drag & drop — reorder siblings by dragging nodes",
                  "Text editing mode — toggle between visual and Markdown editing",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm font-medium text-slate-700"
                  >
                    <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">
                      check
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-900 rounded-2xl p-1 overflow-hidden shadow-2xl">
              <div className="bg-slate-800/50 p-6 font-mono text-[13px] leading-relaxed text-slate-300">
                <div className="flex gap-2 mb-6 opacity-30">
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <pre
                  className="whitespace-pre"
                  dangerouslySetInnerHTML={{
                    __html: [
                      `<span class="text-white font-bold">Project Roadmap</span>`,
                      `<span class="text-slate-500">-</span> <span class="text-orange-300">**Phase 1**</span> — Foundation`,
                      `  <span class="text-slate-500">-</span> <span class="text-green-400">[x]</span> Setup repository`,
                      `  <span class="text-slate-500">-</span> <span class="text-green-400">[x]</span> Core architecture`,
                      `  <span class="text-slate-500">-</span> <span class="text-amber-400">[-]</span> API design`,
                      `    <span class="text-primary/60">&gt; REST endpoints defined</span>`,
                      `    <span class="text-primary/60">&gt; GraphQL schema in progress</span>`,
                      `<span class="text-slate-500">-</span> <span class="text-orange-300">*Phase 2*</span> — Features`,
                      `  <span class="text-slate-500">-</span> <span class="text-slate-400">[ ]</span> User auth`,
                      `  <span class="text-slate-500">-</span> <span class="text-slate-400">[ ]</span> <span class="text-rose-400">\`WebSocket\`</span> support`,
                      `  <span class="text-slate-500">-</span> <span class="text-slate-400">[ ]</span> <span class="text-amber-400">==Dashboard==</span>`,
                      `<span class="text-slate-500">-</span> Resources`,
                      `  <span class="text-slate-500">-</span> <span class="text-blue-400">[Docs](https://docs.example.com)</span>`,
                      `  <span class="text-slate-500">-</span> <span class="text-slate-400 line-through">~~Deprecated wiki~~</span>`,
                    ].join("\n"),
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* React Integration Section                                        */}
        {/* --------------------------------------------------------------- */}
        <section
          className="max-w-7xl mx-auto px-4 md:px-6 mb-20 md:mb-40"
          data-animate
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 md:mb-6">
                Built for the React Ecosystem.
              </h2>
              <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-6 md:mb-8">
                Drop a powerful mind-mapping engine into your application with a
                single component. Fully controlled, typed, and extensible with a
                rich plugin system.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="font-bold text-slate-900 mb-1">
                    TypeScript Native
                  </div>
                  <p className="text-sm text-slate-500">
                    First-class type definitions for every node and edge
                    property.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">
                    Plugin System
                  </div>
                  <p className="text-sm text-slate-500">
                    Extend syntax with tags, cross-links, LaTeX, folding, and
                    more.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-1 overflow-hidden shadow-2xl">
              <div className="bg-slate-800/50 p-6 font-mono text-sm leading-relaxed text-slate-300">
                <div className="flex gap-2 mb-6 opacity-30">
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <pre
                  className="whitespace-pre"
                  dangerouslySetInnerHTML={{
                    __html: [
                      `<span class="text-purple-400">import</span> { MindMap } <span class="text-purple-400">from</span> <span class="text-green-400">"@xiangfa/mindmap"</span>;`,
                      `<span class="text-purple-400">import</span> <span class="text-green-400">"@xiangfa/mindmap/style.css"</span>;`,
                      ``,
                      `<span class="text-purple-400">export default function</span> <span class="text-yellow-400">App</span>() {`,
                      `  <span class="text-purple-400">return</span> (`,
                      `    &lt;<span class="text-blue-400">MindMap</span>`,
                      `      <span class="text-orange-400">markdown</span>={content}`,
                      `      <span class="text-orange-400">theme</span>=<span class="text-green-400">"light"</span>`,
                      `      <span class="text-orange-400">onDataChange</span>={(data) =&gt; <span class="text-blue-400">save</span>(data)}`,
                      `    /&gt;`,
                      `  );`,
                      `}`,
                    ].join("\n"),
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* Social Proof Section                                             */}
        {/* --------------------------------------------------------------- */}
        <section
          className="max-w-7xl mx-auto px-4 md:px-6 mb-20 md:mb-40 text-center border-t border-slate-100 pt-16 md:pt-24"
          data-animate
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-10 md:mb-16">
            Powering creative teams around the world
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 md:gap-24 opacity-40 grayscale">
            <div className="text-xl md:text-2xl font-black tracking-tighter">
              PHENTOM
            </div>
            <div className="text-xl md:text-2xl font-black tracking-tighter">
              ABXYOS
            </div>
            <div className="text-xl md:text-2xl font-black tracking-tighter italic underline decoration-4 decoration-primary">
              KIENTIC
            </div>
            <div className="text-xl md:text-2xl font-black tracking-tighter uppercase">
              Vertax
            </div>
            <div className="text-xl md:text-2xl font-black tracking-tighter font-serif">
              Lumena
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* Final CTA Section                                                */}
        {/* --------------------------------------------------------------- */}
        <section
          className="max-w-7xl mx-auto px-4 md:px-6 mb-20 md:mb-40"
          data-animate
        >
          <div className="bg-slate-900 rounded-2xl p-8 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.15)_0%,transparent_70%)]" />
            <h2 className="text-3xl md:text-6xl font-bold mb-6 md:mb-8 relative z-10 tracking-tight">
              Precision in Thought.
            </h2>
            <p className="text-slate-400 text-base md:text-xl max-w-xl mx-auto mb-8 md:mb-12 relative z-10 leading-relaxed font-medium">
              The open-source standard for visual thinking in the React
              ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 relative z-10">
              <a
                href="#demo"
                className="w-full sm:w-auto bg-primary text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full text-base md:text-lg font-bold transition-all hover:bg-primary/90 hover:scale-[1.02] text-center"
              >
                Get Started Free
              </a>
              <a
                href="#/docs"
                className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full text-base md:text-lg font-bold transition-all hover:bg-white/10 text-center"
              >
                View Documentation
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================================= */}
      {/* Footer                                                            */}
      {/* ================================================================= */}
      <footer className="w-full py-8 px-4 md:px-8 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="text-lg font-bold tracking-tight text-slate-900 mb-6">
                Open MindMap
              </div>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Open Source & Community Driven.
                <br />
                Built for the modern web.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-[11px] mb-6 uppercase tracking-widest text-slate-400">
                Engineering
              </h5>
              <ul className="space-y-4 text-[13px] font-semibold text-slate-600">
                <li>
                  <a
                    className="hover:text-primary transition-colors"
                    href="#/docs"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-primary transition-colors"
                    href="#/docs#api-reference"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-primary transition-colors"
                    href="#/docs#getting-started"
                  >
                    React SDK
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-primary transition-colors"
                    href="#/docs#extended-syntax"
                  >
                    Plugin Guide
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-[11px] mb-6 uppercase tracking-widest text-slate-400">
                Community
              </h5>
              <ul className="space-y-4 text-[13px] font-semibold text-slate-600">
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Discord
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-primary transition-colors"
                    href="https://github.com/u14app/mindmap"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-[11px] mb-6 uppercase tracking-widest text-slate-400">
                Legal
              </h5>
              <ul className="space-y-4 text-[13px] font-semibold text-slate-600">
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Privacy
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    Terms
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary transition-colors" href="#">
                    License
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              &copy; 2026 Open MindMap. Open Source.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
