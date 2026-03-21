import { useState, useRef, useCallback } from "react";
import type { MindMapAIConfig } from "../types";
import type { ThemeColors } from "../utils/theme";
import type { MindMapMessages } from "../utils/i18n";
import {
  IconLightning,
  IconPaperclip,
  IconStop,
  IconClose,
  IconLoaderCircle,
} from "./icons";

const DEFAULT_SYSTEM_PROMPT = `#Role
You are a professional Mind Map Generator specializing in hierarchical information architecture. Your objective is to deconstruct complex topics into a robust, visual Markdown outline.

#Logic and Structure
- Primary Branches: Use the MECE (Mutually Exclusive, Collectively Exhaustive) principle to ensure no overlap and complete coverage of the topic.
- Branching Density: Aim for 3-5 primary branches. For narrow topics that do not naturally yield five branches, provide at least 3 branches and prioritize hierarchical depth over breadth.
- Hierarchical Depth: The structure must not exceed a maximum depth of the Root + 3 levels.
- Logical Flow: Organize the sequence of branches and sub-nodes based on priority, moving from foundational concepts to advanced applications.
- Task Status Logic:
  - \`- [x] \` : Assigned to foundational, prerequisite, or essential concepts.
  - \`- [-] \` : Assigned to intermediate, active, or transitional concepts.
  - \`- [ ] \` : Assigned to advanced, future-state, or specialized concepts.

#Formatting Standards
- Root Node: Place the root node on the first line of the response with no prefix (no hyphen, bullet, or number).
- Indentation: Use exactly two spaces per level of hierarchy to define the structure.
- Child Node Prefix: Every child node must start with a hyphen followed by a space ("- ").
- Text Constraints: Each node must contain between 2 and 6 visible words. Markdown formatting characters (e.g., **, ==, \`) do not count toward this 2-6 word limit.
- Remarks: Insert contextual notes or brief explanations immediately after relevant nodes using the "> " prefix.
- Inline Styling: Use Obsidian-compatible Markdown for emphasis: **bold**, *italic*, \`code\`, ~~strikethrough~~, and ==highlighting==.

#Example Output
Project Management
- [x] **Foundational Concepts**
  - Project Life Cycle
    > Initiation through closing phases
  - Stakeholder Identification
- [-] *Execution Frameworks*
  - ==Agile Methodologies==
  - Waterfall Sequential Process
- [ ] Advanced Optimization
  - Resource Load Balancing
    > Optimizing team allocation
  - Portfolio Risk Mitigation

#Constraints
- Provide the raw Markdown output only.
- Do not include any introductory text, conversational fillers, or explanations.
- Do not include any concluding remarks or summaries.
- FINAL NEGATIVE CONSTRAINT: Do not wrap the output in markdown code fences. Provide the response as raw, plain text.`;

interface AttachedFile {
  name: string;
  type: string;
  base64: string;
}

export interface MindMapAIInputProps {
  config: MindMapAIConfig;
  theme: ThemeColors;
  messages: MindMapMessages;
  currentMarkdown?: string;
  onMarkdownStream: (markdown: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

function buildAcceptString(
  attachments: MindMapAIConfig["attachments"],
): string {
  if (!attachments || attachments.length === 0) return "";
  const parts: string[] = [];
  for (const type of attachments) {
    if (type === "text")
      parts.push("text/*,.json,.js,.ts,.xml,.yaml,.yml,.sql,.sh,.md");
    else if (type === "image") parts.push("image/*");
    else if (type === "pdf") parts.push("application/pdf");
  }
  return parts.join(",");
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function buildUserContent(
  input: string,
  files: AttachedFile[],
): string | ContentPart[] {
  if (files.length === 0) return input;

  const parts: ContentPart[] = [{ type: "text", text: input }];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      parts.push({ type: "image_url", image_url: { url: file.base64 } });
    } else {
      // text/* or pdf: decode base64 and append as text
      const textContent = atob(file.base64.split(",")[1] || "");
      parts.push({
        type: "text",
        text: `[File: ${file.name}]\n${textContent}`,
      });
    }
  }

  return parts;
}

function stripThinkBlocks(text: string): string {
  // Remove completed <think>...</think> blocks
  let result = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  // Remove unclosed <think>... at the end (streaming in progress)
  result = result.replace(/<think>[\s\S]*$/, "");
  return result;
}

async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "data: [DONE]") return;
      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}

