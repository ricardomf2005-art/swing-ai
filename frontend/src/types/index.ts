export interface Scores {
  technique: number;
  consistency: number;
  balance: number;
  rotation: number;
  impact: number;
  overall: number;
  handicap_range: string;
}

export interface Strength {
  icon: string;
  text: string;
}

export interface Improvement {
  icon: string;
  text: string;
  phase: string;
}

export interface Drill {
  name: string;
  description: string;
}

export interface Correction {
  title: string;
  phase: string;
  what: string;
  why: string;
  how: string;
  drill: Drill;
  severity: "high" | "medium" | "low";
}

export interface MetricItem {
  label: string;
  value: number;
  unit: string;
  ideal_range: string;
  status: "good" | "warning";
}

export interface ShotPrediction {
  shape: string;
  color: string;
  description: string;
}

export interface Report {
  view: string;
  strengths: Strength[];
  improvements: Improvement[];
  corrections: Correction[];
  shot_prediction: ShotPrediction;
  metrics_summary: MetricItem[];
}

export interface AnalysisResult {
  id: string;
  date: string;
  filename: string;
  view: string;
  video_url: string;
  duration: number;
  total_frames: number;
  fps: number;
  scores: Scores;
  metrics: Record<string, unknown>;
  report: Report;
  phase_frames: Record<string, number>;
  keyframes: Record<string, string>;
}

export interface SessionSummary {
  id: string;
  date: string;
  filename: string;
  view: string;
  scores: Scores;
  video_url: string;
}

export type SwingView = "dtl" | "fo";

export const PHASE_LABELS: Record<string, string> = {
  address: "Address",
  takeaway: "Takeaway",
  half_backswing: "Half Backswing",
  top_of_backswing: "Top",
  transition: "Transition",
  downswing: "Downswing",
  impact: "Impact",
  follow_through: "Follow Through",
  finish: "Finish",
};
