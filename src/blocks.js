const DEFINITIONS = {
  onClick: { category: "event", label: "When selected component is clicked", value: "" },
  setText: { category: "action", label: "Set component text to", value: "Hello from TileForge!" },
  showMessage: { category: "action", label: "Show message", value: "It works!" },
  moveRight: { category: "motion", label: "Move component right by", value: "40" }
};

const $ = selector => document.querySelector(selector);

export class BlocksView {
  constructor({ workspace, onChange }) {
    this.workspace = workspace;
    this.onChange = onChange;
    this.project = null;
    $("#clear-blocks").addEventListener("click", () => {
      if (!this.project) return;
      this.project.blocks = [];
      this.render();
      this.onChange("Cleared program");
    });
    $("#run-blocks").addEventListener("click", () => this.run());
    this.workspace.addEventListener("click", event => {
      const button = event.target.closest("[data-remove-block]");
      if (!button || !this.project) return;
      this.project.blocks = this.project.blocks.filter(block => block.id !== button.dataset.removeBlock);
      this.render();
      this.onChange("Removed block");
    });
    this.workspace.addEventListener("change", event => {
      const input = event.target.closest("[data-block-value]");
      if (!input || !this.project) return;
      const block = this.project.blocks.find(item => item.id === input.dataset.blockValue);
      if (!block) return;
      block.value = input.value;
      this.onChange("Updated block");
    });
  }

  setProject(project) {
    this.project = project;
    this.render();
  }

  add(type) {
    if (!this.project || !DEFINITIONS[type]) return;
    const definition = DEFINITIONS[type];
    this.project.blocks.push({
      id: globalThis.crypto?.randomUUID?.() || `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      value: definition.value
    });
    this.render();
    this.onChange("Added block");
  }

  render() {
    if (!this.project) return;
    this.workspace.replaceChildren();
    const blocks = this.project.blocks || [];
    $("#block-count").textContent = String(blocks.length);
    if (!blocks.length) {
      const empty = document.createElement("div");
      empty.className = "blocks-empty";
      empty.id = "blocks-empty";
      empty.textContent = "Add blocks from the toolbox to build your first program.";
      this.workspace.append(empty);
    }
    for (const block of blocks) {
      const definition = DEFINITIONS[block.type];
      if (!definition) continue;
      const row = document.createElement("div");
      row.className = `program-block ${definition.category}`;
      const label = document.createElement("span");
      label.textContent = definition.label;
      row.append(label);
      if (block.type !== "onClick") {
        const input = document.createElement("input");
        input.value = block.value ?? "";
        input.dataset.blockValue = block.id;
        input.setAttribute("aria-label", `${definition.label} value`);
        if (block.type === "moveRight") {
          input.type = "number";
          input.min = "0";
          input.max = "1000";
        }
        row.append(input);
      }
      const remove = document.createElement("button");
      remove.className = "remove-block";
      remove.type = "button";
      remove.textContent = "×";
      remove.title = "Remove block";
      remove.dataset.removeBlock = block.id;
      row.append(remove);
      this.workspace.append(row);
    }
  }

  async run({ eventOnly = false, component = null } = {}) {
    if (!this.project) return;
    const output = $("#run-output");
    const blocks = this.project.blocks || [];
    const hasEvent = blocks.some(block => block.type === "onClick");
    if (eventOnly && !hasEvent) return;
    if (eventOnly && !component) return;
    if (!eventOnly && !component) {
      output.textContent = "Select a component in Design first, then run the program.";
      return;
    }
    const target = component || null;
    const messages = [];
    for (const block of blocks) {
      if (block.type === "onClick") continue;
      if (!target) continue;
      switch (block.type) {
        case "setText":
          target.text = String(block.value ?? "");
          messages.push("Text updated");
          break;
        case "showMessage":
          messages.push(String(block.value || "Hello!"));
          break;
        case "moveRight": {
          const amount = Math.max(0, Math.min(1000, Number(block.value) || 0));
          target.x = Math.min(this.project.canvas.width - target.width, target.x + amount);
          messages.push(`Moved right by ${amount}px`);
          break;
        }
      }
    }
    output.textContent = messages.length ? `Program finished: ${messages.join(" · ")}` : "No action blocks to run.";
    if (messages.length) this.onChange("Ran program");
  }

  hasClickEvent() {
    return (this.project?.blocks || []).some(block => block.type === "onClick");
  }
}
