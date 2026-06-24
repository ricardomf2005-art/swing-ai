import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwingAI — Golf Swing Analyzer",
  description: "Análisis profesional de swing de golf con inteligencia artificial",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-dark-950 text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
