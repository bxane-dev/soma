import { useState } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import {
  checkForSomaUpdate,
  installSomaUpdate,
  type SomaRuntimePlatform
} from "./updater";
import type {
  Dashboard,
  Drill,
  ProfileInput,
  ScanInput,
  StyleDna,
  BodyModel
} from "./soma";
import {
  Axis,
  EmptyState,
  Field,
  Metric,
  PageHeader,
  Slider,
  StatusRow,
  pct
} from "./components";

export function Onboarding(props: {
  busy: boolean;
  error: string;
  onCreate: (input: ProfileInput) => Promise<void>;
}) {
  const [form, setForm] = useState<ProfileInput>({
    displayName: "",
    age: 25,
    heightCm: 175,
    weightKg: 75
  });

  return (
    <main className="onboarding">
      <section className="onboarding-copy">
        <div className="brand-mark">S</div>
        <p className="kicker">SOMA // LOCAL MOVEMENT SYSTEM</p>
        <h1>Your body becomes the rule set.</h1>
        <p className="lead">
          Soma turns your declared movement capabilities and hard limits into a
          Body Model, one-word Style DNA and adaptive training curriculum.
        </p>
        <div className="privacy-note">
          <strong>Local first.</strong>
          <span>Your profile and training history stay on this device.</span>
        </div>
      </section>

      <form
        className="onboarding-card"
        onSubmit={(event) => {
          event.preventDefault();
          void props.onCreate(form);
        }}
      >
        <p className="kicker">CREATE PROFILE</p>
        <Field label="Name">
          <input
            value={form.displayName}
            onChange={(event) =>
              setForm({ ...form, displayName: event.target.value })
            }
            placeholder="Your name"
            autoFocus
          />
        </Field>
        <div className="form-grid">
          <Field label="Age">
            <input
              type="number"
              min={10}
              max={120}
              value={form.age}
              onChange={(event) =>
                setForm({ ...form, age: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Height · cm">
            <input
              type="number"
              min={80}
              max={260}
              value={form.heightCm}
              onChange={(event) =>
                setForm({ ...form, heightCm: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Weight · kg">
            <input
              type="number"
              min={20}
              max={350}
              step="0.1"
              value={form.weightKg}
              onChange={(event) =>
                setForm({ ...form, weightKg: Number(event.target.value) })
              }
            />
          </Field>
        </div>
        {props.error && <div className="error-banner compact">{props.error}</div>}
        <button className="primary wide" disabled={props.busy}>
          {props.busy ? "Creating…" : "Create local profile"}
        </button>
        <p className="fine-print">
          Soma is a training tool, not a medical diagnostic or medical-clearance
          system. Camera-derived measurements remain estimates.
        </p>
      </form>
    </main>
  );
}

export function OverviewPage(props: {
  dashboard: Dashboard;
  onScan: () => void;
  onTrain: () => void;
}) {
  const profile = props.dashboard.state.profile;
  const body = props.dashboard.state.bodyModel;
  const style = props.dashboard.state.style;
  const curriculum = props.dashboard.state.curriculum;

  return (
    <>
      <PageHeader
        eyebrow="SOMA // OVERVIEW"
        title={style ? style.name : "Hello, " + (profile?.displayName ?? "")}
        subtitle={
          style
            ? "Your current style is generated from your Body Model and declared constraints."
            : "Complete your first movement scan to generate a Body Model and Style DNA."
        }
      />

      <section className="metric-grid">
        <Metric
          label="BODY MODEL"
          value={body ? "v" + body.version : "Not built"}
          detail={body ? pct(body.confidence) + "% input confidence" : "Scan required"}
        />
        <Metric
          label="READINESS"
          value={curriculum ? pct(curriculum.readiness) + "%" : "—"}
          detail={body?.safetyState ?? "Waiting for scan"}
        />
        <Metric
          label="SESSIONS"
          value={String(props.dashboard.progress.sessions)}
          detail={String(props.dashboard.progress.totalReps) + " total reps"}
        />
        <Metric
          label="MASTERY"
          value={pct(props.dashboard.progress.mastery) + "%"}
          detail="Recorded session progress"
        />
      </section>

      <section className="two-column">
        <article className="surface hero-card">
          <p className="kicker">NEXT ACTION</p>
          <h2>{style ? "Continue your curriculum" : "Build your movement model"}</h2>
          <p>
            {style
              ? "Your current style and drill set are ready. Complete sessions to build progress history."
              : "The first scan uses your own ratings and hard movement limits. Soma does not infer a medical diagnosis."}
          </p>
          <div className="actions">
            <button className="primary" onClick={style ? props.onTrain : props.onScan}>
              {style ? "Start training" : "Start scan"}
            </button>
            {style && <button onClick={props.onScan}>Re-scan</button>}
          </div>
        </article>

        <article className="surface">
          <p className="kicker">SYSTEM STATUS</p>
          <StatusRow label="Local persistence" value="ACTIVE" />
          <StatusRow label="Body Model" value={body ? "READY" : "WAITING"} />
          <StatusRow label="Style DNA" value={style ? "READY" : "WAITING"} />
          <StatusRow label="Camera pose model" value="NOT INSTALLED" muted />
          <p className="fine-print">
            Soma does not fake camera measurements. This build uses the real
            manual scan engine until a bundled pose model is installed.
          </p>
        </article>
      </section>
    </>
  );
}

export function ScanPage(props: {
  initial: ScanInput;
  busy: boolean;
  onSubmit: (input: ScanInput) => Promise<void>;
}) {
  const [scan, setScan] = useState<ScanInput>(props.initial);

  const items: Array<{
    key: keyof Omit<ScanInput, "discomfortLevel">;
    label: string;
    help: string;
  }> = [
    {
      key: "balance",
      label: "Balance",
      help: "How stable you feel during controlled stance changes."
    },
    {
      key: "mobility",
      label: "Mobility",
      help: "Comfortable movement range without forcing end range."
    },
    {
      key: "endurance",
      label: "Endurance",
      help: "How well you sustain controlled activity."
    },
    {
      key: "explosiveness",
      label: "Explosiveness",
      help: "Comfort with faster acceleration and deceleration."
    },
    {
      key: "rotationLimit",
      label: "Rotation limit",
      help: "Your declared upper bound for rotational demand."
    },
    {
      key: "impactLimit",
      label: "Impact limit",
      help: "Your declared upper bound for impact demand."
    }
  ];

  return (
    <>
      <PageHeader
        eyebrow="SOMA // SCAN"
        title="Manual movement scan"
        subtitle="These are user-declared training inputs. Soma treats your limits as hard constraints and does not diagnose injuries."
      />

      <section className="surface scan-card">
        {items.map((item) => (
          <Slider
            key={item.key}
            label={item.label}
            help={item.help}
            value={scan[item.key]}
            max={100}
            suffix="%"
            onChange={(value) => setScan({ ...scan, [item.key]: value })}
          />
        ))}

        <Slider
          label="Current discomfort"
          help="If this is high, Soma pauses active training rather than interpreting the cause."
          value={scan.discomfortLevel}
          max={10}
          suffix="/10"
          onChange={(value) => setScan({ ...scan, discomfortLevel: value })}
        />

        <div className="scan-footer">
          <div>
            <strong>Safety priority</strong>
            <p>Declared limits → Body Model → Style DNA → curriculum.</p>
          </div>
          <button
            className="primary"
            disabled={props.busy}
            onClick={() => void props.onSubmit(scan)}
          >
            {props.busy ? "Generating…" : "Generate Body Model"}
          </button>
        </div>
      </section>
    </>
  );
}

export function StylePage(props: {
  style: StyleDna | null;
  body: BodyModel | null;
  onScan: () => void;
}) {
  if (!props.style || !props.body) {
    return (
      <EmptyState
        title="No Style DNA yet"
        body="Complete a scan first."
        action="Start scan"
        onAction={props.onScan}
      />
    );
  }

  const axes: [string, number][] = [
    ["Range", props.style.range],
    ["Mobility", props.style.mobility],
    ["Rotation", props.style.rotation],
    ["Impact", props.style.impact],
    ["Leverage", props.style.leverage],
    ["Tempo", props.style.tempo],
    ["Balance", props.style.balanceDependency],
    ["Footwork", props.style.footworkComplexity]
  ];

  return (
    <>
      <PageHeader
        eyebrow="SOMA // STYLE DNA"
        title={props.style.name}
        subtitle={
          "Version " +
          props.style.version +
          ". One-word identity generated from your current Body Model; uniqueness is guaranteed inside this local Soma registry only."
        }
      />

      <section className="style-layout">
        <article className="surface dna-card">
          <div className="dna-name">{props.style.name}</div>
          <div className="dna-bars">
            {axes.map(([label, value]) => (
              <Axis key={label} label={label} value={value} />
            ))}
          </div>
        </article>

        <div className="stack">
          <article className="surface">
            <p className="kicker">WHY THIS STYLE</p>
            <ul className="clean-list">
              {props.style.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </article>

          <article className="surface">
            <p className="kicker">ACTIVE RESTRICTIONS</p>
            {props.style.restrictions.length ? (
              <ul className="clean-list">
                {props.style.restrictions.map((restriction) => (
                  <li key={restriction}>{restriction}</li>
                ))}
              </ul>
            ) : (
              <p>No additional restrictions beyond your declared limits.</p>
            )}
            <div className={"safety-pill " + props.body.safetyState.toLowerCase()}>
              {props.body.safetyState}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

export function TrainPage(props: {
  dashboard: Dashboard;
  selected: Drill | null;
  busy: boolean;
  onSelect: (drill: Drill | null) => void;
  onComplete: (drill: Drill, score: number, reps: number) => Promise<void>;
  onScan: () => void;
}) {
  const curriculum = props.dashboard.state.curriculum;
  const body = props.dashboard.state.bodyModel;

  if (!curriculum || !body) {
    return (
      <EmptyState
        title="Scan required before training"
        action="Start scan"
        onAction={props.onScan}
      />
    );
  }

  if (body.safetyState === "PAUSED") {
    return (
      <>
        <PageHeader
          eyebrow="SOMA // TRAIN"
          title="Training paused"
          subtitle="Your reported discomfort is high, so Soma is not presenting active drills. Soma does not diagnose the cause."
        />
        <article className="surface warning-card">
          <strong>Active training is paused.</strong>
          <p>
            Re-scan when your current state changes. Significant or worsening
            pain should be assessed appropriately rather than trained through.
          </p>
          <button onClick={props.onScan}>Update scan</button>
        </article>
      </>
    );
  }

  if (props.selected) {
    return (
      <SessionPanel
        drill={props.selected}
        busy={props.busy}
        reduced={body.safetyState === "REDUCED"}
        onBack={() => props.onSelect(null)}
        onComplete={props.onComplete}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="SOMA // TRAIN"
        title="Adaptive curriculum"
        subtitle={
          pct(curriculum.readiness) +
          "% readiness · " +
          body.safetyState.toLowerCase() +
          " training state"
        }
      />
      <section className="drill-grid">
        {curriculum.drills.map((drill, index) => (
          <article className="surface drill-card" key={drill.id}>
            <div className="drill-number">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <p className="kicker">{drill.focus.toUpperCase()}</p>
              <h2>{drill.name}</h2>
              <p>{drill.description}</p>
              <div className="drill-meta">
                <span>{drill.reps} reps</span>
                <span>{Math.ceil(drill.durationSeconds / 60)} min</span>
                <span>{pct(drill.difficulty)}% difficulty</span>
              </div>
            </div>
            <button className="primary" onClick={() => props.onSelect(drill)}>
              Start
            </button>
          </article>
        ))}
      </section>
    </>
  );
}

function SessionPanel(props: {
  drill: Drill;
  busy: boolean;
  reduced: boolean;
  onBack: () => void;
  onComplete: (drill: Drill, score: number, reps: number) => Promise<void>;
}) {
  const [score, setScore] = useState(80);
  const [reps, setReps] = useState(props.drill.reps);

  return (
    <>
      <PageHeader
        eyebrow="SOMA // SESSION"
        title={props.drill.name}
        subtitle={props.drill.description}
      />
      <section className="surface session-card">
        {props.reduced && (
          <div className="notice">
            Reduced-load mode is active because of your current scan.
          </div>
        )}
        <div className="session-target">
          <span>Target reps</span>
          <strong>{props.drill.reps}</strong>
        </div>
        <Slider
          label="Completed reps"
          help="Record what you actually completed."
          value={reps}
          max={Math.max(30, props.drill.reps * 2)}
          suffix=""
          onChange={setReps}
        />
        <Slider
          label="Session quality"
          help="Your rating of control and consistency, not a camera-derived score."
          value={score}
          max={100}
          suffix="%"
          onChange={setScore}
        />
        <div className="actions">
          <button onClick={props.onBack}>Back</button>
          <button
            className="primary"
            disabled={props.busy}
            onClick={() =>
              void props.onComplete(props.drill, score / 100, reps)
            }
          >
            {props.busy ? "Saving…" : "Complete session"}
          </button>
        </div>
      </section>
    </>
  );
}

export function ProgressPage(props: { dashboard: Dashboard }) {
  const sessions = [...props.dashboard.state.sessions].reverse();

  return (
    <>
      <PageHeader
        eyebrow="SOMA // PROGRESS"
        title={pct(props.dashboard.progress.mastery) + "% mastery"}
        subtitle="Progress is based on recorded Soma sessions, not fabricated sensor data."
      />

      <section className="metric-grid">
        <Metric
          label="SESSIONS"
          value={String(props.dashboard.progress.sessions)}
          detail="Completed"
        />
        <Metric
          label="REPS"
          value={String(props.dashboard.progress.totalReps)}
          detail="Recorded"
        />
        <Metric
          label="AVG QUALITY"
          value={pct(props.dashboard.progress.averageScore) + "%"}
          detail="Self-rated"
        />
        <Metric
          label="MASTERY"
          value={pct(props.dashboard.progress.mastery) + "%"}
          detail="Current style"
        />
      </section>

      <article className="surface">
        <p className="kicker">SESSION HISTORY</p>
        {sessions.length === 0 ? (
          <p>No sessions yet. Complete a curriculum drill to start your history.</p>
        ) : (
          <div className="history">
            {sessions.map((session) => (
              <div className="history-row" key={session.id}>
                <div>
                  <strong>{session.drillName}</strong>
                  <span>{new Date(session.completedAt).toLocaleString()}</span>
                </div>
                <div className="history-stats">
                  <span>{session.reps} reps</span>
                  <span>{pct(session.score)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  );
}

export function SettingsPage(props: {
  platform: SomaRuntimePlatform;
  dashboard: Dashboard;
  busy: boolean;
  onReset: () => Promise<void>;
}) {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState(
    props.platform === "desktop" ? "Not checked" : "Store-managed on mobile"
  );
  const [updating, setUpdating] = useState(false);

  async function checkUpdate() {
    if (props.platform !== "desktop") return;
    setStatus("Checking…");
    try {
      const next = await checkForSomaUpdate();
      setUpdate(next);
      setStatus(next ? "Soma " + next.version + " available" : "Up to date");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function installUpdate() {
    if (!update) return;
    setUpdating(true);
    try {
      await installSomaUpdate(update);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
      setUpdating(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="SOMA // SETTINGS"
        title="Privacy & system"
        subtitle="Soma is local-first. The current Body Model and history are stored on this device."
      />

      <section className="two-column">
        <article className="surface">
          <p className="kicker">PRIVACY</p>
          <StatusRow label="Raw camera storage" value="OFF" />
          <StatusRow label="Cloud sync" value="OFF" />
          <StatusRow label="Telemetry" value="OFF" />
          <StatusRow label="Local data" value="ON" />
          <p className="fine-print">
            This build does not upload your Body Model, scan values, Style DNA
            or training history.
          </p>
        </article>

        <article className="surface">
          <p className="kicker">SYSTEM</p>
          <StatusRow label="Platform" value={props.platform.toUpperCase()} />
          <StatusRow
            label="Schema"
            value={"v" + props.dashboard.state.schemaVersion}
          />
          <StatusRow label="Updater" value={status} />
          {props.platform === "desktop" && (
            <div className="actions">
              <button onClick={() => void checkUpdate()}>Check updates</button>
              {update && (
                <button
                  className="primary"
                  disabled={updating}
                  onClick={() => void installUpdate()}
                >
                  {updating ? "Installing…" : "Install update"}
                </button>
              )}
            </div>
          )}
        </article>
      </section>

      <article className="surface danger-zone">
        <p className="kicker">RESET</p>
        <h2>Delete local Soma data</h2>
        <p>
          This clears the profile, scans, Style DNA, curriculum and session
          history stored by Soma on this device.
        </p>
        <button
          className="danger"
          disabled={props.busy}
          onClick={() => {
            if (window.confirm("Delete all local Soma data on this device?")) {
              void props.onReset();
            }
          }}
        >
          {props.busy ? "Deleting…" : "Delete local data"}
        </button>
      </article>
    </>
  );
}
