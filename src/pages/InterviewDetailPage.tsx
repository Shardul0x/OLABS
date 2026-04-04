import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, RotateCcw, Award, TrendingUp, Target, 
  MessageCircle, ChevronDown, ChevronUp, Cpu, 
  User, Clock, FileText, Tag, CheckCircle2, 
  XCircle, Sparkles, ThumbsUp, AlertCircle, Layers
} from "lucide-react";
import { useHistory } from "../contexts/InterviewHistoryContext";
import { useState, useEffect } from "react";

// --- INLINED COMPONENTS TO PREVENT IMPORT ERRORS ---

const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  return (
    <div className="hidden lg:block pointer-events-none fixed inset-0 z-[9999]">
      <motion.div className="w-1.5 h-1.5 bg-primary rounded-full fixed top-0 left-0" style={{ x: mousePos.x - 3, y: mousePos.y - 3 }} />
      <motion.div className="w-8 h-8 border border-primary/30 rounded-full fixed top-0 left-0 transition-transform duration-100 ease-out" style={{ x: mousePos.x - 16, y: mousePos.y - 16 }} />
    </div>
  );
};

const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
  </div>
);

// --- MAIN PAGE COMPONENT ---

interface DetailPageProps {
  sessionId: string;
  onBack?: () => void;
  onNewInterview?: () => void;
}

// ⚡ Scale helper: Standardizes LLM scores (e.g. 5 becomes 50%, 75 stays 75%)
const scale = (v: number) => {
  if (!v || v === 0) return 0;
  return v <= 10 ? Math.round(v * 10) : Math.round(v);
};

