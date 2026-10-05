# Soma

Soma is a local-first adaptive movement and personalized martial-art training platform.

**Created by bxane** — [@bxane-dev](https://github.com/bxane-dev)

> Status: production architecture bootstrap. The desktop application is being built with Tauri 2 + React/TypeScript.

## Auto updates

Soma is wired to GitHub Releases from this repository:

`https://github.com/bxane-dev/soma/releases/latest/download/latest.json`

Stable desktop builds check for updates on launch. Update bundles are verified by Tauri's updater signature system before installation.

## Development

Prerequisites:

- Node.js 22+
- Rust stable
- Tauri desktop prerequisites for your operating system

```bash
npm install
npm run tauri dev
```

## Release

Tags matching `v*` trigger the release workflow. The release workflow builds Windows, Linux, and macOS installers and publishes updater metadata.

Before the first signed release, configure the signing secrets described in [docs/UPDATER.md](docs/UPDATER.md).

## Identity

- Product: Soma
- Author: bxane
- GitHub: https://github.com/bxane-dev
- Repository: https://github.com/bxane-dev/soma

© 2026 bxane
