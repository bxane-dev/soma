import { readFile, writeFile } from "node:fs/promises";

const configPath = new URL("../src-tauri/tauri.conf.json", import.meta.url);
const publicKey = process.env.TAURI_UPDATER_PUBLIC_KEY?.trim();

if (!publicKey) {
  console.error("TAURI_UPDATER_PUBLIC_KEY is required for signed release builds.");
  process.exit(1);
}

const raw = await readFile(configPath, "utf8");
const config = JSON.parse(raw);

config.plugins ??= {};
config.plugins.updater ??= {};
config.plugins.updater.pubkey = publicKey;
config.plugins.updater.endpoints = [
  "https://github.com/bxane-dev/soma/releases/latest/download/latest.json"
];

await writeFile(configPath, JSON.stringify(config, null, 2) + "\n");
console.log("Configured Soma updater for bxane-dev/soma.");
