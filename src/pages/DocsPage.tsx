import { useState, useEffect, useCallback, useRef } from "react";
import "../Docs.css";
import GettingStarted from "./docs/sections/GettingStarted";
import BasicSyntax from "./docs/sections/BasicSyntax";
import TextFormatting from "./docs/sections/TextFormatting";
import LinksImages from "./docs/sections/LinksImages";
import Remarks from "./docs/sections/Remarks";
import Comments from "./docs/sections/Comments";
import TaskStatus from "./docs/sections/TaskStatus";
import ExtendedSyntax from "./docs/sections/ExtendedSyntax";
import AIGeneration from "./docs/sections/AIGeneration";
import CustomStyling from "./docs/sections/CustomStyling";
import APIReference from "./docs/sections/APIReference";
import KeyboardShortcuts from "./docs/sections/KeyboardShortcuts";
import UtilityFunctions from "./docs/sections/UtilityFunctions";

// ---------------------------------------------------------------------------
// Section metadata
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: "getting-started", title: "Getting Started", icon: "rocket_launch" },
  { id: "basic-syntax", title: "Basic Syntax", icon: "code" },
  { id: "text-formatting", title: "Text Formatting", icon: "format_bold" },
  { id: "links-images", title: "Links & Images", icon: "link" },
  { id: "remarks", title: "Remarks", icon: "comment" },
  { id: "comments", title: "Comments", icon: "visibility_off" },
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
    <div className="docs-page min-h-screen bg-white dark:bg-slate-900">
      {/* ================================================================= */}
      {/* Navbar                                                            */}
      {/* ================================================================= */}
      <nav
        className={`fixed top-0 w-full z-50 glass-effect border-b transition-all duration-300 ${
          navScrolled
            ? "bg-white/95 dark:bg-slate-900/95 border-surface-container-high dark:border-slate-700 shadow-sm"
            : "bg-white/80 dark:bg-slate-900/80 border-surface-container-high/50 dark:border-slate-700/50"
        }`}
      >
        <div className="flex justify-between items-center px-4 md:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex">
            <a
              href="#/"
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 no-underline"
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white">
                <img src="/logo.png" className="scale-150" alt="logo" />
              </span>
              <span className="hidden sm:block">Open MindMap</span>
            </a>
            <div className="flex ml-10 items-center gap-8 text-[13px] font-medium">
              <a
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                href="#/"
              >
                Home
              </a>
              <a className="text-slate-900 dark:text-white" href="#/docs">
                Docs
              </a>
              <a
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
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
            className="docs-drawer absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto docs-sidebar-scroll p-6 pt-20"
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
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
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
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
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
          <GettingStarted />
          <BasicSyntax />
          <TextFormatting />
          <LinksImages />
          <Remarks />
          <Comments />
          <TaskStatus />
          <ExtendedSyntax />
          <AIGeneration />
          <CustomStyling />
          <APIReference />
          <KeyboardShortcuts />
          <UtilityFunctions />
        </main>
      </div>

      {/* ================================================================= */}
      {/* Footer                                                            */}
      {/* ================================================================= */}
      <footer className="w-full py-8 px-4 md:px-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                Open MindMap
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Open Source & Community Driven.
                <br />
                Built for the modern web.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-[11px] mb-6 uppercase tracking-widest text-slate-400">
                Engineering
              </h5>
              <ul className="space-y-4 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
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
              <ul className="space-y-4 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
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
              <ul className="space-y-4 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
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
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
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
          className="docs-back-to-top fixed bottom-6 right-6 z-40 w-10 h-10 bg-slate-900 dark:bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary"
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
