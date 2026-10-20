const $ = (selector, root = document) => root.querySelector(selector);

export class EditorView {
  constructor({ canvas, onSelect, onChange, onDelete, onDuplicate }) {
    this.canvas = canvas;
    this.onSelect = onSelect;
    this.onChange = onChange;
    this.onDelete = onDelete;
    this.onDuplicate = onDuplicate;
    this.project = null;
    this.selectedId = null;
    this.zoom = 1;
    this.drag = null;
    this.bindInspector();
    this.canvas.addEventListener("pointerdown", event => this.startDrag(event));
    this.canvas.addEventListener("click", event => {
      if (event.target === this.canvas || event.target.id === "canvas-empty") this.onSelect(null);
    });
  }

  setProject(project) {
    this.project = project;
    this.render();
  }

  setSelected(id) {
    this.selectedId = id;
    this.render();
    this.renderInspector();
  }

  setZoom(value) {
    this.zoom = Math.max(0.5, Math.min(1.5, value));
    this.canvas.style.transform = `scale(${this.zoom})`;
    this.canvas.style.marginBottom = `${600 * (this.zoom - 1)}px`;
  }

  get selected() {
    return this.project?.components.find(component => component.id === this.selectedId) || null;
  }

  render() {
    if (!this.project) return;
    this.canvas.style.width = `${this.project.canvas.width}px`;
    this.canvas.style.height = `${this.project.canvas.height}px`;
    this.canvas.style.background = this.project.canvas.background || "#fff";
    this.canvas.replaceChildren();
    if (!this.project.components.length) {
      const empty = document.createElement("div");
      empty.className = "canvas-empty";
      empty.id = "canvas-empty";
      empty.innerHTML = '<div class="empty-symbol">＋</div><strong>Your app starts here</strong><span>Add a component from the toolbox.</span>';
      this.canvas.append(empty);
    }
    for (const component of this.project.components) {
      const node = component.kind === "image" ? document.createElement("img") : document.createElement("div");
      node.className = "component" + (component.id === this.selectedId ? " selected" : "");
      node.dataset.id = component.id;
      node.dataset.kind = component.kind;
      node.tabIndex = 0;
      node.setAttribute("aria-label", component.name || component.kind);
      Object.assign(node.style, {
        left: `${component.x}px`, top: `${component.y}px`,
        width: `${component.width}px`, height: `${component.height}px`,
        background: component.background || "#fff", color: component.color || "#222",
        fontSize: `${component.fontSize || 16}px`
      });
      if (component.kind === "image") {
        node.alt = component.name || "Image";
        node.src = component.imageUrl || "";
        if (!component.imageUrl) {
          node.alt = "Image placeholder — set an image URL in Properties";
          node.style.objectFit = "contain";
        } else node.style.objectFit = "cover";
      } else {
        node.textContent = component.text || "";
      }
      if (component.kind === "button") {
        node.style.border = "0";
        node.style.cursor = "move";
      }
      if (component.kind === "tile") {
        node.style.padding = "13px";
        node.style.alignItems = "flex-end";
        node.style.justifyContent = "flex-start";
        node.style.fontWeight = "600";
      }
      this.canvas.append(node);
    }
    this.renderInspector();
  }

  startDrag(event) {
    const node = event.target.closest(".component");
    if (!node || !this.canvas.contains(node)) return;
    const component = this.project.components.find(item => item.id === node.dataset.id);
    if (!component) return;
    event.preventDefault();
    this.onSelect(component.id);
    this.drag = { id: component.id, startX: event.clientX, startY: event.clientY, x: component.x, y: component.y };
    node.setPointerCapture?.(event.pointerId);
    const move = moveEvent => {
      if (!this.drag) return;
      const dx = (moveEvent.clientX - this.drag.startX) / this.zoom;
      const dy = (moveEvent.clientY - this.drag.startY) / this.zoom;
      component.x = Math.max(0, Math.round(this.drag.x + dx));
      component.y = Math.max(0, Math.round(this.drag.y + dy));
      node.style.left = `${component.x}px`;
      node.style.top = `${component.y}px`;
      this.updatePositionFields(component);
    };
    const end = () => {
      if (!this.drag) return;
      this.drag = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      this.onChange("Moved component");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end, { once: true });
  }

  bindInspector() {
    const fields = {
      "prop-name": ["name", "string"], "prop-text": ["text", "string"],
      "prop-x": ["x", "number"], "prop-y": ["y", "number"],
      "prop-width": ["width", "number"], "prop-height": ["height", "number"],
      "prop-bg-text": ["background", "color"], "prop-color-text": ["color", "color"],
      "prop-font": ["fontSize", "number"], "prop-image": ["imageUrl", "string"]
    };
    for (const [id, [key, type]] of Object.entries(fields)) {
      const input = document.getElementById(id);
      const eventName = input.tagName === "TEXTAREA" ? "input" : "change";
      input.addEventListener(eventName, () => {
        const component = this.selected;
        if (!component) return;
        let value = input.value;
        if (type === "number") value = Number(value);
        if (["x", "y"].includes(key)) value = Math.max(0, value || 0);
        if (["width", "height"].includes(key)) value = Math.max(24, value || 24);
        component[key] = value;
        if (key === "background") $("#prop-bg").value = value;
        if (key === "color") $("#prop-color").value = value;
        if (key === "fontSize") $("#prop-font-value").textContent = `${value} px`;
        this.render();
        this.onChange("Edited properties");
      });
    }
    $("#prop-bg").addEventListener("input", event => { $("#prop-bg-text").value = event.target.value; $("#prop-bg-text").dispatchEvent(new Event("change")); });
    $("#prop-color").addEventListener("input", event => { $("#prop-color-text").value = event.target.value; $("#prop-color-text").dispatchEvent(new Event("change")); });
    $("#delete-component").addEventListener("click", () => { if (this.selected) this.onDelete(this.selected.id); });
    $("#duplicate-component").addEventListener("click", () => { if (this.selected) this.onDuplicate(this.selected); });
  }

  updatePositionFields(component) {
    $("#prop-x").value = component.x;
    $("#prop-y").value = component.y;
  }

  renderInspector() {
    const component = this.selected;
    $("#inspector-empty").classList.toggle("hidden", Boolean(component));
    $("#inspector-form").classList.toggle("hidden", !component);
    $("#inspector-kind").textContent = component ? component.kind.toUpperCase() : "—";
    $("#selection-status").textContent = component ? `Selected: ${component.name || component.kind}` : "Nothing selected";
    if (!component) return;
    $("#prop-name").value = component.name || "";
    $("#prop-text").value = component.text || "";
    $("#prop-x").value = component.x;
    $("#prop-y").value = component.y;
    $("#prop-width").value = component.width;
    $("#prop-height").value = component.height;
    $("#prop-bg").value = isColor(component.background) ? component.background : "#ffffff";
    $("#prop-bg-text").value = component.background || "#ffffff";
    $("#prop-color").value = isColor(component.color) ? component.color : "#222222";
    $("#prop-color-text").value = component.color || "#222222";
    $("#prop-font").value = component.fontSize || 16;
    $("#prop-font-value").textContent = `${component.fontSize || 16} px`;
    $("#prop-image").value = component.imageUrl || "";
    $("#prop-text").disabled = component.kind === "image";
    $("#prop-image").disabled = component.kind !== "image";
  }
}

function isColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || "");
}
