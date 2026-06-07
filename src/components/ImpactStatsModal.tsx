"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeoSummary } from "@/types";
import { calculateImpactMetrics, calculateDartDeflection } from "@/lib/physics";
import historicalImpacts from "@/data/historical-impacts.json";
import majorEarthquakes from "@/data/major-earthquakes-expanded.json";

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
const ASTEROID_SIZE = 40;
const DART_SIZE = 28;
const EARTH_SIZE = 64;

const LABEL_TEXT = "font-sans text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-medium text-white/50";
const VALUE_TEXT = "font-sans text-xl md:text-3xl font-light text-white tracking-tight";
const TECH_PANEL = "bg-[#000000]/60 backdrop-blur-[4px] border border-white/[0.05] rounded-[16px]";

interface DartTrajectoryProps {
  stage: TrajectoryStage;
  asteroidName: string;
  onComplete: () => void;
}

function DartTrajectory({ stage, asteroidName, onComplete }: DartTrajectoryProps) {
  const [progress, setProgress] = useState(stage === "complete" ? 1 : 0);
  const interceptRatio = 0.6;
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (stage === "animating") {
      let start: number | null = null;
      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const ratio = Math.min((timestamp - start) / 3000, 1);
        setProgress(ratio);
        if (ratio < 1) rafRef.current = requestAnimationFrame(step);
        else onComplete();
      };
      rafRef.current = requestAnimationFrame(step);
    } else if (stage === "idle") {
      setProgress(0);
    } else if (stage === "complete") {
      setProgress(1);
    }
    
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [stage, onComplete]);

  const approachPhase = Math.min(progress / interceptRatio, 1);
  const postIntercept = progress > interceptRatio ? (progress - interceptRatio) / (1 - interceptRatio) : 0;
  
  const asteroidRatio = Math.min(approachPhase * interceptRatio, interceptRatio);
  const dartRatio = 1 - (1 - interceptRatio) * approachPhase;
  
  const earthPercent = PATH_MARGIN + PATH_RANGE;
  const asteroidOpacity = progress < interceptRatio ? 1 : Math.max(1 - postIntercept * 4, 0);

  return (
    <div className="relative h-20 flex items-center">
      <div className="absolute top-1/2 left-[10%] right-[10%] -translate-y-1/2 border-t border-dashed border-white/20 h-0" />
      <div className="absolute z-10 flex items-center justify-center" style={{ left: `calc(${earthPercent}% - ${EARTH_SIZE / 2}px)`, width: EARTH_SIZE, height: EARTH_SIZE }}>
        <div className="absolute inset-0 border border-white/20 rounded-full" />
        <img src="/earth.png" alt="Earth" width={EARTH_SIZE * 0.7} height={EARTH_SIZE * 0.7} className="object-contain opacity-80 mix-blend-screen" />
      </div>
      
      {asteroidOpacity > 0.05 && (
        <div className="absolute z-20 flex items-center justify-center" style={{ left: `calc(${PATH_MARGIN + asteroidRatio * PATH_RANGE}% - ${ASTEROID_SIZE / 2}px)`, top: `calc(50% - ${ASTEROID_SIZE / 2}px - ${postIntercept * 40}px)`, opacity: asteroidOpacity, width: ASTEROID_SIZE, height: ASTEROID_SIZE }}>
          <img src="/sattelite.png" alt={asteroidName} width={ASTEROID_SIZE * 0.8} height={ASTEROID_SIZE * 0.8} className="object-contain" style={{ filter: "brightness(1.5) grayscale(0.5) sepia(0.5) hue-rotate(180deg)" }} />
        </div>
      )}

      {progress < interceptRatio && (
        <div className="absolute z-20 flex items-center justify-center" style={{ left: `calc(${PATH_MARGIN + dartRatio * PATH_RANGE}% - ${DART_SIZE / 2}px)`, width: DART_SIZE, height: DART_SIZE }}>
          <img src="/dart.png" alt="DART spacecraft" width={DART_SIZE * 0.9} height={DART_SIZE * 0.9} className="object-contain" style={{ filter: "grayscale(1) brightness(1.5)" }} />
        </div>
      )}

      {progress >= interceptRatio && (
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
          <svg className="w-full h-full"><path d="M 60% 50% Q 60% 25%, 60% 0%" stroke="#FFFFFF" strokeWidth={1} strokeDasharray="4 4" fill="none" opacity={Math.max(1 - postIntercept, 0.2)} /></svg>
        </div>
      )}
    </div>
  );
}

