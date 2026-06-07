"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaRuler, FaGlobeAmericas, FaLink, FaArrowRight } from "react-icons/fa";
import { NeoSummary } from "@/types";
import { DataCard, OutlineButton } from "@/components/ui/data-card";

interface AsteroidDetailsProps {
  asteroid: NeoSummary;
}

export default function AsteroidDetails({ asteroid }: AsteroidDetailsProps) {
  const [expanded, setExpanded] = useState(false);

  const jplUrl = `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${asteroid.id}`;

  const velocity = asteroid.closeApproachData?.[0]
    ? parseFloat(
        asteroid.closeApproachData[0].relativeVelocity.kilometersPerSecond
      )
    : null;

  const missDistance = asteroid.closeApproachData?.[0]
    ? parseFloat(asteroid.closeApproachData[0].missDistance.kilometers)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="absolute left-4 md:left-8 bottom-40 md:bottom-8 z-20 pointer-events-auto w-[calc(100%-2rem)] md:w-80 max-h-[calc(100vh-20rem)] md:max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar"
    >
      <DataCard padding="md">
        {/* Header with collapse button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">
              Target Asteroid
            </div>
            <h3 className="text-white text-lg font-medium truncate">
              {asteroid.name}
            </h3>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 ml-3 p-1.5 hover:bg-white/10 rounded-sm transition-colors duration-150"
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.15 }}
              className="block text-white/60 hover:text-white text-xs"
            >
              <FaChevronDown />
            </motion.span>
          </button>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="border border-white/5 bg-white/5 p-2 rounded-sm">
            <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">
              Diameter
            </div>
            <div className="text-white/80 font-mono text-xs">
              {(asteroid.estDiameterMeters.avg / 1000).toFixed(3)} km
            </div>
          </div>
          {velocity && (
            <div className="border border-white/5 bg-white/5 p-2 rounded-sm">
              <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">
                Velocity
              </div>
              <div className="text-white/80 font-mono text-xs">
                {velocity.toFixed(2)} km/s
              </div>
            </div>
          )}
        </div>

        {asteroid.isPotentiallyHazardous && (
          <div className="flex items-center gap-2 mb-4 bg-red-500/10 border border-red-500/20 p-2 rounded-sm">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-red-400 text-[10px] uppercase tracking-wide font-medium">
              Potentially Hazardous
            </span>
          </div>
        )}

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3 border-t border-white/10">
                {/* Size Estimate */}
                <div className="border border-white/5 bg-white/5 p-3 rounded-sm">
                  <div className="text-white/60 text-[9px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FaRuler />
                    <span>Size Estimate</span>
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-white/50">
                      <span>Minimum:</span>
                      <span className="font-mono text-white/80">
                        {(asteroid.estDiameterMeters.min / 1000).toFixed(3)} km
                      </span>
                    </div>
                    <div className="flex justify-between text-white/50">
                      <span>Average:</span>
                      <span className="font-mono text-white">
                        {(asteroid.estDiameterMeters.avg / 1000).toFixed(3)} km
                      </span>
                    </div>
                    <div className="flex justify-between text-white/50">
                      <span>Maximum:</span>
                      <span className="font-mono text-white/80">
                        {(asteroid.estDiameterMeters.max / 1000).toFixed(3)} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Close Approach Data */}
                {asteroid.closeApproachData?.[0] && (
                  <div className="border border-white/5 bg-white/5 p-3 rounded-sm">
                    <div className="text-white/60 text-[9px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FaGlobeAmericas />
                      <span>Close Approach</span>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-white/50">
                        <span>Velocity:</span>
                        <span className="font-mono text-white/80">
                          {parseFloat(
                            asteroid.closeApproachData[0].relativeVelocity
                              .kilometersPerSecond
                          ).toFixed(2)}{" "}
                          km/s
                        </span>
                      </div>
                      {missDistance && (
                        <div className="flex justify-between text-white/50">
                          <span>Miss Distance:</span>
                          <span className="font-mono text-white/80">
                            {(missDistance / 384400).toFixed(2)} LD
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-white/50">
                        <span>Orbiting:</span>
                        <span className="text-white/80">
                          {asteroid.closeApproachData[0].orbitingBody}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* NASA JPL Link */}
                <div className="pt-2">
                  <a
                    href={jplUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] uppercase tracking-wider transition-colors duration-150 rounded-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <FaLink />
                      <span>View on NASA JPL</span>
                    </span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-150 ease-out">
                      <FaArrowRight />
                    </span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DataCard>
    </motion.div>
  );
}
