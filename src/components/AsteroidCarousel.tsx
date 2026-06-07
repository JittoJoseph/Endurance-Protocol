"use client";

import { NeoSummary } from "@/types";
import { motion } from "framer-motion";
import { DataCard, DataCardHeader } from "@/components/ui/data-card";

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
      <DataCard className="h-full flex items-center justify-center min-h-[150px]" padding="sm">
        <div className="text-white/40 text-xs">Loading...</div>
      </DataCard>
    );
  }

  return (
    <DataCard className="h-full flex flex-col p-0">
      <div className="px-3 py-2.5 border-b border-white/10">
        <DataCardHeader title="Near-Earth Objects" className="mb-0" />
      </div>

      {/* Mobile: Horizontal scroll at bottom */}
      <div className="md:hidden flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="flex px-3 py-2">
          {neos.map((neo, index) => (
            <button
              key={neo.id}
              onClick={() => onSelect(neo)}
              className={`flex-shrink-0 w-40 p-2.5 text-left transition-colors duration-150 ease-out border-r border-white/5 last:border-r-0 ${
                selectedId === neo.id
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <h3 className={`text-xs font-medium truncate flex-1 ${selectedId === neo.id ? 'text-white' : 'text-white/80'}`}>
                  {neo.name.replace(/[()]/g, "")}
                </h3>
                {neo.isPotentiallyHazardous && (
                  <span className="text-red-400 text-[8px] tracking-wider px-1 border border-red-500/20 rounded-sm">
                    PHA
                  </span>
                )}
              </div>
              <div className="text-white/40 text-[9px] space-y-1">
                <div className="flex justify-between">
                  <span>Ø</span>
                  <span className="text-white/60">
                    {Math.round(neo.estDiameterMeters.avg)}m
                  </span>
                </div>
                {neo.closeApproachData?.[0] && (
                  <div className="flex justify-between">
                    <span>V</span>
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
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Vertical scroll */}
      <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar">
        {neos.map((neo, index) => (
          <button
            key={neo.id}
            onClick={() => onSelect(neo)}
            className={`w-full px-3 py-2.5 text-left border-b border-white/5 last:border-b-0 transition-colors duration-150 ease-out group ${
              selectedId === neo.id
                ? "bg-white/10"
                : "hover:bg-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className={`text-xs font-medium truncate flex-1 transition-colors ${selectedId === neo.id ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                {neo.name.replace(/[()]/g, "")}
              </h3>
              {neo.isPotentiallyHazardous && (
                <span className="text-red-400 text-[9px] tracking-wider border border-red-500/20 px-1 rounded-sm">
                  PHA
                </span>
              )}
            </div>
            <div className="text-white/40 text-[10px] space-y-0.5">
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
          </button>
        ))}
      </div>
    </DataCard>
  );
}
