"use client";

import { motion } from "framer-motion";
import { CityPreset } from "@/types";

interface ControlsProps {
  onPreset: (city: CityPreset) => void;
  onImpact: () => void;
  disabled?: boolean;
  hasSelection?: boolean;
}

const CITY_PRESETS: CityPreset[] = [
  { name: "New York", lat: 40.7128, lon: -74.006, population: 8336817 },
  { name: "London", lat: 51.5074, lon: -0.1278, population: 9002488 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, population: 13960000 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777, population: 12442373 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, population: 5312000 },
];

export default function Controls({
  onPreset,
  onImpact,
  disabled = false,
  hasSelection = false,
}: ControlsProps) {
  return (
    <div className="space-y-8">
      {/* Target Selection */}
      <div>
        <h3 className="text-white/60 text-xs font-light mb-4 uppercase tracking-[0.2em]">
          Target Location
        </h3>
        <div className="space-y-2">
          {CITY_PRESETS.map((city) => (
            <motion.button
              key={city.name}
              onClick={() => onPreset(city)}
              disabled={disabled}
              className="w-full px-4 py-3 text-left border-l-2 border-white/10 hover:border-white/30 hover:bg-white/5 text-white/80 text-sm font-light transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={{ x: disabled ? 0 : 4 }}
            >
              <div className="flex justify-between items-center">
                <span>{city.name}</span>
                <span className="text-white/40 text-xs">
                  {(city.population / 1000000).toFixed(1)}M
                </span>
              </div>
            </motion.button>
          ))}
        </div>
        <p className="text-white/30 text-[10px] mt-3 tracking-wider uppercase">
          Or click on globe
        </p>
      </div>

      {/* Impact Button */}
      <motion.button
        onClick={onImpact}
        disabled={disabled || !hasSelection}
        className="w-full py-4 border border-white/20 hover:border-white text-white/80 hover:text-white text-sm font-light uppercase tracking-[0.2em] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        whileHover={{ scale: disabled || !hasSelection ? 1 : 1.02 }}
        whileTap={{ scale: disabled || !hasSelection ? 1 : 0.98 }}
      >
        {hasSelection ? "Execute Impact" : "Select Target"}
      </motion.button>
    </div>
  );
}
