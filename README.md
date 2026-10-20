# TileForge

**An open-source, Metro-inspired visual app builder prototype.**

TileForge is a browser-based visual editor with a free-positioning canvas, a properties inspector, and a simple block-programming workspace. It uses native browser APIs and ES modules—no npm dependencies or build step are required.

> **Status:** working early prototype. It exports standalone HTML previews and `.tileforge` project files. It does **not** yet compile native Windows x64 `.appx` packages.

## Run locally

Serve the repository root with any static web server, then open `src/index.html`. For example, from the repository root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/src/` in your browser. Serving the files over HTTP avoids browser restrictions around JavaScript modules when opening an HTML file directly.

## Features

- Windows 8.1 Metro-inspired interface
- Drag components around a 960×600 design canvas
- Text, button, image, and Metro tile components
- Edit names, text, position, dimensions, colors, font size, and image URL
- Duplicate and delete components
- Save and reopen `.tileforge` JSON project files
- Export a standalone HTML preview
- Visual block workspace with event, text, message, and motion blocks
- GitHub Actions packages source and attaches ZIPs to versioned GitHub Releases

## Project structure

```text
src/
  index.html    Application structure
  styles.css    UI and editor styling
  app.js        App startup, project state, and UI events
  editor.js     Canvas rendering, dragging, and properties inspector
  blocks.js     Visual block workspace and simple block execution
  project.js    Project schema, validation, saving, and HTML export
.github/
  workflows/
    package-release.yml
```

## Automated source package and releases

Pushes to `main` create a downloadable source ZIP workflow artifact. To publish a GitHub Release with the source ZIP and SHA-256 checksum attached, push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Roadmap

- [x] Modular browser editor prototype
- [x] Free-positioning visual canvas and component inspector
- [x] Save/open project files
- [x] Standalone HTML export
- [x] Basic visual programming blocks
- [x] Automated source ZIP and GitHub Releases
- [ ] More component types and multi-page projects
- [ ] Richer block logic, variables, conditions, and events
- [ ] Native Windows project generation
- [ ] Windows x64 `.appx` packaging and signing

## License

MIT. See [LICENSE](LICENSE).
