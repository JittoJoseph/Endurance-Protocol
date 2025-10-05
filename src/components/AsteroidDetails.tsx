"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeoSummary } from "@/types";

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
      className="absolute left-4 md:left-8 bottom-4 md:bottom-8 z-20 pointer-events-auto w-[calc(100%-2rem)] md:w-96 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar"
    >
      <div className="bg-black/90 backdrop-blur-xl border border-white/20 shadow-2xl p-4 md:p-5">
        {/* Header with collapse button */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">
              Target Asteroid
            </div>
            <h3 className="text-white text-xl md:text-2xl font-light tracking-wide truncate">
              {asteroid.name}
            </h3>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 ml-3 p-2 hover:bg-white/10 rounded transition-colors"
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="block text-white/60 hover:text-white text-sm"
            >
              ▼
            </motion.span>
          </button>
        </div>

        {/* Key Stats - Always Visible */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className="bg-white/5 border border-white/10 p-2 rounded">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
              Diameter
            </div>
            <div className="text-white font-mono text-base">
              {(asteroid.estDiameterMeters.avg / 1000).toFixed(3)} km
            </div>
          </div>
          {velocity && (
            <div className="bg-white/5 border border-white/10 p-2 rounded">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                Velocity
              </div>
              <div className="text-white font-mono text-base">
                {velocity.toFixed(2)} km/s
              </div>
            </div>
          )}
        </div>

        {asteroid.isPotentiallyHazardous && (
          <div className="flex items-center gap-2 mb-3 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-red-400 text-xs tracking-wide uppercase">
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
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3 border-t border-white/10 mt-3">
                {/* Diameter Range */}
                <div className="bg-white/5 border border-white/10 p-3 rounded">
                  <div className="text-white/60 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>📏</span>
                    <span>Size Estimate</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-white/70">
                      <span>Minimum:</span>
                      <span className="font-mono text-white">
                        {(asteroid.estDiameterMeters.min / 1000).toFixed(3)} km
                      </span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Average:</span>
                      <span className="font-mono text-cyan-400">
                        {(asteroid.estDiameterMeters.avg / 1000).toFixed(3)} km
                      </span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Maximum:</span>
                      <span className="font-mono text-white">
                        {(asteroid.estDiameterMeters.max / 1000).toFixed(3)} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Close Approach Data */}
                {asteroid.closeApproachData?.[0] && (
                  <div className="bg-white/5 border border-white/10 p-3 rounded">
                    <div className="text-white/60 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span>🌍</span>
                      <span>Close Approach</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-white/70">
                        <span>Velocity:</span>
                        <span className="font-mono text-white">
                          {parseFloat(
                            asteroid.closeApproachData[0].relativeVelocity
                              .kilometersPerSecond
                          ).toFixed(2)}{" "}
                          km/s
                        </span>
                      </div>
                      {missDistance && (
                        <div className="flex justify-between text-white/70">
                          <span>Miss Distance:</span>
                          <span className="font-mono text-white">
                            {(missDistance / 384400).toFixed(2)} LD
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-white/70">
                        <span>Orbiting:</span>
                        <span className="text-white">
                          {asteroid.closeApproachData[0].orbitingBody}
                        </span>
                      </div>
                    </div>
                    {missDistance && (
                      <div className="text-white/40 text-[10px] mt-2 italic">
                        * LD = Lunar Distance (384,400 km)
                      </div>
                    )}
                  </div>
                )}

                {/* NASA JPL Link */}
                <div className="pt-3 border-t border-white/10">
                  <a
                    href={jplUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full py-3 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 text-xs uppercase tracking-wider transition-all rounded group"
                  >
                    <span className="flex items-center gap-2">
                      <span>🔗</span>
                      <span>View on NASA JPL</span>
                    </span>
                    <span className="transform group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </a>
                  <div className="text-white/30 text-[10px] mt-2 text-center">
                    JPL Small-Body Database Browser
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-white/5 border border-white/10 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 text-sm flex-shrink-0">
                      ℹ️
                    </span>
                    <div className="text-[11px] leading-relaxed">
                      <div className="text-white/60 font-semibold mb-1">
                        Data Source
                      </div>
                      <div className="text-white/40">
                        NASA Near-Earth Object Web Service (NeoWs). Size
                        estimates based on absolute magnitude and albedo.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
