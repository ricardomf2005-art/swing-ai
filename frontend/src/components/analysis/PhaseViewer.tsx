"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHASE_LABELS } from "@/types";

interface Props {
  keyframes: Record<string, string>;
}

const PHASE_ORDER = [
  "address", "takeaway", "half_backswing", "top_of_backswing",
  "transition", "downswing", "impact", "follow_through", "finish",
];

export default function PhaseViewer({ keyframes }: Props) {
  const [active, setActive] = useState("address");
  const phases = PHASE_ORDER.filter((p) => keyframes[p]);

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {phases.map((phase, i) => (
          <button
            key={phase}
            onClick={() => setActive(phase)}
            className="flex-shrink-0 relative"
          >
            <div
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                active === phase
                  ? "bg-brand-500 text-white"
                  : "bg-white/8 text-white/50 hover:bg-white/12"
              }`}
            >
              {PHASE_LABELS[phase] ?? phase}
            </div>
            {i < phases.length - 1 && (
              <div className="absolute top-1/2 -right-1.5 w-1.5 h-px bg-white/20" />
            )}
          </button>
        ))}
      </div>

      {/* Frame display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25 }}
          className="relative rounded-xl overflow-hidden bg-dark-800 border border-white/10"
        >
          {keyframes[active] ? (
            <img
              src={keyframes[active]}
              alt={PHASE_LABELS[active] ?? active}
              className="w-full object-contain max-h-96"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-white/30">
              Fotograma no disponible
            </div>
          )}
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <span className="text-white text-sm font-semibold">
              {PHASE_LABELS[active] ?? active}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
