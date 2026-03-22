import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import "../Docs.css";

// ---------------------------------------------------------------------------
// Section metadata
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: "getting-started", title: "Getting Started", icon: "rocket_launch" },
  { id: "basic-syntax", title: "Basic Syntax", icon: "code" },
  { id: "text-formatting", title: "Text Formatting", icon: "format_bold" },
  { id: "links-images", title: "Links & Images", icon: "link" },
  { id: "remarks", title: "Remarks", icon: "comment" },
  { id: "task-status", title: "Task Status", icon: "check_box" },
  { id: "extended-syntax", title: "Extended Syntax", icon: "extension" },
  { id: "ai-generation", title: "AI Generation", icon: "smart_toy" },
  { id: "custom-styling", title: "Custom Styling", icon: "palette" },
  { id: "api-reference", title: "API Reference", icon: "api" },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    icon: "keyboard",
  },
  {
    id: "utility-functions",
    title: "Utility Functions",
    icon: "build",
  },
];

// ---------------------------------------------------------------------------
// Syntax highlight helpers (no third-party deps — oneDark palette)
// ---------------------------------------------------------------------------

const CSS_KEYWORDS = new Set([
  "important",
  "inherit",
  "initial",
  "unset",
  "revert",
  "none",
  "auto",
  "block",
  "flex",
  "grid",
  "inline",
  "solid",
  "dashed",
  "dotted",
  "hidden",
  "visible",
  "absolute",
  "relative",
  "fixed",
  "sticky",
  "static",
  "bold",
  "normal",
  "italic",
  "center",
  "left",
  "right",
  "top",
  "bottom",
  "transparent",
  "currentColor",
  "square",
]);

function highlightCss(code: string): ReactNode {
  return code.split("\n").map((line, i) => {
    const parts: ReactNode[] = [];
    const re =
      /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(--[\w-]+)|(#(?:[0-9a-fA-F]{3,8})\b)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\.[\w-]+(?:\[[\w-]+(?:="[^"]*")?\])?)|(\d+\.?\d*(?:px|em|rem|%|vh|vw|s|ms|deg|fr|ch)?\b)|([\w-]+)\s*(?=:)|([{};:,])/g;
    let m: RegExpExecArray | null;
    let last = 0;
    let k = 0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) {
        parts.push(<span key={k++}>{line.slice(last, m.index)}</span>);
      }
      const [token, comment, varName, hex, str, selector, num, prop, punct] = m;
      if (comment) {
        parts.push(
          <span key={k++} className="hl-cmt">
            {token}
          </span>,
        );
      } else if (varName) {
        parts.push(
          <span key={k++} className="hl-num">
            {token}
          </span>,
        );
      } else if (hex) {
        parts.push(
          <span key={k++} className="hl-num">
            {token}
          </span>,
        );
      } else if (str) {
        parts.push(
          <span key={k++} className="hl-str">
            {token}
          </span>,
        );
      } else if (selector) {
        parts.push(
          <span key={k++} className="hl-tag">
            {token}
          </span>,
        );
      } else if (num) {
        parts.push(
          <span key={k++} className="hl-num">
            {token}
          </span>,
        );
      } else if (prop) {
        if (CSS_KEYWORDS.has(prop)) {
          parts.push(
            <span key={k++} className="hl-kw">
              {token}
            </span>,
          );
        } else {
          parts.push(
            <span key={k++} className="hl-fn">
              {token}
            </span>,
          );
        }
      } else if (punct) {
        parts.push(
          <span key={k++} className="hl-op">
            {token}
          </span>,
        );
      } else {
        parts.push(<span key={k++}>{token}</span>);
      }
      last = re.lastIndex;
    }
    if (last < line.length) {
      const remainder = line.slice(last);
      // Check for CSS keyword values in the remainder
      const valRe = /(#[0-9a-fA-F]{3,8}\b)|(--[\w-]+)|(\d+\.?\d*(?:px|em|rem|%|vh|vw|s|ms|deg|fr|ch)?\b)|([\w-]+)/g;
      let vm: RegExpExecArray | null;
      let vLast = 0;
      while ((vm = valRe.exec(remainder)) !== null) {
        if (vm.index > vLast) {
          parts.push(<span key={k++}>{remainder.slice(vLast, vm.index)}</span>);
        }
        const [vToken] = vm;
        const [, vHex, vVar, vNum, vWord] = vm;
        if (vHex) {
          parts.push(
            <span key={k++} className="hl-num">
              {vToken}
            </span>,
          );
        } else if (vVar) {
          parts.push(
            <span key={k++} className="hl-num">
              {vToken}
            </span>,
          );
        } else if (vNum) {
          parts.push(
            <span key={k++} className="hl-num">
              {vToken}
            </span>,
          );
        } else if (vWord && CSS_KEYWORDS.has(vWord)) {
          parts.push(
            <span key={k++} className="hl-kw">
              {vToken}
            </span>,
          );
        } else {
          parts.push(<span key={k++}>{vToken}</span>);
        }
        vLast = valRe.lastIndex;
      }
      if (vLast < remainder.length) {
        parts.push(<span key={k++}>{remainder.slice(vLast)}</span>);
      }
    }
    return <div key={i}>{parts.length ? parts : "\n"}</div>;
  });
}

const TSX_KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "const",
  "let",
  "var",
  "function",
  "return",
  "interface",
  "type",
  "async",
  "await",
  "new",
  "if",
  "else",
  "default",
  "void",
  "boolean",
  "string",
  "number",
  "true",
  "false",
  "null",
  "undefined",
]);

