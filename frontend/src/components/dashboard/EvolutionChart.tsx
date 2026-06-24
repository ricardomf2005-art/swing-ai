"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { SessionSummary } from "@/types";
import { formatDate } from "@/lib/utils";

interface Props {
  sessions: SessionSummary[];
}

export default function EvolutionChart({ sessions }: Props) {
  const data = [...sessions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      date: formatDate(s.date).split(",")[0],
      Técnica: s.scores.technique,
      Rotación: s.scores.rotation,
      Impacto: s.scores.impact,
      General: s.scores.overall,
    }));

  if (data.length === 0) return null;

  return (
    <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-white">Evolución de Puntuaciones</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#0a1220",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              color: "white",
            }}
          />
          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }} />
          <Line type="monotone" dataKey="General" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} />
          <Line type="monotone" dataKey="Técnica" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Rotación" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Impacto" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
