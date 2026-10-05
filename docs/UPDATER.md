# Soma auto updater

Soma uses Tauri's signed updater and GitHub Releases from:

`https://github.com/bxane-dev/soma`

The packaged app checks:

`https://github.com/bxane-dev/soma/releases/latest/download/latest.json`

on launch and every six hours.

## Signing identity

The updater public key is committed in `src-tauri/tauri.conf.json`.

- Key ID: `916AFDAFE1F5A321`
- Public key: safe to distribute
- Private key: never commit or publish it
- Private-key passphrase: never commit or publish it

Tauri requires updater signatures and Soma also enables `requireSignedVersion`, binding an updater artifact to the release version it was signed for.

## GitHub Actions secrets

Add exactly these repository secrets under:

`Settings → Secrets and variables → Actions → New repository secret`

1. `TAURI_SIGNING_PRIVATE_KEY`
   - Paste the entire contents of the private-key backup file.
2. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
   - Paste the entire contents of the password backup file.

The public key is not a secret and is already embedded in the application.

## Publishing an update

1. Update the version in both `package.json` and `src-tauri/tauri.conf.json`.
2. Commit the release.
3. Create and push a tag such as `v0.2.0`.
4. GitHub Actions builds installers, signed updater artifacts and `latest.json`.
5. Publish the draft GitHub Release after checking its artifacts.
6. Existing Soma installations detect the published stable release on their next check.

## Security

- HTTPS is required for the updater endpoint.
- The update endpoint is fixed to `bxane-dev/soma`.
- Tauri verifies the updater signature before installation.
- Signed-version verification is enabled.
- Downgrades are disabled.
- Windows uses passive installer mode.
- The private updater key stays outside the repository.
- Losing the private updater key means existing installs cannot trust newly signed updates, so keep an offline backup.
