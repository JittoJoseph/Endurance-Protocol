"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({
  content,
  children,
  position = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: position === "top" ? 5 : -5,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === "top" ? 5 : -5 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
          >
            <div className="bg-black/95 backdrop-blur-xl border border-white/30 px-3 py-2 rounded shadow-lg max-w-xs">
              <div className="text-white/90 text-xs leading-relaxed">
                {content}
              </div>
            </div>
            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-black/95 border-white/30 transform rotate-45 ${
                position === "top"
                  ? "bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r"
                  : position === "bottom"
                  ? "top-[-4px] left-1/2 -translate-x-1/2 border-t border-l"
                  : position === "left"
                  ? "right-[-4px] top-1/2 -translate-y-1/2 border-t border-r"
                  : "left-[-4px] top-1/2 -translate-y-1/2 border-b border-l"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
