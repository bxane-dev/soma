# Soma

Soma is a local-first adaptive movement and personalized martial-art training platform.

**Created by bxane** — [@bxane-dev](https://github.com/bxane-dev)

## Current implementation — 0.2.0

Soma now has a real end-to-end local application flow:

- local profile creation
- manual movement scan
- hard rotation and impact limits
- Personal Body Model with versioning and provenance
- deterministic one-word Style DNA generation
- collision-aware local style registry
- explainable style traits and restrictions
- safety states: READY / REDUCED / PAUSED
- adaptive drill curriculum
- recorded sessions and progress
- local JSON persistence on desktop, Android and iOS
- privacy/reset controls
- signed GitHub Releases desktop updater
- Android APK CI
- iOS simulator CI
- signed IPA CI path when Apple credentials are configured

## What Soma does not fake

The current build does **not** pretend to have camera pose measurements or a local language model when those model assets are not installed.

Camera-derived biomechanics, live pose coaching, AR overlays and a true local AI coach remain model-backed features to add with bundled, validated model files. Soma's current manual scan values are explicitly user-declared inputs.

Soma is a training tool, not a medical diagnostic or medical-clearance system.

## Development

Prerequisites:

- Node.js 22+
- Rust stable
- Tauri 2 platform prerequisites

Desktop:

```bash
npm install
npm run tauri dev
```

Android:

```bash
npm install
npm run android:init
node scripts/patch-android-manifest.mjs
npm run android:apk
```

iOS requires macOS/Xcode:

```bash
npm install
npm run ios:init
npm run ios:ipa
```

## Validation

Every relevant push runs:

- TypeScript/Vite production build
- Rust core unit tests
- Android build
- iOS simulator build

The Rust tests enforce important invariants such as style rotation/impact not exceeding declared limits and high reported discomfort pausing active curriculum.

## Auto updates

Desktop Soma checks:

`https://github.com/bxane-dev/soma/releases/latest/download/latest.json`

Stable desktop update bundles are signature-verified before installation.

See [docs/UPDATER.md](docs/UPDATER.md).

## Mobile

See [docs/MOBILE.md](docs/MOBILE.md).

## Identity

- Product: Soma
- Author: bxane
- GitHub: https://github.com/bxane-dev
- Repository: https://github.com/bxane-dev/soma

© 2026 bxane
