"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeoSummary } from "@/types";
import { calculateImpactMetrics } from "@/lib/physics";
import Image from "next/image";

interface ImpactStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asteroid: NeoSummary;
  impactLocation: { lat: number; lon: number };
  cityName?: string;
}

interface GeminiAnalysis {
  summary: string;
  keyPoints: string[];
  recommendations: string[];
}

type TrajectoryStage = "idle" | "animating" | "complete";

const PATH_MARGIN = 12;
const PATH_RANGE = 100 - PATH_MARGIN * 2;
const ASTEROID_SIZE = 72;
const DART_SIZE = 40;
const EARTH_SIZE = 140;

interface ImpactTrajectoryProps {
  asteroidName: string;
  onProgress: (value: number) => void;
  onComplete: () => void;
}

function ImpactTrajectory({
  asteroidName,
  onProgress,
  onComplete,
}: ImpactTrajectoryProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    let start: number | null = null;
    const duration = 3600;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const ratio = Math.min(elapsed / duration, 1);
      setProgress(ratio);
      onProgress(ratio);

      if (ratio < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onProgress, onComplete]);

  const asteroidPercent = PATH_MARGIN + progress * PATH_RANGE;
  const earthPercent = PATH_MARGIN + PATH_RANGE;
  const coverPercent = Math.max(
    0,
    Math.min(((asteroidPercent - PATH_MARGIN) / PATH_RANGE) * 100, 100)
  );
  const showImpact = progress >= 0.98;

  return (
    <>
      <div className="relative mt-6 h-16">
        <div
          className="absolute"
          style={{
            top: "50%",
            left: `${PATH_MARGIN}%`,
            right: `${PATH_MARGIN}%`,
            transform: "translateY(-50%)",
          }}
        >
          <div className="relative h-0">
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 border-t border-dashed border-white/25" />
            <div
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-black/80"
              style={{ width: `${coverPercent}%` }}
            />
          </div>
        </div>

        {/* Earth */}
        <div
          className="absolute"
          style={{
            left: `calc(${earthPercent}% - ${EARTH_SIZE / 2}px)`,
            top: `calc(50% - ${EARTH_SIZE / 2}px)`,
          }}
        >
          <Image
            src="/earth.png"
            alt="Earth"
            width={EARTH_SIZE}
            height={EARTH_SIZE}
            className="object-contain drop-shadow-[0_6px_20px_rgba(76,154,255,0.25)]"
          />
        </div>

        {/* Asteroid */}
        {progress < 1 && (
          <div
            className="absolute z-10"
            style={{
              left: `calc(${asteroidPercent}% - ${ASTEROID_SIZE / 2}px)`,
              top: `calc(50% - ${ASTEROID_SIZE / 2}px)`,
            }}
          >
            <Image
              src="/sattelite.png"
              alt={asteroidName}
              width={ASTEROID_SIZE}
              height={ASTEROID_SIZE}
              className="object-contain"
              style={{
                filter:
                  "brightness(0.75) contrast(1.2) saturate(0.65) sepia(0.35) hue-rotate(18deg)",
              }}
            />
          </div>
        )}

        <AnimatePresence>
          {showImpact && (
            <motion.div
              key="impact-flash"
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: [0.3, 1.5, 1.3], opacity: [0.8, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute pointer-events-none z-30"
              style={{
                left: `calc(${earthPercent}% - 20px)`,
                top: `calc(50% - 20px)`,
              }}
            >
              <div className="relative w-10 h-10">
                {/* Core explosion - more intense */}
                <div className="absolute inset-0 bg-gradient-radial from-white via-yellow-400/95 to-orange-500/80 rounded-full blur-sm" />
                <div className="absolute inset-0.5 bg-gradient-radial from-yellow-300/90 via-red-500/70 to-transparent rounded-full blur" />

                {/* Heavy impact particles */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-2 bg-gradient-to-t from-red-700 via-orange-500 to-yellow-300 rounded-full"
                    style={{
                      top: "50%",
                      left: "50%",
                      transformOrigin: "bottom center",
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1.2, 0.8],
                      opacity: [1, 0.9, 0],
                      rotate: [0, i * 30 - 180], // 12 particles, 30 degrees apart
                      x: [0, Math.cos((i * Math.PI) / 6) * 15],
                      y: [0, Math.sin((i * Math.PI) / 6) * 15],
                    }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                      delay: i * 0.02,
                    }}
                  />
                ))}

                {/* Intense shockwave */}
                <motion.div
                  className="absolute inset-0 border-2 border-yellow-400/80 rounded-full"
                  animate={{
                    scale: [1, 2.8],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                />

                {/* Secondary shockwave */}
                <motion.div
                  className="absolute inset-0 border border-red-500/60 rounded-full"
                  animate={{
                    scale: [1, 3.2],
                    opacity: [0.7, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeOut",
                    delay: 0.1,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-between text-[10px] uppercase tracking-[0.28em] text-white/45">
        <span>{asteroidName.toUpperCase()}</span>
        <span>Earth</span>
      </div>
    </>
  );
}

interface DartTrajectoryProps {
  stage: TrajectoryStage;
  asteroidName: string;
  onProgress?: (value: number) => void;
  onComplete: () => void;
}

function DartTrajectory({
  stage,
  asteroidName,
  onProgress,
  onComplete,
}: DartTrajectoryProps) {
  const [progress, setProgress] = useState(stage === "complete" ? 1 : 0);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const interceptRatio = 0.6;

  useEffect(() => {
    if (stage === "animating") {
      completedRef.current = false;
      let start: number | null = null;
      const duration = 3800;

      const step = (timestamp: number) => {
        if (start === null) start = timestamp;
        const elapsed = timestamp - start;
        const ratio = Math.min(elapsed / duration, 1);
        setProgress(ratio);
        onProgress?.(ratio);

        if (ratio < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      };

      rafRef.current = requestAnimationFrame(step);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    if (stage === "idle") {
      setProgress(0);
      onProgress?.(0);
    }

    if (stage === "complete") {
      setProgress(1);
      onProgress?.(1);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stage, onComplete, onProgress]);

  const approachPhase = Math.min(progress / interceptRatio, 1);
  const postIntercept =
    progress > interceptRatio
      ? (progress - interceptRatio) / (1 - interceptRatio)
      : 0;

  const asteroidRatio = Math.min(
    approachPhase * interceptRatio,
    interceptRatio
  );
  const dartRatio = 1 - (1 - interceptRatio) * approachPhase;

  const asteroidPercent = PATH_MARGIN + asteroidRatio * PATH_RANGE;
  const dartPercent = PATH_MARGIN + dartRatio * PATH_RANGE;
  const earthPercent = PATH_MARGIN + PATH_RANGE;

  const coverPercent = Math.max(
    0,
    Math.min(((asteroidPercent - PATH_MARGIN) / PATH_RANGE) * 100, 100)
  );

  const asteroidOpacity =
    progress < interceptRatio ? 1 : Math.max(1 - postIntercept * 3.2, 0);
  const dartOpacity =
    progress < interceptRatio ? 1 : Math.max(1 - postIntercept * 4.5, 0);
  const showDeflection = progress >= interceptRatio;
  const showAsteroidSprite = asteroidOpacity > 0.05;
  const showDartSprite = dartOpacity > 0.05;

  return (
    <>
      <div className="relative mt-6 h-16">
        <div
          className="absolute"
          style={{
            top: "50%",
            left: `${PATH_MARGIN}%`,
            right: `${PATH_MARGIN}%`,
            transform: "translateY(-50%)",
          }}
        >
          <div className="relative h-0">
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 border-t border-dashed border-white/25" />
            <div
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-black/80"
              style={{ width: `${coverPercent}%` }}
            />
          </div>
        </div>

        {/* Earth */}
        <div
          className="absolute"
          style={{
            left: `calc(${earthPercent}% - ${EARTH_SIZE / 2}px)`,
            top: `calc(50% - ${EARTH_SIZE / 2}px)`,
          }}
        >
          <Image
            src="/earth.png"
            alt="Earth"
            width={EARTH_SIZE}
            height={EARTH_SIZE}
            className="object-contain drop-shadow-[0_6px_20px_rgba(76,154,255,0.25)]"
          />
        </div>

        {/* Asteroid */}
        {showAsteroidSprite && (
          <div
            className="absolute z-10"
            style={{
              left: `calc(${asteroidPercent}% - ${ASTEROID_SIZE / 2}px)`,
              top: `calc(50% - ${ASTEROID_SIZE / 2}px + ${
                -postIntercept * 48
              }px)`,
              opacity: asteroidOpacity,
              transition: stage === "animating" ? "none" : "opacity 0.4s ease",
            }}
          >
            <Image
              src="/sattelite.png"
              alt={asteroidName}
              width={ASTEROID_SIZE}
              height={ASTEROID_SIZE}
              className="object-contain"
              style={{
                filter:
                  "brightness(0.7) contrast(1.25) saturate(0.65) sepia(0.35) hue-rotate(18deg)",
              }}
            />
          </div>
        )}

        {/* DART */}
        {showDartSprite && (
          <div
            className="absolute z-20"
            style={{
              left: `calc(${dartPercent}% - ${DART_SIZE / 2}px)`,
              top: `calc(50% - ${DART_SIZE / 2}px + ${
                -Math.min(progress, 0.5) * 12
              }px)`,
              opacity: dartOpacity,
              transition: stage === "animating" ? "none" : "opacity 0.4s ease",
            }}
          >
            <Image
              src="/dart.png"
              alt="DART spacecraft"
              width={DART_SIZE}
              height={DART_SIZE}
              className="object-contain"
            />
          </div>
        )}

        {/* Intercept marker */}
        <div
          className="absolute top-1/2 -mt-1 h-2 w-2 rounded-full"
          style={{
            left: `calc(${PATH_MARGIN + interceptRatio * PATH_RANGE}% - 4px)`,
            backgroundColor:
              stage === "complete"
                ? "rgba(34,197,94,0.8)"
                : "rgba(255,255,255,0.35)",
          }}
        />

        <AnimatePresence>
          {showDeflection && (
            <motion.div
              key="deflect-path"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
            >
              <svg className="w-full h-full">
                <path
                  d="M 60% 50% Q 60% 25%, 60% 0%"
                  stroke="rgba(34,197,94,0.7)"
                  strokeWidth={2}
                  strokeDasharray="8 12"
                  fill="none"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 grid grid-cols-3 text-[10px] uppercase tracking-[0.28em] text-white/45">
        <span>DART</span>
        <span className="text-center">{asteroidName.toUpperCase()}</span>
        <span className="text-right">Earth</span>
      </div>
    </>
  );
}

interface TrajectoryPanelProps {
  asteroidName: string;
  dartStage: TrajectoryStage;
  onImpactComplete: () => void;
  onDartComplete: () => void;
}

function TrajectoryPanel({
  asteroidName,
  dartStage,
  onImpactComplete,
  onDartComplete,
}: TrajectoryPanelProps) {
  const [impactProgress, setImpactProgress] = useState(0);

  const mode = dartStage === "idle" ? "impact" : "dart";

  const statusText =
    mode === "impact"
      ? impactProgress < 1
        ? "Impact trajectory simulation"
        : "Impact path locked"
      : dartStage === "animating"
      ? "Defense simulation running"
      : dartStage === "complete"
      ? "Trajectory deflected"
      : "Defense standby";

  return (
    <div className="mb-8 rounded-lg border border-white/12 bg-white/[0.04] px-6 py-5">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-white/35">
        <span>Impact trajectory</span>
        <span className="text-white/50">{statusText}</span>
      </div>

      {mode === "impact" ? (
        <ImpactTrajectory
          asteroidName={asteroidName}
          onProgress={setImpactProgress}
          onComplete={onImpactComplete}
        />
      ) : (
        <DartTrajectory
          asteroidName={asteroidName}
          stage={dartStage}
          onComplete={onDartComplete}
        />
      )}
    </div>
  );
}

export default function ImpactStatsModal({
  isOpen,
  onClose,
  asteroid,
  impactLocation,
  cityName,
}: ImpactStatsModalProps) {
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDartOption, setShowDartOption] = useState(false);
  const [dartStage, setDartStage] = useState<TrajectoryStage>("idle");
  const [impactTrajComplete, setImpactTrajComplete] = useState(false);

  // Calculate impact metrics
  const avgDiameter = asteroid.estDiameterMeters.avg;
  const velocity = parseFloat(
    asteroid.closeApproachData?.[0]?.relativeVelocity.kilometersPerSecond ||
      "20"
  );
  const metrics = useMemo(
    () => calculateImpactMetrics(avgDiameter, velocity, 3000),
    [avgDiameter, velocity]
  );

  useEffect(() => {
    if (!geminiAnalysis) return;
    if (dartStage !== "idle") return;

    if (currentIndex >= geminiAnalysis.summary.length) {
      const timer = setTimeout(() => setShowDartOption(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [geminiAnalysis, currentIndex, dartStage]);

  const handleDartClick = () => {
    setShowDartOption(false);
    setDartStage("animating");
  };

  const handleImpactTrajectoryComplete = useCallback(() => {
    setImpactTrajComplete(true);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!geminiAnalysis) return;

    const fullText = geminiAnalysis.summary;
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20); // 20ms per character
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, geminiAnalysis]);

  const fetchGeminiAnalysis = useCallback(
    async (options?: { dartSuccess?: boolean }) => {
      setLoading(true);
      setGeminiAnalysis(null);
      setDisplayedText("");
      setCurrentIndex(0);

      if (options?.dartSuccess) {
        setShowDartOption(false);
      }

      try {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promptType: "narrative",
            payload: {
              name: asteroid.name,
              diameterMeters: avgDiameter,
              velocityKmS: velocity,
              tntMegatons: metrics.tntMegatons,
              craterDiameterKm: metrics.craterDiameterKm,
              destructionRadiusKm: metrics.destructionRadiusKm,
              targetCity:
                cityName ||
                `${impactLocation.lat.toFixed(
                  2
                )}°, ${impactLocation.lon.toFixed(2)}°`,
              estimatedPopulationAffected: metrics.approxCasualties,
              dartSuccess: options?.dartSuccess,
            },
          }),
        });

        const data = await response.json();
        const summaryText = data.summary || "Impact analysis unavailable.";

        setGeminiAnalysis({
          summary: summaryText,
          keyPoints: [
            `Kinetic energy: ${metrics.kineticEnergyJ.toExponential(2)} Joules`,
            `Crater diameter: ${metrics.craterDiameterKm.toFixed(1)} km`,
            `Destruction radius: ${metrics.destructionRadiusKm.toFixed(1)} km`,
            metrics.approxCasualties
              ? `Estimated casualties: ${metrics.approxCasualties.toLocaleString()}`
              : options?.dartSuccess
              ? "Casualties avoided"
              : "Massive infrastructure damage",
          ],
          recommendations: options?.dartSuccess
            ? [
                "Continue monitoring deflected trajectory",
                "Document mission telemetry for future defenses",
                "Coordinate recovery operations",
              ]
            : [
                "Immediate evacuation of surrounding areas",
                "Activate planetary defense systems",
                "International emergency response coordination",
              ],
        });
      } catch (error) {
        console.error("Gemini API error:", error);
        setGeminiAnalysis({
          summary: options?.dartSuccess
            ? `Planetary defense mission successfully diverted ${asteroid.name}. Earth is no longer in the impact corridor.`
            : `Impact of ${
                asteroid.name
              } would create a ${metrics.craterDiameterKm.toFixed(
                1
              )}km crater with devastating effects across ${metrics.destructionRadiusKm.toFixed(
                1
              )}km radius. The ${metrics.tntMegatons.toFixed(
                1
              )} megaton explosion would cause immediate widespread destruction.`,
          keyPoints: [
            `Kinetic energy: ${metrics.kineticEnergyJ.toExponential(2)} Joules`,
            `Crater diameter: ${metrics.craterDiameterKm.toFixed(1)} km`,
            `Destruction radius: ${metrics.destructionRadiusKm.toFixed(1)} km`,
            metrics.approxCasualties
              ? `Estimated casualties: ${metrics.approxCasualties.toLocaleString()}`
              : options?.dartSuccess
              ? "Casualties avoided"
              : "Massive infrastructure damage",
          ],
          recommendations: options?.dartSuccess
            ? [
                "Continue monitoring deflected trajectory",
                "Document mission telemetry for future defenses",
                "Coordinate recovery operations",
              ]
            : [
                "Immediate evacuation of surrounding areas",
                "Activate planetary defense systems",
                "International emergency response coordination",
              ],
        });
      } finally {
        setLoading(false);
      }
    },
    [
      asteroid.name,
      avgDiameter,
      velocity,
      metrics,
      cityName,
      impactLocation.lat,
      impactLocation.lon,
    ]
  );

  useEffect(() => {
    if (!isOpen) {
      setDisplayedText("");
      setCurrentIndex(0);
      return;
    }

    setDartStage("idle");
    setShowDartOption(false);
    setImpactTrajComplete(false);
    fetchGeminiAnalysis();
  }, [isOpen, fetchGeminiAnalysis]);

  const handleDartComplete = useCallback(() => {
    setDartStage("complete");
    fetchGeminiAnalysis({ dartSuccess: true });
  }, [fetchGeminiAnalysis]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-8">
              <TrajectoryPanel
                asteroidName={asteroid.name}
                dartStage={dartStage}
                onImpactComplete={handleImpactTrajectoryComplete}
                onDartComplete={handleDartComplete}
              />

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-start mb-8"
              >
                <div>
                  <h2 className="text-3xl font-light text-white tracking-wide mb-2">
                    Impact Analysis
                  </h2>
                  <p className="text-white/60 text-sm uppercase tracking-widest">
                    {asteroid.name}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white text-2xl transition-colors"
                >
                  ✕
                </button>
              </motion.div>

              {/* Impact Metrics Grid - Only show if DART not completed */}
              {dartStage !== "complete" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 border border-white/10 p-4">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
                      Energy
                    </div>
                    <div className="text-white text-2xl font-light">
                      {metrics.tntMegatons.toFixed(1)}
                    </div>
                    <div className="text-white/60 text-xs mt-1">MT TNT</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
                      Crater
                    </div>
                    <div className="text-white text-2xl font-light">
                      {metrics.craterDiameterKm.toFixed(1)}
                    </div>
                    <div className="text-white/60 text-xs mt-1">
                      km diameter
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
                      Destruction
                    </div>
                    <div className="text-white text-2xl font-light">
                      {metrics.destructionRadiusKm.toFixed(1)}
                    </div>
                    <div className="text-white/60 text-xs mt-1">km radius</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
                      Magnitude
                    </div>
                    <div className="text-white text-2xl font-light">
                      {metrics.seismicEquivalentMagnitude?.toFixed(1) || "N/A"}
                    </div>
                    <div className="text-white/60 text-xs mt-1">Richter</div>
                  </div>
                </div>
              )}

              {/* Gemini AI Analysis */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <p className="text-white/60 mt-4 text-sm">
                    Analyzing impact scenario...
                  </p>
                </div>
              ) : geminiAnalysis ? (
                <div className="space-y-6">
                  {/* Summary with typewriter */}
                  <div>
                    <h3 className="text-white/60 text-xs uppercase tracking-widest mb-3">
                      AI Analysis
                    </h3>
                    <p className="text-white/80 text-base leading-relaxed">
                      {displayedText}
                      {currentIndex < geminiAnalysis.summary.length && (
                        <span className="inline-block w-2 h-4 bg-white/60 ml-1 animate-pulse" />
                      )}
                    </p>
                  </div>

                  {/* Key Points */}
                  {currentIndex >= geminiAnalysis.summary.length && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="text-white/60 text-xs uppercase tracking-widest mb-3">
                        Key Impact Factors
                      </h3>
                      <ul className="space-y-2">
                        {geminiAnalysis.keyPoints.map((point, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="text-white/70 text-sm flex items-start"
                          >
                            <span className="text-orange-500 mr-3">•</span>
                            {point}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Recommendations */}
                  {currentIndex >= geminiAnalysis.summary.length && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h3 className="text-white/60 text-xs uppercase tracking-widest mb-3">
                        Response Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {geminiAnalysis.recommendations.map((rec, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + idx * 0.1 }}
                            className="text-white/70 text-sm flex items-start"
                          >
                            <span className="text-blue-400 mr-3">▸</span>
                            {rec}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* DART Defense Button */}
                  {currentIndex >= geminiAnalysis.summary.length &&
                    showDartOption &&
                    impactTrajComplete &&
                    dartStage === "idle" && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                        className="mt-8 pt-6 border-t border-white/10"
                      >
                        <h3 className="text-white/60 text-xs uppercase tracking-widest mb-4">
                          Planetary Defense Option
                        </h3>
                        <button
                          onClick={handleDartClick}
                          className="w-full border border-white/20 hover:border-white/40 text-white/60 hover:text-white py-3 px-4 text-xs uppercase tracking-widest transition-all duration-300"
                        >
                          Run DART Simulation
                        </button>
                        <p className="text-white/40 text-xs mt-3 text-center">
                          Engage kinetic impactor scenario to attempt deflection
                        </p>
                      </motion.div>
                    )}

                  {dartStage === "animating" && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 text-center text-white/50 text-xs uppercase tracking-[0.3em]"
                    >
                      Planetary defense simulation running
                    </motion.div>
                  )}

                  {/* DART Success Message */}
                  {dartStage === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8 p-6 bg-green-500/10 border-2 border-green-500/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                          ✓
                        </div>
                        <div>
                          <h3 className="text-green-300 font-bold text-lg">
                            Mission Success
                          </h3>
                          <p className="text-green-400/80 text-sm">
                            Earth impact avoided
                          </p>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm">
                        The DART spacecraft intercepted {asteroid.name} and
                        altered its trajectory. The asteroid is now on a safe
                        course away from Earth.
                      </p>
                      <div className="mt-4 p-3 bg-black/30 rounded">
                        <div className="text-white/60 text-xs uppercase tracking-widest mb-2">
                          Deflection Metrics
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-cyan-300">Velocity change</div>
                            <div className="text-white">≈ 0.5 km/s</div>
                          </div>
                          <div>
                            <div className="text-cyan-300">
                              Closest approach
                            </div>
                            <div className="text-white">≈ 50,000 km</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
