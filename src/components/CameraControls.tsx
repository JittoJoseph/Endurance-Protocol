"use client";

import { motion } from "framer-motion";

interface CameraControlsProps {
  onPresetChange: (preset: string) => void;
  currentPreset: string;
}

const presets = [
  { id: "default", label: "Default", icon: "🌍" },
  { id: "overview", label: "Overview", icon: "🛰️" },
  { id: "closeup", label: "Close Up", icon: "🔍" },
  { id: "topdown", label: "Top Down", icon: "⬆️" },
  { id: "impact", label: "Impact View", icon: "💥" },
];

export default function CameraControls({
  onPresetChange,
  currentPreset,
}: CameraControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-4"
    >
      <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3 font-light">
        Camera Views
      </h3>
      <div className="flex flex-col gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onPresetChange(preset.id)}
            className={`
              px-4 py-2 rounded-md text-sm font-light
              transition-all duration-300 text-left flex items-center gap-3
              ${
                currentPreset === preset.id
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
              }
            `}
          >
            <span className="text-lg">{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
