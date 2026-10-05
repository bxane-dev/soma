import { useCallback, useEffect, useRef, useState } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import {
  checkForSomaUpdate,
  installSomaUpdate,
  type UpdateProgress
} from "./updater";

type UpdateState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "current" }
  | { kind: "available"; version: string; notes?: string }
  | { kind: "installing"; version: string; progress: UpdateProgress }
  | { kind: "error"; message: string };

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const updateRef = useRef<Update | null>(null);
  const [updateState, setUpdateState] = useState<UpdateState>({ kind: "idle" });

  const checkForUpdates = useCallback(async () => {
    setUpdateState({ kind: "checking" });

    try {
      if (updateRef.current) {
        await updateRef.current.close();
        updateRef.current = null;
      }

      const update = await checkForSomaUpdate();

      if (!update) {
        setUpdateState({ kind: "current" });
        return;
      }

      updateRef.current = update;
      setUpdateState({
        kind: "available",
        version: update.version,
        notes: update.body
      });
    } catch (error) {
      setUpdateState({ kind: "error", message: messageFromError(error) });
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;

    const version = update.version;
    setUpdateState({
      kind: "installing",
      version,
      progress: { phase: "started", downloaded: 0 }
    });

    try {
      await installSomaUpdate(update, (progress) => {
        setUpdateState({ kind: "installing", version, progress });
      });
    } catch (error) {
      setUpdateState({ kind: "error", message: messageFromError(error) });
    }
  }, []);

  useEffect(() => {
    void checkForUpdates();

    const interval = window.setInterval(() => {
      void checkForUpdates();
    }, 6 * 60 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
      if (updateRef.current) {
        void updateRef.current.close();
      }
    };
  }, [checkForUpdates]);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">SOMA // CORE</p>
          <h1>Adaptive movement intelligence.</h1>
          <p className="lede">
            Local-first scanning, Style DNA, training orchestration and live
            coaching. Created by bxane.
          </p>
        </div>

        <div className="status-card">
          <span className="status-dot" />
          <div>
            <strong>Repository connected</strong>
            <span>github.com/bxane-dev/soma</span>
          </div>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <p className="panel-label">BUILD</p>
          <h2>Soma 0.1.0</h2>
          <p>Desktop foundation online. Production engines are next.</p>
        </article>

        <article className="panel updater-panel">
          <p className="panel-label">AUTO UPDATER</p>
          <UpdateView
            state={updateState}
            onCheck={checkForUpdates}
            onInstall={installUpdate}
          />
        </article>
      </section>

      <footer>
        <span>© 2026 bxane</span>
        <span>@bxane-dev</span>
      </footer>
    </main>
  );
}

function UpdateView({
  state,
  onCheck,
  onInstall
}: {
  state: UpdateState;
  onCheck: () => Promise<void>;
  onInstall: () => Promise<void>;
}) {
  if (state.kind === "checking") {
    return (
      <>
        <h2>Checking GitHub Releases…</h2>
        <p>Soma checks the stable release channel automatically.</p>
      </>
    );
  }

  if (state.kind === "current") {
    return (
      <>
        <h2>Up to date</h2>
        <p>No newer stable Soma release is available.</p>
        <button onClick={() => void onCheck()}>Check again</button>
      </>
    );
  }

  if (state.kind === "available") {
    return (
      <>
        <h2>Soma {state.version} available</h2>
        <p>{state.notes || "A signed Soma update is ready to install."}</p>
        <button onClick={() => void onInstall()}>Download & install</button>
      </>
    );
  }

  if (state.kind === "installing") {
    const label =
      state.progress.percent === undefined
        ? "Downloading update…"
        : `Downloading… ${state.progress.percent}%`;

    return (
      <>
        <h2>Installing Soma {state.version}</h2>
        <p>{label}</p>
        <div className="progress">
          <div
            className="progress-fill"
            style={{ width: `${state.progress.percent ?? 12}%` }}
          />
        </div>
      </>
    );
  }

  if (state.kind === "error") {
    return (
      <>
        <h2>Updater unavailable</h2>
        <p>{state.message}</p>
        <button onClick={() => void onCheck()}>Retry</button>
      </>
    );
  }

  return (
    <>
      <h2>GitHub Releases</h2>
      <p>Stable updates are checked on launch and every six hours.</p>
      <button onClick={() => void onCheck()}>Check now</button>
    </>
  );
}
