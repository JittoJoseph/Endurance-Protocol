"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import { NeoSummary } from "@/types";
import { DataCard, DataCardHeader } from "@/components/ui/data-card";

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
      <DataCard padding="sm">
        <div className="text-white/40 text-xs">Loading live data...</div>
      </DataCard>
    );
  }

  if (error || approaches.length === 0) {
    return null;
  }

  const now = new Date().getTime();
  const upcomingApproaches = approaches.filter(
    (a) => new Date(a.time).getTime() > now
  );
  const passedApproaches = approaches.filter(
    (a) => new Date(a.time).getTime() <= now
  );

  const sortedApproaches = [...upcomingApproaches, ...passedApproaches];
  const nextThree = sortedApproaches.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative"
    >
      <DataCard padding="none">
        <div className="flex flex-col w-full h-full">
            <button
            onClick={() => setExpanded(!expanded)}
            className="w-full p-3 hover:bg-white/5 transition-colors duration-150 ease-out flex items-center justify-between"
            >
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">
                Live Feed • {upcomingApproaches.length} Upcoming
                </span>
            </div>
            <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.15 }}
                className="text-white/40 text-xs"
            >
                <FaChevronDown />
            </motion.div>
            </button>

            {!expanded && (
            <div className="px-3 pb-3 flex flex-col">
                {nextThree.map((approach, idx) => (
                <button
                    key={approach.id + approach.time}
                    onClick={() => handleSelectApproach(approach)}
                    className={`w-full text-left text-xs py-2 flex items-center justify-between hover:text-white transition-colors duration-150 ease-out group ${idx !== nextThree.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                    <span className="truncate max-w-[200px] text-white/70 group-hover:text-white transition-colors">
                    {approach.name}
                    </span>
                    <span className="text-white/40 group-hover:text-white/60 transition-colors">
                    {getTimeUntil(approach.time)}
                    </span>
                </button>
                ))}
            </div>
            )}

            <AnimatePresence>
            {expanded && (
                <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-white/10"
                >
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {sortedApproaches.map((approach) => (
                    <button
                        key={approach.id + approach.time}
                        onClick={() => handleSelectApproach(approach)}
                        className="w-full px-3 py-2.5 hover:bg-white/5 border-b border-white/5 transition-colors duration-150 text-left group"
                    >
                        <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-white/80 text-xs font-medium truncate group-hover:text-white transition-colors">
                                {approach.name}
                            </span>
                            {approach.is_potentially_hazardous && (
                                <span className="text-red-400 text-[9px] uppercase tracking-wider px-1 border border-red-500/20 rounded-sm">
                                PHA
                                </span>
                            )}
                            </div>
                            <div className="text-white/40 text-[10px] space-y-0.5">
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
                            <div className="text-cyan-400/80 text-xs font-mono">
                            {getTimeUntil(approach.time)}
                            </div>
                            <div className="text-white/30 text-[9px] mt-0.5">
                            {new Date(approach.time).toLocaleDateString()}
                            </div>
                        </div>
                        </div>
                    </button>
                    ))}
                </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </DataCard>
    </motion.div>
  );
}
