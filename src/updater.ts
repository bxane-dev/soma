import type {
  DownloadEvent,
  Update
} from "@tauri-apps/plugin-updater";
import { invoke } from "@tauri-apps/api/core";

export const SOMA_UPDATE_ENDPOINT =
  "https://github.com/bxane-dev/soma/releases/latest/download/latest.json";

export type SomaRuntimePlatform = "desktop" | "android" | "ios";

export type UpdateProgress = {
  phase: "started" | "downloading" | "finished";
  downloaded: number;
  total?: number;
  percent?: number;
};

export async function getSomaRuntimePlatform(): Promise<SomaRuntimePlatform> {
  return invoke<SomaRuntimePlatform>("runtime_platform");
}

export async function checkForSomaUpdate(): Promise<Update | null> {
  const { check } = await import("@tauri-apps/plugin-updater");
  return check({ timeout: 15_000 });
}

export async function installSomaUpdate(
  update: Update,
  onProgress?: (progress: UpdateProgress) => void
): Promise<void> {
  let downloaded = 0;
  let total: number | undefined;

  const handleEvent = (event: DownloadEvent) => {
    if (event.event === "Started") {
      total = event.data.contentLength;
      onProgress?.({
        phase: "started",
        downloaded,
        total,
        percent: total ? 0 : undefined
      });
      return;
    }

    if (event.event === "Progress") {
      downloaded += event.data.chunkLength;
      onProgress?.({
        phase: "downloading",
        downloaded,
        total,
        percent: total
          ? Math.min(100, Math.round((downloaded / total) * 100))
          : undefined
      });
      return;
    }

    onProgress?.({
      phase: "finished",
      downloaded,
      total,
      percent: 100
    });
  };

  await update.downloadAndInstall(handleEvent, { timeout: 120_000 });

  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}
