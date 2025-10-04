"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface DartAnimation2DProps {
  onComplete: () => void;
  asteroidName?: string;
}

/**
 * DART Planetary Defense Animation - Professional scientific visualization
 * Satellite launches from Earth, intercepts asteroid mid-flight, deflects it
 */
export default function DartAnimation2D({
  onComplete,
  asteroidName = "ASTEROID",
}: DartAnimation2DProps) {
  const asteroidControls = useAnimation();
  const dartControls = useAnimation();
  const impactFlashControls = useAnimation();
  const [pathProgress, setPathProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const playAnimation = useCallback(async () => {
    // Animate dotted path as asteroid moves
    const pathInterval = setInterval(() => {
      setPathProgress((prev) => {
        if (prev >= 50) {
          clearInterval(pathInterval);
          return 50;
        }
        return prev + 2.5; // Slower progression
      });
    }, 100);

    // Phase 1: Asteroid and DART both move towards interception point (2.5 seconds)
    await Promise.all([
      // Asteroid moves from left toward center
      asteroidControls.start({
        x: ["0%", "50%"],
        transition: {
          duration: 2.5,
          ease: "linear",
        },
      }),
      // DART launches from Earth toward center
      dartControls.start({
        x: ["100%", "50%"],
        transition: {
          duration: 2.5,
          ease: "easeInOut",
        },
      }),
    ]);

    clearInterval(pathInterval);

    // Phase 2: Interception flash (0.5 seconds)
    await impactFlashControls.start({
      scale: [0, 2.2, 1.8],
      opacity: [1, 1, 0],
      transition: {
        duration: 0.5,
      },
    });

    // Phase 3: Asteroid deflects upward (2 seconds)
    await asteroidControls.start({
      x: ["50%", "50%"],
      y: ["0%", "-120%"],
      opacity: [1, 0.3],
      transition: {
        duration: 2,
        ease: "easeOut",
      },
    });

    // Show success message
    setShowSuccess(true);

    // Wait then complete
    setTimeout(() => {
      onComplete();
    }, 2500);
  }, [asteroidControls, dartControls, impactFlashControls, onComplete]);

  useEffect(() => {
    playAnimation();
  }, [playAnimation]);

  return (
    <div className="relative w-full h-full bg-gradient-to-r from-slate-900/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
      </div>

      {/* Dotted path (asteroid trajectory) */}
      <svg
        className="absolute top-1/2 left-0 w-full h-1 pointer-events-none"
        style={{ transform: "translateY(-50%)" }}
      >
        <defs>
          <linearGradient
            id="dartPathGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="transparent" />
            <stop offset={`${pathProgress}%`} stopColor="transparent" />
            <stop
              offset={`${pathProgress}%`}
              stopColor="rgba(239, 68, 68, 0.6)"
            />
            <stop offset="100%" stopColor="rgba(239, 68, 68, 0.6)" />
          </linearGradient>
        </defs>
        <line
          x1="12%"
          y1="50%"
          x2="88%"
          y2="50%"
          stroke="url(#dartPathGradient)"
          strokeWidth="1"
          strokeDasharray="8,12"
        />
      </svg>

      {/* Deflected path (upward arc) - shown after interception */}
      {pathProgress >= 50 && (
        <motion.svg
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        >
          <path
            d="M 50% 50% Q 50% 20%, 50% 0%"
            stroke="rgba(34, 197, 94, 0.7)"
            strokeWidth="2"
            strokeDasharray="8,12"
            fill="none"
          />
        </motion.svg>
      )}

      {/* Earth sprite (right side) */}
      <div className="absolute right-[10%] top-1/2 -translate-y-1/2">
        <div className="relative w-24 h-24">
          <Image src="/earth.png" alt="Earth" fill className="object-contain" />
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-lg scale-110" />
        </div>
        <div className="text-center mt-2">
          <div className="text-slate-300 text-xs font-medium">EARTH</div>
        </div>
      </div>

      {/* DART Satellite (Earth to interception point) */}
      <motion.div
        animate={dartControls}
        className="absolute right-[10%] top-1/2 -translate-y-1/2 z-20"
        style={{ width: "80%" }}
      >
        <div className="relative w-10 h-10">
          <Image
            src="/dart.png"
            alt="DART Satellite"
            fill
            className="object-contain"
          />
          {/* Thruster trail */}
          <motion.div
            className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-1 bg-cyan-400 blur-sm"
            animate={{
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
            }}
          />
        </div>
        <div className="text-center mt-2">
          <div className="text-slate-300 text-xs font-medium">DART</div>
        </div>
      </motion.div>

      {/* Asteroid sprite (left to interception, then deflects upward) */}
      <motion.div
        animate={asteroidControls}
        className="absolute left-[10%] top-1/2 -translate-y-1/2"
        style={{ width: "80%" }}
      >
        <div className="relative w-12 h-12">
          <Image
            src="/earth.png"
            alt={asteroidName}
            fill
            className="object-contain"
            style={{
              filter:
                "brightness(0.4) contrast(1.3) saturate(0.5) sepia(0.4) hue-rotate(25deg)",
            }}
          />
        </div>
        <div className="text-center mt-2">
          <div className="text-slate-300 text-xs font-medium">
            {asteroidName?.toUpperCase()}
          </div>
        </div>
      </motion.div>

      {/* Professional interception flash at midpoint */}
      <motion.div
        animate={impactFlashControls}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ scale: 0, opacity: 0 }}
      >
        <div className="relative w-32 h-32">
          {/* Energy flash layers */}
          <div className="absolute inset-0 bg-gradient-radial from-cyan-300 via-blue-400 to-transparent rounded-full blur-xl opacity-90" />
          <div className="absolute inset-2 bg-gradient-radial from-white via-cyan-200 to-transparent rounded-full blur-lg opacity-80" />
          <div className="absolute inset-4 bg-gradient-radial from-cyan-400 via-blue-500 to-transparent rounded-full blur-md opacity-70" />

          {/* Energy particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-300 rounded-full"
              style={{
                top: "50%",
                left: "50%",
              }}
              animate={{
                x: [0, Math.cos((i * Math.PI * 2) / 12) * 40],
                y: [0, Math.sin((i * Math.PI * 2) / 12) * 40],
                opacity: [1, 0],
                scale: [1, 0.5, 0],
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: i * 0.02,
              }}
            />
          ))}

          {/* Shockwave ring */}
          <motion.div
            className="absolute inset-0 border-2 border-cyan-300/60 rounded-full"
            animate={{
              scale: [0, 3],
              opacity: [1, 0],
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          />
        </div>
      </motion.div>

      {/* Success message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
        >
          <div className="bg-slate-800/90 backdrop-blur-md border-2 border-green-500/50 rounded-lg px-8 py-6 shadow-2xl">
            <div className="text-green-400 text-2xl font-bold mb-3 text-center">
              ✓ DEFLECTION SUCCESSFUL
            </div>
            <div className="text-slate-300 text-center text-sm leading-relaxed">
              Kinetic impactor successfully altered asteroid trajectory.
              <br />
              Earth impact threat neutralized.
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-medium">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                PLANETARY DEFENSE SYSTEM ACTIVE
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status indicator */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-slate-300 text-sm font-medium">
            DART DEFENSE SIMULATION
          </span>
        </div>
        <div className="mt-1 text-slate-400 text-xs">
          {pathProgress < 50
            ? `Approach: ${Math.round(pathProgress * 2)}%`
            : "Interception Complete"}
        </div>
      </div>

      {/* Mission info */}
      <div className="absolute bottom-4 left-4 text-slate-400 text-xs">
        Mission: Double Asteroid Redirection Test (DART)
      </div>
      <div className="absolute bottom-4 right-4 text-slate-400 text-xs">
        Technology: Kinetic Impactor
      </div>
    </div>
  );
}