export default function ImpactStatsModal({ isOpen, onClose, asteroid, impactLocation, cityName }: ImpactStatsModalProps) {
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dartStage, setDartStage] = useState<TrajectoryStage>("idle");
  const [dartResult, setDartResult] = useState<{ success: boolean; velocityChangeMS: number; deflectionDistanceKm: number; missDistanceKm: number; confidence: number; reason: string; } | null>(null);

  const avgDiameter = asteroid.estDiameterMeters.avg;
  const velocity = parseFloat(asteroid.closeApproachData?.[0]?.relativeVelocity.kilometersPerSecond || "20");
  const metrics = useMemo(() => calculateImpactMetrics(avgDiameter, velocity, 3000), [avgDiameter, velocity]);

  const closestImpact = useMemo(() => {
    if (dartStage === "complete") return null;
    const scored = historicalImpacts.map(i => ({ ...i, score: Math.abs(i.energy_mt - metrics.tntMegatons) / Math.max(metrics.tntMegatons, 1) }));
    return scored.sort((a, b) => a.score - b.score)[0];
  }, [metrics.tntMegatons, dartStage]);

  const closestEarthquake = useMemo(() => {
    if (!metrics.seismicEquivalentMagnitude || dartStage === "complete") return null;
    const scored = majorEarthquakes.map(eq => ({ ...eq, score: Math.abs(eq.magnitude - metrics.seismicEquivalentMagnitude!) }));
    return scored.sort((a, b) => a.score - b.score)[0];
  }, [metrics.seismicEquivalentMagnitude, dartStage]);

  const fetchGeminiAnalysis = useCallback(async (options?: { dartSuccess?: boolean }) => {
    setLoading(true); setGeminiAnalysis(null); setDisplayedText(""); setCurrentIndex(0);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptType: "narrative",
          payload: { name: asteroid.name, diameterMeters: avgDiameter, velocityKmS: velocity, tntMegatons: metrics.tntMegatons, craterDiameterKm: metrics.craterDiameterKm, targetCity: cityName || `${impactLocation.lat.toFixed(2)}°, ${impactLocation.lon.toFixed(2)}°`, dartSuccess: options?.dartSuccess },
        }),
      });
      const data = await response.json();
      setGeminiAnalysis({ summary: data.summary || "ANALYSIS UNAVAILABLE.", keyPoints: [`Kinetic energy: ${metrics.kineticEnergyJ.toExponential(2)} J`, `Crater: ${metrics.craterDiameterKm.toFixed(1)} km`, `Destruction: ${metrics.destructionRadiusKm.toFixed(1)} km`], recommendations: options?.dartSuccess ? ["Monitor trajectory", "Log telemetry"] : ["Evacuate zone", "Deploy DART"] });
    } catch {
      setGeminiAnalysis({ summary: "CRITICAL THREAT. IMPACT IMMINENT. SYSTEM OFFLINE.", keyPoints: ["System offline"], recommendations: ["Evacuate immediately"] });
    } finally { setLoading(false); }
  }, [asteroid.name, avgDiameter, velocity, metrics, cityName, impactLocation.lat, impactLocation.lon]);

  useEffect(() => {
    if (!isOpen) return;
    setDartStage("idle"); fetchGeminiAnalysis();
  }, [isOpen, fetchGeminiAnalysis]);

  useEffect(() => {
    if (geminiAnalysis && currentIndex < geminiAnalysis.summary.length) {
      const timeout = setTimeout(() => { setDisplayedText(geminiAnalysis.summary.substring(0, currentIndex + 1)); setCurrentIndex(currentIndex + 1); }, 8);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, geminiAnalysis]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl z-50 p-4 md:p-6 lg:p-10 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 md:top-8 md:right-8 z-[60] text-white/40 hover:text-white" aria-label="Close terminal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6L18 18M6 18L18 6" /></svg>
      </button>

      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full max-w-[1100px] max-h-[90vh] bg-[#0A0A0A] p-2 md:p-3 rounded-[28px] md:rounded-[36px] border border-[#1A1A1A] shadow-2xl relative flex flex-col">
        
        {/* Whole page is scrollable here */}
        <div className="bg-[#000000] rounded-[20px] md:rounded-[28px] border border-[#222222] relative overflow-y-auto custom-scrollbar flex flex-col shadow-inner">
          <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '16px 16px', maskImage: 'radial-gradient(ellipse at top, black 0%, transparent 80%)', opacity: 0.5 }} />

          {/* Top Badge */}
          <div className="relative z-10 px-6 pt-6 pb-3 flex items-center gap-2 border-b border-white/[0.05] bg-white/[0.02]">
            <span className={`${LABEL_TEXT} text-white/80`}>X900 // TECHNICAL TERMINAL</span>
          </div>

          {/* Compact Telemetry Header */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 border-b border-white/[0.05] bg-white/[0.01]">
            <div className="p-4 md:p-6 border-r border-b md:border-b-0 border-white/[0.05]"><div className={`${LABEL_TEXT} mb-1`}>TARGET</div><div className={VALUE_TEXT}>{asteroid.name}</div></div>
            <div className="p-4 md:p-6 border-r border-b md:border-b-0 border-white/[0.05]"><div className={`${LABEL_TEXT} mb-1`}>YIELD</div><div className={VALUE_TEXT}>{metrics.tntMegatons > 1000 ? (metrics.tntMegatons / 1000).toFixed(1) : metrics.tntMegatons.toFixed(0)} <span className="text-sm md:text-base text-white/40">{metrics.tntMegatons > 1000 ? 'GT' : 'MT'}</span></div></div>
            <div className="p-4 md:p-6 border-r border-white/[0.05]"><div className={`${LABEL_TEXT} mb-1`}>CRATER</div><div className={VALUE_TEXT}>{metrics.craterDiameterKm.toFixed(2)} <span className="text-sm md:text-base text-white/40">KM</span></div></div>
            <div className="p-4 md:p-6"><div className={`${LABEL_TEXT} mb-1 text-red-400`}>DESTRUCTION ZONE</div><div className={`${VALUE_TEXT} text-red-500`}>{metrics.destructionRadiusKm.toFixed(0)} <span className="text-sm md:text-base text-red-500/40">KM</span></div></div>
          </div>

          {/* Compact Main Content Grid */}
          <div className="relative z-10 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Col: Orbital Sim & CTA */}
            <div className="flex flex-col gap-6">
              <div className={`${TECH_PANEL} p-6 flex flex-col`}>
                <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-4">
                  <span className={`${LABEL_TEXT} text-white`}>ORBITAL SIMULATION</span>
                  <span className="flex items-center gap-2 font-mono text-[9px] text-white/40">
                    <span className={`w-1.5 h-1.5 rounded-sm ${dartStage === 'idle' ? 'bg-red-500' : 'bg-white/20'}`} />
                    {dartStage === 'idle' ? 'IMPACT IMMINENT' : dartStage === 'animating' ? 'DEFENSE ACTIVE' : 'DEFLECTION COMPLETE'}
                  </span>
                </div>
                
                {/* Unified Trajectory Animation */}
                <DartTrajectory asteroidName={asteroid.name} stage={dartStage} onComplete={() => { setDartStage("complete"); setDartResult(calculateDartDeflection(velocity, avgDiameter, 3000, 5)); fetchGeminiAnalysis({ dartSuccess: true }); }} />

                {/* Simplified & Cleaner DART CTA */}
                <div className="mt-4 flex justify-end">
                  {dartStage === "idle" ? (
                    <button onClick={() => setDartStage("animating")} className="px-6 py-2 border border-white/20 bg-white/[0.02] hover:bg-white hover:text-black transition-colors rounded text-[10px] tracking-widest uppercase font-mono text-white/80">
                      INITIATE DART
                    </button>
                  ) : dartStage === "animating" ? (
                    <div className="px-6 py-2 border border-dashed border-white/20 rounded flex items-center justify-center gap-3 text-white/60">
                      <div className="w-3 h-3 border border-t-white rounded-full animate-spin" /><span className="font-mono text-[10px] tracking-widest">EXECUTING...</span>
                    </div>
                  ) : (
                    <div className="px-6 py-2 flex items-center justify-center gap-3 text-white/80">
                      <span className="font-mono text-[10px] tracking-widest uppercase">{dartResult?.success ? "DEFLECTION CONFIRMED" : "DEFLECTION FAILED"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Redesigned DART Results Panel */}
              {dartStage === "complete" && dartResult && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 border border-white/[0.05] bg-[#000000]/80 rounded-xl overflow-hidden">
                  <div className="bg-white/[0.02] border-b border-white/[0.05] px-6 py-3 flex justify-between items-center">
                    <span className={LABEL_TEXT}>POST-ACTION REPORT</span>
                    <span className={`font-mono text-[10px] tracking-widest ${dartResult.success ? 'text-white/80' : 'text-red-400'}`}>
                      STATUS: {dartResult.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="text-[11px] font-mono text-white/60 leading-relaxed mb-6">
                      {dartResult.reason}
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-white/[0.05] border border-white/[0.05] rounded">
                      <div className="bg-[#050505] p-4">
                        <div className={`${LABEL_TEXT} mb-1 text-white/40`}>VELOCITY DELTA</div>
                        <div className="font-mono text-xs text-white">{(dartResult.velocityChangeMS * 1000).toFixed(2)} MM/S</div>
                      </div>
                      <div className="bg-[#050505] p-4">
                        <div className={`${LABEL_TEXT} mb-1 text-white/40`}>MISS DISTANCE</div>
                        <div className="font-mono text-xs text-white">{dartResult.missDistanceKm.toLocaleString()} KM</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Col: System Log & Historic */}
            <div className="flex flex-col gap-6">
              <div className={`${TECH_PANEL} p-6 flex-1 flex flex-col`}>
                <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
                  <span className="w-1.5 h-1.5 bg-white/20 rounded-sm" />
                  <span className={LABEL_TEXT}>SYSTEM LOG</span>
                </div>
                {loading ? (
                  <div className="flex items-center gap-4 text-white/40"><div className="w-4 h-4 border border-t-white rounded-full animate-spin" /><span className="font-mono text-[10px]">Uplinking threat analysis...</span></div>
                ) : geminiAnalysis && (
                  <div>
                    <div className="font-mono text-[11px] md:text-sm text-white/80 leading-relaxed mb-6">
                      {displayedText}{currentIndex < geminiAnalysis.summary.length && <span className="inline-block w-2 h-4 bg-white/60 ml-1 animate-pulse" />}
                    </div>
                    {currentIndex >= geminiAnalysis.summary.length && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4 border-t border-white/[0.05]">
                        <div>
                          <div className={`${LABEL_TEXT} text-white/40 mb-2`}>RECOMMENDATIONS</div>
                          <ul className="space-y-1">{geminiAnalysis.recommendations.map((rec, i) => <li key={i} className="font-mono text-[10px] text-white/60 flex gap-2"><span className="text-white/30">&gt;</span> {rec}</li>)}</ul>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Compact Historical Grid */}
              {dartStage !== "complete" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {closestImpact && (
                    <div className={`${TECH_PANEL} p-5`}><div className="flex items-center gap-2 mb-2"><span className="w-1 h-1 bg-[#4B67A0] rounded-full" /><span className={LABEL_TEXT}>IMPACT MATCH</span></div><div className="text-white text-base font-light">{closestImpact.name}</div><div className="text-[10px] text-white/40 uppercase tracking-widest">{closestImpact.subtitle}</div></div>
                  )}
                  {closestEarthquake && (
                    <div className={`${TECH_PANEL} p-5`}><div className="flex items-center gap-2 mb-2"><span className="w-1 h-1 bg-red-500/50 rounded-full" /><span className={LABEL_TEXT}>SEISMIC MATCH</span></div><div className="text-white text-base font-light">{closestEarthquake.name}</div><div className="text-[10px] text-white/40 uppercase tracking-widest">MAGNITUDE {closestEarthquake.magnitude}</div></div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
