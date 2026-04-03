import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Cpu, Mail, Lock, ArrowRight, User, Sparkles,
  Eye, EyeOff, Zap, Mic, BarChart3, Video,
} from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { supabase } from "@/lib/supabase";

/* ─── Custom cursor glow that follows the mouse ─── */
const CursorGlow = () => {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  const ringX = useSpring(mouseX, { stiffness: 80, damping: 18, mass: 0.6 });
  const ringY = useSpring(mouseY, { stiffness: 80, damping: 18, mass: 0.6 });
  const glowX = useSpring(mouseX, { stiffness: 40, damping: 14, mass: 1 });
  const glowY = useSpring(mouseY, { stiffness: 40, damping: 14, mass: 1 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      try {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        setHovering(el?.closest('button, a, input, [role="button"]') !== null);
      } catch (err) {
        setHovering(false);
      }
    };
    const down = () => setClicking(true);
    const up   = () => setClicking(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99999 }}>
      
      {/* Soft ambient glow blob — slowest */}
      <motion.div className="absolute top-0 left-0" style={{ x: glowX, y: glowY }}>
        <div style={{
          transform: "translate(-50%, -50%)", 
          width: 320, height: 320,
          background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)",
          borderRadius: "50%"
        }} />
      </motion.div>

      {/* Outer ring — lags behind, scales on hover/click */}
      <motion.div className="absolute top-0 left-0" style={{ x: ringX, y: ringY }}>
        <motion.div
          className="rounded-full"
          style={{ transformOrigin: "center", borderStyle: "solid", x: "-50%", y: "-50%" }}
          initial={{ width: 34, height: 34, borderWidth: 1.5, borderColor: "rgba(167,139,250,0.85)", opacity: 0 }}
          animate={{
            width: clicking ? 18 : hovering ? 46 : 34,
            height: clicking ? 18 : hovering ? 46 : 34,
            borderColor: hovering ? "#a78bfa" : "rgba(167,139,250,0.85)",
            borderWidth: hovering ? 2 : 1.5,
            boxShadow: clicking
              ? "0 0 0 4px rgba(167,139,250,0.15), 0 0 20px 6px rgba(167,139,250,0.55)"
              : hovering
              ? "0 0 0 2px rgba(167,139,250,0.1), 0 0 24px 8px rgba(167,139,250,0.45)"
              : "0 0 14px 4px rgba(167,139,250,0.35)",
            opacity: 1,
          }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
        />
      </motion.div>

      {/* Inner dot — snaps to cursor instantly */}
      <motion.div className="absolute top-0 left-0" style={{ x: mouseX, y: mouseY }}>
        <motion.div
          className="rounded-full"
          style={{ transformOrigin: "center", x: "-50%", y: "-50%" }}
          initial={{ width: 7, height: 7 }}
          animate={{
            width: clicking ? 3 : hovering ? 5 : 7,
            height: clicking ? 3 : hovering ? 5 : 7,
            background: clicking ? "#fff" : hovering ? "#ede9fe" : "#c4b5fd",
            boxShadow: clicking
              ? "0 0 10px 4px rgba(196,181,253,0.95)"
              : hovering
              ? "0 0 12px 5px rgba(196,181,253,0.8)"
              : "0 0 8px 3px rgba(196,181,253,0.7)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        />
      </motion.div>

    </div>
  );
};

/* ─── Ambient Orb ─── */
const AmbientOrb = ({ delay, x, y, size, color }: {
  delay: number; x: string; y: string; size: number; color: string;
}) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color, filter: "blur(70px)" }}
    animate={{
      x: [0, 60, -40, 25, 0],
      y: [0, -70, 45, -20, 0],
      scale: [1, 1.3, 0.85, 1.15, 1],
      opacity: [0.45, 0.85, 0.55, 0.75, 0.45],
    }}
    transition={{ duration: 10, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

/* ─── Floating particles ─── */
const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 40 }).map((_, i) => {
      const size = i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5;
      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size, height: size,
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            background: i % 2 === 0 ? "hsl(var(--primary)/0.85)" : "hsl(var(--accent)/0.7)",
            boxShadow: i % 5 === 0 ? "0 0 6px 2px hsl(var(--primary)/0.5)" : "none",
          }}
          animate={{ y: [0, -160, 0], opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: (i * 0.3) % 7, ease: "easeInOut" }}
        />
      );
    })}
  </div>
);