function highlightTsx(code: string): ReactNode {
  return code.split("\n").map((line, i) => {
    const parts: ReactNode[] = [];
    // Single combined regex with alternation — order matters
    const re =
      /(\{\/\*[\s\S]*?\*\/\}|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[\w.]+|\/?>)|(=>|\.{3}|\?\.|[!=]==?|&&|\|\|)|(\b\d+\.?\d*\b)|([\w$]+)/g;
    let m: RegExpExecArray | null;
    let last = 0;
    let k = 0;
    while ((m = re.exec(line)) !== null) {
      // plain text gap
      if (m.index > last) {
        parts.push(<span key={k++}>{line.slice(last, m.index)}</span>);
      }
      const [token, comment, str, tag, op, num, word] = m;
      if (comment) {
        parts.push(
          <span key={k++} className="hl-cmt">
            {token}
          </span>,
        );
      } else if (str) {
        parts.push(
          <span key={k++} className="hl-str">
            {token}
          </span>,
        );
      } else if (tag) {
        parts.push(
          <span key={k++} className="hl-tag">
            {token}
          </span>,
        );
      } else if (op) {
        parts.push(
          <span key={k++} className="hl-op">
            {token}
          </span>,
        );
      } else if (num) {
        parts.push(
          <span key={k++} className="hl-num">
            {token}
          </span>,
        );
      } else if (word) {
        if (TSX_KEYWORDS.has(word)) {
          parts.push(
            <span key={k++} className="hl-kw">
              {token}
            </span>,
          );
        } else {
          // Check if it's a function call (word followed by `(`)
          const after = line[re.lastIndex];
          if (after === "(") {
            parts.push(
              <span key={k++} className="hl-fn">
                {token}
              </span>,
            );
          } else if (after === "=" || after === ":") {
            // Could be an attribute like `className=`
            // Check if we're inside a JSX context (rough heuristic)
            const before = line.slice(0, m.index);
            if (/<[\w.]+[^>]*$/.test(before)) {
              parts.push(
                <span key={k++} className="hl-attr">
                  {token}
                </span>,
              );
            } else {
              parts.push(<span key={k++}>{token}</span>);
            }
          } else {
            parts.push(<span key={k++}>{token}</span>);
          }
        }
      }
      last = re.lastIndex;
    }
    if (last < line.length) {
      parts.push(<span key={k++}>{line.slice(last)}</span>);
    }
    return <div key={i}>{parts.length ? parts : "\n"}</div>;
  });
}

function highlightBash(code: string): ReactNode {
  return code.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i}>{"\n"}</div>;

    // Comment lines
    if (line.trimStart().startsWith("#")) {
      return (
        <div key={i}>
          <span className="hl-cmt">{line}</span>
        </div>
      );
    }

    // Command lines: command subcommand args...
    const m = line.match(/^(\s*)([\w-]+)(?:\s+([\w-]+))?(?:\s+(.*))?$/);
    if (m) {
      const [, indent, cmd, sub, args] = m;
      const parts: ReactNode[] = [];
      let k = 0;
      if (indent) parts.push(<span key={k++}>{indent}</span>);
      parts.push(
        <span key={k++} className="hl-fn">
          {cmd}
        </span>,
      );
      if (sub) {
        parts.push(<span key={k++}> </span>);
        parts.push(
          <span key={k++} className="hl-kw">
            {sub}
          </span>,
        );
      }
      if (args) {
        parts.push(<span key={k++}> </span>);
        parts.push(
          <span key={k++} className="hl-str">
            {args}
          </span>,
        );
      }
      return <div key={i}>{parts}</div>;
    }

    return (
      <div key={i}>
        <span>{line}</span>
      </div>
    );
  });
}

function highlightMindmapInline(
  text: string,
  startKey: number,
): [ReactNode[], number] {
  const parts: ReactNode[] = [];
  let k = startKey;
  const re =
    /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|==[^=]+==#[a-zA-Z][\w-]*|\$\$[^$]+\$\$|\$[^$\n]+\$|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|->\.?\s*\{#[\w-]+\}(?:\s*"[^"]*")?\{#[\w-]+\}|\*(?!\*)[^*]+\*(?!\*))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    }
    const t = m[0];
    if (t.startsWith("**")) {
      parts.push(
        <span key={k++} className="font-semibold" style={{ color: "#e5e7eb" }}>
          {t}
        </span>,
      );
    } else if (t.startsWith("~~")) {
      parts.push(
        <span key={k++} className="hl-cmt line-through">
          {t}
        </span>,
      );
    } else if (t.startsWith("`")) {
      parts.push(
        <span key={k++} className="hl-tag">
          {t}
        </span>,
      );
    } else if (t.startsWith("==")) {
      parts.push(
        <span key={k++} className="hl-num">
          {t}
        </span>,
      );
    } else if (
      t.startsWith("$$") ||
      (t.startsWith("$") && !t.startsWith("${"))
    ) {
      parts.push(
        <span key={k++} className="hl-num">
          {t}
        </span>,
      );
    } else if (t.startsWith("![")) {
      parts.push(
        <span key={k++} className="hl-fn">
          {t}
        </span>,
      );
    } else if (t.startsWith("[")) {
      parts.push(
        <span key={k++} className="hl-fn">
          {t}
        </span>,
      );
    } else if (t.startsWith("->")) {
      parts.push(
        <span key={k++} className="hl-fn">
          {t}
        </span>,
      );
    } else if (t.startsWith("{#")) {
      parts.push(
        <span key={k++} className="hl-attr">
          {t}
        </span>,
      );
    } else if (t.startsWith("#")) {
      parts.push(
        <span key={k++} className="hl-kw">
          {t}
        </span>,
      );
    } else if (t.startsWith("*")) {
      parts.push(
        <span key={k++} className="italic" style={{ color: "#abb2bf" }}>
          {t}
        </span>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) {
    parts.push(<span key={k++}>{text.slice(last)}</span>);
  }
  return [parts, k];
}

function highlightMindmap(code: string): ReactNode {
  const lines = code.split("\n");
  let inFrontmatter = false;

  return lines.map((line, i) => {
    // Empty line
    if (!line.trim()) return <div key={i}>{"\n"}</div>;

    // Frontmatter delimiter
    if (line.trim() === "---") {
      inFrontmatter = !inFrontmatter;
      return (
        <div key={i}>
          <span className="hl-op">{line}</span>
        </div>
      );
    }

    // Inside frontmatter: key: value
    if (inFrontmatter) {
      const fm = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.*)/);
      if (fm) {
        return (
          <div key={i}>
            <span>{fm[1]}</span>
            <span className="hl-attr">{fm[2]}</span>
            <span className="hl-op">{fm[3]}</span>
            <span className="hl-str">{fm[4]}</span>
          </div>
        );
      }
      return (
        <div key={i}>
          <span>{line}</span>
        </div>
      );
    }

    // Remark lines (> ...)
    const remarkMatch = line.match(/^(\s*)(>.*)/);
    if (remarkMatch) {
      return (
        <div key={i}>
          <span>{remarkMatch[1]}</span>
          <span className="hl-cmt">{remarkMatch[2]}</span>
        </div>
      );
    }

    // Multi-line content (| ...)
    const pipeMatch = line.match(/^(\s*)(\|)(.*)/);
    if (pipeMatch) {
      const [inlineParts] = highlightMindmapInline(pipeMatch[3], 2);
      return (
        <div key={i}>
          <span>{pipeMatch[1]}</span>
          <span className="hl-op">{pipeMatch[2]}</span>
          {inlineParts}
        </div>
      );
    }

    // Lines with list markers (- / + / -.)
    const listMatch = line.match(/^(\s*)([-+]\.?\s)(.*)/);
    if (listMatch) {
      const [, indent, marker, text] = listMatch;
      const parts: ReactNode[] = [];
      let k = 0;
      parts.push(<span key={k++}>{indent}</span>);
      parts.push(
        <span key={k++} className="hl-op">
          {marker}
        </span>,
      );

      // Task markers
      const taskMatch = text.match(/^\[([ x-])\]\s*/);
      if (taskMatch) {
        const status = taskMatch[1];
        const cls =
          status === "x" ? "hl-str" : status === "-" ? "hl-num" : "hl-cmt";
        parts.push(
          <span key={k++} className={cls}>
            [{status}]{" "}
          </span>,
        );
        const rest = text.slice(taskMatch[0].length);
        const [inlineParts] = highlightMindmapInline(rest, k);
        parts.push(...inlineParts);
      } else {
        const [inlineParts] = highlightMindmapInline(text, k);
        parts.push(...inlineParts);
      }

      return <div key={i}>{parts}</div>;
    }

    // Root node (no indent, no marker)
    return (
      <div key={i}>
        <span className="font-semibold" style={{ color: "#e5e7eb" }}>
          {line}
        </span>
      </div>
    );
  });
}

