"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import AsteroidCarousel from "@/components/AsteroidCarousel";
import Controls from "@/components/Controls";
import InfoPanel from "@/components/InfoPanel";
import {
  NeoSummary,
  ImpactMetrics,
  CityPreset,
  GeminiPromptPayload,
} from "@/types";
import { calculateImpactMetrics } from "@/lib/physics";

// Dynamically import EarthScene to avoid SSR issues with Three.js
const EarthScene = dynamic(() => import("@/components/EarthScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-white">Loading 3D Scene...</div>
    </div>
  ),
});

export default function Home() {
  const [neos, setNeos] = useState<NeoSummary[]>([]);
  const [selectedNeo, setSelectedNeo] = useState<NeoSummary | null>(null);
  const [impactPoint, setImpactPoint] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityPreset | null>(null);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(
    null
  );
  const [geminiText, setGeminiText] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [dartTriggered, setDartTriggered] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [asteroidInFlight, setAsteroidInFlight] = useState(false);

  const fetchNeos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/neo");
      const data = await response.json();
      setNeos(data.neos);
      setIsCached(data.cached);

      if (data.cached) {
        showToast("Using cached asteroid data");
      }
    } catch (error) {
      console.error("Error fetching NEOs:", error);
      showToast("Failed to load asteroid data", true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch NEOs on mount
  useEffect(() => {
    fetchNeos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectNeo = (neo: NeoSummary) => {
    setSelectedNeo(neo);
    setImpactPoint(null);
    setSelectedCity(null);
    setImpactMetrics(null);
    setGeminiText(null);
    setShowInfoPanel(false);
    setDartTriggered(false);
  };

  const handleGlobeClick = (lat: number, lon: number) => {
    if (selectedNeo) {
      setImpactPoint({ lat, lon });
      setSelectedCity(null);
    }
  };

  const handleCityPreset = (city: CityPreset) => {
    if (selectedNeo) {
      setImpactPoint({ lat: city.lat, lon: city.lon });
      setSelectedCity(city);
    }
  };

  const handleImpact = async () => {
    if (!selectedNeo || !impactPoint) return;

    // Start asteroid animation
    setAsteroidInFlight(true);
  };

  const handleImpactComplete = async () => {
    if (!selectedNeo || !impactPoint) return;

    // Calculate impact metrics after animation
    const velocity = selectedNeo.closeApproachData?.[0]
      ? parseFloat(
          selectedNeo.closeApproachData[0].relativeVelocity.kilometersPerSecond
        )
      : 20;

    const metrics = calculateImpactMetrics(
      selectedNeo.estDiameterMeters.avg,
      velocity,
      3000,
      selectedCity?.population
    );

    setImpactMetrics(metrics);
    setShowInfoPanel(true);
    setDartTriggered(false);
    setAsteroidInFlight(false);

    // Fetch Gemini summary
    await fetchGeminiSummary(metrics, false);
  };

  const fetchGeminiSummary = async (
    metrics: ImpactMetrics,
    dartSuccess?: boolean
  ) => {
    setGeminiLoading(true);
    try {
      const payload: GeminiPromptPayload = {
        name: selectedNeo?.name || "Unknown",
        diameterMeters: selectedNeo?.estDiameterMeters.avg || 0,
        velocityKmS: selectedNeo?.closeApproachData?.[0]
          ? parseFloat(
              selectedNeo.closeApproachData[0].relativeVelocity
                .kilometersPerSecond
            )
          : 20,
        tntMegatons: metrics.tntMegatons,
        craterDiameterKm: metrics.craterDiameterKm,
        destructionRadiusKm: metrics.destructionRadiusKm,
        targetCity: selectedCity?.name,
        estimatedPopulationAffected: metrics.approxCasualties,
        dartSuccess,
      };

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptType: "compact",
          payload,
        }),
      });

      const data = await response.json();
      setGeminiText(data.summary);

      if (data.cached) {
        showToast("Using cached AI response");
      }
    } catch (error) {
      console.error("Error fetching Gemini summary:", error);
      setGeminiText("Failed to generate AI summary. Please try again.");
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleTryDart = async () => {
    setDartTriggered(true);

    // Simulate DART deflection
    setTimeout(async () => {
      if (impactMetrics) {
        // Recalculate with "successful" deflection (reduced impact)
        const reducedMetrics = { ...impactMetrics };
        reducedMetrics.tntMegatons *= 0.1; // Drastically reduced
        reducedMetrics.destructionRadiusKm *= 0.3;

        setImpactMetrics(reducedMetrics);
        await fetchGeminiSummary(reducedMetrics, true);
      }
    }, 1000);
  };

  const showToast = (message: string, isError = false) => {
    // Simple console log for now - could be replaced with a toast library
    console.log(isError ? "❌" : "✓", message);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3D Earth Canvas */}
      <div className="absolute inset-0 z-0">
        <EarthScene
          onGlobeClick={handleGlobeClick}
          impactPoint={impactPoint}
          asteroidInFlight={asteroidInFlight}
          asteroidSize={
            selectedNeo ? selectedNeo.estDiameterMeters.avg / 5000 : 0.1
          }
          onImpactComplete={handleImpactComplete}
        />
      </div>

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

      {/* Left Sidebar - Asteroid Selection */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute left-8 top-32 bottom-8 z-20 pointer-events-auto w-80"
      >
        <AsteroidCarousel
          neos={neos}
          onSelect={handleSelectNeo}
          selectedId={selectedNeo?.id}
          loading={loading}
        />
      </motion.div>

      {/* Right Sidebar - Controls */}
      {selectedNeo && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute right-8 top-32 z-20 pointer-events-auto w-80"
        >
          <Controls
            onPreset={handleCityPreset}
            onImpact={handleImpact}
            disabled={loading}
            hasSelection={!!impactPoint}
          />
        </motion.div>
      )}

      {/* Info Panel */}
      {showInfoPanel && (
        <InfoPanel
          impactMetrics={impactMetrics}
          geminiText={geminiText}
          onTryDart={handleTryDart}
          loading={geminiLoading}
          dartTriggered={dartTriggered}
          onClose={() => setShowInfoPanel(false)}
        />
      )}

      {/* Data Source Badge */}
      {isCached && (
        <div className="absolute top-6 right-8 z-30 text-white/30 text-xs tracking-wider">
          CACHED DATA
        </div>
      )}
    </div>
  );
}
