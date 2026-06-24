"use client";
import { motion } from "framer-motion";
import ScoreRing from "@/components/ui/ScoreRing";
import type { Scores } from "@/types";
import { scoreLabel } from "@/lib/utils";

interface Props {
  scores: Scores;
}

const CATEGORY_LABELS: [keyof Scores, string][] = [
  ["technique", "Técnica"],
  ["consistency", "Consistencia"],
  ["balance", "Equilibrio"],
  ["rotation", "Rotación"],
  ["impact", "Impacto"],
];

export default function ScoreCard({ scores }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-dark-800 border border-white/10 rounded-2xl p-6 space-y-6"
    >
      {/* Overall score */}
      <div className="flex flex-col items-center py-4">
        <ScoreRing score={scores.overall} size={160} strokeWidth={10} />
        <div className="mt-4 text-center">
          <p className="text-3xl font-bold gradient-text">{scores.overall}/100</p>
          <p className="text-white/60 mt-1">{scoreLabel(scores.overall)}</p>
          <div className="mt-3 px-4 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/30 inline-block">
            <p className="text-gold-400 text-sm font-semibold">
              Handicap estimado: {scores.handicap_range}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-white/8" />

      {/* Category scores */}
      <div className="grid grid-cols-5 gap-2">
        {CATEGORY_LABELS.map(([key, label], i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <ScoreRing
              score={typeof scores[key] === "number" ? (scores[key] as number) : 0}
              size={72}
              strokeWidth={5}
              label={label}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
