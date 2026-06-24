"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Video, Activity } from "lucide-react";
import type { AnalysisResult } from "@/types";
import ScoreCard from "@/components/analysis/ScoreCard";
import PhaseViewer from "@/components/analysis/PhaseViewer";
import ReportPanel from "@/components/analysis/ReportPanel";
import VideoOverlay from "@/components/analysis/VideoOverlay";
import { formatDate } from "@/lib/utils";

const BACKEND = "https://swing-ai-production-342a.up.railway.app";

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => { setResult(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-white/20 border-t-brand-500 rounded-full"
        />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4 text-white/50">
        <p>Sesión no encontrada</p>
        <button onClick={() => router.push("/")} className="text-brand-400 hover:underline">
          Volver al inicio
        </button>
      </div>
    );
  }

  const videoUrl = result.video_url ? `${BACKEND}${result.video_url}` : null;

  return (
    <div className="min-h-screen bg-dark-950 bg-grid-dark bg-grid">
      {/* Header */}
      <header className="border-b border-white/8 bg-dark-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{result.filename ?? "Swing Analysis"}</p>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(result.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  {result.view === "dtl" ? "Down The Line" : "Face On"} · {result.duration}s
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text">{result.scores.overall}</p>
            <p className="text-xs text-white/40">/ 100</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Video with overlay — full width on top */}
        {videoUrl && (result as any).phase_timestamps && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800 border border-white/10 rounded-2xl p-4"
          >
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Vídeo con análisis biomecánico
            </h2>
            <p className="text-white/40 text-xs mb-3">
              Reproduce el vídeo — las líneas de análisis aparecen automáticamente en cada fase
            </p>
            <VideoOverlay
              videoUrl={videoUrl}
              phaseTimestamps={(result as any).phase_timestamps}
              phaseLandmarks={(result as any).phase_landmarks ?? {}}
              duration={result.duration}
            />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: scores */}
          <div className="lg:col-span-1 space-y-6">
            <ScoreCard scores={result.scores} />
          </div>

          {/* Right: phases + report */}
          <div className="lg:col-span-2 space-y-6">
            {Object.keys(result.keyframes ?? {}).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-dark-800 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="font-semibold text-white mb-4">Fases del Swing</h2>
                <PhaseViewer keyframes={result.keyframes} />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800 border border-white/10 rounded-2xl p-6"
            >
              <h2 className="font-semibold text-white mb-4">Informe del Coach</h2>
              <ReportPanel report={result.report} />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
