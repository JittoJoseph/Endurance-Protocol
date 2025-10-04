"use client";

import { Globe, ChevronLeft, ChevronRight } from "lucide-react";

interface CameraViewControlsProps {
  onPresetChange: (preset: string) => void;
  currentPreset?: string;
  disabled?: boolean;
}

const presets = [
  { id: "default", icon: Globe, label: "Default View" },
  { id: "close-left", icon: ChevronLeft, label: "Close Left" },
  { id: "close-right", icon: ChevronRight, label: "Close Right" },
];

export default function CameraViewControls({
  onPresetChange,
  currentPreset = "default",
  disabled = false,
}: CameraViewControlsProps) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-10">
      {presets.map((preset) => {
        const Icon = preset.icon;
        const isActive = currentPreset === preset.id;

        return (
          <button
            key={preset.id}
            onClick={() => onPresetChange(preset.id)}
            disabled={disabled}
            className={`
              group relative
              w-12 h-12 rounded-xl
              flex items-center justify-center
              transition-all duration-200
              backdrop-blur-md
              ${
                isActive
                  ? "bg-red-500/90 text-white shadow-lg shadow-red-500/50"
                  : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}
              border border-white/10
            `}
            title={preset.label}
          >
            <Icon className="w-5 h-5" />

            {/* Tooltip */}
            <div
              className={`
              absolute right-full mr-3
              px-3 py-1.5 rounded-lg
              bg-black/90 text-white text-xs font-medium
              whitespace-nowrap
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              pointer-events-none
              border border-white/10
            `}
            >
              {preset.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
