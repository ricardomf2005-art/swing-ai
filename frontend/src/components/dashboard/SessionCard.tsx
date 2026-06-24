"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Eye, Trash2 } from "lucide-react";
import type { SessionSummary } from "@/types";
import { formatDate, scoreColor, scoreLabel } from "@/lib/utils";

interface Props {
  session: SessionSummary;
  index: number;
  onDelete: (id: string) => void;
}

export default function SessionCard({ session, index, onDelete }: Props) {
  const color = scoreColor(session.scores.overall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-dark-800 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-all"
    >
      {/* Score badge */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2"
        style={{ borderColor: color, color }}
      >
        <span className="font-bold text-lg">{session.scores.overall}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">
          {session.filename ?? "Swing"}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-white/40 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(session.date)}
          </span>
          <span className="text-xs text-white/30">
            {session.view === "dtl" ? "Down The Line" : "Face On"}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color }}>
          {scoreLabel(session.scores.overall)}
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/analysis/${session.id}`}
          className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-brand-500/20 transition-colors"
        >
          <Eye className="w-4 h-4 text-white/60" />
        </Link>
        <button
          onClick={() => onDelete(session.id)}
          className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-red-500/20 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-white/60" />
        </button>
      </div>
    </motion.div>
  );
}