export function MindMapAIInput({
  config,
  theme,
  messages,
  currentMarkdown,
  onMarkdownStream,
  onComplete,
  onError,
}: MindMapAIInputProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef(0);

  const hasAttachments = config.attachments && config.attachments.length > 0;

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed && attachedFiles.length === 0) return;
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const userContent = buildUserContent(trimmed, attachedFiles);

      const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      const systemContent = currentMarkdown?.trim()
        ? `${systemPrompt}\n\n#Current Mind Map\nThe user already has the following mind map. They may ask you to modify, expand, or optimize it. If the user's request is about the existing content, use it as the base and output the updated version. If the request is about a new topic, generate a fresh mind map.\n\n\`\`\`\n${currentMarkdown.trim()}\n\`\`\``
        : systemPrompt;

      const body = JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        stream: true,
      });

      const res = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      let accumulated = "";
      let pendingUpdate = false;

      for await (const chunk of parseSSEStream(reader)) {
        accumulated += chunk;

        if (!pendingUpdate) {
          pendingUpdate = true;
          const snapshot = stripThinkBlocks(accumulated);
          rafRef.current = requestAnimationFrame(() => {
            onMarkdownStream(snapshot);
            pendingUpdate = false;
          });
        }
      }

      // Final update with complete content
      cancelAnimationFrame(rafRef.current);
      if (accumulated) {
        onMarkdownStream(stripThinkBlocks(accumulated));
      }
      setInput("");
      setAttachedFiles([]);
      onComplete();
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User cancelled — keep partial result
        onComplete();
      } else {
        const msg = (err as Error).message || messages.aiError;
        setError(msg);
        onError(msg);
        setTimeout(() => setError(null), 4000);
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [
    input,
    attachedFiles,
    isGenerating,
    config,
    currentMarkdown,
    messages,
    onMarkdownStream,
    onComplete,
    onError,
  ]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              base64: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });

      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [],
  );

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div
      className="mindmap-ai-input"
      style={{
        background: theme.controls.bgColor,
        color: theme.controls.textColor,
        borderColor: theme.contextMenu.borderColor,
      }}
    >
      {/* File previews */}
      {attachedFiles.length > 0 && (
        <div className="mindmap-ai-file-previews">
          {attachedFiles.map((file, i) => (
            <span
              key={i}
              className="mindmap-ai-file-chip"
              style={{ background: theme.controls.hoverBg }}
            >
              <span className="mindmap-ai-file-name">{file.name}</span>
              <button
                className="mindmap-ai-file-remove"
                onClick={() => removeFile(i)}
                style={{ color: theme.controls.textColor }}
              >
                <IconClose size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mindmap-ai-input-row">
        {/* Attachment button */}
        {hasAttachments && (
          <>
            <button
              className="mindmap-ai-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              title={messages.aiPlaceholder}
              style={{ color: theme.controls.textColor }}
            >
              <IconPaperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={buildAcceptString(config.attachments)}
              multiple
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </>
        )}

        {/* Text input */}
        <input
          className="mindmap-ai-input-field"
          type="text"
          value={isGenerating ? "" : input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isGenerating ? messages.aiGenerating : messages.aiPlaceholder
          }
          disabled={isGenerating}
          style={{ color: theme.controls.textColor }}
        />

        {/* Send / Stop button */}
        <button
          className={`mindmap-ai-send-btn${isGenerating ? " mindmap-ai-send-btn--loading" : ""}`}
          onClick={isGenerating ? handleStop : handleSubmit}
          disabled={
            !isGenerating && !input.trim() && attachedFiles.length === 0
          }
          style={{
            background: isGenerating
              ? "transparent"
              : !input.trim() && attachedFiles.length === 0
                ? theme.controls.hoverBg
                : theme.root.bgColor,
            color:
              isGenerating || (!input.trim() && attachedFiles.length === 0)
                ? theme.controls.textColor
                : theme.root.textColor,
          }}
        >
          {isGenerating ? (
            <>
              <span className="mindmap-ai-spinner">
                <IconLoaderCircle size={20} />
              </span>
              <span className="mindmap-ai-stop-icon">
                <IconStop size={16} />
              </span>
            </>
          ) : (
            <IconLightning size={16} />
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mindmap-ai-error" style={{ color: "#ef4444" }}>
          {error}
        </div>
      )}
    </div>
  );
}
