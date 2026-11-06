import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const sourceCore = resolve(root, "src/components/MindMap/core");
const dist = resolve(root, "dist");
const failures = [];
const checks = [];

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

function check(name, passed) {
  checks.push({ name, passed });
}

const coreFiles = filesUnder(sourceCore).filter(
  (file) => /\.(ts|tsx)$/.test(file) && !file.includes("__tests__"),
);
for (const file of coreFiles) {
  const code = readFileSync(file, "utf8");
  const forbidden = [
    /["']react(?:\/[^"']*)?["']/,
    /["']react-dom(?:\/[^"']*)?["']/,
    /\bwindow\b/,
    /\bdocument\.(?:create|query|getElement)/,
    /\bHTMLElement\b/,
    /\bSVGElement\b/,
    /\.css["']/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(code)) failures.push(`core boundary: ${relative(root, file)} matches ${pattern}`);
  }
}
check("headless core source boundary", !failures.some((value) => value.startsWith("core boundary")));

const requiredArtifacts = [
  "index.js",
  "index.cjs",
  "core.js",
  "core.cjs",
  "static.js",
  "static.cjs",
  "viewer.js",
  "viewer.cjs",
  "editor.js",
  "editor.cjs",
  "features/history.js",
  "features/history.cjs",
  "features/search.js",
  "features/search.cjs",
  "features/import.js",
  "features/import.cjs",
  "features/export.js",
  "features/export.cjs",
  "features/markdown-editor.js",
  "features/markdown-editor.cjs",
  "features/ai.js",
  "features/ai.cjs",
  "extensions/index.js",
  "extensions/index.cjs",
  "extensions/cross-link.js",
  "extensions/cross-link.cjs",
  "extensions/tags.js",
  "extensions/tags.cjs",
  "extensions/folding.js",
  "extensions/folding.cjs",
  "extensions/frontmatter.js",
  "extensions/frontmatter.cjs",
  "extensions/latex.js",
  "extensions/latex.cjs",
  "extensions/multiline.js",
  "extensions/multiline.cjs",
  "extensions/dotted-line.js",
  "extensions/dotted-line.cjs",
  "types/index.d.ts",
  "types/entries/core.d.ts",
  "types/entries/static.d.ts",
  "types/entries/viewer.d.ts",
  "types/entries/editor.d.ts",
  "types/entries/features/history.d.ts",
  "types/entries/features/search.d.ts",
  "types/entries/features/import.d.ts",
  "types/entries/features/export.d.ts",
  "types/entries/features/markdown-editor.d.ts",
  "types/entries/features/ai.d.ts",
  "types/entries/extensions/index.d.ts",
  "types/entries/extensions/cross-link.d.ts",
  "types/entries/extensions/tags.d.ts",
  "types/entries/extensions/folding.d.ts",
  "types/entries/extensions/frontmatter.d.ts",
  "types/entries/extensions/latex.d.ts",
  "types/entries/extensions/multiline.d.ts",
  "types/entries/extensions/dotted-line.d.ts",
  "styles/tokens.css",
  "styles/static.css",
  "styles/viewer.css",
  "styles/editor.css",
  "styles/features/history.css",
  "styles/features/search.css",
  "styles/features/import.css",
  "styles/features/export.css",
  "styles/features/markdown-editor.css",
  "styles/features/ai.css",
  "bundle-manifest.json",
];
for (const path of requiredArtifacts) {
  if (!existsSync(resolve(dist, path))) failures.push(`missing dist artifact: ${path}`);
}
check("public artifact matrix", !failures.some((value) => value.startsWith("missing dist")));

const manifestPath = resolve(dist, "bundle-manifest.json");
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const viewerFiles = manifest.entries?.viewer?.files ?? [];
  const editorFiles = manifest.entries?.editor?.files ?? [];
  const editorLazyFiles = manifest.entries?.editor?.lazyFiles;
  const editorLazyImports = manifest.entries?.editor?.lazyImports;
  const forbiddenViewerNames = ["history", "search", "import", "export", "markdown-editor", "ai", "MindMapEditor"];
  for (const name of forbiddenViewerNames) {
    if (viewerFiles.some((file) => file.toLowerCase().includes(name.toLowerCase()))) {
      failures.push(`viewer graph contains optional feature: ${name}`);
    }
  }
  const forbiddenEditorNames = ["history", "search", "import", "export", "markdown-editor", "ai"];
  for (const name of forbiddenEditorNames) {
    if (editorFiles.some((file) => file.toLowerCase().includes(name.toLowerCase()))) {
      failures.push(`editor graph contains opt-in feature: ${name}`);
    }
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const featurePattern = new RegExp(`features[/\\\\]${escapedName}|${escapedName}Feature`, "i");
    if ([...editorFiles, ...viewerFiles].some((file) => existsSync(resolve(dist, file)) && featurePattern.test(readFileSync(resolve(dist, file), "utf8")))) {
      failures.push(`runtime graph imports opt-in feature: ${name}`);
    }
  }
  check("viewer excludes optional features", !failures.some((value) => value.startsWith("viewer graph")));
  check("editor keeps optional features opt-in", !failures.some((value) => value.startsWith("editor graph")));
  check("runtime source graph excludes optional features", !failures.some((value) => value.startsWith("runtime graph")));
  if (!Array.isArray(editorLazyFiles) || !Array.isArray(editorLazyImports)) failures.push("build manifest does not record editor lazy reachability");
  check("lazy runtime reachability is recorded", !failures.some((value) => value.startsWith("build manifest does not record")));
} else {
  failures.push("missing build manifest: dist/bundle-manifest.json");
  check("viewer excludes optional features", false);
  check("editor keeps optional features opt-in", false);
  check("runtime source graph excludes optional features", false);
  check("lazy runtime reachability is recorded", false);
}

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const allowedExport = (subpath) =>
  subpath === "." ||
  ["./core", "./static", "./viewer", "./editor", "./extensions"].includes(subpath) ||
  subpath.startsWith("./features/") ||
  subpath.startsWith("./extensions/") ||
  subpath.startsWith("./styles/");
