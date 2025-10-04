"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

interface DartAnimation2DProps {
  onComplete: () => void;
  asteroidName: string;
}

/**
 * DART Deflection Animation - Kurzgesagt style
 * Satellite launches from Earth, intercepts asteroid mid-flight, deflects it away
 */
export default function DartAnimation2D({
  onComplete,
  asteroidName,
}: DartAnimation2DProps) {
  const asteroidControls = useAnimation();
  const dartControls = useAnimation();
  const impactFlashControls = useAnimation();
  const [pathProgress, setPathProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    playAnimation();
  }, []);

  const playAnimation = async () => {
    // Animate dotted path
    const pathInterval = setInterval(() => {
      setPathProgress((prev) => {
        if (prev >= 50) {
          // Stop at 50% (interception point)
          clearInterval(pathInterval);
          return 50;
        }
        return prev + 2.5; // Slower progression
      });
    }, 100);

    // Phase 1: Asteroid and DART both move towards interception point (2 seconds)
    await Promise.all([
      // Asteroid moves from left toward center
      asteroidControls.start({
        x: ["0%", "50%"],
        rotate: [0, 180],
        transition: {
          duration: 2,
          ease: "linear",
        },
      }),
      // DART launches from Earth toward center
      dartControls.start({
        x: ["100%", "50%"],
        y: ["0%", "-10%"], // Slight arc
        rotate: [45, 180],
        transition: {
          duration: 2,
          ease: "easeInOut",
        },
      }),
    ]);

    clearInterval(pathInterval);

    // Phase 2: Interception flash (0.3 seconds)
    await impactFlashControls.start({
      scale: [0, 2, 1.5],
      opacity: [1, 1, 0],
      transition: {
        duration: 0.3,
      },
    });

    // Phase 3: Asteroid deflects away (1.5 seconds)
    await asteroidControls.start({
      x: ["50%", "50%"],
      y: ["0%", "-80%"],
      rotate: [180, 540],
      opacity: [1, 0.5],
      transition: {
        duration: 1.5,
        ease: "easeOut",
      },
    });

    // Show success message
    setShowSuccess(true);

    // Wait then complete
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-950/30 via-black/20 to-green-950/30 rounded-lg overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Dotted path (asteroid trajectory) */}
      <svg
        className="absolute top-1/2 left-0 w-full h-2 pointer-events-none"
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
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop
              offset={`${pathProgress}%`}
              stopColor="white"
              stopOpacity="0"
            />
            <stop
              offset={`${pathProgress}%`}
              stopColor="red"
              stopOpacity="0.5"
            />
            <stop offset="100%" stopColor="red" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <line
          x1="10%"
          y1="50%"
          x2="85%"
          y2="50%"
          stroke="url(#dartPathGradient)"
          strokeWidth="2"
          strokeDasharray="10,15"
        />
      </svg>

      {/* Deflected path (upward arc) - shown after interception */}
      {pathProgress >= 50 && (
        <motion.svg
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        >
          <path
            d="M 50% 50% Q 50% 20%, 50% 0%"
            stroke="lime"
            strokeWidth="2"
            strokeDasharray="10,15"
            fill="none"
          />
        </motion.svg>
      )}

      {/* Earth sprite (right side) */}
      <div className="absolute right-[8%] top-1/2 -translate-y-1/2">
        <div className="relative w-28 h-28 sm:w-36 sm:h-36">
          <Image
            src="/earth.png"
            alt="Earth"
            fill
            className="object-contain"
            style={{
              animation: "spin 30s linear infinite",
            }}
          />
          <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl scale-125" />
        </div>
      </div>

      {/* DART Satellite (Earth to interception point) */}
      <motion.div
        animate={dartControls}
        className="absolute right-[8%] top-1/2 -translate-y-1/2 z-20"
        style={{ width: "60%" }}
      >
        <div className="relative w-12 h-12 sm:w-16 sm:h-16">
          <Image
            src="/dart.png"
            alt="DART Satellite"
            fill
            className="object-contain"
          />
          {/* Thruster glow */}
          <motion.div
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-2 bg-cyan-400 blur-md"
            animate={{
              scaleX: [1, 1.5, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
            }}
          />
        </div>
      </motion.div>

      {/* Asteroid sprite (left to interception, then deflects upward) */}
      <motion.div
        animate={asteroidControls}
        className="absolute left-[8%] top-1/2 -translate-y-1/2"
        style={{ width: "60%" }}
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
          <Image
            src="/earth.png"
            alt={asteroidName}
            fill
            className="object-contain"
            style={{
              filter:
                "brightness(0.5) contrast(1.2) saturate(0.8) sepia(0.3) hue-rotate(15deg)",
            }}
          />
          <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-lg scale-150 -z-10" />
        </div>
      </motion.div>

      {/* Interception flash at midpoint */}
      <motion.div
        animate={impactFlashControls}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ scale: 0, opacity: 0 }}
      >
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          <div className="absolute inset-0 bg-cyan-300 rounded-full blur-2xl" />
          <div className="absolute inset-4 bg-white rounded-full blur-xl" />
          <div className="absolute inset-8 bg-cyan-400 rounded-full blur-lg" />
        </div>
      </motion.div>

      {/* Success message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="bg-green-500/20 backdrop-blur-md border-2 border-green-400 rounded-lg px-8 py-6">
            <div className="text-green-300 text-2xl font-bold mb-2 text-center">
              ✓ DEFLECTION SUCCESSFUL
            </div>
            <div className="text-white/80 text-center text-sm">
              Earth is safe. Asteroid trajectory altered.
            </div>
          </div>
        </motion.div>
      )}

      {/* Animation label */}
      <div className="absolute top-6 left-6 text-white/70 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span>DART Planetary Defense</span>
        </div>
        <div className="mt-2 text-white/50 text-xs">{asteroidName}</div>
      </div>
    </div>
  );
}
