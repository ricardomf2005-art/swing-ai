"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, XCircle, Target, Dumbbell } from "lucide-react";
import type { Report } from "@/types";
import MetricBar from "@/components/ui/MetricBar";

interface Props {
  report: Report;
}

function CorrectionCard({ correction, index }: { correction: Report["corrections"][0]; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="border border-white/10 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${correction.severity === "high" ? "bg-red-500" : correction.severity === "medium" ? "bg-yellow-500" : "bg-blue-400"}`} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{correction.title}</p>
          <p className="text-xs text-white/40 mt-0.5">{correction.phase}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="w-4 h-4 text-white/40" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              <div className="w-full h-px bg-white/8" />

              <div className="space-y-3">
                <Section icon="🔍" title="Qué ocurre" text={correction.what} />
                <Section icon="⚡" title="Por qué ocurre" text={correction.why} />
                <Section icon="✅" title="Cómo corregirlo" text={correction.how} />
              </div>

              <div className="bg-brand-500/10 border border-brand-500/25 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-brand-400" />
                  <span className="text-brand-400 font-semibold text-sm">Drill: {correction.drill.name}</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{correction.drill.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Section({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
        {icon} {title}
      </p>
      <p className="text-sm text-white/80 leading-relaxed">{text}</p>
    </div>
  );
}

export default function ReportPanel({ report }: Props) {
  const [tab, setTab] = useState<"overview" | "corrections" | "metrics">("overview");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {(["overview", "corrections", "metrics"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? "bg-white/12 text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            {t === "overview" ? "Diagnóstico" : t === "corrections" ? "Correcciones" : "Métricas"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Shot prediction */}
            <div className="p-4 rounded-xl border" style={{
              borderColor: report.shot_prediction.color + "40",
              background: report.shot_prediction.color + "15",
            }}>
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5" style={{ color: report.shot_prediction.color }} />
                <div>
                  <p className="font-bold" style={{ color: report.shot_prediction.color }}>
                    {report.shot_prediction.shape}
                  </p>
                  <p className="text-white/60 text-sm">{report.shot_prediction.description}</p>
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                Lo que haces bien
              </h3>
              {report.strengths.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-brand-500/8 border border-brand-500/20"
                >
                  <span className="text-brand-400 mt-0.5">✓</span>
                  <p className="text-white/80 text-sm leading-relaxed">{s.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Improvements */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                A mejorar
              </h3>
              {report.improvements.map((imp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-red-500/8 border border-red-500/20"
                >
                  <span className="text-red-400 mt-0.5">✗</span>
                  <p className="text-white/80 text-sm leading-relaxed">{imp.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "corrections" && (
          <motion.div
            key="corrections"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {report.corrections.length === 0 ? (
              <p className="text-white/40 text-center py-8">No se detectaron errores críticos</p>
            ) : (
              report.corrections.map((c, i) => (
                <CorrectionCard key={i} correction={c} index={i} />
              ))
            )}
          </motion.div>
        )}

        {tab === "metrics" && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {report.metrics_summary.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <MetricBar
                  label={m.label}
                  value={m.value}
                  unit={m.unit}
                  idealRange={m.ideal_range}
                  status={m.status}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