// ---------------------------------------------------------------------------
// CodeBlock component
// ---------------------------------------------------------------------------

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = useMemo(() => {
    if (lang === "tsx" || lang === "typescript") return highlightTsx(children);
    if (lang === "bash") return highlightBash(children);
    if (lang === "mindmap") return highlightMindmap(children);
    if (lang === "css") return highlightCss(children);
    return children;
  }, [children, lang]);

  return (
    <div className="docs-code-block bg-slate-900 rounded-xl overflow-hidden my-4">
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

// ---------------------------------------------------------------------------
// Reusable section heading
// ---------------------------------------------------------------------------

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="docs-section text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-6 pt-10 border-t border-slate-100 first:border-t-0 first:pt-0"
    >
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-bold text-slate-800 mt-8 mb-3">{children}</h3>
  );
}

// ---------------------------------------------------------------------------
// DocsPage Component
// ---------------------------------------------------------------------------

function DocsPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [navScrolled, setNavScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // ---- Navbar scroll & back-to-top ----
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 10);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---- Scrollspy ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // ---- Scroll to section on initial load (deep link) ----
  useEffect(() => {
    const hash = window.location.hash;
    const sectionId = hash.replace("#/docs", "").replace("#", "");
    if (sectionId) {
      setTimeout(() => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setSidebarOpen(false);
  }, []);

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="docs-page min-h-screen bg-white">
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
              <a
                className="text-slate-500 hover:text-slate-900 transition-colors"
                href="#/"
              >
                Home
              </a>
              <a className="text-slate-900" href="#/docs">
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

          <a
            href="#/docs#getting-started"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("getting-started");
            }}
            className="hidden md:flex bg-primary text-white px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all hover:bg-primary/90 hover:scale-105"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* Mobile sidebar overlay                                            */}
      {/* ================================================================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] docs-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="docs-drawer absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto docs-sidebar-scroll p-6 pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`docs-sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium border-l-2 border-transparent ${
                    activeSection === s.id
                      ? "active"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {s.icon}
                  </span>
                  {s.title}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* ================================================================= */}
      {/* Main layout                                                       */}
      {/* ================================================================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-[68px] flex">
        {/* Sidebar (desktop) */}
        <aside className="docs-sidebar hidden lg:block shrink-0 sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto docs-sidebar-scroll py-8 pr-8">
          <div className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`docs-sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium border-l-2 border-transparent ${
                  activeSection === s.id
                    ? "active"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {s.icon}
                </span>
                {s.title}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main ref={mainRef} className="flex-1 min-w-0 max-w-3xl py-8 lg:pl-4">
          {/* ============================================================= */}
          {/* Getting Started                                                */}
          {/* ============================================================= */}
          <SectionHeading id="getting-started">Getting Started</SectionHeading>

          <p className="text-slate-600 leading-relaxed mb-6">
            Open MindMap is a zero-dependency React component library for
            interactive SVG-based mind maps. It supports Markdown input (AI
            streaming ready), a plugin system for extended syntax, and exports
            to SVG/PNG/Markdown.
          </p>

          <SubHeading>Installation</SubHeading>
          <CodeBlock lang="bash">{`# npm
npm install @xiangfa/mindmap

# pnpm
pnpm add @xiangfa/mindmap

