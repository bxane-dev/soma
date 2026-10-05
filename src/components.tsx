import type { ReactNode } from "react";

export function pct(value: number) {
  return Math.round(value * 100);
}

export function PageHeader(props: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="page-header">
      <p className="kicker">{props.eyebrow}</p>
      <h1>{props.title}</h1>
      <p>{props.subtitle}</p>
    </header>
  );
}

export function Metric(props: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <small>{props.detail}</small>
    </article>
  );
}

export function StatusRow(props: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="status-row">
      <span>{props.label}</span>
      <strong className={props.muted ? "muted" : ""}>{props.value}</strong>
    </div>
  );
}

export function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      {props.children}
    </label>
  );
}

export function Slider(props: {
  label: string;
  help: string;
  value: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="slider-row">
      <div>
        <strong>{props.label}</strong>
        <p>{props.help}</p>
      </div>
      <div className="slider-control">
        <span>{props.value}{props.suffix}</span>
        <input
          type="range"
          min={0}
          max={props.max}
          value={props.value}
          onChange={(event) => props.onChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}

export function Axis(props: { label: string; value: number }) {
  const value = pct(props.value);
  return (
    <div className="axis">
      <div>
        <span>{props.label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="axis-track">
        <div style={{ width: String(value) + "%" }} />
      </div>
    </div>
  );
}

export function EmptyState(props: {
  title: string;
  body?: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="empty-state">
      <div className="brand-mark">S</div>
      <h1>{props.title}</h1>
      {props.body && <p>{props.body}</p>}
      <button className="primary" onClick={props.onAction}>{props.action}</button>
    </section>
  );
}
