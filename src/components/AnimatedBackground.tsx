"use client";

import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
} from "framer-motion";
import { useEffect, useRef } from "react";

// ─── Particle Canvas ──────────────────────────────────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; hue: number;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.5 ? 215 : 190,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${p.hue}, 80%, 70%, ${(1 - dist / 110) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grad.addColorStop(0, `hsla(${p.hue}, 90%, 85%, ${p.alpha})`);
        grad.addColorStop(1, `hsla(${p.hue}, 90%, 70%, 0)`);
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen dark:opacity-60 pointer-events-none"
    />
  );
};

// ─── Data Streams ─────────────────────────────────────────────────────────────
const DataStreams = () => {
  const streams = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 8 + i * 12,
    delay: i * 0.7,
    duration: 3.5 + i * 0.4,
    opacity: 0.07 + (i % 3) * 0.04,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {streams.map((s) => (
        <motion.div
          key={s.id}
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${s.x}%`, opacity: s.opacity }}
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: [0, 1, 1, 0] }}
          transition={{
            duration: s.duration, delay: s.delay,
            repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut",
          }}
        >
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(100,160,255,0.6) 40%, rgba(40,220,255,0.8) 60%, transparent)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

// ─── Hex Grid ─────────────────────────────────────────────────────────────────
const HexGrid = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    style={{ opacity: 0.045 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
        <polygon
          points="30,2 58,17 58,47 30,62 2,47 2,17"
          fill="none"
          stroke="rgba(120,180,255,1)"
          strokeWidth="0.7"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex)" />
  </svg>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const AnimatedBackground = () => {
  const { scrollYProgress, scrollY } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 55, damping: 22 });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const move = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mouseX, mouseY]);

  const w = typeof window !== "undefined" ? window.innerWidth || 1 : 1;
  const h = typeof window !== "undefined" ? window.innerHeight || 1 : 1;

  const gridY    = useTransform(scrollY, [0, 2500], [0, -200]);
  const ringY    = useTransform(scrollY, [0, 2500], [30, -90]);
  const haloY    = useTransform(scrollY, [0, 2500], [0, -60]);
  const auroraY  = useTransform(scrollY, [0, 2500], [0, 120]);

  const mouseSlowX = useTransform(mouseX, [0, w], [-10, 10]);
  const mouseMidX  = useTransform(mouseX, [0, w], [-22, 22]);
  const mouseMidY  = useTransform(mouseY, [0, h], [-16, 16]);
  const mouseFastX = useTransform(mouseX, [0, w], [-36, 36]);
  const mouseFastY = useTransform(mouseY, [0, h], [-28, 28]);

  const ringX      = useSpring(mouseMidX, { stiffness: 40, damping: 18 });
  const ringRotate = useTransform(smoothScroll, [0, 1], [0, 25]);
  const innerRotate= useTransform(smoothScroll, [0, 1], [0, -15]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#020408] dark:bg-[#020408]">

      {/* Light mode base — soft blue-white gradient instead of black */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 10%, #dbeafe 0%, #eff6ff 40%, #f8fafc 70%, #f1f5f9 100%)",
        }}
      />

      {/* Dark mode deep void overlay */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, #060d1f 0%, #020408 60%, #000000 100%)",
        }}
      />

      <HexGrid />
      <ParticleField />
      <DataStreams />

      {/* Scanning grid */}
      <motion.div
        className="absolute -inset-[25%] opacity-25 mix-blend-multiply dark:mix-blend-screen dark:opacity-25"
        style={{ y: gridY, x: mouseSlowX }}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(80,120,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(80,120,255,0.10) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </motion.div>

      {/* Aurora band */}
      <motion.div
        className="absolute -top-[30%] left-[10%] right-[10%] h-[55vh] blur-[90px] pointer-events-none"
        style={{ y: auroraY, x: mouseSlowX, opacity: 0.3 }}
      >
        <div
          className="w-full h-full rounded-[50%]"
          style={{
            background:
              "conic-gradient(from 200deg, #0a1aff22, #00d4ff44, #7c3aed33, #0a1aff22)",
          }}
        />
      </motion.div>

      {/* Moving scanline shimmer */}
      <motion.div
        className="absolute inset-x-0 h-[200vh] opacity-15 mix-blend-screen pointer-events-none"
        style={{ y: useTransform(smoothScroll, [0, 1], [-60, 20]) }}
      >
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(120,200,255,0.18) 45%, rgba(80,220,255,0.12) 55%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* ── Primary halo — VISIBLE IN BOTH MODES ─────────────────────────────── */}
      {/* Light mode halo: strong blue sphere, multiply blend so it tints the white bg */}
      <motion.div
        className="absolute top-[3%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] max-w-[780px] max-h-[780px] rounded-full pointer-events-none dark:hidden"
        style={{
          y: haloY,
          x: mouseSlowX,
          background:
            "radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(99,102,241,0.30) 40%, rgba(147,197,253,0.15) 70%, transparent 100%)",
          filter: "blur(80px)",
        }}
      />
      {/* Dark mode halo */}
      <motion.div
        className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[130px] pointer-events-none hidden dark:block"
        style={{
          y: haloY,
          x: mouseSlowX,
          background:
            "radial-gradient(circle, rgba(40,100,255,0.22) 0%, rgba(20,200,255,0.08) 60%, transparent 100%)",
        }}
      />

      {/* ── Secondary accent halo ─────────────────────────────────────────────── */}
      {/* Light mode */}
      <motion.div
        className="absolute top-[15%] left-[35%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] rounded-full pointer-events-none dark:hidden"
        style={{
          x: mouseFastX,
          y: useSpring(mouseFastY, { stiffness: 30, damping: 18 }),
          background: "rgba(139,92,246,0.35)",
          filter: "blur(90px)",
        }}
      />
      {/* Dark mode */}
      <motion.div
        className="absolute top-[18%] left-[38%] w-[30vw] h-[30vw] max-w-[340px] max-h-[340px] rounded-full blur-[100px] pointer-events-none hidden dark:block"
        style={{
          x: mouseFastX,
          y: useSpring(mouseFastY, { stiffness: 30, damping: 18 }),
          background: "rgba(120, 40, 255, 0.12)",
        }}
      />

      {/* ── Tertiary right accent ─────────────────────────────────────────────── */}
      {/* Light mode */}
      <motion.div
        className="absolute top-[18%] right-[8%] w-[28vw] h-[28vw] max-w-[320px] max-h-[320px] rounded-full pointer-events-none dark:hidden"
        style={{
          x: useTransform(mouseFastX, (v) => -v * 0.5),
          background: "rgba(6,182,212,0.28)",
          filter: "blur(80px)",
        }}
      />
      {/* Dark mode */}
      <motion.div
        className="absolute top-[20%] right-[8%] w-[24vw] h-[24vw] max-w-[280px] max-h-[280px] rounded-full blur-[80px] pointer-events-none hidden dark:block"
        style={{
          x: useTransform(mouseFastX, (v) => -v * 0.5),
          background: "rgba(0, 220, 200, 0.08)",
        }}
      />

      {/* ── Outer HUD ring ────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 w-[82vw] h-[82vw] max-w-[900px] max-h-[900px] rounded-full pointer-events-none"
        style={{
          y: ringY, x: ringX, rotate: ringRotate,
          border: "1px solid rgba(80,140,255,0.18)",
          boxShadow: "0 0 100px rgba(60,140,255,0.08), inset 0 0 60px rgba(60,140,255,0.06)",
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-52 h-px origin-left"
            style={{
              transform: `rotate(${(360 / 24) * i}deg) translateY(-50%)`,
              background: i % 6 === 0
                ? "linear-gradient(to right, rgba(100,180,255,0.5), rgba(40,220,255,0.2), transparent)"
                : "linear-gradient(to right, rgba(80,140,255,0.2), transparent)",
            }}
          />
        ))}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
            style={{
              transform: `rotate(${deg}deg) translateX(calc(41vw - 4px)) translateY(-50%)`,
              background: "rgba(80,200,255,0.8)",
              boxShadow: "0 0 12px rgba(40,220,255,0.9)",
            }}
          />
        ))}
      </motion.div>

      {/* ── Mid HUD ring ──────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 w-[62vw] h-[62vw] max-w-[680px] max-h-[680px] rounded-full pointer-events-none"
        style={{
          y: useTransform(scrollY, [0, 2500], [50, -70]),
          x: ringX, rotate: innerRotate,
          border: "1px solid rgba(100,160,255,0.12)",
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-52 h-px origin-left"
            style={{
              transform: `rotate(${(360 / 12) * i + 15}deg) translateY(-50%)`,
              background: "linear-gradient(to right, rgba(120,180,255,0.3), transparent)",
            }}
          />
        ))}
        <div
          className="absolute inset-8 rounded-full"
          style={{ border: "1px dashed rgba(80,140,255,0.1)" }}
        />
      </motion.div>

      {/* ── Inner HUD ring ────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 w-[42vw] h-[42vw] max-w-[460px] max-h-[460px] rounded-full pointer-events-none"
        style={{
          y: useTransform(scrollY, [0, 2500], [60, -45]),
          x: useSpring(mouseSlowX, { stiffness: 50, damping: 20 }),
          rotate: useTransform(smoothScroll, [0, 1], [0, 10]),
          border: "1px solid rgba(60,220,255,0.10)",
          boxShadow: "inset 0 0 40px rgba(40,200,255,0.06)",
        }}
      />

      {/* ── Bottom ground glow ────────────────────────────────────────────────── */}
      {/* Light */}
      <motion.div
        className="absolute bottom-[-22vh] left-1/2 -translate-x-1/2 w-[100vw] h-[50vh] rounded-full pointer-events-none dark:hidden"
        style={{
          x: mouseSlowX,
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.10) 50%, transparent 80%)",
          filter: "blur(60px)",
        }}
      />
      {/* Dark */}
      <motion.div
        className="absolute bottom-[-22vh] left-1/2 -translate-x-1/2 w-[100vw] h-[50vh] rounded-full blur-[150px] pointer-events-none hidden dark:block"
        style={{
          x: mouseSlowX,
          background:
            "radial-gradient(ellipse at center, rgba(30,180,255,0.15) 0%, rgba(80,80,255,0.06) 50%, transparent 80%)",
        }}
      />

      {/* Corner vignettes */}
      <div className="absolute top-0 left-0 w-[35vw] h-[35vh] opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(40,80,255,0.18),transparent_70%)]" />
      <div className="absolute bottom-0 right-0 w-[35vw] h-[35vh] opacity-30 pointer-events-none bg-[radial-gradient(circle_at_bottom_right,rgba(0,200,255,0.12),transparent_70%)]" />

      {/* Edge vignette — lighter in light mode */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_70%_at_50%_40%,transparent_40%,rgba(0,0,0,0.08)_100%)] dark:bg-[radial-gradient(ellipse_70%_70%_at_50%_40%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

      {/* Top shimmer — DARK MODE ONLY (was causing the yellow strip in light) */}
      <div className="absolute inset-x-0 top-0 h-[2px] opacity-40 pointer-events-none hidden dark:block bg-[linear-gradient(to_right,transparent,rgba(80,180,255,0.6)_30%,rgba(40,220,255,0.9)_50%,rgba(80,180,255,0.6)_70%,transparent)]" />
    </div>
  );
};

export default AnimatedBackground;