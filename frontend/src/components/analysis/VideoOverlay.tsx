"use client";
import { useEffect, useRef, useState } from "react";

interface Landmark {
  [key: string]: [number, number];
}

interface Props {
  videoUrl: string;
  phaseTimestamps: Record<string, number>;
  phaseLandmarks: Record<string, Landmark>;
  duration: number;
}

const CONNECTIONS = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

function findClosestPhase(time: number, timestamps: Record<string, number>): string | null {
  let closest: string | null = null;
  let minDiff = Infinity;
  for (const [phase, t] of Object.entries(timestamps)) {
    const diff = Math.abs(t - time);
    if (diff < minDiff) {
      minDiff = diff;
      closest = phase;
    }
  }
  return minDiff < 0.5 ? closest : null;
}

export default function VideoOverlay({ videoUrl, phaseTimestamps, phaseLandmarks, duration }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePhase, setActivePhase] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const phase = findClosestPhase(video.currentTime, phaseTimestamps);
      setActivePhase(phase);
      if (!phase || !phaseLandmarks[phase]) return;

      const lm = phaseLandmarks[phase];
      const W = canvas.width;
      const H = canvas.height;

      // Draw skeleton connections
      ctx.strokeStyle = "rgba(74, 222, 128, 0.85)";
      ctx.lineWidth = 2.5;
      for (const [a, b] of CONNECTIONS) {
        if (lm[a] && lm[b]) {
          ctx.beginPath();
          ctx.moveTo(lm[a][0] * W, lm[a][1] * H);
          ctx.lineTo(lm[b][0] * W, lm[b][1] * H);
          ctx.stroke();
        }
      }

      // Draw joints
      ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
      for (const [, coords] of Object.entries(lm)) {
        ctx.beginPath();
        ctx.arc(coords[0] * W, coords[1] * H, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spine line
      const ls = lm["left_shoulder"], rs = lm["right_shoulder"];
      const lh = lm["left_hip"], rh = lm["right_hip"];
      if (ls && rs && lh && rh) {
        const sX = (ls[0] + rs[0]) / 2 * W;
        const sY = (ls[1] + rs[1]) / 2 * H;
        const hX = (lh[0] + rh[0]) / 2 * W;
        const hY = (lh[1] + rh[1]) / 2 * H;

        ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(sX, sY);
        ctx.lineTo(hX, hY);
        // Extend to ground
        const dx = hX - sX, dy = hY - sY;
        const ext = 1.5;
        ctx.lineTo(sX + dx * ext, sY + dy * ext);
        ctx.stroke();
        ctx.setLineDash([]);

        // Shoulder line
        ctx.strokeStyle = "rgba(147, 197, 253, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ls[0] * W, ls[1] * H);
        ctx.lineTo(rs[0] * W, rs[1] * H);
        ctx.stroke();

        // Hip line
        ctx.strokeStyle = "rgba(249, 115, 22, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lh[0] * W, lh[1] * H);
        ctx.lineTo(rh[0] * W, rh[1] * H);
        ctx.stroke();
      }

      // Wrist trajectory (swing plane)
      const lw = lm["left_wrist"];
      if (lw) {
        ctx.fillStyle = "rgba(167, 139, 250, 0.9)";
        ctx.beginPath();
        ctx.arc(lw[0] * W, lw[1] * H, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("✋", lw[0] * W - 8, lw[1] * H + 4);
      }

      // Phase label
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(8, 8, 160, 26);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(phase.replace(/_/g, " ").toUpperCase(), 14, 26);
    };

    const onTimeUpdate = () => draw();
    const onLoadedData = () => draw();

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", draw);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", draw);
    };
  }, [phaseTimestamps, phaseLandmarks]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        muted
        playsInline
        className="w-full block"
        style={{ maxHeight: "480px", objectFit: "contain" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: "normal" }}
      />
      {/* Legend */}
      <div className="absolute bottom-12 right-2 flex flex-col gap-1 text-xs">
        {[
          { color: "#4ade80", label: "Esqueleto" },
          { color: "#ef4444", label: "Columna" },
          { color: "#93c5fd", label: "Hombros" },
          { color: "#f97316", label: "Caderas" },
          { color: "#a78bfa", label: "Muñeca" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded">
            <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
            <span className="text-white/70">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
