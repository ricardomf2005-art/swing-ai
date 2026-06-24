"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Activity, History, ChevronRight, Zap } from "lucide-react";
import VideoUploader from "@/components/upload/VideoUploader";
import SessionCard from "@/components/dashboard/SessionCard";
import EvolutionChart from "@/components/dashboard/EvolutionChart";
import type { SwingView, SessionSummary, AnalysisResult } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) setSessions(await res.json());
    } catch {}
  };

  const handleAnalyze = async (file: File, view: SwingView) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("view", view);

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Analysis failed");
      router.push(`/analysis/${json.id}`);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-dark-950 bg-grid-dark bg-grid">
      {/* Header */}
      <header className="border-b border-white/8 bg-dark-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">SwingAI</span>
            <span className="hidden sm:block text-white/30 text-sm">Golf Analyzer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-white/40 text-xs">AI Ready</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/12 border border-brand-500/25 mb-2">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-brand-400 text-xs font-medium">Análisis biomecánico con IA</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold">
            <span className="gradient-text">Analiza tu Swing</span>
            <br />
            <span className="text-white/80">como un pro</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto text-base leading-relaxed">
            Sube un vídeo de tu swing y obtén un informe completo con métricas biomecánicas,
            correcciones específicas y drills personalizados.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 max-w-sm mx-auto">
          <button
            onClick={() => setActiveTab("analyze")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "analyze" ? "bg-white/12 text-white" : "text-white/40"
            }`}
          >
            <Activity className="w-4 h-4" />
            Analizar
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "history" ? "bg-white/12 text-white" : "text-white/40"
            }`}
          >
            <History className="w-4 h-4" />
            Historial
            {sessions.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center">
                {sessions.length}
              </span>
            )}
          </button>
        </div>

        <div>
          {activeTab === "analyze" ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-dark-800/80 backdrop-blur border border-white/10 rounded-2xl p-6">
                <VideoUploader onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
              </div>

              {/* Tips */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { emoji: "📱", tip: "Graba en horizontal para mejor análisis" },
                  { emoji: "☀️", tip: "Buena iluminación mejora la precisión" },
                  { emoji: "🎯", tip: "Incluye todo el cuerpo en el encuadre" },
                ].map((t, i) => (
                  <div key={i} className="bg-white/4 rounded-xl p-3 text-center">
                    <span className="text-2xl">{t.emoji}</span>
                    <p className="text-white/50 text-xs mt-2 leading-relaxed">{t.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aún no hay swings analizados</p>
                  <p className="text-sm mt-1">Sube tu primer vídeo para comenzar</p>
                </div>
              ) : (
                <>
                  {sessions.length >= 2 && <EvolutionChart sessions={sessions} />}
                  <div className="space-y-2">
                    {sessions.map((s, i) => (
                      <SessionCard key={s.id} session={s} index={i} onDelete={handleDelete} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
