"use client";

import { ImpactMetrics } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface InfoPanelProps {
  impactMetrics: ImpactMetrics | null;
  geminiText: string | null;
  onTryDart: () => void;
  loading?: boolean;
  dartTriggered?: boolean;
  onClose: () => void;
}

export default function InfoPanel({
  impactMetrics,
  geminiText,
  onTryDart,
  loading = false,
  dartTriggered = false,
  onClose,
}: InfoPanelProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Typewriter effect for Gemini text
  useEffect(() => {
    if (!geminiText) {
      setDisplayedText("");
      return;
    }

    setIsTyping(true);
    setDisplayedText("");
    let index = 0;

    const interval = setInterval(() => {
      if (index < geminiText.length) {
        setDisplayedText(geminiText.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [geminiText]);

  if (!impactMetrics) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black/90 border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-white text-xl font-light uppercase tracking-[0.3em] mb-2">
                  Impact Analysis
                </h2>
                <p className="text-white/40 text-xs tracking-wider uppercase">
                  Computational Simulation
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white text-xl transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <MetricItem
                label="Energy"
                value={impactMetrics.tntMegatons.toFixed(2)}
                unit="MT TNT"
              />
              <MetricItem
                label="Crater"
                value={impactMetrics.craterDiameterKm.toFixed(2)}
                unit="km"
              />
              <MetricItem
                label="Radius"
                value={impactMetrics.destructionRadiusKm.toFixed(2)}
                unit="km destruction"
              />
              {impactMetrics.seismicEquivalentMagnitude && (
                <MetricItem
                  label="Seismic"
                  value={impactMetrics.seismicEquivalentMagnitude.toFixed(1)}
                  unit="magnitude"
                />
              )}
              {impactMetrics.approxCasualties !== null && (
                <MetricItem
                  label="Casualties"
                  value={`~${(impactMetrics.approxCasualties / 1000).toFixed(
                    0
                  )}K`}
                  unit="estimated"
                  fullWidth={
                    impactMetrics.seismicEquivalentMagnitude ? false : true
                  }
                />
              )}
            </div>

            {/* AI Analysis */}
            <div className="mb-8">
              <h3 className="text-white/60 text-xs font-light mb-4 uppercase tracking-[0.2em]">
                AI Analysis
              </h3>
              <div className="border-l-2 border-white/10 pl-4">
                {loading ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
                    <span className="text-white/40 text-xs">Processing...</span>
                  </div>
                ) : (
                  <p className="text-white/70 text-sm leading-relaxed font-light whitespace-pre-line">
                    {displayedText}
                    {isTyping && (
                      <span className="inline-block w-0.5 h-4 bg-white/70 ml-1 animate-pulse" />
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* DART Section */}
            <div className="pt-6 border-t border-white/10">
              {!dartTriggered ? (
                <motion.button
                  onClick={onTryDart}
                  className="w-full py-4 border border-white/20 hover:border-white text-white/80 hover:text-white text-sm font-light uppercase tracking-[0.2em] transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Simulate DART Deflection
                </motion.button>
              ) : (
                <div className="text-center py-4">
                  <span className="text-green-400/80 text-sm uppercase tracking-[0.2em]">
                    Deflection Successful
                  </span>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 text-center text-white/30 text-[10px] tracking-wider uppercase">
              Simplified Model — Educational Purposes
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MetricItem({
  label,
  value,
  unit,
  fullWidth = false,
}: {
  label: string;
  value: string;
  unit: string;
  fullWidth?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${fullWidth ? "col-span-2" : ""}`}
    >
      <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="text-white text-3xl font-extralight tracking-tight">
        {value}
      </div>
      <div className="text-white/50 text-xs mt-1">{unit}</div>
    </motion.div>
  );
}
