"use client";

import {
  motion, AnimatePresence, useScroll, useTransform,
  useSpring, useMotionValue,
} from "framer-motion";
import {
  ArrowRight, Mic, Video, Brain, BarChart3, Shield, Sparkles,
  Upload, FileText, MessageSquare, X, Shuffle, Layers, ChevronRight,
} from "lucide-react";
import { useInterview, InterviewMode } from "@/contexts/InterviewContext";
import { useRef, useState, useEffect, useCallback } from "react";
import { FluidTabs, type TabItem } from "@/components/ui/fluid-tabs";
import AnimatedBackground from "@/components/AnimatedBackground";
import ScrollReveal from "@/components/ScrollReveal";
import PeripheralHUD from "@/components/PeripheralHUD";
import CustomCursor from "@/components/CustomCursor";

// ─── TOPICSUBTOPICS — defined locally ────────────────────────────────────────
const TOPICSUBTOPICS: Record<string, string[]> = {
  OS:   ["Processes", "Threads", "Memory Management", "Scheduling", "Deadlocks", "Virtual Memory", "File Systems"],
  DBMS: ["SQL", "Normalization", "ACID", "Transactions", "Indexing", "NoSQL", "Query Optimization"],
  CN:   ["TCP/IP", "OSI Model", "DNS", "HTTP/HTTPS", "Routing", "Subnetting", "Socket Programming"],
  OOP:  ["SOLID Principles", "Design Patterns", "Inheritance", "Polymorphism", "Abstraction", "Encapsulation"],
  DSA:  ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Sorting", "Hashing"],
};

// ─── Magnetic Hook ────────────────────────────────────────────────────────────
function useMagnetic(strength = 0.15) {
  const ref = useRef<HTMLElement | null>(null);
  const x   = useMotionValue(0);
  const y   = useMotionValue(0);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  }, [x, y, strength]);
  const handleMouseLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.addEventListener("mousemove",  handleMouseMove as EventListener);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove",  handleMouseMove as EventListener);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);
  return {
    ref,
    x: useSpring(x, { stiffness: 300, damping: 30 }),
    y: useSpring(y, { stiffness: 300, damping: 30 }),
  };
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const features = [
  { icon: Mic,       title: "Voice Analysis",  desc: "Clarity, cadence, and confidence scored in real time." },
  { icon: Video,     title: "Video Tracking",  desc: "Behavioral cue detection and eye-contact scoring." },
  { icon: Brain,     title: "AI Evaluation",   desc: "Context-aware depth grading by domain specialists." },
  { icon: BarChart3, title: "Score Reports",   desc: "50 granular metrics per response session." },
  { icon: Shield,    title: "Secure Sessions", desc: "Zero-retention policy. End-to-end encrypted." },
];

const modeTabs: TabItem[] = [
  { id: "text",  label: "Text Mode",     icon: <MessageSquare size={15} /> },
  { id: "voice", label: "Voice Mode",    icon: <Mic size={15} />           },
  { id: "video", label: "Video + Audio", icon: <Video size={15} />         },
];

const topicMeta: Record<string, { icon: string; desc: string; colorDark: string; colorLight: string }> = {
  OS:   { icon: "🖥️", desc: "Processes · Memory · Scheduling", colorDark: "rgba(80,160,255,0.15)",  colorLight: "rgba(37,99,235,0.10)"  },
  DBMS: { icon: "🗄️", desc: "SQL · Normalization · ACID",      colorDark: "rgba(120,80,255,0.15)",  colorLight: "rgba(109,40,217,0.10)"  },
  CN:   { icon: "🌐", desc: "TCP/IP · OSI · DNS · HTTP",        colorDark: "rgba(40,200,255,0.15)",  colorLight: "rgba(6,182,212,0.12)"   },
  OOP:  { icon: "🧱", desc: "SOLID · Patterns · Inheritance",   colorDark: "rgba(255,100,80,0.12)",  colorLight: "rgba(239,68,68,0.08)"   },
  DSA:  { icon: "⚡", desc: "Arrays · Trees · DP · Graphs",     colorDark: "rgba(40,220,140,0.12)",  colorLight: "rgba(16,185,129,0.10)"  },
};

