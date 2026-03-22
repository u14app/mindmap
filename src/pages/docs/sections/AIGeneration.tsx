import { CodeBlock } from "../components/CodeBlock";
import { SectionHeading, SubHeading } from "../components/SectionHeading";

export default function AIGeneration() {
  return (
    <>
          <SectionHeading id="ai-generation">AI Generation</SectionHeading>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
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
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
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
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
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

          <p className="text-sm text-slate-500 dark:text-slate-500 mt-3 mb-6">
            <strong>Security Note:</strong> The API key is sent from the
            browser. For production deployments, use a proxy endpoint to keep
            your key server-side.
          </p>
    </>
  );
}
