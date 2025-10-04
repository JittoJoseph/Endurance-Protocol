"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeoSummary } from "@/types";
import { calculateImpactMetrics } from "@/lib/physics";

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

  // Calculate impact metrics
  const avgDiameter = asteroid.estDiameterMeters.avg;
  const velocity = parseFloat(
    asteroid.closeApproachData?.[0]?.relativeVelocity.kilometersPerSecond ||
      "20"
  );
  const metrics = calculateImpactMetrics(avgDiameter, velocity, 3000);

  useEffect(() => {
    if (isOpen && !geminiAnalysis) {
      fetchGeminiAnalysis();
    }
  }, [isOpen]);

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
            targetCity: cityName || `${impactLocation.lat.toFixed(2)}°, ${impactLocation.lon.toFixed(2)}°`,
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
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
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
              </div>

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
                  <div className="text-white/60 text-xs mt-1">km diameter</div>
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
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
