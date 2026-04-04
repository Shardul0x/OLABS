import { motion } from "framer-motion";
import { 
  RotateCcw, TrendingUp, Shield, Target, ChevronDown, ChevronUp, Cpu, 
  User, Clock, FileText, History, Star, MessageCircle, Award, CheckCircle2,
  Sparkles, ThumbsUp, AlertCircle, Layers, Tag
} from "lucide-react";
import { useInterview } from "../contexts/InterviewContext";
import { useHistory, InterviewSession } from "../contexts/InterviewHistoryContext";
import { useState, useEffect, useRef } from "react";

interface ReportPageProps {
  onViewHistory: () => void;
}

const ReportPage = ({ onViewHistory }: ReportPageProps) => {
  const { answers, setPhase, environmentWarnings, chatMessages, questions, sessionId, mode, selectedTopics } = useInterview();
  const { addSession, sessions } = useHistory();
  const [showTranscript, setShowTranscript] = useState(false);
  const savedRef = useRef(false);

  // ⚡ Scale scores correctly. If avg is <= 10 (LLM scale), convert to percentage for UI.
  const scale = (val: number) => (val <= 10 && val > 0 ? Math.round(val * 10) : Math.round(val));
  
  const avg = (fn: (a: typeof answers[0]) => number) => {
    if (!answers.length) return 0;
    const rawAvg = answers.reduce((s, a) => s + fn(a), 0) / answers.length;
    return scale(rawAvg);
  };

  const avgClarity = avg((a) => a.scores.clarity);
  const avgConfidence = avg((a) => a.scores.confidence);
  const avgTechnical = avg((a) => a.scores.technical);
  const avgOverall = avg((a) => a.scores.overall);

  // Initial local fallback before Groq finishes
  const recommendation = avgOverall >= 80 ? "Strong Hire" : avgOverall >= 60 ? "Consider" : "Reject";

  useEffect(() => {
    if (savedRef.current || answers.length === 0) return;
    if (sessions.some((s) => s.sessionId === sessionId)) return;
    savedRef.current = true;

    // Save initial placeholder session. (Supabase syncs final Groq report later)
    const session: InterviewSession = {
      sessionId,
      date: new Date().toISOString(),
      topics: [...new Set([...selectedTopics, ...answers.map((a) => a.topic)])],
      mode,
      status: "completed",
      answers,
      chatMessages,
      overallScore: avgOverall,
      scores: { clarity: avgClarity, confidence: avgConfidence, technical: avgTechnical, communication: avgClarity },
      strengths: [], 
      improvements: [],
      environmentWarnings,
    };
    
    addSession(session);
  }, [addSession, answers, avgClarity, avgConfidence, avgOverall, avgTechnical, chatMessages, environmentWarnings, mode, sessionId, selectedTopics, sessions]);

  // ⚡ Extract Groq LLM Data (If it has synced from DB)
  const activeSession = sessions.find((s) => s.sessionId === sessionId) as any;
  const strengths = activeSession?.strengths && Array.isArray(activeSession.strengths) ? activeSession.strengths : [];
  const improvements = activeSession?.improvements && Array.isArray(activeSession.improvements) ? activeSession.improvements : [];
  const topicFeedback = activeSession?.topic_feedback || {};
  const aiCommunication = activeSession?.feedback || activeSession?.communication || "";
  const finalRecommendation = activeSession?.final_recommendation || recommendation;

  const isGroqLoading = strengths.length === 0 && improvements.length === 0;

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20 shadow-green-500/20" };
    if (score >= 80) return { grade: "A", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20 shadow-green-500/20" };
    if (score >= 70) return { grade: "B", color: "text-primary", bg: "bg-primary/10 border-primary/20 shadow-primary/20" };
    if (score >= 60) return { grade: "C", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/20" };
    return { grade: "D", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20 shadow-destructive/20" };
  };

  const overallGrade = getGrade(avgOverall);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[#020408]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Hero Summary Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[3rem] bg-card/20 backdrop-blur-3xl border border-white/10 p-10 md:p-14 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center gap-12">
            <div className={`w-40 h-40 rounded-[2.5rem] border-2 shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] ${overallGrade.bg} flex flex-col items-center justify-center shrink-0 transition-transform hover:scale-105 duration-500`}>
              <span className={`text-6xl font-black tracking-tighter ${overallGrade.color}`}>{overallGrade.grade}</span>
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground mt-2">Final Score</span>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-6">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                   <Sparkles className="w-4 h-4 text-primary" />
                   <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Interview Concluded</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">Session Intelligence</h2>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-muted-foreground flex items-center shadow-inner">{sessionId}</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-5 py-1.5 rounded-full border shadow-lg flex items-center gap-2 ${
                  finalRecommendation.includes("Strong") ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  finalRecommendation.includes("Reject") ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  "bg-primary/10 text-primary border-primary/20"
                }`}>
                  <Target className="w-3 h-3" /> Verdict: {finalRecommendation}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed font-medium">
                Your performance data has been secured. Our neural engine is running deep-analysis on your logic, communication, and technical accuracy.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Competency Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "Answer Clarity", val: avgClarity, icon: "💡", color: "text-blue-400" },
             { label: "Vocal Presence", val: avgConfidence, icon: "💪", color: "text-violet-400" },
             { label: "Technical Logic", val: avgTechnical, icon: "⚡", color: "text-amber-400" }
           ].map((s, i) => (
             <motion.div 
               key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
               className="bg-card/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 text-center space-y-6 hover:border-white/20 transition-all shadow-xl"
             >
                <div className="text-3xl filter drop-shadow-lg">{s.icon}</div>
                <div className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.val}%</div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">{s.label}</p>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${s.val}%` }} className={`h-full rounded-full ${s.color.replace('text-', 'bg-')} shadow-[0_0_15px_rgba(255,255,255,0.1)]`} />
                </div>
             </motion.div>
           ))}
        </div>

        {/* 🚀 Communication DNA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card/20 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 space-y-5 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
             <MessageCircle size={100} className="text-primary" />
          </div>
          <div className="flex items-center gap-3 text-primary">
            <MessageCircle className="w-6 h-6" />
            <h3 className="text-xl font-black tracking-tight uppercase">Communication DNA</h3>
          </div>
          {aiCommunication ? (
            <p className="text-muted-foreground leading-relaxed text-lg font-medium italic relative z-10">"{aiCommunication}"</p>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground/60 font-medium italic py-2">
              <Cpu className="w-5 h-5 animate-spin" /> Neural Engine synthesizing communication profile...
            </div>
          )}
        </motion.div>

        {/* 🚀 Insights & Pro Tips (Strengths & Improvements) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-xl flex flex-col min-h-[250px]"
          >
            <h3 className="text-lg font-black text-emerald-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
              <ThumbsUp className="w-5 h-5" /> Key Strengths
            </h3>
            {isGroqLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 opacity-50 py-4">
                <Cpu className="w-8 h-8 text-emerald-400 animate-pulse" />
                <p className="text-sm font-medium">Extracting technical strengths...</p>
              </div>
            ) : (
              <ul className="space-y-4 flex-1">
                {strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-4 text-sm text-white/80 font-medium">
                    <div className="bg-emerald-500/20 p-1.5 rounded-full shrink-0 mt-0.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /></div>
                    <span className="leading-relaxed pt-0.5">{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-xl flex flex-col min-h-[250px]"
          >
            <h3 className="text-lg font-black text-amber-400 mb-6 flex items-center gap-3 uppercase tracking-widest">
              <TrendingUp className="w-5 h-5" /> Areas to Grow
            </h3>
            {isGroqLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 opacity-50 py-4">
                <Cpu className="w-8 h-8 text-amber-400 animate-pulse" />
                <p className="text-sm font-medium">Identifying areas for improvement...</p>
              </div>
            ) : (
              <ul className="space-y-4 flex-1">
                {improvements.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-4 text-sm text-white/80 font-medium">
                    <div className="bg-amber-500/20 p-1.5 rounded-full shrink-0 mt-0.5"><AlertCircle className="w-3.5 h-3.5 text-amber-400" /></div>
                    <span className="leading-relaxed pt-0.5">{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>

        {/* 🚀 Domain Specific Feedback */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card/20 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl min-h-[200px]"
        >
          <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
            <Layers className="w-6 h-6 text-primary" /> Domain Analysis
          </h3>
          {Object.keys(topicFeedback).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3 opacity-50 py-10">
              <Cpu className="w-8 h-8 text-primary animate-pulse" />
              <p className="text-sm font-medium">Generating deep-dive feedback on specific topics...</p>
            </div>
          ) : (
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
          )}
        </motion.div>

        {/* Environmental Warnings */}
        {environmentWarnings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 space-y-3"
          >
            <h3 className="text-sm font-bold flex items-center gap-2 text-destructive"><Shield className="w-4 h-4" /> Proctoring Alerts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {environmentWarnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-destructive/10 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row gap-5 pt-6 relative z-10">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onViewHistory}
            className="flex-1 bg-white/5 text-white py-5 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-xs border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all shadow-xl"
          >
            <History className="w-4 h-4 opacity-40" /> View History Archive
          </motion.button>
          <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59,130,246,0.3)" }} whileTap={{ scale: 0.98 }} onClick={() => setPhase("landing")}
            className="flex-1 bg-primary text-primary-foreground py-5 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Initialize New DNA Sync
          </motion.button>
        </div>

      </div>
    </div>
  );
};

export default ReportPage;