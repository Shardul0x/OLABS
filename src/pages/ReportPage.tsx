import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, TrendingUp, Shield, Target, ChevronDown, ChevronUp,
  Cpu, FileText, History, Star, MessageCircle, Award,
  CheckCircle2, Sparkles, ThumbsUp, AlertCircle, Layers, Tag, RefreshCw
} from "lucide-react";
import { useInterview } from "../contexts/InterviewContext";
import { useHistory, InterviewSession } from "../contexts/InterviewHistoryContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ReportPageProps {
  onViewHistory: () => void;
}

// ✅ Matches public.interview_sessions schema exactly
interface GroqReport {
  overall_score: number;
  scores: { clarity: number; confidence: number; technical: number };
  strengths: string[];
  improvements: string[];       // ✅ column is "improvements" not "weaknesses"
  topic_feedback: Record<string, string>;
  feedback: string;             // ✅ column is "feedback" not "communication"
  final_recommendation: string;
}

const scale = (val: number) =>
  val <= 10 && val > 0 ? Math.round(val * 10) : Math.round(val);

const getGrade = (score: number) => {
  if (score >= 90) return { grade: "A+", color: "text-green-400",   bg: "bg-green-500/10 border-green-500/20",    ring: "shadow-green-500/20" };
  if (score >= 80) return { grade: "A",  color: "text-green-400",   bg: "bg-green-500/10 border-green-500/20",    ring: "shadow-green-500/20" };
  if (score >= 70) return { grade: "B",  color: "text-primary",     bg: "bg-primary/10 border-primary/20",        ring: "shadow-primary/20" };
  if (score >= 60) return { grade: "C",  color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20",  ring: "shadow-yellow-500/20" };
  return               { grade: "D",  color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", ring: "shadow-destructive/20" };
};

const getRecStyle = (rec: string) => {
  if (rec === "Strong Hire") return "text-green-400 bg-green-500/10 border-green-500/30";
  if (rec === "Hire")        return "text-green-300 bg-green-500/10 border-green-500/20";
  if (rec === "Consider")    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  return "text-red-400 bg-red-500/10 border-red-500/30";
};

const MAX_POLLS = 12;

const ReportPage = ({ onViewHistory }: ReportPageProps) => {
  const {
    answers, setPhase, environmentWarnings, chatMessages,
    sessionId, mode, selectedTopics,
  } = useInterview();
  const { addSession, sessions } = useHistory();

  const [showTranscript, setShowTranscript] = useState(false);
  const [groqReport, setGroqReport]         = useState<GroqReport | null>(null);
  const [fetchStatus, setFetchStatus]       = useState<"loading" | "ready" | "error">("loading");
  const savedRef = useRef(false);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  // ── Local per-answer averages (fallback only) ─────────────────────────────
  const avg = (fn: (a: typeof answers[0]) => number) => {
    if (!answers.length) return 0;
    return scale(answers.reduce((s, a) => s + fn(a), 0) / answers.length);
  };
  const avgClarity    = avg((a) => a.scores.clarity);
  const avgConfidence = avg((a) => a.scores.confidence);
  const avgTechnical  = avg((a) => a.scores.technical);
  const avgOverall    = avg((a) => a.scores.overall);
  const fallbackRec   = avgOverall >= 80 ? "Strong Hire" : avgOverall >= 60 ? "Consider" : "Reject";

  // ── Step 1: Save placeholder to local context (once) ─────────────────────
  useEffect(() => {
    if (savedRef.current || answers.length === 0) return;
    if (sessions.some((s) => s.sessionId === sessionId)) return;
    savedRef.current = true;
    const session: InterviewSession = {
      sessionId,
      date: new Date().toISOString(),
      topics: [...new Set([...selectedTopics, ...answers.map((a) => a.topic)])],
      mode, status: "completed", answers, chatMessages,
      overallScore: avgOverall,
      scores: { clarity: avgClarity, confidence: avgConfidence, technical: avgTechnical, communication: avgClarity },
      strengths: [], improvements: [], environmentWarnings,
    };
    addSession(session);
  }, [answers]); // eslint-disable-line

  // ── Step 2: Poll Supabase for Groq report ────────────────────────────────
  const fetchReport = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data, error } = await supabase
        .from("interview_sessions")            // ✅ correct table: public.interview_sessions
        .select(`
          overall_score,
          scores,
          strengths,
          improvements,
          topic_feedback,
          feedback,
          final_recommendation
        `)
        .eq("session_id", sessionId)
        .maybeSingle();

      if (error) {
        console.warn("Supabase fetch:", error.message);
        // Stop polling immediately on hard errors (table not found, 404, auth)
        if (
          error.message?.includes("schema cache") ||
          error.message?.includes("404") ||
          (error as any).status === 404
        ) {
          setFetchStatus("error");
          if (pollRef.current) clearInterval(pollRef.current);
        }
        return;
      }

      if (!data) return; // row not written yet — keep polling

      // Groq report is ready when overall_score is set
      if (data.overall_score && Number(data.overall_score) > 0) {
        setGroqReport(data as GroqReport);
        setFetchStatus("ready");
        if (pollRef.current) clearInterval(pollRef.current); // ✅ stop polling
      }
    } catch (e) {
      console.error("fetchReport exception:", e);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    pollCount.current = 0;

    // 5s initial delay — give Python backend time to generate & write the report
    const initialDelay = setTimeout(() => {
      fetchReport();
      pollRef.current = setInterval(() => {
        pollCount.current += 1;
        if (pollCount.current >= MAX_POLLS) {
          clearInterval(pollRef.current!);
          setFetchStatus("error");
          return;
        }
        fetchReport();
      }, 5000);
    }, 5000);

    return () => {
      clearTimeout(initialDelay);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchReport, sessionId]);

  // ── Step 3: Derive display values ────────────────────────────────────────
  const displayOverall    = groqReport ? scale(groqReport.overall_score)       : avgOverall;
  const displayClarity    = groqReport ? scale(groqReport.scores?.clarity)     : avgClarity;
  const displayConfidence = groqReport ? scale(groqReport.scores?.confidence)  : avgConfidence;
  const displayTechnical  = groqReport ? scale(groqReport.scores?.technical)   : avgTechnical;
  const strengths         = groqReport?.strengths      ?? [];
  const improvements      = groqReport?.improvements   ?? [];  // ✅ correct column name
  const topicFeedback     = groqReport?.topic_feedback ?? {};
  const aiCommunication   = groqReport?.feedback       ?? "";  // ✅ correct column name
  const finalRec          = groqReport?.final_recommendation ?? fallbackRec;
  const isLoading         = fetchStatus === "loading";
  const overallGrade      = getGrade(displayOverall);

  const scoreItems = [
    { label: "Clarity",    value: displayClarity,    icon: <MessageCircle className="w-4 h-4" />, bar: "bg-blue-500" },
    { label: "Confidence", value: displayConfidence, icon: <Shield className="w-4 h-4" />,        bar: "bg-purple-500" },
    { label: "Technical",  value: displayTechnical,  icon: <Cpu className="w-4 h-4" />,           bar: "bg-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-foreground p-4 md:p-8 relative overflow-hidden selection:bg-primary/30">
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-black tracking-tighter text-white">Interview Report</h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                  Neural engine analysing session — scores will update shortly
                </p>
              </>
            ) : fetchStatus === "error" ? (
              <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest">
                Showing estimated scores — DB report unavailable
              </p>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                  Analysis complete — verified by neural engine
                </p>
              </>
            )}
          </div>
        </motion.div>

        {/* ── Overall Score Card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`rounded-[2rem] border-2 p-8 shadow-2xl ${overallGrade.bg} ${overallGrade.ring}`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">
                {isLoading ? "Estimated Score" : "Verified Overall Score"}
              </p>
              <div className="flex items-end gap-3">
                <motion.span
                  key={displayOverall}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`text-8xl font-black ${overallGrade.color}`}
                >
                  {displayOverall}
                </motion.span>
                <span className="text-muted-foreground text-3xl mb-3">/100</span>
              </div>
              <span className={`text-5xl font-black ${overallGrade.color}`}>{overallGrade.grade}</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Recommendation</p>
              <motion.span
                key={finalRec}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className={`px-5 py-2.5 rounded-full border-2 text-sm font-black uppercase tracking-widest ${getRecStyle(finalRec)}`}
              >
                {finalRec}
              </motion.span>
              {isLoading && (
                <p className="text-[9px] text-muted-foreground animate-pulse">Updating from DB...</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Score Breakdown ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-[2rem] border border-white/5 bg-card/20 backdrop-blur-xl p-6 space-y-5 shadow-xl"
        >
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
            <TrendingUp className="w-4 h-4 text-primary" /> Score Breakdown
          </h2>
          <div className="space-y-4">
            {scoreItems.map((s) => (
              <div key={s.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-muted-foreground">{s.icon} {s.label}</span>
                  <motion.span key={s.value} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white">
                    {s.value}/100
                  </motion.span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div
                    key={s.value}
                    initial={{ width: 0 }} animate={{ width: `${s.value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`${s.bar} h-2 rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Communication / Feedback ── */}
        <AnimatePresence>
          {aiCommunication && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-[2rem] border border-white/5 bg-card/20 backdrop-blur-xl p-6 space-y-3 shadow-xl"
            >
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <MessageCircle className="w-4 h-4 text-primary" /> Communication Assessment
              </h2>
              <p className="text-muted-foreground italic text-sm leading-relaxed">"{aiCommunication}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading Skeleton OR Groq Content ── */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-[2rem] border border-white/5 bg-card/20 backdrop-blur-xl p-6 space-y-4"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Groq LLM Analysing...
            </p>
            {[
              "Extracting technical strengths...",
              "Identifying improvement areas...",
              "Generating topic-wise deep-dive feedback...",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground font-medium">{t}</span>
              </div>
            ))}
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="h-full w-1/3 bg-primary/40 rounded-full"
              />
            </div>
          </motion.div>
        ) : (
          <>
            {/* Strengths */}
            {strengths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-[2rem] border border-white/5 bg-card/20 backdrop-blur-xl p-6 space-y-4 shadow-xl"
              >
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                  <ThumbsUp className="w-4 h-4 text-green-400" /> Strengths
                </h2>
                <ul className="space-y-2.5">
                  {strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Areas to Improve */}
            {improvements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-[2rem] border border-white/5 bg-card/20 backdrop-blur-xl p-6 space-y-4 shadow-xl"
              >
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                  <AlertCircle className="w-4 h-4 text-yellow-400" /> Areas to Improve
                </h2>
                <ul className="space-y-2.5">
                  {improvements.map((imp: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Target className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" /> {imp}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Topic Feedback */}
            {Object.keys(topicFeedback).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-[2rem] border border-white/5 bg-card/20 backdrop-blur-xl p-6 space-y-4 shadow-xl"
              >
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                  <Layers className="w-4 h-4 text-primary" /> Topic-Wise Feedback
                </h2>
                <div className="space-y-3">
                  {Object.entries(topicFeedback).map(([topic, feedback]) => (
                    <div key={topic} className="rounded-2xl bg-white/5 border border-white/5 p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                        <Tag className="w-3 h-3" /> {topic}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{String(feedback)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ── Transcript ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-[2rem] border border-white/5 bg-card/20 backdrop-blur-xl overflow-hidden shadow-xl"
        >
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
              <FileText className="w-4 h-4 text-primary" /> Interview Transcript
            </span>
            {showTranscript
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5 px-5 pb-5 space-y-4 overflow-hidden"
              >
                {answers.map((a, i) => (
                  <div key={i} className="space-y-2 pt-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-1.5">
                      <Star className="w-3 h-3" /> Q{i + 1} — {a.topic}
                    </p>
                    <p className="text-sm font-semibold text-white">{a.question}</p>
                    <p className="text-sm text-muted-foreground bg-white/5 rounded-2xl p-4 leading-relaxed">{a.answer}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 pb-8"
        >
          <button
            onClick={() => setPhase("upload")}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-[1.5rem] border border-white/10 hover:bg-white/5 transition-colors text-sm font-black uppercase tracking-widest text-white"
          >
            <RotateCcw className="w-4 h-4" /> New Interview
          </button>
          <button
            onClick={onViewHistory}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-[1.5rem] bg-primary hover:bg-primary/90 transition-colors text-sm font-black uppercase tracking-widest text-primary-foreground"
          >
            <History className="w-4 h-4" /> View History
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default ReportPage;