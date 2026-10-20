export const PROJECT_VERSION = 1;

export function createProject(name = "Untitled app") {
  return {
    format: "tileforge",
    version: PROJECT_VERSION,
    name,
    canvas: { width: 960, height: 600, background: "#ffffff" },
    components: [],
    blocks: []
  };
}

export function createComponent(kind, overrides = {}) {
  const defaults = {
    text: { name: "Text", text: "Hello, world!", width: 220, height: 44, background: "#ffffff", color: "#222222", fontSize: 24 },
    button: { name: "Button", text: "Click me", width: 150, height: 44, background: "#0078d7", color: "#ffffff", fontSize: 16 },
    image: { name: "Image", text: "", width: 220, height: 140, background: "#eeeeee", color: "#333333", fontSize: 16, imageUrl: "" },
    tile: { name: "Metro tile", text: "App tile", width: 180, height: 150, background: "#0078d7", color: "#ffffff", fontSize: 20 }
  };
  const base = defaults[kind] || defaults.text;
  return {
    id: globalThis.crypto?.randomUUID?.() || `cmp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    kind,
    x: 40 + Math.round(Math.random() * 60),
    y: 40 + Math.round(Math.random() * 60),
    ...structuredClone(base),
    ...overrides
  };
}

export function normalizeProject(raw) {
  if (!raw || raw.format !== "tileforge" || !Array.isArray(raw.components)) {
    throw new Error("This is not a valid TileForge project file.");
  }
  const project = createProject(typeof raw.name === "string" ? raw.name : "Imported app");
  project.version = PROJECT_VERSION;
  project.canvas = { ...project.canvas, ...(raw.canvas || {}) };
  project.components = raw.components.map(item => ({
    ...createComponent(["text", "button", "image", "tile"].includes(item.kind) ? item.kind : "text"),
    ...item,
    id: String(item.id || (globalThis.crypto?.randomUUID?.() || `cmp-${Date.now()}`))
  }));
  project.blocks = Array.isArray(raw.blocks) ? raw.blocks.map(block => ({ ...block })) : [];
  return project;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function saveProjectFile(project) {
  const data = JSON.stringify(project, null, 2);
  downloadBlob(new Blob([data], { type: "application/json" }), `${safeFilename(project.name)}.tileforge`);
}

function safeFilename(value) {
  return String(value || "tileforge-project").trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "tileforge-project";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

export function exportHtml(project) {
  const elements = project.components.map(component => {
    const common = `position:absolute;left:${number(component.x)}px;top:${number(component.y)}px;width:${number(component.width)}px;height:${number(component.height)}px;color:${escapeHtml(component.color)};background:${escapeHtml(component.background)};font-size:${number(component.fontSize)}px;box-sizing:border-box;overflow:hidden;overflow-wrap:anywhere;`;
    if (component.kind === "image") {
      const src = escapeHtml(component.imageUrl || "");
      return `<img alt="${escapeHtml(component.name)}" src="${src}" style="${common}object-fit:cover;">`;
    }
    const tag = component.kind === "button" ? "button" : "div";
    const extra = component.kind === "button" ? "border:0;cursor:pointer;" : component.kind === "tile" ? "padding:12px;display:flex;align-items:flex-end;font-weight:600;" : "padding:4px;";
    const text = escapeHtml(component.text);
    const click = component.kind === "button" ? ' onclick="alert(this.textContent)"' : "";
    return `<${tag} style="${common}${extra}"${click}>${text}</${tag}>`;
  }).join("\n    ");
  const title = escapeHtml(project.name || "TileForge app");
  const background = escapeHtml(project.canvas?.background || "#ffffff");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;background:#eee;font-family:"Segoe UI",Arial,sans-serif}.app{position:relative;width:${number(project.canvas.width)}px;height:${number(project.canvas.height)}px;max-width:100%;margin:24px auto;background:${background};box-shadow:0 2px 14px #0002;overflow:hidden}@media(max-width:960px){.app{transform-origin:top left}}</style></head>
<body><main class="app">
    ${elements}
</main></body></html>`;
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${safeFilename(project.name)}.html`);
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(5000, parsed)) : 0;
}