const forbiddenExportNames = ["./legacy-viewer", "./cognitive", "./cognitive/react", "./styles/cognitive.css", "./style.css", "./package.json"];
for (const subpath of Object.keys(packageJson.exports ?? {})) {
  if (!allowedExport(subpath)) failures.push(`unsupported package export: ${subpath}`);
  if (forbiddenExportNames.includes(subpath)) failures.push(`retired package export: ${subpath}`);
}
const exportTargets = [];
for (const [subpath, config] of Object.entries(packageJson.exports ?? {})) {
  if (typeof config === "string") exportTargets.push([subpath, "default", config]);
  else if (config && typeof config === "object") {
    for (const [condition, target] of Object.entries(config)) {
      if (typeof target !== "string") failures.push(`package export condition is not a path: ${subpath}.${condition}`);
      else exportTargets.push([subpath, condition, target]);
    }
  } else failures.push(`package export has no target: ${subpath}`);
}
for (const [subpath, condition, target] of exportTargets) {
  if (!existsSync(resolve(root, target))) failures.push(`package export missing: ${subpath}.${condition} -> ${target}`);
}
check("package export allowlist", !failures.some((value) => value.startsWith("unsupported package export") || value.startsWith("retired package export")));
check("package exports resolve", !failures.some((value) => value.startsWith("package export")));

if (packageJson.version !== "1.0.0") failures.push(`package version is ${packageJson.version}; expected 1.0.0`);
check("package version", packageJson.version === "1.0.0");

const legacyReferences = [];
for (const file of filesUnder(resolve(root, "src"))) {
  if (!/\.(ts|tsx|js|jsx|mjs)$/.test(file)) continue;
  const code = readFileSync(file, "utf8");
  if (/cognitive-runtime|legacy-viewer/.test(code)) legacyReferences.push(relative(root, file));
}
for (const file of legacyReferences) failures.push(`retired runtime reference: ${file}`);
check("retired runtime references", legacyReferences.length === 0);

const retiredSourcePaths = [
  "src/components/MindMap/MindMap.tsx",
  "src/components/MindMap/MindMapViewer.tsx",
  "src/components/MindMap/MindMap.css",
  "src/components/MindMap/components",
  "src/components/MindMap/hooks",
  "src/components/MindMap/plugins",
  "src/components/MindMap/utils",
  "src/components/MindMap/types.ts",
  "src/components/MindMap/viewer.ts",
  "index.html",
  "src/App.tsx",
  "src/App.css",
  "src/Docs.css",
  "src/index.css",
  "src/main.tsx",
  "src/components/MindMapPlayground.tsx",
  "src/pages",
];
for (const path of retiredSourcePaths) {
  if (existsSync(resolve(root, path))) failures.push(`retired source path remains: ${path}`);
}
check(
  "retired source roots and demo files removed",
  !failures.some((value) => value.startsWith("retired source path remains:")),
);

const report = {
  generatedAt: new Date().toISOString(),
  passed: failures.length === 0,
  checks,
  failures,
};
const artifacts = resolve(root, "artifacts");
mkdirSync(artifacts, { recursive: true });
writeFileSync(resolve(artifacts, "boundary-report.json"), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
