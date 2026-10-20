# TileForge

**An open-source, Metro-inspired visual app builder prototype.**

TileForge lets you place text, buttons, images, and tiles freely on a canvas, edit their properties, and save projects as `.tileforge` JSON files.

> **Prototype status:** this first version is a browser-based editor prototype. It does not yet compile real Windows 8.1 x64 `.appx` packages. APPX generation is a planned milestone that requires a compatible Windows SDK/build environment and signing configuration.

## Features

- Windows 8.1 Metro-inspired interface
- Free-positioning drag-and-drop canvas
- Text, button, image, and Metro tile components
- Inspector for text, position, dimensions, colors, and font size
- Save and open `.tileforge` projects
- Export a standalone HTML preview
- GitHub Actions creates a source ZIP on pushes and GitHub Releases on version tags

## Run

Open `src/index.html` in a modern browser. No dependencies or install step required.

## Automated packages and releases

Every push to `main` uploads a ZIP as a GitHub Actions workflow artifact. To publish a GitHub Release with the ZIP attached, push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Roadmap

- [x] Drag-and-drop designer prototype
- [x] Text, button, image, and tile elements
- [x] Save/open project files
- [x] Automated source ZIP and GitHub Releases
- [ ] Scratch-style visual programming blocks
- [ ] Multi-page projects
- [ ] Native C#/XAML editor
- [ ] Windows 8.1 x64 `.appx` generation and signing

## License

MIT. See [LICENSE](LICENSE).
