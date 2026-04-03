import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Award, TrendingUp, Target, Lightbulb, Brain, Eye, MessageCircle, Mic2, ChevronDown, ChevronUp, Cpu, User, Clock, FileText, Tag, Video, MessageSquare, Mic, Shield, AlertTriangle } from "lucide-react";
import { useHistory, InterviewSession } from "@/contexts/InterviewHistoryContext";
import { useState } from "react";

interface DetailPageProps {
  sessionId: string;
  onBack: () => void;
  onNewInterview: () => void;
}

const getGrade = (score: number) => {
  if (score >= 90) return { grade: "A+", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (score >= 80) return { grade: "A", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (score >= 70) return { grade: "B", color: "text-primary", bg: "bg-primary/10 border-primary/20" };
  if (score >= 60) return { grade: "C", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  return { grade: "D", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
};

const modeIcons: Record<string, React.ReactNode> = {
  text: <MessageSquare className="w-4 h-4" />,
  voice: <Mic className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
};

const InterviewDetailPage = ({ sessionId, onBack, onNewInterview }: DetailPageProps) => {
  const { getSession } = useHistory();
  const session = getSession(sessionId);
  const [showTranscript, setShowTranscript] = useState(false);

  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Session not found</p>
          <button onClick={onBack} className="text-primary hover:underline text-sm">Go back</button>
        </div>
      </div>
    );
  }

  // Fallback safety checks in case Supabase returned incomplete data
  const scores = session.scores || { clarity: 0, confidence: 0, technical: 0, communication: 0, bodyLanguage: 0, eyeContact: 0 };
  const overallGrade = getGrade(session.overallScore || 0);
  const date = new Date(session.date);
  const answersCount = Array.isArray(session.answers) ? session.answers.length : 0;
  const safeMessages = Array.isArray(session.chatMessages) ? session.chatMessages : [];
  const safeWarnings = Array.isArray(session.environmentWarnings) ? session.environmentWarnings : [];
  const safeStrengths = Array.isArray(session.strengths) ? session.strengths : [];
  const safeImprovements = Array.isArray(session.improvements) ? session.improvements : [];

  const coreScores = [
    { label: "Clarity", value: scores.clarity, icon: "💡" },
    { label: "Confidence", value: scores.confidence, icon: "💪" },
    { label: "Technical", value: scores.technical, icon: "⚡" },
  ];

  const detailedMetrics = [
    { label: "Speaking Confidence", value: scores.confidence, icon: Mic2, color: "from-blue-500 to-cyan-400" },
    { label: "Communication", value: scores.communication, icon: MessageCircle, color: "from-violet-500 to-purple-400" },
    { label: "Body Language", value: scores.bodyLanguage, icon: Brain, color: "from-emerald-500 to-green-400" },
    { label: "Eye Contact", value: scores.eyeContact, icon: Eye, color: "from-amber-500 to-orange-400" },
  ];

  const suggestions = [
    "Practice with a timer to improve conciseness",
    "Use the STAR method for behavioral questions",
    "Record yourself to review body language",
    "Study system design patterns for senior roles",
    "Prepare 2-3 stories that showcase leadership",
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </motion.button>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 md:p-12"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className={`w-36 h-36 rounded-3xl border-2 ${overallGrade.bg} flex flex-col items-center justify-center shrink-0`}
            >
              <span className={`text-5xl font-black ${overallGrade.color}`}>{overallGrade.grade}</span>
              <span className="text-xs text-muted-foreground mt-1">Overall Grade</span>
            </motion.div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Interview Report</h2>
              <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{session.sessionId}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  session.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                }`}>{session.status}</span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex items-center gap-1">{modeIcons[session.mode] || <MessageSquare className="w-4 h-4" />} {session.mode || "text"} mode</span>
                <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {answersCount} questions</span>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                {(session.topics || []).map((t) => (
                  <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary border border-border flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Core Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {coreScores.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 text-center space-y-3"
            >
              <div className="text-2xl">{item.icon}</div>
              <div className="relative mx-auto w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
                  <motion.circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={175.9}
                    initial={{ strokeDashoffset: 175.9 }}
                    animate={{ strokeDashoffset: 175.9 - (175.9 * (item.value || 0)) / 100 }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{item.value || 0}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {detailedMetrics.map((metric, i) => (
            <motion.div key={metric.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4 space-y-3"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metric.value || 0}%</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                  initial={{ width: 0 }} animate={{ width: `${metric.value || 0}%` }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Environment warnings */}
        {safeWarnings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-destructive" /> Environment Flags</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {safeWarnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-destructive/10 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" /><span>{w}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Strengths</h3>
            {safeStrengths.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keep practicing to build strengths!</p>
            ) : (
              <div className="space-y-2">
                {safeStrengths.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.05 }}
                    className="flex items-center gap-2.5 text-xs bg-green-500/5 border border-green-500/10 rounded-xl px-3 py-2.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{s}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-amber-400" /> Areas to Improve</h3>
            {safeImprovements.length === 0 ? (
              <p className="text-xs text-muted-foreground">Great job across the board!</p>
            ) : (
              <div className="space-y-2">
                {safeImprovements.map((w, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.05 }}
                    className="flex items-center gap-2.5 text-xs bg-amber-500/5 border border-amber-500/10 rounded-xl px-3 py-2.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />{w}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Pro Tips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-3"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary" /> Pro Tips</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 w-5 h-5 rounded-md flex items-center justify-center shrink-0">{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Interview Transcript - WITH DB DATE FIX */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <button onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Interview Transcript
              <span className="text-xs font-normal text-muted-foreground">({safeMessages.length} messages)</span>
            </h3>
            {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTranscript && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t border-border">
              <div className="max-h-[500px] overflow-y-auto p-5 space-y-3">
                {safeMessages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">No transcript recorded for this session.</p>
                ) : (
                  safeMessages.map((msg) => {
                    const isAI = msg.role === "ai";
                    // THE FIX: Always convert the string back to a Date object so it doesn't crash!
                    const msgTime = new Date(msg.timestamp); 
                    
                    return (
                      <div key={msg.id} className={`flex gap-2.5 items-start ${isAI ? "" : "flex-row-reverse"}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isAI ? "bg-primary/15" : "bg-secondary"}`}>
                          {isAI ? <Cpu className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`max-w-[80%] space-y-1 ${isAI ? "" : "items-end flex flex-col"}`}>
                          {isAI && msg.topic && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {msg.topic} {msg.questionIndex !== undefined && `• Q${msg.questionIndex + 1}`}
                            </span>
                          )}
                          <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            isAI ? "bg-secondary/60 rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm"
                          }`}>
                            {msg.content?.startsWith("```") ? (
                              <pre className="font-mono text-[10px] whitespace-pre-wrap">{msg.content.replace(/```\n?/g, "")}</pre>
                            ) : (msg.content || "")}
                          </div>
                          <span className="text-[9px] text-muted-foreground">
                            {/* Now this will work safely! */}
                            {msgTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex gap-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onBack}
            className="flex-1 flex items-center justify-center gap-3 bg-secondary text-foreground py-4 rounded-2xl font-semibold text-base border border-border"
          >
            <ArrowLeft className="w-5 h-5" /> Back to History
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onNewInterview}
            className="flex-1 flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-2xl font-semibold text-base"
          >
            <RotateCcw className="w-5 h-5" /> Start New Interview
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailPage;