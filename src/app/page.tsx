"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import AsteroidCarousel from "@/components/AsteroidCarousel";
import ImpactStatsModal from "@/components/ImpactStatsModal";
import LiveFeed from "@/components/LiveFeed";
import AsteroidDetails from "@/components/AsteroidDetails";
import { NeoSummary } from "@/types";
import { getLocationDescription } from "@/lib/geocoding";

// Static data - moved outside component to avoid recreation
const TARGET_CITIES = [
  { name: "New York", lat: 40.7128, lon: -74.006, population: 8336817 },
  { name: "London", lat: 51.5074, lon: -0.1278, population: 9002488 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, population: 13960000 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777, population: 12442373 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, population: 5312000 },
] as const;

type CityType = (typeof TARGET_CITIES)[number];

// Animation variants for better performance
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3 },
};

const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

// Dynamically import EarthScene to avoid SSR issues
const EarthScene = dynamic(() => import("@/components/EarthScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-white text-xl">Loading Earth...</div>
    </div>
  ),
});

export default function Home() {
  // Data state
  const [neos, setNeos] = useState<NeoSummary[]>([]);
  const [selectedNeo, setSelectedNeo] = useState<NeoSummary | null>(null);
  const [impactLocation, setImpactLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showDetails, setShowDetails] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedCityName, setSelectedCityName] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);

  // Memoized derived state
  const isSelectionMode = useMemo(
    () => showDetails && selectedNeo && !impactLocation,
    [showDetails, selectedNeo, impactLocation]
  );

  const isImpactReady = useMemo(
    () => selectedNeo && impactLocation,
    [selectedNeo, impactLocation]
  );

  // Fetch asteroids on mount
  useEffect(() => {
    fetchNeos();
  }, []);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchNeos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/neo");
      if (!response.ok) {
        console.error("Failed to load asteroid data");
        setLoading(false);
        return;
      }
      const data = await response.json();
      setNeos(data.neos);
    } catch (error) {
      console.error("❌ Error fetching NEOs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectNeo = useCallback((neo: NeoSummary) => {
    setSelectedNeo(neo);
    setShowDetails(true);
    setImpactLocation(null);
  }, []);

  const handleGlobeClick = useCallback(
    (lat: number, lon: number) => {
      if (!selectedNeo) return;
      setImpactLocation({ lat, lon });
      setSelectedCityName(getLocationDescription(lat, lon));
    },
    [selectedNeo]
  );

  const handleImpact = useCallback(() => {
    if (!selectedNeo || !impactLocation) return;
    setShowStatsModal(true);
  }, [selectedNeo, impactLocation]);

  const handleReset = useCallback(() => {
    setSelectedNeo(null);
    setImpactLocation(null);
    setShowDetails(false);
    setShowStatsModal(false);
    setSelectedCityName("");
  }, []);

  const handleCitySelect = useCallback((city: CityType) => {
    setSelectedCityName(city.name);
    setImpactLocation({ lat: city.lat, lon: city.lon });
  }, []);

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <EarthScene
          impactLocation={impactLocation}
          onGlobeClick={handleGlobeClick}
        />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Minimal Header */}
        <motion.div
          {...fadeInDown}
          transition={{ duration: 0.6 }}
          className="absolute top-4 left-4 md:top-6 md:left-8 z-10 pointer-events-none"
        >
          <h1 className="text-xl md:text-2xl font-light text-white tracking-[0.3em] uppercase">
            Endurance Protocol
          </h1>
          <p className="text-white/40 text-xs mt-1 tracking-[0.2em] uppercase font-light">
            Planetary Defense Simulation
          </p>
        </motion.div>

        {/* Live Feed - Top Right on Desktop, Top Center on Mobile */}
        <AnimatePresence>
          {!showDetails && (
            <motion.div
              {...fadeInDown}
              transition={{ duration: 0.6 }}
              className="absolute top-16 md:top-6 left-4 right-4 md:left-auto md:right-8 z-20 pointer-events-auto md:w-96 max-w-md"
            >
              <LiveFeed onSelectAsteroid={handleSelectNeo} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Right - Quit Button (During Location Selection) */}
        <AnimatePresence>
          {isSelectionMode && (
            <motion.button
              {...fadeInDown}
              transition={{ duration: 0.4 }}
              onClick={handleReset}
              className="absolute top-16 md:top-6 right-4 md:right-8 z-30 pointer-events-auto px-4 py-2 md:px-6 md:py-3 border border-white/20 hover:border-white/40 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-all will-change-transform"
            >
              ✕ Exit Selection
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bottom Carousel - Asteroid Carousel (Mobile) */}
        <AnimatePresence>
          {!showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4 }}
              className="md:hidden absolute bottom-4 left-4 right-4 z-20 pointer-events-auto h-32"
            >
              <AsteroidCarousel
                neos={neos}
                selectedId={selectedNeo?.id}
                onSelect={handleSelectNeo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Sidebar - Asteroid Carousel (Desktop) */}
        <AnimatePresence>
          {!showDetails && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="hidden md:block absolute left-8 top-32 bottom-8 z-20 pointer-events-auto w-80 max-w-md"
            >
              <AsteroidCarousel
                neos={neos}
                selectedId={selectedNeo?.id}
                onSelect={handleSelectNeo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Asteroid Details (When Selected) - Expandable */}
        <AnimatePresence>
          {showDetails && selectedNeo && (!impactLocation || !isMobile) && (
            <AsteroidDetails asteroid={selectedNeo} />
          )}
        </AnimatePresence>

        {/* City Presets - Mobile: Bottom horizontal scroll, Desktop: Right sidebar */}
        <AnimatePresence>
          {isSelectionMode && (
            <>
              {/* Mobile: Bottom horizontal scroll */}
              <motion.div
                {...fadeInUp}
                transition={{ duration: 0.4 }}
                className="md:hidden absolute bottom-4 left-4 right-4 z-20 pointer-events-auto"
              >
                <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-3 shadow-2xl will-change-transform">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-xs uppercase tracking-widest">
                      Target Cities
                    </span>
                    <span className="text-white/30 text-[10px] uppercase">
                      Or tap Earth
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {TARGET_CITIES.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleCitySelect(city)}
                        className="flex-shrink-0 px-3 py-2 border border-white/20 hover:border-red-500/50 hover:bg-white/5 text-white/80 text-xs font-light transition-all rounded whitespace-nowrap will-change-transform"
                      >
                        <div className="text-center">
                          <div>{city.name}</div>
                          <div className="text-white/40 text-[10px]">
                            {(city.population / 1000000).toFixed(1)}M
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Desktop: Right sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.6 }}
                className="hidden md:block absolute right-8 top-32 z-20 pointer-events-auto w-80 max-w-md max-h-[60vh] overflow-y-auto custom-scrollbar"
              >
                <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-6 shadow-2xl will-change-transform">
                  <h3 className="text-white/60 text-xs font-light mb-4 uppercase tracking-[0.2em] sticky top-0 bg-black/90 pb-2">
                    Target Location
                  </h3>
                  <div className="space-y-2">
                    {TARGET_CITIES.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleCitySelect(city)}
                        className="w-full px-4 py-3 text-left border-l-2 border-white/10 hover:border-red-500/50 hover:bg-white/5 text-white/80 text-sm font-light transition-all will-change-transform"
                      >
                        <div className="flex justify-between items-center">
                          <span>{city.name}</span>
                          <span className="text-white/40 text-xs">
                            {(city.population / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-white/30 text-[10px] mt-4 tracking-wider uppercase">
                    Or click on Earth
                  </p>

                  <button
                    onClick={handleReset}
                    className="w-full mt-6 py-2 border border-white/20 hover:border-white/40 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-all will-change-transform"
                  >
                    ← Back to Asteroids
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Impact Control - Mobile: Bottom overlay, Desktop: Right sidebar */}
        <AnimatePresence>
          {isImpactReady && (
            <>
              {/* Mobile: Bottom overlay */}
              <motion.div
                {...fadeInUp}
                transition={{ duration: 0.4 }}
                className="md:hidden absolute bottom-4 left-4 right-4 z-20 pointer-events-auto"
              >
                <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-4 shadow-2xl will-change-transform">
                  <h3 className="text-white text-base font-light tracking-wider mb-3">
                    Impact Simulation Ready
                  </h3>
                  <div className="bg-white/5 border border-white/10 px-3 py-2 rounded mb-4">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                      Target
                    </div>
                    <p className="text-white/80 text-sm font-mono">
                      {impactLocation!.lat.toFixed(2)}°,{" "}
                      {impactLocation!.lon.toFixed(2)}°
                    </p>
                    {selectedCityName && (
                      <p className="text-white/60 text-xs mt-1">
                        {selectedCityName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleImpact}
                      className="flex-1 border-2 border-red-500/50 hover:border-red-400/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 py-3 px-4 transition-all duration-200 font-light tracking-wider uppercase text-sm rounded will-change-transform"
                    >
                      🎯 Simulate Impact
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-3 border border-white/20 hover:border-white/40 text-white/60 hover:text-white transition-all font-light tracking-wider uppercase text-sm rounded will-change-transform"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    onClick={() => setImpactLocation(null)}
                    className="w-full mt-3 py-2 border border-white/20 hover:border-white/40 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-all rounded will-change-transform"
                  >
                    ← Change Location
                  </button>
                </div>
              </motion.div>

              {/* Desktop: Right sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.6 }}
                className="hidden md:block absolute right-8 top-32 z-20 pointer-events-auto w-80 max-w-md"
              >
                <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-6 shadow-2xl will-change-transform">
                  <h3 className="text-white text-lg font-light tracking-wider mb-4">
                    Impact Simulation Ready
                  </h3>
                  <div className="bg-white/5 border border-white/10 px-3 py-2 rounded mb-6">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                      Target
                    </div>
                    <p className="text-white/80 text-sm font-mono">
                      {impactLocation!.lat.toFixed(2)}°,{" "}
                      {impactLocation!.lon.toFixed(2)}°
                    </p>
                    {selectedCityName && (
                      <p className="text-white/60 text-xs mt-1">
                        {selectedCityName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleImpact}
                      className="flex-1 border-2 border-red-500/50 hover:border-red-400/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 py-3 px-4 transition-all duration-200 font-light tracking-wider uppercase text-sm rounded will-change-transform"
                    >
                      🎯 Simulate Impact
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-3 border border-white/20 hover:border-white/40 text-white/60 hover:text-white transition-all font-light tracking-wider uppercase text-sm rounded will-change-transform"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    onClick={() => setImpactLocation(null)}
                    className="w-full mt-4 py-2 border border-white/20 hover:border-white/40 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-all rounded will-change-transform"
                  >
                    ← Change Location
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-white text-xl">Loading asteroid data...</div>
          </div>
        )}
      </div>

      {/* Impact Statistics Modal */}
      {isImpactReady && (
        <ImpactStatsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          asteroid={selectedNeo!}
          impactLocation={impactLocation!}
          cityName={selectedCityName}
        />
      )}
    </main>
  );
}
