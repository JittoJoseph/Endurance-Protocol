"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Animation2DProps {
  onComplete: () => void;
  asteroidName: string;
}

/**
 * 2D Impact Animation - Kurzgesagt style
 * Left: Asteroid → Right: Earth with disappearing dotted path
 */
export default function Animation2D({
  onComplete,
  asteroidName,
}: Animation2DProps) {
  const asteroidControls = useAnimation();
  const explosionControls = useAnimation();
  const earthShakeControls = useAnimation();

  const [pathProgress, setPathProgress] = useState(0);

  useEffect(() => {
    playAnimation();
  }, []);

  const playAnimation = async () => {
    // Animate path disappearing as asteroid moves
    const pathInterval = setInterval(() => {
      setPathProgress((prev) => {
        if (prev >= 100) {
          clearInterval(pathInterval);
          return 100;
        }
        return prev + 3.33; // 100 / 30 frames = ~3.33% per frame over 3 seconds
      });
    }, 100);

    // Phase 1: Asteroid travels from left to right (3 seconds)
    await asteroidControls.start({
      x: ["0%", "100%"],
      rotate: [0, 360],
      transition: {
        duration: 3,
        ease: "linear",
      },
    });

    clearInterval(pathInterval);

    // Phase 2: Impact explosion (0.8 seconds)
    await Promise.all([
      explosionControls.start({
        scale: [0, 1.5, 2],
        opacity: [1, 1, 0],
        transition: {
          duration: 0.8,
          times: [0, 0.5, 1],
        },
      }),
      earthShakeControls.start({
        x: [0, -8, 8, -8, 8, -4, 4, 0],
        y: [0, -4, 4, -4, 4, -2, 2, 0],
        rotate: [0, -2, 2, -2, 2, -1, 1, 0],
        transition: {
          duration: 0.8,
        },
      }),
    ]);

    // Wait a moment then complete
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-indigo-950/30 via-black/20 to-purple-950/30 rounded-lg overflow-hidden">
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

      {/* Dotted trajectory path - disappears as asteroid progresses */}
      <svg
        className="absolute top-1/2 left-0 w-full h-2 pointer-events-none"
        style={{ transform: "translateY(-50%)" }}
      >
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop
              offset={`${pathProgress}%`}
              stopColor="white"
              stopOpacity="0"
            />
            <stop
              offset={`${pathProgress}%`}
              stopColor="white"
              stopOpacity="0.4"
            />
            <stop offset="100%" stopColor="white" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <line
          x1="10%"
          y1="50%"
          x2="85%"
          y2="50%"
          stroke="url(#pathGradient)"
          strokeWidth="2"
          strokeDasharray="10,15"
        />
      </svg>

      {/* Earth sprite (right side) */}
      <motion.div
        animate={earthShakeControls}
        className="absolute right-[8%] top-1/2 -translate-y-1/2"
      >
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
          {/* Glow effect */}
          <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl scale-125" />
        </div>
      </motion.div>

      {/* Asteroid sprite (left to right) */}
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
          {/* Asteroid trail effect */}
          <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-lg scale-150 -z-10" />
        </div>
      </motion.div>

      {/* Explosion effect at Earth position */}
      <motion.div
        animate={explosionControls}
        className="absolute right-[8%] top-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ scale: 0, opacity: 0 }}
      >
        <div className="relative w-48 h-48 sm:w-64 sm:h-64">
          {/* Fire layers - multiple colored circles */}
          <div className="absolute inset-0 bg-yellow-300 rounded-full blur-2xl opacity-90" />
          <div className="absolute inset-4 bg-orange-500 rounded-full blur-xl opacity-80" />
          <div className="absolute inset-8 bg-red-600 rounded-full blur-lg opacity-70" />
          <div className="absolute inset-12 bg-yellow-400 rounded-full blur-md opacity-60" />

          {/* Explosion particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-orange-400 rounded-full"
              style={{
                top: "50%",
                left: "50%",
              }}
              animate={{
                x: [0, Math.cos((i * Math.PI * 2) / 12) * 80],
                y: [0, Math.sin((i * Math.PI * 2) / 12) * 80],
                opacity: [1, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Animation label */}
      <div className="absolute top-6 left-6 text-white/70 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span>Impact Simulation Running</span>
        </div>
        <div className="mt-2 text-white/50 text-xs">{asteroidName}</div>
      </div>
    </div>
  );
}
