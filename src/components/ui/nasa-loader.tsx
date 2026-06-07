import { motion } from "framer-motion";

export const NasaLoader = ({ text }: { text: string | React.ReactNode }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-5">
      {/* High-tech spinner */}
      <div className="relative w-10 h-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-[1px] border-white/10 border-t-white/80 border-r-white/80"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-[1px] border-white/5 border-l-white/40 border-b-white/40"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        </div>
      </div>
      
      <div className="text-white/60 text-[10px] uppercase tracking-widest font-mono text-center">
        {text}
      </div>
    </div>
  );
};