// ─── Component ────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const {
    sessionId, mode, setMode,
    resumeFile,        setResumeFile,
    additionalFiles,   setAdditionalFiles,
    startSession,
    selectedTopics,    setSelectedTopics,
    selectedSubtopics, setSelectedSubtopics,
    randomTopics,      setRandomTopics,
    isLoading,         setIsLoading,
  } = useInterview();

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const docInputRef    = useRef<HTMLInputElement>(null);
  const [dropActive, setDropActive] = useState(false);
  const [isDark, setIsDark]         = useState(true);

  // Track theme
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  const { scrollYProgress, scrollY } = useScroll();
  const scaleY   = useSpring(scrollYProgress, { stiffness: 80, damping: 30 });
  const contentY = useTransform(scrollY, [0, 2500], [0, -25]);
  const cta      = useMagnetic(0.2);

  const scrollToSetup = () =>
    document.getElementById("setup-section")?.scrollIntoView({ behavior: "smooth" });

  const toggleTopic = (topic: string) => {
    if (randomTopics) return;
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter(t => t !== topic)
      : [...selectedTopics, topic];
    setSelectedTopics(next);
    setSelectedSubtopics(selectedSubtopics.filter(s => next.some(t => TOPICSUBTOPICS[t]?.includes(s))));
  };

  const toggleSubtopic = (sub: string) => {
    if (!randomTopics)
      setSelectedSubtopics(
        selectedSubtopics.includes(sub)
          ? selectedSubtopics.filter(s => s !== sub)
          : [...selectedSubtopics, sub]
      );
  };

  const handleRandom = () => {
    setRandomTopics(!randomTopics);
    if (!randomTopics) { setSelectedTopics([]); setSelectedSubtopics([]); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDropActive(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") setResumeFile(file);
  };

  // INTEGRATED BACKEND HANDLER
  const handleStartInterview = async () => {
    if (!resumeFile) {
      alert("Please upload your resume to continue.");
      return;
    }

    setIsLoading(true); // Triggers loading UI states globally

    const formData = new FormData();
    formData.append("resume", resumeFile);
    additionalFiles.forEach((file) => {
      formData.append("additional_docs", file);
    });

    try {
      // Calls FastAPI on port 8000
      const response = await fetch("http://localhost:8000/start-interview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Backend failed to initialize session.");

      const data = await response.json();

      // Passes server-generated ID and first question to the Interview Phase
      startSession(data.session_id, data.first_question);

    } catch (error) {
      console.error("Connection Error:", error);
      alert("Could not connect to AI backend. Ensure your Python server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const bg = isDark ? "#020408" : "#f0f4ff";

  return (
    <div
      className="relative min-h-screen overflow-x-hidden selection:bg-primary/20 selection:text-primary font-body"
      style={{ background: bg }}
    >
      <CustomCursor />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@400;500;700;900&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }

        :root {
          --c-blue:   rgba(60,140,255,1);
          --c-cyan:   rgba(40,220,255,1);
          --c-violet: rgba(130,60,255,1);
        }

        .hm-root {
          --glass-bg:       rgba(6,10,22,0.80);
          --glass-border:   rgba(100,160,255,0.14);
          --glass-shadow:   0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(120,180,255,0.10);
          --card-bg:        rgba(8,12,24,0.82);
          --card-border:    rgba(80,130,255,0.10);
          --card-hover-bg: rgba(12,18,36,0.88);
          --card-hover-border: rgba(80,160,255,0.25);
          --card-hover-shadow: 0 0 40px rgba(40,100,255,0.08);
          --text-primary:    rgba(255,255,255,0.95);
          --text-secondary: rgba(180,210,255,0.85);
          --text-muted:      rgba(147,197,253,0.50);
          --text-faint:     rgba(147,197,253,0.40);
          --text-dim:       rgba(147,197,253,0.35);
          --step-color:     rgba(40,220,255,0.90);
          --badge-bg:       linear-gradient(135deg,rgba(40,80,255,0.20),rgba(0,200,255,0.15));
          --badge-border:    rgba(80,160,255,0.30);
          --divider:         linear-gradient(to right, transparent, rgba(80,140,255,0.15), transparent);
          --rail-bg:         rgba(255,255,255,0.04);
          --input-bg:        rgba(255,255,255,0.04);
          --input-bg-h:      rgba(255,255,255,0.08);
          --input-border:    rgba(255,255,255,0.07);
          --topic-idle-bg:   rgba(255,255,255,0.02);
          --topic-idle-b:    rgba(255,255,255,0.07);
          --topic-idle-bh:   rgba(255,255,255,0.14);
          --topic-idle-bgh: rgba(255,255,255,0.05);
          --sub-idle-bg:     rgba(255,255,255,0.05);
          --sub-idle-bgh:    rgba(255,255,255,0.10);
          --sub-idle-text:   rgba(255,255,255,0.55);
          --sub-idle-texth: rgba(255,255,255,0.80);
          --sub-idle-b:      rgba(255,255,255,0.07);
          --sub-sel-bg:      #ffffff;
          --sub-sel-text:    #000000;
          --file-row-bg:     rgba(255,255,255,0.04);
          --file-row-b:      rgba(255,255,255,0.06);
          --file-text:       rgba(255,255,255,0.75);
          --file-del:        rgba(255,255,255,0.30);
          --scroll-text:     rgba(255,255,255,0.25);
          --session-text:    rgba(255,255,255,0.25);
          --drop-idle-b:     rgba(96,165,250,0.15);
          --drop-idle-bh:    rgba(96,165,250,0.30);
          --drop-txt:        rgba(255,255,255,0.80);
          --drop-sub:        rgba(147,197,253,0.35);
          --resume-fn:       rgba(255,255,255,1);
          --resume-sz:       rgba(147,197,253,0.50);
          --no-file-txt:     rgba(255,255,255,0.30);
          --no-file-sub:     rgba(255,255,255,0.20);
          --rand-idle-bg:    rgba(255,255,255,0.04);
          --rand-idle-bgh:   rgba(255,255,255,0.08);
          --rand-idle-b:     rgba(255,255,255,0.10);
          --rand-idle-text: rgba(255,255,255,0.55);
          --rand-idle-texth:rgba(255,255,255,0.80);
          --feat-title:      rgba(255,255,255,0.90);
          --feat-desc:       rgba(147,197,253,0.40);
          --feat-icon:       rgba(147,197,253,0.60);
          --skill-desc:      rgba(147,197,253,0.45);
          --topic-name:      rgba(255,255,255,1);
          --topic-desc:      rgba(147,197,253,0.40);
          --sub-label:       rgba(40,220,255,0.70);
          --ingestion-desc: rgba(147,197,253,0.45);
          --h2-sub:          rgba(147,197,253,0.40);
          --del-btn:         rgba(255,255,255,0.40);
          --del-btn-bgh:     rgba(239,68,68,0.20);
          --browse-text:     rgba(255,255,255,0.60);
          --browse-texth:    rgba(255,255,255,0.90);
          --pill-text:       rgba(167,139,250,0.70);
          --pill-bg:         rgba(167,139,250,0.10);
          --pill-b:          rgba(167,139,250,0.20);
          --start-text:      #000000;
          --hero-sub:        rgba(191,219,254,0.50);
          --hero-highlight: rgba(191,219,254,0.80);
        }

        .hm-root.light {
          --glass-bg:       rgba(255,255,255,0.82);
          --glass-border:   rgba(37,99,235,0.16);
          --glass-shadow:   0 24px 80px rgba(37,99,235,0.08), inset 0 1px 0 rgba(37,99,235,0.10);
          --card-bg:        rgba(248,250,255,0.90);
          --card-border:    rgba(37,99,235,0.10);
          --card-hover-bg: rgba(239,246,255,0.95);
          --card-hover-border: rgba(37,99,235,0.28);
          --card-hover-shadow: 0 0 40px rgba(37,99,235,0.08);
          --text-primary:    rgba(15,23,42,0.95);
          --text-secondary: rgba(30,58,138,0.85);
          --text-muted:      rgba(37,99,235,0.60);
          --text-faint:     rgba(37,99,235,0.50);
          --text-dim:       rgba(37,99,235,0.45);
          --step-color:     rgba(37,99,235,0.90);
          --badge-bg:       linear-gradient(135deg,rgba(37,99,235,0.10),rgba(6,182,212,0.10));
          --badge-border:    rgba(37,99,235,0.25);
          --divider:         linear-gradient(to right, transparent, rgba(37,99,235,0.15), transparent);
          --rail-bg:         rgba(37,99,235,0.06);
          --input-bg:        rgba(37,99,235,0.04);
          --input-bg-h:      rgba(37,99,235,0.08);
          --input-border:    rgba(37,99,235,0.12);
          --topic-idle-bg:   rgba(37,99,235,0.03);
          --topic-idle-b:    rgba(37,99,235,0.12);
          --topic-idle-bh:   rgba(37,99,235,0.28);
          --topic-idle-bgh: rgba(37,99,235,0.06);
          --sub-idle-bg:     rgba(37,99,235,0.06);
          --sub-idle-bgh:    rgba(37,99,235,0.12);
          --sub-idle-text:   rgba(30,58,138,0.70);
          --sub-idle-texth: rgba(15,23,42,0.90);
          --sub-idle-b:      rgba(37,99,235,0.12);
          --sub-sel-bg:      #1e3a8a;
          --sub-sel-text:    #ffffff;
          --file-row-bg:     rgba(37,99,235,0.05);
          --file-row-b:      rgba(37,99,235,0.12);
          --file-text:       rgba(15,23,42,0.80);
          --file-del:        rgba(15,23,42,0.35);
          --scroll-text:     rgba(37,99,235,0.40);
          --session-text:    rgba(37,99,235,0.45);
          --drop-idle-b:     rgba(37,99,235,0.18);
          --drop-idle-bh:    rgba(37,99,235,0.35);
          --drop-txt:        rgba(15,23,42,0.80);
          --drop-sub:        rgba(37,99,235,0.50);
          --resume-fn:       rgba(15,23,42,1);
          --resume-sz:       rgba(37,99,235,0.55);
          --no-file-txt:     rgba(37,99,235,0.45);
          --no-file-sub:     rgba(37,99,235,0.35);
          --rand-idle-bg:    rgba(37,99,235,0.04);
          --rand-idle-bgh:   rgba(37,99,235,0.08);
          --rand-idle-b:     rgba(37,99,235,0.12);
          --rand-idle-text: rgba(30,58,138,0.65);
          --rand-idle-texth:rgba(15,23,42,0.85);
          --feat-title:      rgba(15,23,42,0.90);
          --feat-desc:       rgba(37,99,235,0.55);
          --feat-icon:       rgba(37,99,235,0.60);
          --skill-desc:      rgba(37,99,235,0.55);
          --topic-name:      rgba(15,23,42,1);
          --topic-desc:      rgba(37,99,235,0.55);
          --sub-label:       rgba(37,99,235,0.75);
          --ingestion-desc: rgba(37,99,235,0.55);
          --h2-sub:          rgba(37,99,235,0.50);
          --del-btn:         rgba(15,23,42,0.40);
          --del-btn-bgh:     rgba(239,68,68,0.12);
          --browse-text:     rgba(30,58,138,0.70);
          --browse-texth:    rgba(15,23,42,0.90);
          --pill-text:       rgba(109,40,217,0.75);
          --pill-bg:         rgba(109,40,217,0.08);
          --pill-b:          rgba(109,40,217,0.18);
          --start-text:      #000000;
          --hero-sub:        rgba(30,58,138,0.65);
          --hero-highlight: rgba(15,23,42,0.85);
        }

        .font-display { font-family: 'Orbitron', sans-serif; }
        .font-body    { font-family: 'Space Grotesk', sans-serif; }
        .font-mono    { font-family: 'JetBrains Mono', monospace; }

        .glass-panel {
          background:           var(--glass-bg);
          backdrop-filter:      blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border:               1px solid var(--glass-border);
          box-shadow:           var(--glass-shadow);
        }
        .glass-card {
          background:   var(--card-bg);
          backdrop-filter: blur(20px);
          border:       1px solid var(--card-border);
          transition:   border-color 0.3s, background 0.3s, box-shadow 0.3s;
        }
        .glass-card:hover {
          border-color: var(--card-hover-border);
          background:   var(--card-hover-bg);
          box-shadow:   var(--card-hover-shadow);
        }

        .text-gradient {
          background: linear-gradient(125deg, #e8f0ff 0%, #7eb6ff 38%, #22d3ee 72%, #a78bfa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .light .text-gradient {
          background: linear-gradient(125deg, #1e3a8a 0%, #1d4ed8 38%, #0891b2 72%, #7c3aed 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .text-gradient-subtle {
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(180,210,255,0.85) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .light .text-gradient-subtle {
          background: linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,64,175,0.90) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .badge {
          background:    var(--badge-bg);
          border:        1px solid var(--badge-border);
          backdrop-filter: blur(12px);
        }
        .step-number {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.65rem; letter-spacing: 0.2em;
          color: var(--step-color); opacity: 0.9;
        }
        .divider-line {
          width: 100%; height: 1px;
          background: var(--divider);
        }
        .topic-card-selected {
          border-color: rgba(80,180,255,0.40) !important;
          box-shadow:   0 0 30px rgba(40,120,255,0.15), inset 0 1px 0 rgba(120,200,255,0.15);
        }
        .light .topic-card-selected {
          border-color: rgba(37,99,235,0.45) !important;
          box-shadow:   0 0 24px rgba(37,99,235,0.12), inset 0 1px 0 rgba(37,99,235,0.12);
        }
        .cta-btn {
          background: linear-gradient(135deg, #1a3fff, #0ea5e9, #7c3aed);
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
        .start-btn {
          background:  linear-gradient(135deg, #fff 0%, #e8f0ff 100%);
          box-shadow:  0 0 0 1px rgba(255,255,255,0.20), 0 20px 60px rgba(255,255,255,0.18), 0 0 80px rgba(80,140,255,0.20);
          transition:  box-shadow 0.3s;
        }
        .start-btn:hover {
          box-shadow:  0 0 0 1px rgba(255,255,255,0.30), 0 20px 80px rgba(255,255,255,0.28), 0 0 120px rgba(80,160,255,0.35);
        }
        .light .start-btn {
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
          box-shadow: 0 0 0 1px rgba(37,99,235,0.30), 0 20px 50px rgba(37,99,235,0.20), 0 0 60px rgba(37,99,235,0.15);
          color: #fff !important;
        }
        .light .start-btn:hover {
          box-shadow: 0 0 0 1px rgba(37,99,235,0.45), 0 20px 70px rgba(37,99,235,0.30), 0 0 80px rgba(37,99,235,0.22);
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
      `}</style>

      {/* ── Fixed Background ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedBackground />
        <PeripheralHUD />
      </div>

      {/* ── Scroll rail ──────────────────────────────────────── */}
      <div
        className="fixed left-5 md:left-8 top-0 bottom-0 w-px z-20 pointer-events-none hidden md:block"
        style={{ background: "var(--rail-bg)" }}
      >
        <motion.div
          className="absolute top-0 left-0 w-full origin-top"
          style={{
            scaleY, bottom: 0,
            background:  isDark
              ? "linear-gradient(to bottom, rgba(60,140,255,0.8), rgba(40,220,255,0.9))"
              : "linear-gradient(to bottom, rgba(37,99,235,0.8), rgba(6,182,212,0.9))",
            boxShadow: isDark
              ? "0 0 16px rgba(40,200,255,0.7)"
              : "0 0 16px rgba(37,99,235,0.5)",
          }}
        />
        <motion.div
          className={`absolute -left-[3px] w-[7px] h-[7px] rounded-full ${isDark ? "bg-cyan-400 shadow-[0_0_14px_rgba(40,220,255,0.9)]" : "bg-blue-600 shadow-[0_0_14px_rgba(37,99,235,0.7)]"}`}
          style={{ top: useTransform(scaleY, [0, 1], ["0%", "100%"]) }}
        />
      </div>

      {/* ── Page Content ─────────────────────────────────────── */}
      <div className={`hm-root${isDark ? "" : " light"} relative z-10 flex flex-col items-center px-4 md:px-8 md:pl-16`}>
        <motion.div style={{ y: contentY }} className="w-full flex flex-col items-center">

          {/* ══════════════════════ HERO ═══════════════════════ */}
          <section className="w-full max-w-7xl min-h-screen flex flex-col justify-center items-center text-center relative pb-24 pt-28">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="badge inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-10"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                <Sparkles className={`w-3.5 h-3.5 ${isDark ? "text-cyan-400" : "text-blue-600"}`} />
              </motion.div>
              <span className="font-mono text-[0.68rem] font-medium tracking-[0.22em] uppercase" style={{ color: "var(--text-muted)" }}>
                HireMind AI · Neural Engine v2.0
              </span>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-cyan-400" : "bg-blue-600"}`} />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl sm:text-6xl md:text-[5.5rem] font-black tracking-[-0.02em] leading-[1.05] mb-6 max-w-5xl"
            >
              <span className="text-gradient">Master your</span><br />
              <span className="text-gradient-subtle">interview with</span><br />
              <span className="text-gradient">AI Precision.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.38, duration: 1 }}
              className="text-lg md:text-xl max-w-2xl leading-relaxed mb-12 font-light"
              style={{ color: "var(--hero-sub)" }}
            >
              Real-time analysis of your{" "}
              <span className="font-medium" style={{ color: "var(--hero-highlight)" }}>clarity</span>,{" "}
              <span className="font-medium" style={{ color: "var(--hero-highlight)" }}>confidence</span>, and{" "}
              <span className="font-medium" style={{ color: "var(--hero-highlight)" }}>technical depth</span>{" "}
              — powered by a specialized neural evaluation engine.
            </motion.p>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.8 }}>
              <motion.button
                ref={cta.ref as React.RefObject<HTMLButtonElement>}
                style={{ x: cta.x, y: cta.y }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={scrollToSetup}
                className="cta-btn relative group inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-display font-bold text-base text-white tracking-wide shadow-[0_0_60px_rgba(40,100,255,0.3)] overflow-hidden"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]" />
                <span className="relative z-10">Configure Session</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1.5 transition-transform" />
              </motion.button>
            </motion.div>

            {/* Scroll hint */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 1 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <span className="font-mono text-[0.58rem] tracking-[0.3em] uppercase" style={{ color: "var(--scroll-text)" }}>scroll</span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className={`w-px h-8 bg-gradient-to-b ${isDark ? "from-blue-400/40" : "from-blue-600/40"} to-transparent`}
              />
            </motion.div>
          </section>

          <div className="w-full max-w-6xl"><div className="divider-line" /></div>

          {/* ══════════════════ FEATURES GRID ══════════════════ */}
          <section className="w-full max-w-6xl py-32 relative z-10">
            <ScrollReveal delay={0.05}>
              <div className="text-center mb-20">
                <span className="step-number block mb-4">Neural Analysis Toolkit</span>
                <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gradient-subtle">
                  Built to evaluate everything.
                </h2>
                <p className="text-lg font-light max-w-lg mx-auto" style={{ color: "var(--h2-sub)" }}>
                  Over 50 data points analyzed per response — from micro-hesitations to concept depth.
                </p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {features.map((f, i) => (
                <ScrollReveal key={f.title} delay={0.06 * i} className="h-full">
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="glass-card p-6 rounded-[1.5rem] h-full flex flex-col group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                      style={{
                        background: isDark ? "rgba(59,130,246,0.10)" : "rgba(37,99,235,0.08)",
                        border: `1px solid ${isDark ? "rgba(96,165,250,0.15)" : "rgba(37,99,235,0.18)"}`,
                      }}
                    >
                      <f.icon size={18} style={{ color: "var(--feat-icon)" }} />
                    </div>
                    <div className="font-display font-semibold text-sm tracking-wide mb-2" style={{ color: "var(--feat-title)" }}>{f.title}</div>
                    <div className="text-xs leading-relaxed font-light flex-1" style={{ color: "var(--feat-desc)" }}>{f.desc}</div>
                    <div
                      className="mt-4 h-px w-0 group-hover:w-full transition-all duration-500"
                      style={{ background: isDark ? "linear-gradient(to right, rgba(96,165,250,0.4), rgba(34,211,238,0.4))" : "linear-gradient(to right, rgba(37,99,235,0.4), rgba(6,182,212,0.4))" }}
                    />
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          <div className="w-full max-w-6xl"><div className="divider-line" /></div>

          {/* ══════════════ STEP 01 — DATA INGESTION ═══════════ */}
          <section id="setup-section" className="w-full max-w-5xl py-32 relative z-10">
            <ScrollReveal delay={0.05}>
              <div className="text-center mb-16">
                <span className="step-number block mb-3">Step 01</span>
                <h2 className="font-display text-5xl font-black tracking-tight mb-4 text-gradient-subtle">Data Ingestion</h2>
                <p className="text-lg font-light max-w-md mx-auto" style={{ color: "var(--ingestion-desc)" }}>
                  Provide context so your AI examiner can personalize every question.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Resume Upload */}
              <ScrollReveal delay={0.12} className="h-full">
                <div className="h-full min-h-[380px] p-8 md:p-10 rounded-[2rem] glass-panel flex flex-col relative overflow-hidden">
                  <div
                    className="absolute top-0 right-0 w-20 h-20 rounded-bl-[2rem]"
                    style={{ background: isDark ? "linear-gradient(to bottom left, rgba(59,130,246,0.10), transparent)" : "linear-gradient(to bottom left, rgba(37,99,235,0.07), transparent)" }}
                  />
                  <div className="flex items-center gap-3 mb-8">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: isDark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.10)", border: `1px solid ${isDark ? "rgba(96,165,250,0.20)" : "rgba(37,99,235,0.20)"}` }}
                    >
                      <FileText size={16} className={isDark ? "text-blue-300" : "text-blue-600"} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-sm tracking-wide" style={{ color: "var(--feat-title)" }}>Primary Resume</h3>
                      <p className="font-mono text-[0.6rem] tracking-widest uppercase mt-0.5" style={{ color: "var(--text-dim)" }}>PDF only</p>
                    </div>
                  </div>
                  <input ref={resumeInputRef} type="file" accept=".pdf" className="hidden"
                    onChange={e => setResumeFile(e.target.files?.[0] || null)} />

                  {resumeFile ? (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col justify-center">
                      <div
                        className="flex items-center gap-4 p-5 rounded-xl"
                        style={{ background: isDark ? "rgba(59,130,246,0.10)" : "rgba(37,99,235,0.07)", border: `1px solid ${isDark ? "rgba(96,165,250,0.20)" : "rgba(37,99,235,0.18)"}` }}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: isDark ? "rgba(59,130,246,0.20)" : "rgba(37,99,235,0.12)" }}>
                          <FileText size={18} className={isDark ? "text-blue-300" : "text-blue-600"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate" style={{ color: "var(--resume-fn)" }}>{resumeFile.name}</div>
                          <div className="font-mono text-xs mt-1" style={{ color: "var(--resume-sz)" }}>{(resumeFile.size / 1024).toFixed(0)} KB · Ready</div>
                        </div>
                        <button
                          onClick={() => setResumeFile(null)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20 hover:text-red-500"
                          style={{ color: "var(--del-btn)" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div
                      onMouseEnter={() => setDropActive(true)}
                      onMouseLeave={() => setDropActive(false)}
                      onDragOver={e => { e.preventDefault(); setDropActive(true); }}
                      onDragLeave={() => setDropActive(false)}
                      onDrop={handleDrop}
                      onClick={() => resumeInputRef.current?.click()}
                      className="flex-1 rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300"
                      style={{
                        borderColor: dropActive
                          ? isDark ? "rgba(34,211,238,0.60)" : "rgba(37,99,235,0.55)"
                          : isDark ? "rgba(96,165,250,0.15)" : "rgba(37,99,235,0.18)",
                        background: dropActive
                          ? isDark ? "rgba(34,211,238,0.05)" : "rgba(37,99,235,0.05)"
                          : "transparent",
                      }}
                    >
                      <motion.div
                        animate={dropActive ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors"
                        style={{
                          background: dropActive
                            ? isDark ? "rgba(34,211,238,0.15)" : "rgba(37,99,235,0.12)"
                            : isDark ? "rgba(59,130,246,0.08)" : "rgba(37,99,235,0.06)",
                          border: `1px solid ${dropActive
                            ? isDark ? "rgba(34,211,238,0.30)" : "rgba(37,99,235,0.30)"
                            : isDark ? "rgba(96,165,250,0.15)" : "rgba(37,99,235,0.15)"}`,
                        }}
                      >
                        <Upload size={24} style={{ color: dropActive ? (isDark ? "rgba(34,211,238,1)" : "rgba(37,99,235,1)") : "var(--drop-sub)" }} />
                      </motion.div>
                      <span className="font-display font-semibold text-sm mb-1" style={{ color: "var(--drop-txt)" }}>
                        {dropActive ? "Release to upload" : "Drop your resume"}
                      </span>
                      <span className="font-mono text-xs tracking-wide" style={{ color: "var(--drop-sub)" }}>drag, drop, click to browse</span>
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Additional Docs */}
              <ScrollReveal delay={0.22} className="h-full">
                <div className="h-full min-h-[380px] p-8 md:p-10 rounded-[2rem] glass-panel flex flex-col relative overflow-hidden">
                  <div
                    className="absolute top-0 right-0 w-20 h-20 rounded-bl-[2rem]"
                    style={{ background: isDark ? "linear-gradient(to bottom left, rgba(139,92,246,0.08), transparent)" : "linear-gradient(to bottom left, rgba(109,40,217,0.06), transparent)" }}
                  />
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: isDark ? "rgba(139,92,246,0.15)" : "rgba(109,40,217,0.10)", border: `1px solid ${isDark ? "rgba(167,139,250,0.20)" : "rgba(109,40,217,0.18)"}` }}
                      >
                        <Layers size={16} className={isDark ? "text-violet-300" : "text-violet-700"} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-sm tracking-wide" style={{ color: "var(--feat-title)" }}>Additional Context</h3>
                        <p className="font-mono text-[0.6rem] tracking-widest uppercase mt-0.5" style={{ color: "var(--text-dim)" }}>Optional</p>
                      </div>
                    </div>
                    {additionalFiles.length > 0 && (
                      <span className="font-mono text-[0.65rem] px-2.5 py-1 rounded-full tracking-wide" style={{ color: "var(--pill-text)", background: "var(--pill-bg)", border: "1px solid var(--pill-b)" }}>
                        {additionalFiles.length} file{additionalFiles.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <input ref={docInputRef} type="file" accept=".pdf" multiple className="hidden"
                    onChange={e => { if (e.target.files) setAdditionalFiles([...additionalFiles, ...Array.from(e.target.files)]); }} />
                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-hide mb-6">
                    {additionalFiles.length > 0 ? (
                      additionalFiles.map((f, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{ background: "var(--file-row-bg)", border: "1px solid var(--file-row-b)" }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText size={13} className={isDark ? "text-violet-400 shrink-0" : "text-violet-600 shrink-0"} />
                            <span className="text-sm truncate font-light" style={{ color: "var(--file-text)" }}>{f.name}</span>
                          </div>
                          <button onClick={() => setAdditionalFiles(additionalFiles.filter((_, j) => j !== i))}
                            className="hover:text-red-500 transition-colors ml-3 shrink-0"
                            style={{ color: "var(--file-del)" }}>
                            <X size={13} />
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div
                        className="flex-1 flex flex-col items-center justify-center text-center rounded-2xl py-8"
                        style={{ border: `1px dashed ${isDark ? "rgba(255,255,255,0.10)" : "rgba(37,99,235,0.15)"}` }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                          style={{ background: isDark ? "rgba(139,92,246,0.08)" : "rgba(109,40,217,0.06)", border: `1px solid ${isDark ? "rgba(167,139,250,0.10)" : "rgba(109,40,217,0.12)"}` }}
                        >
                          <Layers size={16} className={isDark ? "text-violet-300/40" : "text-violet-600/50"} />
                        </div>
                        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--no-file-txt)" }}>No files added</span>
                        <span className="text-xs mt-1" style={{ color: "var(--no-file-sub)" }}>Cover letters, portfolios</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => docInputRef.current?.click()}
                    className="w-full py-3.5 rounded-xl text-sm font-display font-semibold tracking-wide transition-all duration-200"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--browse-text)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--input-bg-h)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--browse-texth)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--input-bg)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--browse-text)"; }}
                  >
                    Browse Files
                  </button>
                </div>
              </ScrollReveal>
            </div>
          </section>

          <div className="w-full max-w-5xl"><div className="divider-line" /></div>

          {/* ══════════════ STEP 02 — SKILL CALIBRATION ════════ */}
          <section className="w-full max-w-5xl py-32 relative z-10">
            <ScrollReveal delay={0.05}>
              <div className="p-8 md:p-12 rounded-[2rem] glass-panel">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                  <div>
                    <span className="step-number block mb-3">Step 02</span>
                    <h3 className="font-display font-black text-3xl md:text-4xl tracking-tight mb-2 text-gradient-subtle">Skill Calibration</h3>
                    <p className="font-light" style={{ color: "var(--skill-desc)" }}>Select technical domains to evaluate.</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleRandom}
                    className="flex items-center gap-2.5 font-display text-sm font-semibold tracking-wide px-5 py-3 rounded-xl transition-all"
                    style={randomTopics ? {
                      background: isDark ? "rgba(34,211,238,0.15)" : "rgba(37,99,235,0.10)",
                      color:      isDark ? "rgba(34,211,238,1)"    : "rgba(37,99,235,1)",
                      border:     `1px solid ${isDark ? "rgba(34,211,238,0.40)" : "rgba(37,99,235,0.35)"}`,
                      boxShadow:  isDark ? "0 0 20px rgba(34,211,238,0.15)" : "0 0 16px rgba(37,99,235,0.12)",
                    } : {
                      background: "var(--rand-idle-bg)",
                      border:     "1px solid var(--rand-idle-b)",
                      color:      "var(--rand-idle-text)",
                    }}
                  >
                    <Shuffle size={15} />Randomize
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {Object.entries(topicMeta).map(([topic, meta]) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <motion.button key={topic} onClick={() => toggleTopic(topic)}
                        disabled={randomTopics}
                        whileHover={!randomTopics ? { scale: 1.02, y: -2 } : undefined}
                        whileTap={!randomTopics ? { scale: 0.98 } : undefined}
                        className={`text-left p-5 rounded-[1.25rem] border transition-all duration-300 relative ${isSelected ? "topic-card-selected" : ""}`}
                        style={{
                          opacity:     randomTopics ? 0.25 : 1,
                          background:  isSelected
                            ? (isDark ? meta.colorDark : meta.colorLight)
                            : "var(--topic-idle-bg)",
                          borderColor: isSelected ? undefined : "var(--topic-idle-b)",
                        }}
                      >
                        {isSelected && (
                          <span className={`absolute top-3.5 right-3.5 w-2 h-2 rounded-full ${isDark ? "bg-cyan-400 shadow-[0_0_10px_rgba(40,220,255,0.9)]" : "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.7)]"}`} />
                        )}
                        <span className="text-2xl mb-3 block">{meta.icon}</span>
                        <div className="font-display font-bold text-base mb-1.5" style={{ color: "var(--topic-name)" }}>{topic}</div>
                        <div className="font-mono text-[0.6rem] leading-relaxed tracking-wide" style={{ color: "var(--topic-desc)" }}>{meta.desc}</div>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selectedTopics.length > 0 && !randomTopics && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                    >
                      <div
                        className="mt-10 pt-10 space-y-6"
                        style={{ borderTop: `1px solid ${isDark ? "rgba(96,165,250,0.10)" : "rgba(37,99,235,0.12)"}` }}
                      >
                        {selectedTopics.map(topic => (
                          <div key={topic}>
                            <div className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--sub-label)" }}>
                              {topic} — Subtopics
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {TOPICSUBTOPICS[topic]?.map(sub => {
                                const isSel = selectedSubtopics.includes(sub);
                                return (
                                  <motion.button key={sub} onClick={() => toggleSubtopic(sub)}
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    className="text-xs px-4 py-2 rounded-xl transition-all duration-200 font-display tracking-wide"
                                    style={isSel ? {
                                      background: "var(--sub-sel-bg)",
                                      color:      "var(--sub-sel-text)",
                                      fontWeight: 700,
                                      border:     "1px solid transparent",
                                      boxShadow:  isDark ? "0 0 16px rgba(255,255,255,0.20)" : "0 0 16px rgba(37,99,235,0.20)",
                                    } : {
                                      background:  "var(--sub-idle-bg)",
                                      color:       "var(--sub-idle-text)",
                                      border:      "1px solid var(--sub-idle-b)",
                                    }}
                                  >{sub}</motion.button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          </section>

          <div className="w-full max-w-5xl"><div className="divider-line" /></div>

          {/* ══════════════ STEP 03 — MODE + LAUNCH ════════════ */}
          <section className="w-full max-w-5xl pb-48 pt-24 relative z-10 flex flex-col items-center">
            <ScrollReveal delay={0.05} className="w-full text-center mb-14">
              <span className="step-number block mb-3">Step 03</span>
              <h3 className="font-display font-black text-4xl tracking-tight mb-8 text-gradient-subtle">Select Mode</h3>
              <div
                className="w-full max-w-md mx-auto overflow-hidden rounded-2xl"
                style={{ background: "var(--input-bg)", border: `1px solid ${isDark ? "rgba(96,165,250,0.10)" : "rgba(37,99,235,0.12)"}` }}
              >
                <FluidTabs tabs={modeTabs} defaultActive={mode}
                  onChange={id => setMode(id as InterviewMode)} />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.18} className="w-full max-w-md">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => handleStartInterview()}
                disabled={isLoading}
                className="start-btn relative w-full py-6 rounded-[1.5rem] font-display font-black text-xl flex items-center justify-center gap-4 overflow-hidden"
                style={{ color: isDark ? "#000000" : "#ffffff" }}
              >
                <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent)]" />
                <span>{isLoading ? "Analyzing Resume..." : "Begin Session"}</span>
                <ChevronRight size={22} />
              </motion.button>
            </ScrollReveal>

            <div className="text-center mt-6 flex items-center justify-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: "var(--session-text)" }}>
                Encrypted · Zero-retention · ID: {typeof sessionId === 'string' ? sessionId.slice(0, 8).toUpperCase() : 'INITIALIZING'}
              </p>
            </div>
          </section>

        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;