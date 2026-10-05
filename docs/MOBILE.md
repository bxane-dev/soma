# Soma mobile builds

Soma targets Android and iOS through Tauri 2.

## Android

Local setup requires the Android SDK, NDK, Java and the Android Rust targets.

```bash
npm install
npm run android:init
node scripts/patch-android-manifest.mjs
npm run android:apk
```

The GitHub Actions workflow builds a debug-signed APK that can be installed directly for testing.

For Play Store distribution, create a production Android keystore and configure release signing before publishing an AAB.

## iOS

iOS builds require macOS and Xcode.

```bash
npm install
npm run ios:init
npm run ios:ipa
```

A device IPA requires Apple code signing. Tauri's official iOS signing flow requires an Apple Developer account, a certificate and a provisioning profile.

For the GitHub Actions IPA job, configure:

- `IOS_CERTIFICATE` — base64-encoded Apple certificate (.p12)
- `IOS_CERTIFICATE_PASSWORD` — password used when exporting the certificate
- `IOS_MOBILE_PROVISION` — base64-encoded provisioning profile

The bundle identifier is:

`dev.bxane.soma`

Until those secrets exist, CI still compiles an iOS simulator app so iOS source compatibility is continuously checked.

## Camera and microphone

Soma includes iOS privacy usage strings and patches the generated Android manifest with camera and microphone permissions. Actual access is requested only when Soma's scan/voice features use those devices.

## Updates

The self-updater is desktop-only. Android and iOS production updates must use their respective store distribution channels.