# yarn
yarn add @xiangfa/mindmap`}</CodeBlock>

          <p className="text-sm text-slate-500 mt-3 mb-6">
            For LaTeX math formula rendering, also install KaTeX (optional):
          </p>
          <CodeBlock lang="bash">npm install katex</CodeBlock>

          <SubHeading>Quick Start</SubHeading>
          <CodeBlock lang="tsx">{`import { MindMap } from "@xiangfa/mindmap";
import "@xiangfa/mindmap/style.css";

const data = \`
My Mind Map
  - First Topic
    - Sub-topic A
    - Sub-topic B
  - Second Topic
\`;

function App() {
  return <MindMap markdown={data} />;
}`}</CodeBlock>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mt-4 mb-6">
            <p className="text-sm text-slate-700 font-medium">
              <span className="font-bold text-primary">Note:</span> The
              component fills its parent container. Ensure the parent has an
              explicit width and height.
            </p>
          </div>

          <SubHeading>Markdown Input</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Pass a Markdown list directly — ideal for streaming AI responses:
          </p>
          <CodeBlock lang="tsx">{`const markdown = \`
Machine Learning
  - Supervised Learning
    - Classification
    - Regression
  - Unsupervised Learning

Application Areas
  - Natural Language Processing
  - Computer Vision
\`;

<MindMap markdown={markdown} />`}</CodeBlock>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Separate different root node trees with blank lines in the Markdown.
          </p>

          <SubHeading>Dark Mode</SubHeading>
          <CodeBlock lang="tsx">{`<MindMap data={data} theme="auto" />  {/* Follow system (default) */}
<MindMap data={data} theme="dark" />  {/* Always dark */}
<MindMap data={data} theme="light" /> {/* Always light */}`}</CodeBlock>

          <SubHeading>Layout Direction</SubHeading>
          <CodeBlock lang="tsx">{`<MindMap data={data} defaultDirection="both" />  {/* Balanced (default) */}
<MindMap data={data} defaultDirection="right" /> {/* All children on right */}
<MindMap data={data} defaultDirection="left" />  {/* All children on left */}`}</CodeBlock>

          <SubHeading>Readonly Mode</SubHeading>
          <CodeBlock lang="tsx">{`<MindMap data={data} readonly />`}</CodeBlock>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Users can still pan, zoom, and select nodes but cannot create, edit,
            or delete. The context menu hides edit actions.
          </p>

          <SubHeading>Plugins</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            All 7 built-in plugins are enabled by default. You can selectively
            enable only what you need:
          </p>
          <CodeBlock lang="tsx">{`import {
  MindMap,
  allPlugins,          // All 7 plugins
  frontMatterPlugin,   // YAML frontmatter
  dottedLinePlugin,    // Dotted edges
  foldingPlugin,       // Collapsible nodes
  multiLinePlugin,     // Multi-line content
  tagsPlugin,          // Tag support
  crossLinkPlugin,     // Cross-node references
  latexPlugin,         // LaTeX math (requires KaTeX)
} from "@xiangfa/mindmap";

{/* Use all plugins (default) */}
<MindMap data={data} plugins={allPlugins} />

{/* Only selected plugins */}
<MindMap data={data} plugins={[foldingPlugin, tagsPlugin]} />

{/* Disable all plugins */}
<MindMap data={data} plugins={[]} />`}</CodeBlock>

          <SubHeading>Ref API</SubHeading>
          <CodeBlock lang="tsx">{`import { useRef } from "react";
import { MindMap, type MindMapRef } from "@xiangfa/mindmap";

function App() {
  const ref = useRef<MindMapRef>(null);

  const handleExportPNG = async () => {
    const blob = await ref.current!.exportToPNG();
    // ... download blob
  };

  return <MindMap ref={ref} data={data} />;
}`}</CodeBlock>

          <SubHeading>Listening for Changes</SubHeading>
          <CodeBlock lang="tsx">{`<MindMap
  data={data}
  onDataChange={(newData) => {
    console.log("Mind map updated:", newData);
  }}
/>`}</CodeBlock>

          <SubHeading>i18n / Localization</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            UI language is automatically detected from the browser. Built-in
            support for Chinese (<code className="text-xs">zh-CN</code>) and
            English (<code className="text-xs">en-US</code>), with fallback to
            English.
          </p>
          <CodeBlock lang="tsx">{`{/* Auto-detect (default) */}
<MindMap data={data} />

{/* Force locale */}
<MindMap data={data} locale="zh-CN" />

{/* Override specific strings */}
<MindMap data={data} locale="zh-CN" messages={{ newNode: "New" }} />

{/* Fully custom language */}
<MindMap
  data={data}
  messages={{
    newNode: "Nuevo nodo",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    // ... override any key from MindMapMessages
  }}
/>`}</CodeBlock>

          {/* ============================================================= */}
          {/* Basic Syntax                                                   */}
          {/* ============================================================= */}
          <SectionHeading id="basic-syntax">Basic Syntax</SectionHeading>

          <p className="text-slate-600 leading-relaxed mb-6">
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

          {/* ============================================================= */}
          {/* Text Formatting                                                */}
          {/* ============================================================= */}
          <SectionHeading id="text-formatting">Text Formatting</SectionHeading>

          <p className="text-slate-600 leading-relaxed mb-6">
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

          {/* ============================================================= */}
          {/* Links & Images                                                 */}
          {/* ============================================================= */}
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

          {/* ============================================================= */}
          {/* Remarks                                                        */}
          {/* ============================================================= */}
          <SectionHeading id="remarks">Remarks</SectionHeading>

          <p className="text-slate-600 leading-relaxed mb-4">
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

          <p className="text-sm text-slate-500 mt-3 mb-6">
            Remarks are not displayed as sub-nodes; they serve as additional
            node information (tooltips/sidebar).
          </p>

          {/* ============================================================= */}
          {/* Task Status                                                    */}
          {/* ============================================================= */}
          <SectionHeading id="task-status">Task Status</SectionHeading>

          <p className="text-slate-600 leading-relaxed mb-4">
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

          {/* ============================================================= */}
          {/* Extended Syntax                                                */}
          {/* ============================================================= */}
          <SectionHeading id="extended-syntax">Extended Syntax</SectionHeading>

          <p className="text-slate-600 leading-relaxed mb-6">
            Extended syntax features are provided through plugins. All 7
            built-in plugins are enabled by default.
          </p>

          {/* Dotted Lines */}
          <SubHeading>Dotted Lines</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Use <code className="text-xs">-.</code> instead of{" "}
            <code className="text-xs">-</code> to render nodes with dotted edges
            for weak relationships:
          </p>
          <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  - Classification
  -. Feature Engineering`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Syntax</th>
                  <th>Line Style</th>
                  <th>Semantics</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>-</code>
                  </td>
                  <td>Solid</td>
                  <td>Standard parent-child relationship</td>
                </tr>
                <tr>
                  <td>
                    <code>-.</code>
                  </td>
                  <td>Dotted</td>
                  <td>Weak association / Optional / TBD</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Multi-line */}
          <SubHeading>Multi-line Node Content</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Lines starting with <code className="text-xs">|</code> are appended
            to the content of the preceding node and rendered as multi-line text
            within that node:
          </p>
          <CodeBlock lang="mindmap">{`Machine Learning
