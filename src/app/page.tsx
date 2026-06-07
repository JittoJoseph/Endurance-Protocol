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
import { DataCard, DataCardHeader, PrimaryButton, OutlineButton } from "@/components/ui/data-card";
import { FaTimes, FaArrowLeft } from "react-icons/fa";

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
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.2 },
};

const fadeInDown = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 },
};

// Dynamically import EarthScene to avoid SSR issues
const EarthScene = dynamic(() => import("@/components/EarthScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-white/40 text-xs uppercase tracking-widest">Loading Earth...</div>
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
    <main className="relative w-screen h-screen bg-black overflow-hidden font-sans">
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
          className="absolute top-6 left-6 md:top-8 md:left-8 z-10 pointer-events-none"
        >
          <h1 className="text-white text-lg font-medium tracking-tight drop-shadow-md">
            Endurance Protocol
          </h1>
          <p className="text-white/60 text-[10px] mt-1 uppercase tracking-widest drop-shadow-md">
            Planetary Defense Simulation
          </p>
        </motion.div>

        {/* Live Feed - Top Right on Desktop, Top Center on Mobile */}
        <AnimatePresence>
          {!showDetails && (
            <motion.div
              {...fadeInDown}
              transition={{ duration: 0.6 }}
              className="absolute top-20 md:top-8 left-6 right-6 md:left-auto md:right-8 z-20 pointer-events-auto md:w-80"
            >
              <LiveFeed onSelectAsteroid={handleSelectNeo} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Right - Quit Button (During Location Selection) */}
        <AnimatePresence>
          {isSelectionMode && (
            <motion.div
              {...fadeInDown}
              transition={{ duration: 0.4 }}
              className="absolute top-20 md:top-8 right-6 md:right-8 z-30 pointer-events-auto"
            >
              <OutlineButton onClick={handleReset} className="shadow-lg text-[10px] uppercase tracking-wider py-1.5 px-3">
                <FaTimes className="inline mr-1" /> Exit Selection
              </OutlineButton>
            </motion.div>
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
              className="md:hidden absolute bottom-6 left-6 right-6 z-20 pointer-events-auto h-32"
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
              className="hidden md:block absolute left-8 top-32 bottom-8 z-20 pointer-events-auto w-80"
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
                className="md:hidden absolute bottom-6 left-6 right-6 z-20 pointer-events-auto"
              >
                <DataCard padding="sm">
                  <DataCardHeader title="Target Cities" action={<span className="text-white/40 text-[9px] uppercase tracking-wider">Or tap Earth</span>} />
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {TARGET_CITIES.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleCitySelect(city)}
                        className="flex-shrink-0 px-3 py-2 border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white text-xs transition-colors duration-150 rounded-sm whitespace-nowrap"
                      >
                        <div className="text-center">
                          <div className="font-medium mb-0.5">{city.name}</div>
                          <div className="text-white/40 text-[10px] font-mono">
                            {(city.population / 1000000).toFixed(1)}M
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </DataCard>
              </motion.div>

              {/* Desktop: Right sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
                className="hidden md:block absolute right-8 top-32 z-20 pointer-events-auto w-80 max-h-[60vh] overflow-y-auto custom-scrollbar"
              >
                <DataCard padding="md">
                  <div className="sticky top-0 bg-black/80 backdrop-blur-md pb-3 -mx-4 px-4 z-10 border-b border-white/5">
                    <DataCardHeader title="Target Location" className="mb-0" />
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {TARGET_CITIES.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleCitySelect(city)}
                        className="w-full px-3 py-2.5 text-left border border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white transition-colors duration-150 rounded-sm"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium">{city.name}</span>
                          <span className="text-white/40 font-mono">
                            {(city.population / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-white/40 text-[9px] mt-4 tracking-wider uppercase text-center">
                    Or click on Earth
                  </p>

                  <OutlineButton onClick={handleReset} className="w-full mt-4">
                    <FaArrowLeft className="inline mr-1" /> Back to Asteroids
                  </OutlineButton>
                </DataCard>
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
                className="md:hidden absolute bottom-6 left-6 right-6 z-20 pointer-events-auto"
              >
                <DataCard padding="md">
                  <h3 className="text-white text-base font-medium mb-3">
                    Impact Ready
                  </h3>
                  <div className="border border-white/5 bg-white/5 p-3 rounded-sm mb-4">
                    <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">
                      Target Coordinates
                    </div>
                    <p className="text-white/80 text-xs font-mono">
                      {impactLocation!.lat.toFixed(2)}°,{" "}
                      {impactLocation!.lon.toFixed(2)}°
                    </p>
                    {selectedCityName && (
                      <p className="text-white/60 text-[10px] mt-1">
                        {selectedCityName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-col">
                    <PrimaryButton onClick={handleImpact} className="w-full py-2.5">
                      Simulate Impact
                    </PrimaryButton>
                    <div className="flex gap-2">
                        <OutlineButton onClick={() => setImpactLocation(null)} className="flex-1 py-2 text-[10px]">
                        <FaArrowLeft className="inline mr-1" /> Change
                        </OutlineButton>
                        <OutlineButton onClick={handleReset} className="flex-shrink-0 px-4 py-2">
                        <FaTimes />
                        </OutlineButton>
                    </div>
                  </div>
                </DataCard>
              </motion.div>

              {/* Desktop: Right sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
                className="hidden md:block absolute right-8 top-32 z-20 pointer-events-auto w-80"
              >
                <DataCard padding="md">
                  <h3 className="text-white text-lg font-medium mb-4">
                    Impact Ready
                  </h3>
                  <div className="border border-white/5 bg-white/5 p-3 rounded-sm mb-4">
                    <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">
                      Target Coordinates
                    </div>
                    <p className="text-white/80 text-xs font-mono">
                      {impactLocation!.lat.toFixed(2)}°,{" "}
                      {impactLocation!.lon.toFixed(2)}°
                    </p>
                    {selectedCityName && (
                      <p className="text-white/60 text-[10px] mt-1">
                        {selectedCityName}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <PrimaryButton onClick={handleImpact} className="w-full py-2.5">
                      Simulate Impact
                    </PrimaryButton>
                    <div className="flex gap-2 mt-2">
                        <OutlineButton onClick={() => setImpactLocation(null)} className="flex-1">
                        <FaArrowLeft className="inline mr-1" /> Change Location
                        </OutlineButton>
                        <OutlineButton onClick={handleReset} className="flex-shrink-0 px-3">
                        <FaTimes />
                        </OutlineButton>
                    </div>
                  </div>
                </DataCard>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <DataCard padding="md">
              <div className="flex flex-col items-center gap-3">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest">Loading data...</div>
              </div>
            </DataCard>
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
