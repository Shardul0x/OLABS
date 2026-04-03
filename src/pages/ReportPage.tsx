import { motion } from "framer-motion";
import { RotateCcw, Award, TrendingUp, AlertTriangle, Shield, Target, Lightbulb, BarChart3, Brain, Eye, MessageCircle, Mic2, ChevronDown, ChevronUp, Cpu, User, Clock, FileText, History } from "lucide-react";
import { useInterview, ChatMessage } from "@/contexts/InterviewContext";
import { useHistory, InterviewSession } from "@/contexts/InterviewHistoryContext";
import { useState, useEffect, useRef } from "react";

interface ReportPageProps {
  onViewHistory: () => void;
}

const ReportPage = ({ onViewHistory }: ReportPageProps) => {
  const { answers, setPhase, environmentWarnings, chatMessages, questions, sessionId, mode, selectedTopics } = useInterview();
  const { addSession, sessions } = useHistory();
  const [showTranscript, setShowTranscript] = useState(false);
  const savedRef = useRef(false);

  const avg = (fn: (a: typeof answers[0]) => number) =>
    answers.length ? Math.round(answers.reduce((s, a) => s + fn(a), 0) / answers.length) : 0;

  const avgClarity = avg((a) => a.scores.clarity);
  const avgConfidence = avg((a) => a.scores.confidence);
  const avgTechnical = avg((a) => a.scores.technical);
  const avgOverall = avg((a) => a.scores.overall);
  const avgSpeaking = avg((a) => a.analysis.speakingConfidence);
  const avgComm = avg((a) => a.analysis.communicationQuality);
  const avgBody = avg((a) => a.analysis.bodyLanguage);
  const avgEye = avg((a) => a.analysis.eyeContact);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (avgClarity >= 75) strengths.push("Clear articulation of ideas");
  else weaknesses.push("Work on structuring answers more clearly");
  if (avgConfidence >= 70) strengths.push("Good confidence level");
  else weaknesses.push("Practice to build more confidence");
  if (avgTechnical >= 75) strengths.push("Strong technical knowledge");
  else weaknesses.push("Review core technical concepts");
  if (avgComm >= 70) strengths.push("Effective communication");
  else weaknesses.push("Improve communication flow");
  if (avgEye >= 65) strengths.push("Good eye contact maintained");
  else weaknesses.push("Try maintaining better eye contact with camera");

  // Save session to history on mount
  useEffect(() => {
    if (savedRef.current || answers.length === 0) return;
    const alreadySaved = sessions.some((s) => s.sessionId === sessionId);
    if (alreadySaved) return;
    savedRef.current = true;

    const uniqueTopics = [...new Set([
      ...selectedTopics,
      ...answers.map((a) => a.topic),
    ])];

    const session: InterviewSession = {
      sessionId,
      date: new Date().toISOString(),
      topics: uniqueTopics,
      mode,
      status: answers.length >= questions.length ? "completed" : "aborted",
      answers,
      chatMessages,
      overallScore: avgOverall,
      scores: {
        confidence: avgConfidence,
        communication: avgComm,
        bodyLanguage: avgBody,
        eyeContact: avgEye,
        clarity: avgClarity,
        technical: avgTechnical,
      },
      strengths,
      improvements: weaknesses,
      environmentWarnings,
    };
    addSession(session);
  }, []);

  const sentimentCounts = answers.reduce((acc, a) => {
    acc[a.analysis.sentiment] = (acc[a.analysis.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const dominantSentiment = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Neutral";

  const suggestions = [
    "Practice with a timer to improve conciseness",
    "Use the STAR method for behavioral questions",
    "Record yourself to review body language",
    "Study system design patterns for senior roles",
    "Prepare 2-3 stories that showcase leadership",
  ];

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
    if (score >= 80) return { grade: "A", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
    if (score >= 70) return { grade: "B", color: "text-primary", bg: "bg-primary/10 border-primary/20" };
    if (score >= 60) return { grade: "C", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
    return { grade: "D", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
  };

  const overallGrade = getGrade(avgOverall);

  const coreScores = [
    { label: "Clarity", value: avgClarity, icon: "💡", color: "from-blue-500/80 to-cyan-400/80" },
    { label: "Confidence", value: avgConfidence, icon: "💪", color: "from-violet-500/80 to-purple-400/80" },
    { label: "Technical", value: avgTechnical, icon: "⚡", color: "from-amber-500/80 to-orange-400/80" },
  ];

  const detailedMetrics = [
    { label: "Speaking Confidence", value: avgSpeaking, icon: Mic2, color: "from-blue-500 to-cyan-400" },
    { label: "Communication Quality", value: avgComm, icon: MessageCircle, color: "from-violet-500 to-purple-400" },
    { label: "Body Language", value: avgBody, icon: Brain, color: "from-emerald-500 to-green-400" },
    { label: "Eye Contact", value: avgEye, icon: Eye, color: "from-amber-500 to-orange-400" },
  ];

  const roundScores = ["Computer Basics", "DSA", "Project & Technical", "HR"].map((round) => {
    const roundAnswers = answers.filter((a) => {
      const q = questions.find((q) => q.text === a.question);
      return q?.round === round;
    });
    const roundAvg = roundAnswers.length
      ? Math.round(roundAnswers.reduce((s, a) => s + a.scores.overall, 0) / roundAnswers.length)
      : 0;
    return { round, score: roundAvg, count: roundAnswers.length };
  });

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 md:p-12"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className={`w-36 h-36 rounded-3xl border-2 ${overallGrade.bg} flex flex-col items-center justify-center shrink-0`}
            >
              <span className={`text-5xl font-black ${overallGrade.color}`}>{overallGrade.grade}</span>
              <span className="text-xs text-muted-foreground mt-1">Overall Grade</span>
            </motion.div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Interview Complete</h2>
              <p className="text-muted-foreground">
                {answers.length} questions answered across {roundScores.filter(r => r.count > 0).length} rounds
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary border border-border">Score: {avgOverall}%</span>
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                  dominantSentiment === "Confident" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                  dominantSentiment === "Nervous" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                }`}>Mood: {dominantSentiment}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Core Scores + Rounds */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {coreScores.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 text-center space-y-3"
            >
              <div className="text-2xl">{item.icon}</div>
              <div className="relative mx-auto w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
                  <motion.circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={175.9} initial={{ strokeDashoffset: 175.9 }}
                    animate={{ strokeDashoffset: 175.9 - (175.9 * item.value) / 100 }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{item.value}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Round Performance</h3>
            {roundScores.map((r, i) => (
              <div key={r.round} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{r.round}</span>
                  <span className="font-semibold">{r.score}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }} animate={{ width: `${r.score}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Detailed Metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {detailedMetrics.map((metric, i) => (
            <div key={metric.label} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metric.value}%</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                  initial={{ width: 0 }} animate={{ width: `${metric.value}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Env Flags */}
        {environmentWarnings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-destructive" /> Environment Flags</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {environmentWarnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-destructive/10 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" /><span>{w}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Strengths</h3>
            {strengths.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keep practicing to build strengths!</p>
            ) : (
              <div className="space-y-2">
                {strengths.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex items-center gap-2.5 text-xs bg-green-500/5 border border-green-500/10 rounded-xl px-3 py-2.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{s}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-amber-400" /> Areas to Improve</h3>
            {weaknesses.length === 0 ? (
              <p className="text-xs text-muted-foreground">Great job across the board!</p>
            ) : (
              <div className="space-y-2">
                {weaknesses.map((w, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
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

        {/* Transcript */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <button onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Interview Transcript
              <span className="text-xs font-normal text-muted-foreground">({chatMessages.length} messages)</span>
            </h3>
            {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showTranscript && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t border-border">
              <div className="max-h-[500px] overflow-y-auto p-5 space-y-3">
                {chatMessages.map((msg) => {
                  const isAI = msg.role === "ai";
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
                          {msg.content.startsWith("```") ? (
                            <pre className="font-mono text-[10px] whitespace-pre-wrap">{msg.content.replace(/```\n?/g, "")}</pre>
                          ) : msg.content}
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex gap-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onViewHistory}
            className="flex-1 flex items-center justify-center gap-3 bg-secondary text-foreground py-4 rounded-2xl font-semibold text-base border border-border"
          >
            <History className="w-5 h-5" /> View History
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setPhase("landing")}
            className="flex-1 flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-2xl font-semibold text-base"
          >
            <RotateCcw className="w-5 h-5" /> Start New Interview
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
