import { useEffect, useState } from "react";
import {
  completeSession,
  createProfile,
  getDashboard,
  resetSoma,
  submitScan,
  type Dashboard,
  type Drill,
  type ProfileInput,
  type ScanInput
} from "./soma";
import { getSomaRuntimePlatform, type SomaRuntimePlatform } from "./updater";
import {
  Onboarding,
  OverviewPage,
  ProgressPage,
  ScanPage,
  SettingsPage,
  StylePage,
  TrainPage
} from "./pages";

type Page = "home" | "scan" | "style" | "train" | "progress" | "settings";
type Busy = "profile" | "scan" | "session" | "reset" | null;

const defaultScan: ScanInput = {
  balance: 60,
  mobility: 60,
  endurance: 60,
  explosiveness: 50,
  rotationLimit: 70,
  impactLimit: 60,
  discomfortLevel: 0
};

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [platform, setPlatform] = useState<SomaRuntimePlatform>("desktop");
  const [page, setPage] = useState<Page>("home");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);

  useEffect(() => {
    void Promise.all([getDashboard(), getSomaRuntimePlatform()])
      .then(([data, runtime]) => {
        setDashboard(data);
        setPlatform(runtime);
      })
      .catch((err) => setError(messageFromError(err)));
  }, []);

  if (!dashboard) {
    return (
      <main className="loading-screen">
        <div className="brand-mark">S</div>
        <p>SOMA // INITIALIZING</p>
        {error && <div className="error-banner">{error}</div>}
      </main>
    );
  }

  async function handleCreate(input: ProfileInput) {
    setBusy("profile");
    setError("");
    try {
      setDashboard(await createProfile(input));
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleScan(input: ScanInput) {
    setBusy("scan");
    setError("");
    try {
      setDashboard(await submitScan(input));
      setPage("style");
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleSession(drill: Drill, score: number, reps: number) {
    setBusy("session");
    setError("");
    try {
      setDashboard(await completeSession(drill.id, score, reps));
      setSelectedDrill(null);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleReset() {
    setBusy("reset");
    setError("");
    try {
      setDashboard(await resetSoma());
      setSelectedDrill(null);
      setPage("home");
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setBusy(null);
    }
  }

  if (!dashboard.state.profile) {
    return (
      <Onboarding
        busy={busy === "profile"}
        error={error}
        onCreate={handleCreate}
      />
    );
  }

  const nav: Array<[Page, string]> = [
    ["home", "Overview"],
    ["scan", "Scan"],
    ["style", "Style DNA"],
    ["train", "Train"],
    ["progress", "Progress"],
    ["settings", "Settings"]
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="logo-row">
            <div className="brand-mark small">S</div>
            <div>
              <strong>SOMA</strong>
              <span>by bxane</span>
            </div>
          </div>

          <nav>
            {nav.map(([id, label]) => (
              <button
                key={id}
                className={page === id ? "nav-item active" : "nav-item"}
                onClick={() => setPage(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="side-footer">
          <span>{dashboard.state.profile.displayName}</span>
          <small>{platform.toUpperCase()} · LOCAL</small>
        </div>
      </aside>

      <main className="content">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        {page === "home" && (
          <OverviewPage
            dashboard={dashboard}
            onScan={() => setPage("scan")}
            onTrain={() => setPage("train")}
          />
        )}

        {page === "scan" && (
          <ScanPage
            initial={dashboard.state.latestScan ?? defaultScan}
            busy={busy === "scan"}
            onSubmit={handleScan}
          />
        )}

        {page === "style" && (
          <StylePage
            style={dashboard.state.style}
            body={dashboard.state.bodyModel}
            onScan={() => setPage("scan")}
          />
        )}

        {page === "train" && (
          <TrainPage
            dashboard={dashboard}
            selected={selectedDrill}
            busy={busy === "session"}
            onSelect={setSelectedDrill}
            onComplete={handleSession}
            onScan={() => setPage("scan")}
          />
        )}

        {page === "progress" && <ProgressPage dashboard={dashboard} />}

        {page === "settings" && (
          <SettingsPage
            platform={platform}
            dashboard={dashboard}
            busy={busy === "reset"}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
