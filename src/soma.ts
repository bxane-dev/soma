import { invoke } from "@tauri-apps/api/core";

export type Profile = {
  id: string;
  displayName: string;
  age: number;
  heightCm: number;
  weightKg: number;
  createdAt: number;
};

export type ScanInput = {
  balance: number;
  mobility: number;
  endurance: number;
  explosiveness: number;
  rotationLimit: number;
  impactLimit: number;
  discomfortLevel: number;
};

export type BodyModel = {
  version: number;
  confidence: number;
  balance: number;
  mobility: number;
  endurance: number;
  explosiveness: number;
  rotationLimit: number;
  impactLimit: number;
  safetyState: "READY" | "REDUCED" | "PAUSED";
  provenance: string[];
  updatedAt: number;
};

export type StyleDna = {
  name: string;
  seed: string;
  range: number;
  mobility: number;
  rotation: number;
  impact: number;
  leverage: number;
  tempo: number;
  balanceDependency: number;
  footworkComplexity: number;
  restrictions: string[];
  reasons: string[];
  version: number;
};

export type Drill = {
  id: string;
  name: string;
  description: string;
  focus: string;
  difficulty: number;
  durationSeconds: number;
  reps: number;
};

export type Curriculum = {
  readiness: number;
  status: "READY" | "REDUCED" | "PAUSED";
  drills: Drill[];
  generatedAt: number;
};

export type SessionRecord = {
  id: string;
  drillId: string;
  drillName: string;
  score: number;
  reps: number;
  completedAt: number;
};

export type SomaState = {
  schemaVersion: number;
  profile: Profile | null;
  latestScan: ScanInput | null;
  bodyModel: BodyModel | null;
  style: StyleDna | null;
  curriculum: Curriculum | null;
  sessions: SessionRecord[];
  styleRegistry: string[];
};

export type ProgressSummary = {
  sessions: number;
  totalReps: number;
  averageScore: number;
  mastery: number;
};

export type Dashboard = {
  state: SomaState;
  progress: ProgressSummary;
};

export type ProfileInput = {
  displayName: string;
  age: number;
  heightCm: number;
  weightKg: number;
};

export function getDashboard(): Promise<Dashboard> {
  return invoke<Dashboard>("get_dashboard");
}

export function createProfile(input: ProfileInput): Promise<Dashboard> {
  return invoke<Dashboard>("create_profile", { input });
}

export function submitScan(input: ScanInput): Promise<Dashboard> {
  return invoke<Dashboard>("submit_scan", { input });
}

export function completeSession(
  drillId: string,
  score: number,
  reps: number
): Promise<Dashboard> {
  return invoke<Dashboard>("complete_session", { drillId, score, reps });
}

export function resetSoma(): Promise<Dashboard> {
  return invoke<Dashboard>("reset_soma");
}