/* ─── Radial pulse ─── */
const RadialPulse = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: 600, height: 600,
          left: "50%", top: "50%",
          marginLeft: -300, marginTop: -300,
          background: "radial-gradient(circle, hsl(var(--primary)/0.07) 0%, transparent 70%)",
        }}
        animate={{ scale: [0.6, 2.2], opacity: [0.6, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: i * 1.35, ease: "easeOut" }}
      />
    ))}
  </div>
);

/* ─── Grid ─── */
const Grid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
    <svg width="100%" height="100%">
      <defs>
        <pattern id="lg" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lg)" />
    </svg>
  </div>
);

/* ─── Orbit rings — fixed distinct radii, no merging ─── */
const OrbitRings = () => {
  const rings = [
    { r: 80,  speed: 12, dir: 1,  dotSize: 7, glow: 14, opacity: 0.28 },
    { r: 130, speed: 18, dir: -1, dotSize: 5, glow: 10, opacity: 0.20 },
    { r: 185, speed: 26, dir: 1,  dotSize: 4, glow: 8,  opacity: 0.14 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {rings.map(({ r, speed, dir, dotSize, glow, opacity }, i) => {
        const diameter = r * 2;
        return (
          <div key={i} className="absolute" style={{ width: diameter, height: diameter }}>
            {/* Static ring border */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: `1px solid hsl(var(--primary)/${opacity})` }}
            />
            {/* Rotating glowing dot */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ rotate: dir === 1 ? 360 : -360 }}
              transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: dotSize,
                  height: dotSize,
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "hsl(var(--primary))",
                  boxShadow: `0 0 ${glow}px ${Math.ceil(dotSize / 2)}px hsl(var(--primary)/0.8)`,
                }}
              />
            </motion.div>
          </div>
        );
      })}

      {/* Single outward ping from center — clean, no merging */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ping-${i}`}
          className="absolute rounded-full"
          style={{ border: "1px solid hsl(var(--primary)/0.5)", width: 40, height: 40 }}
          animate={{ scale: [1, 6], opacity: [0.6, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

/* ─── Stat chip ─── */
const StatCard = ({ icon: Icon, label, delay }: { icon: React.ElementType; label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 260, damping: 22 }}
    whileHover={{ scale: 1.08, y: -3, boxShadow: "0 4px 20px -4px hsl(var(--primary)/0.35)" }}
    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium cursor-default"
    style={{
      background: "hsl(var(--card)/0.7)",
      border: "1px solid hsl(var(--primary)/0.2)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 2px 12px -4px hsl(var(--primary)/0.2)",
    }}
  >
    <div
      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: "hsl(var(--primary)/0.15)" }}
    >
      <Icon className="w-3 h-3 text-primary" />
    </div>
    {label}
  </motion.div>
);

/* ─── Input field ─── */
const Field = ({
  label, icon: Icon, type = "text", value, onChange, placeholder, extra,
}: {
  label: string; icon: React.ElementType; type?: string;
  value: string; onChange: (v: string) => void; placeholder: string; extra?: React.ReactNode;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="flex items-center gap-1.5"><Icon className="w-3 h-3" />{label}</span>
        {extra}
      </label>
      <div className="relative">
        <input
          type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/40"
          style={{
            boxShadow: focused ? "0 0 0 2px hsl(var(--primary)/0.35), inset 0 1px 0 hsl(var(--primary)/0.07)" : "none",
            borderColor: focused ? "hsl(var(--primary)/0.6)" : undefined,
          }}
        />
        <AnimatePresence>
          {focused && (
            <motion.div
              key="glow"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top, hsl(var(--primary)/0.08) 0%, transparent 70%)" }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ══════════════════════ MAIN ══════════════════════ */
const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  // Email login/signup
  const handleSubmit = async () => {
    setLoading(true);
    const authFunction = isSignUp ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    
    const { error } = await authFunction({
      email,
      password,
      options: isSignUp ? { data: { full_name: name } } : undefined
    });

    if (error) {
      alert(error.message); // Will display any errors (like wrong password)
    }
    setLoading(false);
    // Note: We don't need to route manually. The AuthContext detects the login and automatically swaps the view!
  };

  // Google & GitHub login
  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) console.error("OAuth Error:", error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-6 relative overflow-hidden bg-background" style={{ cursor: "none" }}>

      {/* ── Custom cursor ── */}
      <CursorGlow />
      {/* Force pointer cursor on interactive elements */}
      <style>{`
        button, input, a, [role="button"] { cursor: pointer !important; }
        input[type="text"], input[type="email"], input[type="password"] { cursor: text !important; }
      `}</style>

      {/* ── Ambient orbs ── */}
      <AmbientOrb delay={0}  x="0%"  y="5%"  size={560} color="hsl(var(--primary)/0.18)" />
      <AmbientOrb delay={2}  x="60%" y="0%"  size={480} color="hsl(var(--accent)/0.14)"  />
      <AmbientOrb delay={5}  x="50%" y="60%" size={440} color="hsl(var(--primary)/0.16)" />
      <AmbientOrb delay={8}  x="10%" y="70%" size={360} color="hsl(var(--accent)/0.18)"  />
      <AmbientOrb delay={11} x="75%" y="50%" size={320} color="hsl(var(--primary)/0.12)" />

      <Grid />
      <Particles />
      <RadialPulse />

      {/* Central spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, hsl(var(--primary)/0.1) 0%, transparent 70%)" }}
      />

      {/* ══ Card ══ */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="w-full max-w-5xl relative z-10 flex flex-col md:flex-row rounded-3xl overflow-hidden"
        style={{
          background: "hsl(var(--card)/0.72)",
          backdropFilter: "blur(28px)",
          border: "1px solid hsl(var(--border))",
          boxShadow:
            "0 0 0 1px hsl(var(--primary)/0.1), 0 40px 90px -20px hsl(var(--background)), 0 0 80px -10px hsl(var(--primary)/0.22)",
        }}
      >

        {/* ══ LEFT — Form ══ */}
        <div className="flex-[1.2] flex flex-col justify-center px-8 md:px-14 py-12">
          <div className="max-w-sm w-full mx-auto">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10 flex items-center gap-3"
            >
              <motion.div
                whileHover={{ rotate: 10, scale: 1.08 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "hsl(var(--primary)/0.12)",
                  border: "1px solid hsl(var(--primary)/0.25)",
                  boxShadow: "0 0 18px -4px hsl(var(--primary)/0.55)",
                  
                }}
              >
                <Cpu className="w-5 h-5 text-primary" />
              </motion.div>
              <span className="font-bold text-xl tracking-tight">
                HireMind<span className="text-primary"> AI</span>
              </span>
              <div
                className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ background: "hsl(142 72% 50% / 0.1)", border: "1px solid hsl(142 72% 50% / 0.25)" }}
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.3, repeat: Infinity }}
                />
                <span className="text-[10px] font-semibold text-green-500">LIVE</span>
              </div>
            </motion.div>

            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? "signup-head" : "signin-head"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="mb-8"
              >
                <h1 className="text-2xl font-bold mb-1.5 tracking-tight">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isSignUp
                    ? "Start your AI-powered interview journey today"
                    : "Sign in to continue your practice sessions"}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Social buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3 mb-6"
            >
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 18px -4px hsl(var(--primary)/0.4)" }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleOAuthLogin('github')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-secondary/40 transition-colors text-sm font-medium"
              >
                <FaGithub className="w-4 h-4" /> GitHub
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 18px -4px hsl(var(--primary)/0.4)" }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleOAuthLogin('google')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-secondary/40 transition-colors text-sm font-medium"
              >
                <FaGoogle className="w-4 h-4" /> Google
              </motion.button>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground tracking-wide">or continue with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Fields */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="space-y-4 mb-6"
            >
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}
                  >
                    <Field label="Full Name" icon={User} value={name} onChange={setName} placeholder="Alex Johnson" />
                  </motion.div>
                )}
              </AnimatePresence>

              <Field label="Email" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

              {/* Password */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" />Password</span>
                  {!isSignUp && (
                    <button className="text-primary hover:underline normal-case tracking-normal font-medium text-[11px]">
                      Forgot?
                    </button>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/40"
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 0 2px hsl(var(--primary)/0.35)";
                      e.currentTarget.style.borderColor = "hsl(var(--primary)/0.6)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "";
                    }}
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={showPw ? "eye" : "eye-off"}
                        initial={{ opacity: 0, rotate: -20 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 20 }}
                        transition={{ duration: 0.15 }}
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.025, boxShadow: "0 0 44px -6px hsl(var(--primary)/0.75), 0 4px 14px -2px hsl(var(--primary)/0.45)" }}
              whileTap={{ scale: 0.975 }}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full relative overflow-hidden rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 text-primary-foreground disabled:opacity-75"
              style={{
                background: "hsl(var(--primary))",
                boxShadow: "0 0 30px -6px hsl(var(--primary)/0.6), 0 2px 8px -2px hsl(var(--primary)/0.35)",
              }}
            >
              {!loading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/22 to-transparent"
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2 }}
                />
              )}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <motion.div
                      className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                    Signing in…
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    {isSignUp ? "Create Account" : "Sign In"}
                    <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-semibold hover:underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>

        {/* ══ RIGHT — Branding ══ */}
        <div
          className="flex-1 hidden md:flex flex-col items-center justify-center p-12 relative overflow-hidden"
          style={{ background: "hsl(var(--secondary)/0.12)", borderLeft: "1px solid hsl(var(--border))" }}
        >
          <OrbitRings />

          {/* Corner glows */}
          <div
            className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
            style={{ background: "radial-gradient(circle at top right, hsl(var(--primary)/0.2) 0%, transparent 65%)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
            style={{ background: "radial-gradient(circle at bottom left, hsl(var(--accent)/0.16) 0%, transparent 65%)" }}
          />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center space-y-8 relative z-10"
          >
            {/* Hero icon */}
            <div className="relative mx-auto w-fit">
              <motion.div
                animate={{
                  rotate: [0, 8, -8, 0],
                  scale: [1, 1.07, 0.96, 1],
                  boxShadow: [
                    "0 0 30px -10px hsl(var(--primary)/0.4)",
                    "0 0 65px -5px hsl(var(--primary)/0.75)",
                    "0 0 30px -10px hsl(var(--primary)/0.4)",
                  ],
                }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 rounded-3xl flex items-center justify-center"
                style={{ background: "hsl(var(--primary)/0.12)", border: "1px solid hsl(var(--primary)/0.28)" }}
              >
                <motion.div
                  animate={{ rotate: [0, -360] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                >
                  <Cpu className="w-12 h-12 text-primary" />
                </motion.div>
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: "hsl(var(--accent)/0.18)",
                  border: "1px solid hsl(var(--accent)/0.35)",
                  boxShadow: "0 0 14px -2px hsl(var(--accent)/0.55)",
                }}
                animate={{ scale: [1, 1.4, 1], rotate: [0, 18, 0] }}
                transition={{ duration: 1.9, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-accent" />
              </motion.div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">AI-Powered Interviews</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[230px] mx-auto">
                Practice with intelligent evaluation across voice, video, and text.
                Get detailed feedback on every answer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-w-[250px] mx-auto">
              {[
                { label: "4 Rounds",       icon: Zap      },
                { label: "Voice Analysis", icon: Mic      },
                { label: "Video Monitor",  icon: Video    },
                { label: "Smart Scoring",  icon: BarChart3 },
              ].map(({ label, icon }, i) => (
                <StatCard key={label} icon={icon} label={label} delay={0.55 + i * 0.1} />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;