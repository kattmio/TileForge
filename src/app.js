import { createProject, createComponent, normalizeProject, saveProjectFile, exportHtml } from "./project.js";
import { EditorView } from "./editor.js";
import { BlocksView } from "./blocks.js";

const $ = selector => document.querySelector(selector);
let project = createProject();
let selectedId = null;
let toastTimer;

const editor = new EditorView({
  canvas: $("#design-canvas"),
  onSelect: selectComponent,
  onChange: markChanged,
  onDelete: deleteComponent,
  onDuplicate: duplicateComponent
});
const blocks = new BlocksView({
  workspace: $("#blocks-workspace"),
  onChange: markChanged
});

function selectComponent(id) {
  selectedId = id;
  editor.setSelected(id);
}

function markChanged(message = "Changes saved in memory") {
  $("#save-status").textContent = message;
  updateCounts();
}

function updateCounts() {
  $("#component-count").textContent = `${project.components.length} component${project.components.length === 1 ? "" : "s"}`;
  $("#block-count").textContent = String(project.blocks.length);
}

function refreshAll() {
  editor.setProject(project);
  editor.setSelected(selectedId);
  blocks.setProject(project);
  $("#project-name").value = project.name;
  updateCounts();
}

function addComponent(kind) {
  const component = createComponent(kind, {
    x: 35 + (project.components.length % 5) * 28,
    y: 35 + (project.components.length % 5) * 28
  });
  project.components.push(component);
  selectComponent(component.id);
  editor.render();
  markChanged(`Added ${kind}`);
}

function deleteComponent(id) {
  project.components = project.components.filter(component => component.id !== id);
  selectedId = null;
  refreshAll();
  markChanged("Deleted component");
}

function duplicateComponent(component) {
  const copy = {
    ...component,
    id: globalThis.crypto?.randomUUID?.() || `cmp-${Date.now()}`,
    name: `${component.name || component.kind} copy`,
    x: component.x + 24,
    y: component.y + 24
  };
  project.components.push(copy);
  selectedId = copy.id;
  refreshAll();
  markChanged("Duplicated component");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

document.querySelectorAll("[data-add]").forEach(button => {
  button.addEventListener("click", () => addComponent(button.dataset.add));
});
document.querySelectorAll("[data-add-block]").forEach(button => {
  button.addEventListener("click", () => {
    blocks.add(button.dataset.addBlock);
    showToast("Block added to workspace");
  });
});

$("#project-name").addEventListener("change", event => {
  project.name = event.target.value.trim() || "Untitled app";
  markChanged("Project renamed");
});
$("#new-project").addEventListener("click", () => {
  if (project.components.length || project.blocks.length) {
    if (!window.confirm("Create a new project? Unsaved changes will be lost unless you saved a copy.")) return;
  }
  project = createProject();
  selectedId = null;
  refreshAll();
  markChanged("New project");
});
$("#save-project").addEventListener("click", () => {
  project.name = $("#project-name").value.trim() || "Untitled app";
  saveProjectFile(project);
  markChanged("Project file downloaded");
  showToast("Project saved as a .tileforge file");
});
$("#open-project").addEventListener("click", () => $("#project-file").click());
$("#project-file").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    project = normalizeProject(JSON.parse(await file.text()));
    selectedId = null;
    refreshAll();
    markChanged(`Opened ${file.name}`);
    showToast("Project opened");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Could not open project");
  } finally {
    event.target.value = "";
  }
});
$("#export-html").addEventListener("click", () => {
  project.name = $("#project-name").value.trim() || "Untitled app";
  exportHtml(project);
  markChanged("HTML preview exported");
  showToast("Exported standalone HTML preview");
});

document.querySelectorAll("[data-view]").forEach(tab => {
  tab.addEventListener("click", () => {
    const view = tab.dataset.view;
    document.querySelectorAll("[data-view]").forEach(item => item.classList.toggle("active", item === tab));
    $("#design-view").classList.toggle("hidden", view !== "design");
    $("#blocks-view").classList.toggle("hidden", view !== "blocks");
  });
});
$("#zoom-in").addEventListener("click", () => setZoom(editor.zoom + 0.1));
$("#zoom-out").addEventListener("click", () => setZoom(editor.zoom - 0.1));

function setZoom(value) {
  editor.setZoom(value);
  $("#zoom-label").textContent = `${Math.round(editor.zoom * 100)}%`;
}

$("#run-blocks").addEventListener("click", async () => {
  const component = project.components.find(item => item.id === selectedId);
  await blocks.run({ component });
  editor.render();
});
$("#design-canvas").addEventListener("click", async event => {
  const node = event.target.closest(".component");
  if (!node) return;
  const component = project.components.find(item => item.id === node.dataset.id);
  if (!component) return;
  selectedId = component.id;
  if (component.kind === "button" && blocks.hasClickEvent()) {
    await blocks.run({ eventOnly: true, component });
    editor.render();
    showToast("Click program executed");
  }
});

refreshAll();
setZoom(1);
