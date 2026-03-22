import { type ReactNode } from "react";

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

export function highlightCss(code: string): ReactNode {
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
      const valRe =
        /(#[0-9a-fA-F]{3,8}\b)|(--[\w-]+)|(\d+\.?\d*(?:px|em|rem|%|vh|vw|s|ms|deg|fr|ch)?\b)|([\w-]+)/g;
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

export function highlightTsx(code: string): ReactNode {
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

export function highlightBash(code: string): ReactNode {
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
