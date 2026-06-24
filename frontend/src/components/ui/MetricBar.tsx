"use client";
import { motion } from "framer-motion";
import { scoreColor } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  unit?: string;
  idealRange?: string;
  status?: "good" | "warning";
}

export default function MetricBar({ label, value, unit = "°", idealRange, status = "good" }: Props) {
  const color = status === "good" ? "#22c55e" : "#f59e0b";
  const pct = Math.min(100, Math.max(0, (value / 180) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <div className="flex items-center gap-2">
          {idealRange && (
            <span className="text-white/30 text-xs">ideal: {idealRange}</span>
          )}
          <span className="font-mono font-semibold" style={{ color }}>
            {value}{unit}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
