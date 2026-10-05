import { readFile, writeFile } from "node:fs/promises";

const manifestPath =
  "src-tauri/gen/android/app/src/main/AndroidManifest.xml";

let xml = await readFile(manifestPath, "utf8");

const additions = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />'
];

const missing = additions.filter((line) => !xml.includes(line));

if (missing.length > 0) {
  xml = xml.replace(
    /<application\b/,
    `${missing.map((line) => `    ${line}\n`).join("")}\n    <application`
  );
  await writeFile(manifestPath, xml);
}

console.log(
  missing.length
    ? `Added ${missing.length} Android mobile permission entries.`
    : "Android mobile permissions already present."
);
