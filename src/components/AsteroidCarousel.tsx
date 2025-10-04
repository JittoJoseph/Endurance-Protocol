"use client";

import { NeoSummary } from "@/types";
import { motion } from "framer-motion";

interface AsteroidCarouselProps {
  neos: NeoSummary[];
  onSelect: (neo: NeoSummary) => void;
  selectedId?: string | null;
  loading?: boolean;
}

export default function AsteroidCarousel({
  neos,
  onSelect,
  selectedId,
  loading = false,
}: AsteroidCarouselProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <span className="text-white/40 text-xs tracking-widest uppercase">
            Loading
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-white/60 text-xs font-light mb-6 uppercase tracking-[0.2em]">
        Near-Earth Objects
      </h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {neos.map((neo, index) => (
          <motion.button
            key={neo.id}
            onClick={() => onSelect(neo)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className={`w-full p-4 text-left border-l-2 transition-all ${
              selectedId === neo.id
                ? "border-white bg-white/5"
                : "border-white/10 hover:border-white/30 hover:bg-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-white text-sm font-light truncate flex-1">
                {neo.name.replace(/[()]/g, "")}
              </h3>
              {neo.isPotentiallyHazardous && (
                <span className="text-red-400 text-[10px] tracking-wider">
                  PHA
                </span>
              )}
            </div>
            <div className="text-white/40 text-[11px] space-y-1 font-light">
              <div className="flex justify-between">
                <span>Diameter</span>
                <span className="text-white/60">
                  {Math.round(neo.estDiameterMeters.avg)}m
                </span>
              </div>
              {neo.closeApproachData?.[0] && (
                <div className="flex justify-between">
                  <span>Velocity</span>
                  <span className="text-white/60">
                    {parseFloat(
                      neo.closeApproachData[0].relativeVelocity
                        .kilometersPerSecond
                    ).toFixed(1)}{" "}
                    km/s
                  </span>
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
