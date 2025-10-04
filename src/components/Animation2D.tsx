"use client";

import { animate, motion, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Animation2DProps {
  onComplete: () => void;
}

/**
 * Minimal 2D trajectory animation inside analysis panel
 * Asteroid travels left → right, dotted path trails ahead, explosion on impact
 */
export default function Animation2D({ onComplete }: Animation2DProps) {
  const pathRef = useRef<HTMLDivElement>(null);
  const asteroidX = useMotionValue(0);
  const [pathWidth, setPathWidth] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showImpact, setShowImpact] = useState(false);
  const [asteroidDestroyed, setAsteroidDestroyed] = useState(false);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const impactTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const measure = () => {
      if (pathRef.current) {
        setPathWidth(pathRef.current.offsetWidth);
      }
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const unsubscribe = asteroidX.on("change", (latest) => {
      if (!pathWidth) return;
      setProgress(Math.min(1, latest / pathWidth));
    });

    return () => unsubscribe();
  }, [asteroidX, pathWidth]);

  useEffect(() => {
    if (!pathWidth) return;

    animationRef.current?.stop();
    if (impactTimeoutRef.current) {
      clearTimeout(impactTimeoutRef.current);
      impactTimeoutRef.current = null;
    }

    asteroidX.set(0);
    setProgress(0);
    setShowImpact(false);
    setAsteroidDestroyed(false);

    let cancelled = false;

    animationRef.current = animate(asteroidX, pathWidth, {
      duration: 4.2,
      ease: "linear",
    });

    animationRef.current.then(() => {
      if (cancelled) return;
      setShowImpact(true);
      setAsteroidDestroyed(true);
      impactTimeoutRef.current = setTimeout(() => {
        if (!cancelled) {
          setShowImpact(false);
          onComplete();
        }
      }, 900);
    });

    return () => {
      cancelled = true;
      animationRef.current?.stop();
      if (impactTimeoutRef.current) {
        clearTimeout(impactTimeoutRef.current);
        impactTimeoutRef.current = null;
      }
    };
  }, [asteroidX, onComplete, pathWidth]);

  return (
    <div className="relative w-full h-32">
      {/* Earth sprite (fixed top-right) */}
      <div className="absolute top-0 right-0">
        <div className="relative w-16 h-16">
          <Image src="/earth.png" alt="Earth" fill className="object-contain" />
        </div>
      </div>

      {/* Trajectory path */}
      <div className="absolute left-0 right-0 top-12 px-20">
        <div ref={pathRef} className="relative h-[2px]">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(148,163,184,0.5)_0_9px,transparent_9px_18px)]" />
          <div
            className="absolute inset-0 bg-black/90"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />

          {/* Asteroid traveling */}
          {!asteroidDestroyed && (
            <motion.div
              style={{ x: asteroidX }}
              className="absolute -top-6 left-0"
            >
              <div className="relative w-12 h-12">
                <Image
                  src="/sattelite.png"
                  alt="Asteroid"
                  fill
                  className="object-contain"
                  style={{ filter: "brightness(0.85) contrast(1.2)" }}
                />
              </div>
            </motion.div>
          )}

          {/* Impact flash */}
          {showImpact && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0.3 }}
              animate={{ scale: [0.6, 1.8, 2.2], opacity: [0.5, 0.9, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 pointer-events-none"
            >
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-gradient-radial from-amber-400/70 via-orange-500/60 to-transparent rounded-full blur-md" />
                <div className="absolute inset-2 bg-gradient-radial from-white/80 via-amber-300/70 to-transparent rounded-full blur" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-0 px-20">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.3em] text-white/45">
          <span>Asteroid</span>
          <span>Earth</span>
        </div>
      </div>
    </div>
  );
}