const getGrade = (score: number) => {
  const scaled = scale(score);
  if (scaled >= 90) return { grade: "A+", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20 shadow-green-500/20" };
  if (scaled >= 80) return { grade: "A", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20 shadow-green-500/20" };
  if (scaled >= 70) return { grade: "B", color: "text-primary", bg: "bg-primary/10 border-primary/20 shadow-primary/20" };
  if (scaled >= 50) return { grade: "C", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/20" };
  return { grade: "D", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20 shadow-destructive/20" };
};

const InterviewDetailPage = ({ sessionId, onBack, onNewInterview }: DetailPageProps) => {
  const { getSession } = useHistory();
  const session = getSession(sessionId) as any;
  const [showTranscript, setShowTranscript] = useState(true);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020408]">
        <div className="text-center space-y-4">
          <XCircle className="w-16 h-16 text-destructive mx-auto opacity-20" />
          <p className="text-muted-foreground font-medium">Data processing. Please return shortly.</p>
          <button onClick={onBack} className="text-primary font-bold uppercase tracking-widest text-xs hover:underline">Back to Archive</button>
        </div>
      </div>
    );
  }

  // Extract Groq LLM Data safely
  const scores = session.scores || { clarity: 0, confidence: 0, technical: 0 };
  const overallGrade = getGrade(session.overallScore || 0);
  const recommendation = session.final_recommendation || "Consider"; 
  const aiCommunication = session.feedback || session.communication || "Neural engine finalizing report..."; 
  const safeMessages = Array.isArray(session.chatMessages) ? session.chatMessages : [];
  
  const strengths = Array.isArray(session.strengths) ? session.strengths : [];
  const improvements = Array.isArray(session.improvements) ? session.improvements : [];
  const topicFeedback = session.topic_feedback || {};

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[#020408] cursor-none relative overflow-hidden selection:bg-primary/40">
      {/* Visual Enhancement Layer */}
      <CustomCursor />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <AnimatedBackground />
      </div>

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white transition-colors group bg-white/5 px-4 py-2 rounded-full border border-white/10 w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Archive Overview
        </motion.button>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[3rem] bg-card/20 backdrop-blur-3xl border border-white/10 p-10 md:p-14 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center gap-12">
            <div className={`w-40 h-40 rounded-[2.5rem] border-2 shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] ${overallGrade.bg} flex flex-col items-center justify-center shrink-0 transition-transform hover:scale-105 duration-500`}>
              <span className={`text-6xl font-black tracking-tighter ${overallGrade.color}`}>{overallGrade.grade}</span>
              <span className="text-[9px] uppercase font-black tracking-[0.3em] text-muted-foreground mt-2">Proficiency</span>
            </div>

            <div className="flex-1 text-center md:text-left space-y-6">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                   <Sparkles className="w-4 h-4 text-primary" />
                   <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Synthesis Complete</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">Session Intelligence</h2>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-muted-foreground flex items-center shadow-inner">{session.sessionId}</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-5 py-1.5 rounded-full border shadow-lg flex items-center gap-2 ${
                  recommendation.includes("Strong") ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10" :
                  recommendation.includes("Reject") ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10" :
                  "bg-primary/10 text-primary border-primary/20 shadow-primary/10"
                }`}>
                  <Target className="w-3 h-3" /> Verdict: {recommendation}
                </span>
              </div>
              
              <div className="flex items-center gap-8 justify-center md:justify-start text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary/40" /> {new Date(session.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-2"><Award className="w-4 h-4 text-primary/40" /> {safeMessages.length} Records</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Communication DNA */}
        {aiCommunication && aiCommunication !== "Incomplete" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card/20 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 space-y-5 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
               <MessageCircle size={100} className="text-primary" />
            </div>
            <div className="flex items-center gap-3 text-primary">
              <MessageCircle className="w-6 h-6" />
              <h3 className="text-xl font-black tracking-tight uppercase">Communication DNA</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg font-medium italic relative z-10">
              "{aiCommunication}"
            </p>
          </motion.div>
        )}

        {/* Metrics Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Answer Clarity", val: scale(scores.clarity), icon: "💡", color: "text-blue-400" },
            { label: "Vocal Presence", val: scale(scores.confidence), icon: "💪", color: "text-violet-400" },
            { label: "Technical Logic", val: scale(scores.technical), icon: "⚡", color: "text-amber-400" }
          ].map((item, idx) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-card/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 text-center space-y-6 hover:border-white/20 transition-all shadow-xl"
            >
              <div className="text-3xl filter drop-shadow-lg">{item.icon}</div>
              <div className={`text-4xl font-black tracking-tighter ${item.color}`}>{item.val}%</div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">{item.label}</p>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} className={`h-full rounded-full ${item.color.replace('text-', 'bg-')} shadow-[0_0_15px_rgba(255,255,255,0.1)]`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Insights & Pro Tips (Strengths & Improvements) */}
        {(strengths.length > 0 || improvements.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strengths.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-card/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-xl flex flex-col"
              >
                <h3 className="text-lg font-black text-emerald-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
                  <ThumbsUp className="w-5 h-5" /> Key Strengths
                </h3>
                <ul className="space-y-4 flex-1">
                  {strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-4 text-sm text-white/80 font-medium">
                      <div className="bg-emerald-500/20 p-1.5 rounded-full shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="leading-relaxed pt-0.5">{s}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {improvements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-card/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-xl flex flex-col"
              >
                <h3 className="text-lg font-black text-amber-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
                  <TrendingUp className="w-5 h-5" /> Areas to Grow
                </h3>
                <ul className="space-y-4 flex-1">
                  {improvements.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-4 text-sm text-white/80 font-medium">
                      <div className="bg-amber-500/20 p-1.5 rounded-full shrink-0 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="leading-relaxed pt-0.5">{s}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}

        {/* Domain Specific Feedback */}
        {Object.keys(topicFeedback).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-card/20 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
              <Layers className="w-6 h-6 text-primary" /> Domain Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {Object.entries(topicFeedback).map(([topic, feedback], i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 hover:bg-white/10 transition-colors shadow-inner">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
                    <Tag className="w-3 h-3" /> {topic}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {String(feedback)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transcript Archive */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card/20 backdrop-blur-xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
          <button onClick={() => setShowTranscript(!showTranscript)} className="w-full flex items-center justify-between p-10 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black text-white tracking-tight">Interaction Log</h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Full technical audit</p>
              </div>
            </div>
            {showTranscript ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showTranscript && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-white/5 bg-black/20">
                <div className="max-h-[500px] overflow-y-auto p-10 space-y-8 custom-scrollbar">
                  {safeMessages.map((msg: any, i: number) => {
                    const isAI = msg.role === "ai";
                    return (
                      <div key={i} className={`flex gap-6 ${isAI ? "" : "flex-row-reverse"}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-xl ${isAI ? "bg-primary/20 text-primary border-primary/20" : "bg-white/5 text-white border-white/10"}`}>
                          {isAI ? <Cpu className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div className={`max-w-[80%] space-y-2 ${isAI ? "" : "items-end flex flex-col"}`}>
                           {isAI && msg.topic && (
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">{msg.topic} Sync</span>
                           )}
                           <div className={`p-5 rounded-[1.75rem] leading-relaxed text-sm font-medium shadow-lg ${isAI ? "bg-white/5 rounded-tl-sm text-white border border-white/10" : "bg-primary text-primary-foreground rounded-tr-sm"}`}>
                              {msg.content?.startsWith("```") ? (
                                <pre className="font-mono text-xs whitespace-pre-wrap bg-black/50 p-4 rounded-xl mt-3 overflow-x-auto border border-white/5">{msg.content.replace(/```\n?/g, "")}</pre>
                              ) : (msg.content || "")}
                           </div>
                           <span className="text-[8px] text-muted-foreground/30 font-black uppercase tracking-widest px-2">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row gap-5 pt-6 relative z-10">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onBack}
            className="flex-1 bg-white/5 text-white py-5 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-xs border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all shadow-xl"
          >
            <Clock className="w-4 h-4 opacity-40" /> Archive Overview
          </motion.button>
          <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59,130,246,0.3)" }} whileTap={{ scale: 0.98 }} onClick={onNewInterview}
            className="flex-1 bg-primary text-primary-foreground py-5 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Initialize New DNA Sync
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailPage;