"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeoSummary } from "@/types";
import { calculateImpactMetrics } from "@/lib/physics";
import Animation2D from "./Animation2D";
import DartAnimation2D from "./DartAnimation2D";

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
  const [showAnimation, setShowAnimation] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showDartOption, setShowDartOption] = useState(false);
  const [dartActive, setDartActive] = useState(false);
  const [dartComplete, setDartComplete] = useState(false);

  // Calculate impact metrics
  const avgDiameter = asteroid.estDiameterMeters.avg;
  const velocity = parseFloat(
    asteroid.closeApproachData?.[0]?.relativeVelocity.kilometersPerSecond ||
      "20"
  );
  const metrics = calculateImpactMetrics(avgDiameter, velocity, 3000);

  useEffect(() => {
    if (isOpen) {
      // Reset all states
      setShowAnimation(true);
      setAnimationComplete(false);
      setShowDartOption(false);
      setDartActive(false);
      setDartComplete(false);

      if (!geminiAnalysis) {
        fetchGeminiAnalysis();
      }
    }
  }, [isOpen]);

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    setShowAnimation(false);
    // Show DART option after stats are displayed
    setTimeout(() => {
      setShowDartOption(true);
    }, 2000);
  };

  const handleDartClick = () => {
    // Reset to animation state
    setAnimationComplete(false);
    setShowDartOption(false);
    setDartActive(true);
    setShowAnimation(true);
  };

  const handleDartAnimationComplete = () => {
    setDartActive(false);
    setShowAnimation(false);
    setDartComplete(true);
  };

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

  const fetchGeminiAnalysis = async () => {
    setLoading(true);
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
              `${impactLocation.lat.toFixed(2)}°, ${impactLocation.lon.toFixed(
                2
              )}°`,
            estimatedPopulationAffected: metrics.approxCasualties,
          },
        }),
      });

      const data = await response.json();

      // Use the summary from Gemini API
      const summaryText = data.summary || "Impact analysis unavailable.";

      setGeminiAnalysis({
        summary: summaryText,
        keyPoints: [
          `Kinetic energy: ${metrics.kineticEnergyJ.toExponential(2)} Joules`,
          `Crater diameter: ${metrics.craterDiameterKm.toFixed(1)} km`,
          `Destruction radius: ${metrics.destructionRadiusKm.toFixed(1)} km`,
          metrics.approxCasualties
            ? `Estimated casualties: ${metrics.approxCasualties.toLocaleString()}`
            : "Massive infrastructure damage",
        ],
        recommendations: [
          "Immediate evacuation of surrounding areas",
          "Activate planetary defense systems",
          "International emergency response coordination",
        ],
      });
      setCurrentIndex(0);
      setDisplayedText("");
    } catch (error) {
      console.error("Gemini API error:", error);
      // Fallback analysis
      setGeminiAnalysis({
        summary: `Impact of ${
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
            : "Massive infrastructure damage",
        ],
        recommendations: [
          "Immediate evacuation of surrounding areas",
          "Activate planetary defense systems",
          "International emergency response coordination",
        ],
      });
      setCurrentIndex(0);
      setDisplayedText("");
    } finally {
      setLoading(false);
    }
  };

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
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-8">
              {/* 2D Animation Phase */}
              {showAnimation && !dartActive && (
                <div className="w-full h-[500px] mb-8">
                  <Animation2D
                    onComplete={handleAnimationComplete}
                    asteroidName={asteroid.name}
                  />
                </div>
              )}

              {/* DART Animation Phase */}
              {showAnimation && dartActive && (
                <div className="w-full h-[500px] mb-8">
                  <DartAnimation2D
                    onComplete={handleDartAnimationComplete}
                    asteroidName={asteroid.name}
                  />
                </div>
              )}
              {/* Stats Content - Only show after animation */}
              {animationComplete && (
                <>
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

                  {/* Impact Metrics Grid */}
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
                      <div className="text-white/60 text-xs mt-1">
                        km radius
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4">
                      <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
                        Magnitude
                      </div>
                      <div className="text-white text-2xl font-light">
                        {metrics.seismicEquivalentMagnitude?.toFixed(1) ||
                          "N/A"}
                      </div>
                      <div className="text-white/60 text-xs mt-1">Richter</div>
                    </div>
                  </div>

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
                        !dartComplete && (
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
                              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-4 px-6 rounded-lg font-semibold tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-3 group"
                            >
                              <span className="text-2xl">🛰️</span>
                              <span>Try DART Mission</span>
                              <span className="text-xs opacity-70 group-hover:opacity-100">
                                (Double Asteroid Redirection Test)
                              </span>
                            </button>
                            <p className="text-white/40 text-xs mt-3 text-center">
                              Simulate kinetic impactor deflecting the asteroid
                            </p>
                          </motion.div>
                        )}

                      {/* DART Success Message */}
                      {dartComplete && (
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
                                Mission Success!
                              </h3>
                              <p className="text-green-400/80 text-sm">
                                Earth is safe from impact
                              </p>
                            </div>
                          </div>
                          <p className="text-white/70 text-sm">
                            The DART spacecraft successfully intercepted{" "}
                            {asteroid.name} and altered its trajectory. The
                            asteroid has been deflected away from Earth,
                            preventing catastrophic impact.
                          </p>
                          <div className="mt-4 p-3 bg-black/30 rounded">
                            <div className="text-white/60 text-xs uppercase tracking-widest mb-2">
                              Deflection Stats
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-cyan-300">
                                  Velocity Change
                                </div>
                                <div className="text-white">~0.5 km/s</div>
                              </div>
                              <div>
                                <div className="text-cyan-300">
                                  Miss Distance
                                </div>
                                <div className="text-white">~50,000 km</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
