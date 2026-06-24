"use client";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Film, X, ChevronRight, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SwingView } from "@/types";

interface Props {
  onAnalyze: (file: File, view: SwingView) => void;
  isAnalyzing: boolean;
}

export default function VideoUploader({ onAnalyze, isAnalyzing }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState<SwingView>("dtl");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith("video/")) handleFile(f);
    },
    [handleFile]
  );

  const handleSubmit = () => {
    if (file) onAnalyze(file, view);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300",
                dragging
                  ? "border-brand-500 bg-brand-500/10 glow-green"
                  : "border-white/20 bg-white/3 hover:border-brand-500/60 hover:bg-brand-500/5"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <motion.div
                animate={{ y: dragging ? -4 : 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                  dragging ? "bg-brand-500/20" : "bg-white/8"
                )}>
                  <Upload className={cn("w-8 h-8", dragging ? "text-brand-400" : "text-white/40")} />
                </div>
                <div>
                  <p className="text-white text-lg font-semibold">
                    Arrastra tu vídeo aquí
                  </p>
                  <p className="text-white/40 mt-1 text-sm">
                    o haz clic para seleccionar de tu galería
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  {["MP4", "MOV", "AVI"].map((fmt) => (
                    <span key={fmt} className="px-3 py-1 rounded-full bg-white/8 text-white/50 text-xs font-mono">
                      {fmt}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden bg-dark-800 border border-white/10"
          >
            <video
              src={preview!}
              className="w-full max-h-72 object-contain"
              controls
              muted
            />
            <button
              onClick={reset}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-500/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-4 flex items-center gap-3">
              <Film className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/60 truncate">{file.name}</span>
              <span className="ml-auto text-xs text-white/30">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View selector */}
      <div className="space-y-3">
        <p className="text-sm text-white/50 font-medium uppercase tracking-wider">
          Ángulo de grabación
        </p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "dtl", label: "Down The Line", desc: "Desde detrás del jugador", icon: "→" },
            { value: "fo", label: "Face On", desc: "Vista frontal", icon: "↑" },
          ] as { value: SwingView; label: string; desc: string; icon: string }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setView(opt.value)}
              className={cn(
                "p-4 rounded-xl border text-left transition-all duration-200",
                view === opt.value
                  ? "border-brand-500 bg-brand-500/15 glow-green"
                  : "border-white/10 bg-white/5 hover:border-white/25"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className={cn("font-semibold text-sm", view === opt.value ? "text-brand-400" : "text-white")}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{opt.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Analyze button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!file || isAnalyzing}
        whileHover={{ scale: file && !isAnalyzing ? 1.01 : 1 }}
        whileTap={{ scale: file && !isAnalyzing ? 0.99 : 1 }}
        className={cn(
          "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300",
          file && !isAnalyzing
            ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
            : "bg-white/8 text-white/30 cursor-not-allowed"
        )}
      >
        {isAnalyzing ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
            Analizando swing...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            Analizar Swing
            <ChevronRight className="w-4 h-4 ml-auto" />
          </>
        )}
      </motion.button>
    </div>
  );
}