- Supervised Learning
  - Classification
    | **Definition**: Mapping inputs to discrete categories.
    | **Input**: Feature vector X
    | **Output**: Class label Y
  - Regression
    | Continuous output values.
    | Commonly used for prediction scenarios.`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Syntax</th>
                  <th>Display Mode</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>&gt; text</code>
                  </td>
                  <td>Tooltip / Hover</td>
                  <td>Supplementary notes; space-saving</td>
                </tr>
                <tr>
                  <td>
                    <code>| text</code>
                  </td>
                  <td>In-node display</td>
                  <td>When the node requires multi-line content</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tags */}
          <SubHeading>Tags</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Use <code className="text-xs">#tag</code> to label nodes for easy
            filtering and categorization:
          </p>
          <CodeBlock lang="mindmap">{`Tech Stack
- React #frontend #javascript
  - Next.js #framework #ssr
  - Redux #state-management
- Python #backend #ml
  - FastAPI #framework
  - PyTorch #ml #deep-learning
- PostgreSQL #database #backend`}</CodeBlock>

          {/* Cross-links */}
          <SubHeading>Cross-node Connections</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Use <code className="text-xs">{"{#id}"}</code> to define node
            anchors and <code className="text-xs">{"-> {#id}"}</code> to create
            cross-branch connections:
          </p>
          <CodeBlock lang="mindmap">{`System Architecture
- Frontend {#frontend}
  - React
  - API Call -> {#api-gateway}
- Backend
  - API Gateway {#api-gateway}
    - REST
    - GraphQL
  - Data Processing
    - ETL Pipeline -> {#data-warehouse}
- Data Layer
  - Data Warehouse {#data-warehouse}
  - Cache -> {#frontend}`}</CodeBlock>

          <p className="text-sm text-slate-500 mt-3 mb-2">
            Optional annotated connections:
          </p>
          <CodeBlock>{`- API Call -> {#api-gateway} "HTTP/REST"`}</CodeBlock>

          <ul className="list-disc list-inside text-sm text-slate-500 space-y-1 mt-3 mb-6">
            <li>
              <code className="text-xs">{"{#id}"}</code> — Define an anchor on a
              node
            </li>
            <li>
              <code className="text-xs">{"-> {#id}"}</code> — Solid cross-link
              to anchor
            </li>
            <li>
              <code className="text-xs">{'-> {#id} "label"'}</code> — Cross-link
              with label
            </li>
            <li>
              <code className="text-xs">{"-.> {#id}"}</code> — Dotted cross-link
            </li>
          </ul>

          {/* Folding */}
          <SubHeading>Folding Markers</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Use <code className="text-xs">+</code> instead of{" "}
            <code className="text-xs">-</code> to indicate that a node is
            collapsed by default:
          </p>
          <CodeBlock lang="mindmap">{`Project Structure
- src/
  - components/
    - Button.tsx
    - Modal.tsx
  + utils/
    - format.ts
    - validate.ts
  + hooks/
    - useAuth.ts
    - useFetch.ts
- README.md`}</CodeBlock>

          <ul className="list-disc list-inside text-sm text-slate-500 space-y-1 mt-3 mb-6">
            <li>
              <code className="text-xs">-</code> = Expanded (default)
            </li>
            <li>
              <code className="text-xs">+</code> = Collapsed (click to expand)
            </li>
          </ul>

          {/* LaTeX */}
          <SubHeading>Formula Support (LaTeX)</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Render math formulas via{" "}
            <a
              href="https://katex.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              KaTeX
            </a>
            :
          </p>
          <CodeBlock lang="mindmap">{`Loss Functions
- MSE
  | $L = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2$
- Cross Entropy
  | $L = -\\sum_{i} y_i \\log(\\hat{y}_i)$
- KL Divergence
  | $D_{KL}(P \\| Q) = \\sum P(x) \\log\\frac{P(x)}{Q(x)}$`}</CodeBlock>

          <p className="text-sm text-slate-500 mt-3 mb-6">
            Supports inline formulas with <code className="text-xs">$...$</code>{" "}
            and block-level formulas with{" "}
            <code className="text-xs">$$...$$</code>.
          </p>

          {/* Frontmatter */}
          <SubHeading>Global Configuration (Front Matter)</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Control overall behavior and styling with YAML front matter:
          </p>
          <CodeBlock lang="mindmap">{`---
direction: right
theme: auto
---

Machine Learning
- Supervised Learning
- Unsupervised Learning`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Values</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>direction</code>
                  </td>
                  <td>
                    <code>right</code> | <code>left</code> | <code>both</code>
                  </td>
                  <td>Layout direction</td>
                </tr>
                <tr>
                  <td>
                    <code>theme</code>
                  </td>
                  <td>
                    <code>auto</code> | <code>light</code> | <code>dark</code>
                  </td>
                  <td>Color theme</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ============================================================= */}
          {/* AI Generation                                                    */}
          {/* ============================================================= */}
          <SectionHeading id="ai-generation">AI Generation</SectionHeading>

          <p className="text-slate-600 leading-relaxed mb-6">
            The built-in AI generation feature connects to any OpenAI-compatible
            API to generate mind maps from natural language. When the{" "}
            <code className="text-xs">ai</code> prop is provided, a text input
            bar appears at the bottom of the mind map. Users type a prompt, and
            the AI streams back a structured mind map in real-time.
          </p>

          <SubHeading>Basic Usage</SubHeading>
          <CodeBlock lang="tsx">{`import { MindMap } from "@xiangfa/mindmap";
import "@xiangfa/mindmap/style.css";

function App() {
  return (
    <MindMap
      ai={{
        apiUrl: "https://api.openai.com/v1/chat/completions",
        apiKey: "sk-...",
        model: "gpt-5",
      }}
    />
  );
}`}</CodeBlock>

          <SubHeading>MindMapAIConfig</SubHeading>
          <CodeBlock lang="typescript">{`type AIAttachmentType = "text" | "image" | "pdf";

interface MindMapAIConfig {
  apiUrl: string;              // OpenAI-compatible API endpoint
  apiKey: string;              // API key (Bearer token)
  model: string;               // Model name (e.g., "gpt-5")
  systemPrompt?: string;       // Custom system prompt (has a built-in default)
  attachments?: AIAttachmentType[];  // Allowed attachment types (default: [])
}`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>apiUrl</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>Yes</td>
                  <td>OpenAI-compatible chat completions endpoint</td>
                </tr>
                <tr>
                  <td>
                    <code>apiKey</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>Yes</td>
                  <td>
                    API key sent as <code>Bearer</code> token
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>model</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>Yes</td>
                  <td>
                    Model identifier (e.g., <code>gpt-5</code>,{" "}
                    <code>deepseek-chat</code>)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>systemPrompt</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>No</td>
                  <td>Override the built-in mind map generation prompt</td>
                </tr>
                <tr>
                  <td>
                    <code>attachments</code>
                  </td>
                  <td>
                    <code>{"AIAttachmentType[]"}</code>
                  </td>
                  <td>No</td>
                  <td>Enable file uploads (see table below)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>File Attachments</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Enable file attachments by specifying the allowed types in the{" "}
            <code className="text-xs">attachments</code> array. When enabled, a
            paperclip button appears in the input bar.
          </p>

          <CodeBlock lang="tsx">{`<MindMap
  ai={{
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: "sk-...",
    model: "gpt-5",
    attachments: ["text", "image", "pdf"],
  }}
/>`}</CodeBlock>

          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Accepts</th>
                  <th>API Format</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>"text"</code>
                  </td>
                  <td>
                    All <code>text/*</code> MIME types
                  </td>
                  <td>Content sent as text in the message</td>
                </tr>
                <tr>
                  <td>
                    <code>"image"</code>
                  </td>
                  <td>
                    All <code>image/*</code> MIME types
                  </td>
                  <td>
                    Sent as <code>image_url</code> (base64 data URL)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>"pdf"</code>
                  </td>
                  <td>
                    <code>application/pdf</code>
                  </td>
                  <td>Content extracted and sent as text</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>Custom System Prompt</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            The AI generation comes with a built-in system prompt optimized for
            generating mind map markdown. You can override it with your own:
          </p>

          <CodeBlock lang="tsx">{`<MindMap
  ai={{
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: "sk-...",
    model: "gpt-5",
    systemPrompt: "Generate a mind map about the given topic. Use markdown list syntax with - prefix for nodes...",
  }}
/>`}</CodeBlock>

          <p className="text-sm text-slate-500 mt-3 mb-6">
            <strong>Security Note:</strong> The API key is sent from the
            browser. For production deployments, use a proxy endpoint to keep
            your key server-side.
          </p>

          {/* ============================================================= */}
          {/* Custom Styling                                                   */}
          {/* ============================================================= */}
          <SectionHeading id="custom-styling">Custom Styling</SectionHeading>

          <p className="text-slate-600 leading-relaxed mb-4">
            Open MindMap exposes <strong>30+ CSS custom properties</strong> and
            semantic CSS classes on every SVG element. You can customize colors,
            fonts, edges, and branch styles with plain CSS — no JavaScript
            needed.
          </p>

          <SubHeading>CSS Custom Properties</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Override CSS variables on <code>.mindmap-container</code> to change
            theme values globally:
          </p>
          <CodeBlock lang="css">{`.mindmap-container {
  --mindmap-canvas-bg: #f0f4f8;
  --mindmap-root-bg: #1a73e8;
  --mindmap-root-text: #ffffff;
  --mindmap-node-text: #1a1a2e;
  --mindmap-edge-width: 3;
}`}</CodeBlock>

          <p className="text-slate-600 leading-relaxed mt-6 mb-4">
            Available variable groups:
          </p>
          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Variables</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Canvas</td>
                  <td>
                    <code>--mindmap-canvas-bg</code>
                  </td>
                </tr>
                <tr>
                  <td>Root Node</td>
                  <td>
                    <code>--mindmap-root-bg</code>,{" "}
                    <code>--mindmap-root-text</code>,{" "}
                    <code>--mindmap-root-font-size</code>,{" "}
                    <code>--mindmap-root-font-weight</code>,{" "}
                    <code>--mindmap-root-font-family</code>
                  </td>
                </tr>
                <tr>
                  <td>Child Nodes</td>
                  <td>
                    <code>--mindmap-node-text</code>,{" "}
                    <code>--mindmap-node-font-size</code>,{" "}
                    <code>--mindmap-node-font-weight</code>,{" "}
                    <code>--mindmap-node-font-family</code>
                  </td>
                </tr>
                <tr>
                  <td>Level 1</td>
                  <td>
                    <code>--mindmap-level1-font-size</code>,{" "}
                    <code>--mindmap-level1-font-weight</code>
                  </td>
                </tr>
                <tr>
                  <td>Edges</td>
                  <td>
                    <code>--mindmap-edge-width</code>
                  </td>
                </tr>
                <tr>
                  <td>Selection</td>
                  <td>
                    <code>--mindmap-selection-stroke</code>,{" "}
                    <code>--mindmap-selection-fill</code>
                  </td>
                </tr>
                <tr>
                  <td>Highlight</td>
                  <td>
                    <code>--mindmap-highlight-text</code>,{" "}
                    <code>--mindmap-highlight-bg</code>
                  </td>
                </tr>
                <tr>
                  <td>Add Button</td>
                  <td>
                    <code>--mindmap-addbtn-fill</code>,{" "}
                    <code>--mindmap-addbtn-hover</code>,{" "}
                    <code>--mindmap-addbtn-icon</code>
                  </td>
                </tr>
                <tr>
                  <td>Controls</td>
                  <td>
                    <code>--mindmap-controls-bg</code>,{" "}
                    <code>--mindmap-controls-text</code>,{" "}
                    <code>--mindmap-controls-hover</code>
                  </td>
                </tr>
                <tr>
                  <td>Context Menu</td>
                  <td>
                    <code>--mindmap-ctx-bg</code>,{" "}
                    <code>--mindmap-ctx-text</code>,{" "}
                    <code>--mindmap-ctx-hover</code>,{" "}
                    <code>--mindmap-ctx-border</code>,{" "}
                    <code>--mindmap-ctx-shadow</code>
                  </td>
                </tr>
                <tr>
                  <td>Branch Colors</td>
                  <td>
                    <code>--mindmap-branch-0</code> through{" "}
                    <code>--mindmap-branch-9</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>CSS Class Selectors</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            All SVG elements have semantic CSS classes that you can target
            directly. Since SVG presentation attributes have lower specificity
            than CSS rules, your styles will take precedence:
          </p>
          <CodeBlock lang="css">{`/* Change root node background */
.mindmap-node-root .mindmap-node-bg {
  fill: #6c5ce7;
}

/* Make edges thicker */
.mindmap-edge {
  stroke-width: 3;
}

/* Style node underlines */
.mindmap-node-underline {
  stroke-width: 3;
  stroke-linecap: square;
}`}</CodeBlock>

          <p className="text-slate-600 leading-relaxed mt-6 mb-4">
            Key classes:
          </p>
          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>.mindmap-node-root</code>
                  </td>
                  <td>Root node group</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-node-child</code>
                  </td>
                  <td>Child node group</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-node-bg</code>
                  </td>
                  <td>Node background rect</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-node-text</code>
                  </td>
                  <td>Node text element</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-node-underline</code>
                  </td>
                  <td>Child node underline</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-edge</code>
                  </td>
                  <td>Connection line</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-edge-label</code>
                  </td>
                  <td>Edge label text</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-add-btn</code>
                  </td>
                  <td>Add child button</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-fold-btn</code>
                  </td>
                  <td>Fold/unfold toggle</td>
                </tr>
                <tr>
                  <td>
                    <code>.mindmap-tag</code>
                  </td>
                  <td>Tag badge</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>Branch Colors</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Every node and edge has a{" "}
            <code>data-branch-index</code> attribute (0–9) indicating which
            branch of the root it belongs to. Use this for per-branch styling:
          </p>
          <CodeBlock lang="css">{`/* Custom colors for first 3 branches */
.mindmap-edge[data-branch-index="0"] { stroke: #e74c3c; }
.mindmap-edge[data-branch-index="1"] { stroke: #2ecc71; }
.mindmap-edge[data-branch-index="2"] { stroke: #3498db; }

/* Also works on nodes */
.mindmap-node-g[data-branch-index="0"] .mindmap-node-underline {
  stroke: #e74c3c;
}`}</CodeBlock>

          <SubHeading>SVG Export</SubHeading>
          <p className="text-slate-600 leading-relaxed mb-4">
            Exported SVGs embed a <code>&lt;style&gt;</code> block with resolved
            values and include the same semantic classes and{" "}
            <code>data-branch-index</code> attributes. This means:
          </p>
          <ul className="list-disc list-inside text-slate-600 leading-relaxed mb-4 space-y-1">
            <li>Standalone SVG files render correctly without external CSS</li>
            <li>
              When embedded in HTML, the same CSS selectors can override the
              exported styles
            </li>
          </ul>

          {/* ============================================================= */}
          {/* API Reference                                                  */}
          {/* ============================================================= */}
          <SectionHeading id="api-reference">API Reference</SectionHeading>

          <SubHeading>Props</SubHeading>
          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>data</code>
                  </td>
                  <td>
                    <code>MindMapData | MindMapData[]</code>
                  </td>
                  <td>
                    <em>required</em>
                  </td>
                  <td>Tree data (single root or array of roots)</td>
                </tr>
                <tr>
                  <td>
                    <code>markdown</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>-</td>
                  <td>
                    Markdown list source (overrides <code>data</code> when set)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>defaultDirection</code>
                  </td>
                  <td>
                    <code>'left' | 'right' | 'both'</code>
                  </td>
                  <td>
                    <code>'both'</code>
                  </td>
                  <td>Initial layout direction</td>
                </tr>
                <tr>
                  <td>
                    <code>theme</code>
                  </td>
                  <td>
                    <code>'light' | 'dark' | 'auto'</code>
                  </td>
                  <td>
                    <code>'auto'</code>
                  </td>
                  <td>Color theme</td>
                </tr>
                <tr>
                  <td>
                    <code>locale</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>
                    <em>auto</em>
                  </td>
                  <td>
                    UI language (auto-detect, or <code>'zh-CN'</code>,{" "}
                    <code>'en-US'</code>)
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>messages</code>
                  </td>
                  <td>
                    <code>{"Partial<MindMapMessages>"}</code>
                  </td>
                  <td>-</td>
                  <td>Override any UI text string</td>
                </tr>
                <tr>
                  <td>
                    <code>readonly</code>
                  </td>
                  <td>
                    <code>boolean</code>
                  </td>
                  <td>
                    <code>false</code>
                  </td>
                  <td>Display-only mode (no editing/creating)</td>
                </tr>
                <tr>
                  <td>
                    <code>toolbar</code>
                  </td>
                  <td>
                    <code>boolean | ToolbarConfig</code>
                  </td>
                  <td>
                    <code>true</code>
                  </td>
                  <td>Show/hide zoom controls</td>
                </tr>
                <tr>
                  <td>
                    <code>ai</code>
                  </td>
                  <td>
                    <code>MindMapAIConfig</code>
                  </td>
                  <td>-</td>
                  <td>
                    AI generation configuration (see{" "}
                    <a
                      href="#ai-generation"
                      className="text-primary hover:underline"
                    >
                      AI Generation
                    </a>
                    )
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>plugins</code>
                  </td>
                  <td>
                    <code>MindMapPlugin[]</code>
                  </td>
                  <td>
                    <code>allPlugins</code>
                  </td>
                  <td>Enabled extended syntax plugins</td>
                </tr>
                <tr>
                  <td>
                    <code>onDataChange</code>
                  </td>
                  <td>
                    <code>{"(data: MindMapData[]) => void"}</code>
                  </td>
                  <td>-</td>
                  <td>Called when the tree is modified by user interaction</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>ToolbarConfig</SubHeading>
          <CodeBlock lang="typescript">{`interface ToolbarConfig {
  zoom?: boolean; // Show zoom controls (default: true)
}`}</CodeBlock>

          <SubHeading>Ref Methods</SubHeading>
          <div className="docs-table-wrap my-6">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Returns</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>exportToSVG()</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>Export mind map as SVG string</td>
                </tr>
                <tr>
                  <td>
                    <code>exportToPNG()</code>
                  </td>
                  <td>
                    <code>{"Promise<Blob>"}</code>
                  </td>
                  <td>Render high-DPI PNG blob</td>
                </tr>
                <tr>
                  <td>
                    <code>exportToOutline()</code>
                  </td>
                  <td>
                    <code>string</code>
                  </td>
                  <td>Serialize tree to Markdown list</td>
                </tr>
                <tr>
                  <td>
                    <code>getData()</code>
                  </td>
                  <td>
                    <code>MindMapData[]</code>
                  </td>
                  <td>Return current tree data</td>
                </tr>
                <tr>
                  <td>
                    <code>setData(data)</code>
                  </td>
                  <td>
                    <code>void</code>
                  </td>
                  <td>Replace tree data</td>
                </tr>
                <tr>
                  <td>
                    <code>setMarkdown(md)</code>
                  </td>
                  <td>
                    <code>void</code>
                  </td>
                  <td>Parse Markdown and replace tree</td>
                </tr>
                <tr>
                  <td>
                    <code>fitView()</code>
                  </td>
                  <td>
                    <code>void</code>
                  </td>
                  <td>Reset zoom and pan to fit all nodes</td>
                </tr>
                <tr>
                  <td>
                    <code>setDirection(dir)</code>
                  </td>
                  <td>
                    <code>void</code>
                  </td>
                  <td>Change layout direction</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading>Data Structure</SubHeading>
          <CodeBlock lang="typescript">{`interface MindMapData {
  id: string;
  text: string;
  children?: MindMapData[];
  remark?: string;              // Multi-line remark
  taskStatus?: "todo" | "doing" | "done";
  // Plugin extension fields (populated by plugins)
  dottedLine?: boolean;         // Dotted line plugin
  multiLineContent?: string[];  // Multi-line plugin
  tags?: string[];              // Tags plugin
  anchorId?: string;            // Cross-link plugin
  crossLinks?: CrossLink[];     // Cross-link plugin
  collapsed?: boolean;          // Folding plugin
}

interface CrossLink {
  targetAnchorId: string;
  label?: string;
  dotted?: boolean;
}`}</CodeBlock>

          {/* ============================================================= */}
          {/* Keyboard Shortcuts                                             */}
          {/* ============================================================= */}
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

          {/* ============================================================= */}
          {/* Utility Functions                                              */}
          {/* ============================================================= */}
          <SectionHeading id="utility-functions">
            Utility Functions
          </SectionHeading>

          <p className="text-slate-600 leading-relaxed mb-4">
            The following functions are exported for advanced use cases:
          </p>

          <CodeBlock lang="typescript">{`import {
  // Markdown parsing
  parseMarkdownList,            // md string → single MindMapData
  toMarkdownList,               // single MindMapData → md string
  parseMarkdownMultiRoot,       // md string → MindMapData[]
  toMarkdownMultiRoot,          // MindMapData[] → md string
  parseMarkdownWithFrontMatter, // md string → MindMapData[] (with plugins)

  // Inline Markdown
  parseInlineMarkdown,          // text → inline tokens
  stripInlineMarkdown,          // remove Markdown formatting from text

  // Export
  buildExportSVG,               // programmatic SVG generation
  exportToPNG,                  // SVG string → PNG Blob

  // i18n
  resolveMessages,              // build full MindMapMessages object
  detectLocale,                 // detect browser language

  // Plugins
  allPlugins,                   // all 7 built-in plugins
  frontMatterPlugin,
  dottedLinePlugin,
  foldingPlugin,
  multiLinePlugin,
  tagsPlugin,
  crossLinkPlugin,
  latexPlugin,
} from "@xiangfa/mindmap";`}</CodeBlock>
        </main>
      </div>

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

      {/* ================================================================= */}
      {/* Back to top button                                                */}
      {/* ================================================================= */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="docs-back-to-top fixed bottom-6 right-6 z-40 w-10 h-10 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary"
        >
          <span className="material-symbols-outlined text-[20px]">
            keyboard_arrow_up
          </span>
        </button>
      )}
    </div>
  );
}

export default DocsPage;
