"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeoSummary } from "@/types";

interface CloseApproach {
  id: string;
  name: string;
  date: string;
  time: string;
  velocity_km_s: number;
  miss_distance_km: number;
  miss_distance_lunar: number;
  diameter_m: { min: number; max: number; avg: number };
  is_potentially_hazardous: boolean;
}

interface LiveFeedProps {
  onSelectAsteroid: (asteroid: NeoSummary) => void;
}

export default function LiveFeed({ onSelectAsteroid }: LiveFeedProps) {
  const [approaches, setApproaches] = useState<CloseApproach[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchApproaches();
    // Refresh every 5 minutes
    const interval = setInterval(fetchApproaches, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchApproaches = async () => {
    try {
      const response = await fetch("/api/neo/today");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setApproaches(data.approaches || []);
      setError(false);
    } catch (err) {
      console.error("Error fetching live approaches:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntil = (time: string) => {
    const now = new Date().getTime();
    const approach = new Date(time).getTime();
    const diff = approach - now;

    if (diff < 0) return "Passed";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleSelectApproach = (approach: CloseApproach) => {
    // Convert to NeoSummary format
    const neo: NeoSummary = {
      id: approach.id,
      name: approach.name,
      estDiameterMeters: approach.diameter_m,
      isPotentiallyHazardous: approach.is_potentially_hazardous,
      closeApproachData: [
        {
          epochDateCloseApproach: new Date(approach.time).getTime(),
          relativeVelocity: {
            kilometersPerSecond: approach.velocity_km_s.toString(),
          },
          missDistance: {
            kilometers: approach.miss_distance_km.toString(),
          },
          orbitingBody: "Earth",
        },
      ],
    };
    onSelectAsteroid(neo);
    setExpanded(false);
  };

  if (loading) {
    return (
      <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-3">
        <div className="text-white/40 text-xs">Loading live data...</div>
      </div>
    );
  }

  if (error || approaches.length === 0) {
    return null; // Hide if error or no data
  }

  // Separate upcoming and passed approaches
  const now = new Date().getTime();
  const upcomingApproaches = approaches.filter(
    (a) => new Date(a.time).getTime() > now
  );
  const passedApproaches = approaches.filter(
    (a) => new Date(a.time).getTime() <= now
  );

  // Combine: upcoming first, then passed
  const sortedApproaches = [...upcomingApproaches, ...passedApproaches];
  const nextThree = sortedApproaches.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/60 backdrop-blur-md border border-white/10 overflow-hidden"
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 md:px-4 py-2 md:py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white/60 text-xs uppercase tracking-widest">
            Live: {upcomingApproaches.length} Upcoming
          </span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-white/40"
        >
          ▼
        </motion.div>
      </button>

      {/* Collapsed - Show next 3 - Clickable to expand */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-3 md:px-4 pb-2 md:pb-3 space-y-1 md:space-y-2 text-left hover:bg-white/5 transition-colors"
        >
          {nextThree.map((approach) => (
            <div
              key={approach.id + approach.time}
              className="text-xs text-white/50 flex items-center justify-between"
            >
              <span className="truncate max-w-[150px] md:max-w-[200px]">
                {approach.name}
              </span>
              <span className="text-white/40 ml-2">
                {getTimeUntil(approach.time)}
              </span>
            </div>
          ))}
        </button>
      )}

      {/* Expanded - Show all with details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className="max-h-64 md:max-h-96 overflow-y-auto custom-scrollbar">
              {sortedApproaches.map((approach) => (
                <motion.button
                  key={approach.id + approach.time}
                  onClick={() => handleSelectApproach(approach)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 hover:bg-white/5 border-b border-white/5 transition-colors text-left"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-start justify-between gap-2 md:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/80 text-xs md:text-sm font-light truncate">
                          {approach.name}
                        </span>
                        {approach.is_potentially_hazardous && (
                          <span className="text-red-400 text-[10px] uppercase tracking-wider">
                            PHA
                          </span>
                        )}
                      </div>
                      <div className="text-white/40 text-[10px] md:text-xs space-y-0.5">
                        <div>
                          Ø {(approach.diameter_m.avg / 1000).toFixed(2)} km •{" "}
                          {approach.velocity_km_s.toFixed(1)} km/s
                        </div>
                        <div>
                          Miss: {approach.miss_distance_lunar.toFixed(2)} LD
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-cyan-400 text-xs font-mono">
                        {getTimeUntil(approach.time)}
                      </div>
                      <div className="text-white/30 text-[10px] mt-0.5">
                        {new Date(approach.time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="px-3 md:px-4 py-2 bg-black/40 text-center">
              <span className="text-white/30 text-[10px] uppercase tracking-wider">
                Click any asteroid to simulate impact
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
