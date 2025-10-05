"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import AsteroidCarousel from "@/components/AsteroidCarousel";
import ImpactStatsModal from "@/components/ImpactStatsModal";
import LiveFeed from "@/components/LiveFeed";
import AsteroidDetails from "@/components/AsteroidDetails";
import { NeoSummary } from "@/types";
import { getLocationDescription } from "@/lib/geocoding";

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

  // Fetch asteroids on mount
  useEffect(() => {
    fetchNeos();
  }, []);

  const fetchNeos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/neo");

      if (!response.ok) {
        console.error("Failed to load asteroid data");
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data.neos.length} asteroids`);
      setNeos(data.neos);
    } catch (error) {
      console.error("❌ Error fetching NEOs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNeo = (neo: NeoSummary) => {
    console.log("Selected asteroid:", neo.name);
    setSelectedNeo(neo);
    setShowDetails(true);
    setImpactLocation(null); // Reset impact point
  };

  const handleGlobeClick = (lat: number, lon: number) => {
    if (selectedNeo) {
      console.log(
        `Impact point selected: ${lat.toFixed(2)}, ${lon.toFixed(2)}`
      );
      setImpactLocation({ lat, lon });
      // Get continent/location from coordinates
      const locationDesc = getLocationDescription(lat, lon);
      setSelectedCityName(locationDesc);
    }
  };

  const handleImpact = () => {
    if (!selectedNeo || !impactLocation) return;
    console.log("🚀 Launching impact simulation");
    // Show stats modal immediately with 2D animation
    setShowStatsModal(true);
  };

  const handleReset = () => {
    setSelectedNeo(null);
    setImpactLocation(null);
    setShowDetails(false);
    setShowStatsModal(false);
    setSelectedCityName("");
  };

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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute top-6 left-8 z-10 pointer-events-none"
        >
          <h1 className="text-2xl font-light text-white tracking-[0.3em] uppercase">
            Endurance Protocol
          </h1>
          <p className="text-white/40 text-xs mt-1 tracking-[0.2em] uppercase font-light">
            Planetary Defense Simulation
          </p>
        </motion.div>

        {/* Live Feed - Top Right */}
        <AnimatePresence>
          {!showDetails && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="absolute top-20 md:top-6 right-4 md:right-8 z-20 pointer-events-auto w-[calc(100%-2rem)] md:w-96 max-w-md"
            >
              <LiveFeed onSelectAsteroid={handleSelectNeo} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Right - Quit Button (During Location Selection) */}
        <AnimatePresence>
          {showDetails && selectedNeo && !impactLocation && (
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              onClick={handleReset}
              className="absolute top-6 right-8 z-30 pointer-events-auto px-6 py-3 border border-white/20 hover:border-white/40 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-all"
            >
              ✕ Exit Selection
            </motion.button>
          )}
        </AnimatePresence>

        {/* Top Right Quit Button (When location selection active) */}
        <AnimatePresence>
          {showDetails && selectedNeo && !impactLocation && (
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              onClick={handleReset}
              className="absolute top-6 right-8 z-30 pointer-events-auto px-6 py-3 border border-white/20 hover:border-white/40 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-all"
            >
              ✕ Exit Selection
            </motion.button>
          )}
        </AnimatePresence>

        {/* Left Sidebar - Asteroid Carousel (Hidden when details shown) */}
        <AnimatePresence>
          {!showDetails && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute left-4 md:left-8 top-32 md:top-32 bottom-20 md:bottom-8 z-20 pointer-events-auto w-[calc(100%-2rem)] md:w-80 max-w-md"
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
          {showDetails && selectedNeo && (
            <AsteroidDetails asteroid={selectedNeo} />
          )}
        </AnimatePresence>

        {/* Step Indicator (When Selected) - Positioned at top for mobile responsiveness */}
        <AnimatePresence>
          {showDetails && selectedNeo && !impactLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center px-4"
            >
              <div className="bg-black/70 backdrop-blur-md border border-white/20 px-6 py-3 rounded-lg">
                <div className="text-white/80 text-sm md:text-base mb-1 font-light">
                  Step 2: Select Impact Location
                </div>
                <div className="text-white/50 text-xs">
                  Click on Earth or choose a city →
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Sidebar - City Presets (When Asteroid Selected) */}
        <AnimatePresence>
          {showDetails && selectedNeo && !impactLocation && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.8 }}
              className="absolute right-4 md:right-8 top-32 md:top-32 z-20 pointer-events-auto w-[calc(100%-2rem)] md:w-80 max-w-md"
            >
              <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-4 md:p-6 shadow-2xl max-h-[60vh] overflow-y-auto custom-scrollbar">
                <h3 className="text-white/60 text-xs font-light mb-4 uppercase tracking-[0.2em] sticky top-0 bg-black/90 pb-2">
                  Target Location
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      name: "New York",
                      lat: 40.7128,
                      lon: -74.006,
                      population: 8336817,
                    },
                    {
                      name: "London",
                      lat: 51.5074,
                      lon: -0.1278,
                      population: 9002488,
                    },
                    {
                      name: "Tokyo",
                      lat: 35.6762,
                      lon: 139.6503,
                      population: 13960000,
                    },
                    {
                      name: "Mumbai",
                      lat: 19.076,
                      lon: 72.8777,
                      population: 12442373,
                    },
                    {
                      name: "Sydney",
                      lat: -33.8688,
                      lon: 151.2093,
                      population: 5312000,
                    },
                  ].map((city) => (
                    <button
                      key={city.name}
                      onClick={() => {
                        console.log(
                          `Selected city: ${city.name} at ${city.lat}, ${city.lon}`
                        );
                        setSelectedCityName(city.name);
                        setImpactLocation({ lat: city.lat, lon: city.lon });
                      }}
                      className="w-full px-4 py-3 text-left border-l-2 border-white/10 hover:border-red-500/50 hover:bg-white/5 text-white/80 text-sm font-light transition-all"
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
                  className="w-full mt-6 py-2 border border-white/20 hover:border-white/40 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-all"
                >
                  ← Back to Asteroids
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Sidebar - Impact Control */}
        <AnimatePresence>
          {selectedNeo && impactLocation && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.8 }}
              className="absolute right-4 md:right-8 top-32 md:top-32 z-20 pointer-events-auto w-[calc(100%-2rem)] md:w-80 max-w-md"
            >
              <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-4 md:p-6 shadow-2xl">
                <h3 className="text-white text-base md:text-lg font-light tracking-wider mb-3 md:mb-4">
                  Impact Simulation Ready
                </h3>
                <div className="bg-white/5 border border-white/10 px-3 py-2 rounded mb-4 md:mb-6">
                  <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                    Target
                  </div>
                  <p className="text-white/80 text-sm font-mono">
                    {impactLocation.lat.toFixed(2)}°,{" "}
                    {impactLocation.lon.toFixed(2)}°
                  </p>
                  {selectedCityName && (
                    <p className="text-white/60 text-xs mt-1">
                      {selectedCityName}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <button
                    onClick={handleImpact}
                    className="flex-1 border-2 border-red-500/50 hover:border-red-400/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 py-3 px-4 transition-all duration-200 font-light tracking-wider uppercase text-sm rounded"
                  >
                    🎯 Simulate Impact
                  </button>
                  <button
                    onClick={handleReset}
                    className="sm:flex-shrink-0 px-4 py-3 border border-white/20 hover:border-white/40 text-white/60 hover:text-white transition-all font-light tracking-wider uppercase text-sm rounded"
                  >
                    ✕
                  </button>
                </div>

                <button
                  onClick={() => setImpactLocation(null)}
                  className="w-full mt-3 md:mt-4 py-2 border border-white/20 hover:border-white/40 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-all rounded"
                >
                  ← Change Location
                </button>
              </div>
            </motion.div>
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
      {selectedNeo && impactLocation && (
        <ImpactStatsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          asteroid={selectedNeo}
          impactLocation={impactLocation}
          cityName={selectedCityName}
        />
      )}
    </main>
  );
}
