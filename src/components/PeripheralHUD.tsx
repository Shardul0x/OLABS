import { motion } from "framer-motion";

export default function PeripheralHUD() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      
      {/* 1. Massive Background Orbs (Fills the empty dark voids) */}
      <motion.div 
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full mix-blend-screen opacity-20"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)", filter: "blur(100px)" }}
        animate={{ x: [0, 50, 0], y: [0, 100, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-1/3 -right-60 w-[800px] h-[800px] rounded-full mix-blend-screen opacity-10"
        style={{ background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)", filter: "blur(120px)" }}
        animate={{ x: [0, -70, 0], y: [0, -50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 2. Floating Frosted Glass Shapes (Adds 3D depth to the sides) */}
      <motion.div 
        className="absolute top-[20%] left-[5%] w-32 h-32 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl"
        animate={{ y: [0, -40, 0], rotate: [0, 45, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-[30%] right-[8%] w-48 h-48 rounded-full border border-white/5 bg-white/[0.01] backdrop-blur-2xl"
        animate={{ y: [0, 50, 0], scale: [1, 1.1, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 3. Left Edge HUD Tracker */}
      <div className="hidden 2xl:flex absolute left-8 top-1/2 -translate-y-1/2 h-[60vh] flex-col items-center justify-between opacity-30">
        <div className="text-[10px] tracking-[0.3em] font-mono rotate-180" style={{ writingMode: 'vertical-rl' }}>
          SYSTEM_ONLINE // V_2.0
        </div>
        <div className="w-px h-full bg-gradient-to-b from-primary/0 via-primary to-primary/0 my-4 relative">
          {/* Animated scanning dot */}
          <motion.div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
            animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="text-[10px] tracking-[0.3em] font-mono rotate-180" style={{ writingMode: 'vertical-rl' }}>
          SECURE_CONNECTION
        </div>
      </div>

      {/* 4. Right Edge Matrix Grid */}
      <div className="hidden 2xl:block absolute right-12 top-1/4 opacity-20">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div 
              key={i} className="w-1 h-1 rounded-full bg-primary"
              animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>

    </div>
  );
}