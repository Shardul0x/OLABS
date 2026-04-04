import { motion } from "framer-motion";
import {
  Clock, Tag, Mic, Video, MessageSquare, Trophy, Search,
  Trash2, ChevronRight, Sparkles, RefreshCw
} from "lucide-react";
import { useHistory, InterviewSession } from "../contexts/InterviewHistoryContext";
import { useState, useEffect } from "react";
import InterviewDetailPage from "./InterviewDetailPage";
import CustomCursor from "../components/CustomCursor";
import AnimatedBackground from "../components/AnimatedBackground";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface HistoryPageProps {
  onViewDetail?: (sessionId: string) => void;
}

// ✅ Matches public.interview_sessions schema
interface DBSessionReport {
  session_id: string;
  overall_score: number;
  scores: { clarity: number; confidence: number; technical: number };
  final_recommendation: string;
}

const modeIcons: Record<string, React.ReactNode> = {
  text:  <MessageSquare className="w-3.5 h-3.5" />,
  voice: <Mic className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
};

const scaleScore = (v: number) => {
  if (!v || v === 0) return 0;
  return v <= 10 ? Math.round(v * 10) : Math.round(v);
};

const getGradeInfo = (score: number) => {
  const s = scaleScore(score);
  if (s >= 90) return { grade: "A+", color: "text-green-400",   bg: "bg-green-500/10 border-green-500/20" };
  if (s >= 80) return { grade: "A",  color: "text-green-400",   bg: "bg-green-500/10 border-green-500/20" };
  if (s >= 70) return { grade: "B",  color: "text-primary",     bg: "bg-primary/10 border-primary/20" };
  if (s >= 50) return { grade: "C",  color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20" };
  return           { grade: "D",  color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
};

const getRecStyle = (rec: string) => {
  if (rec === "Strong Hire") return "bg-green-500/10 text-green-400 border-green-500/20";
  if (rec === "Hire")        return "bg-green-500/10 text-green-300 border-green-500/20";
  if (rec === "Consider")    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (rec === "Reject")      return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-primary/10 text-primary border-primary/20";
};

const HistoryPage = ({ onViewDetail }: HistoryPageProps) => {
  const { sessions, clearHistory } = useHistory();
  const [search, setSearch]               = useState("");
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const [dbReports, setDbReports]         = useState<Record<string, DBSessionReport>>({});
  const [loadingDB, setLoadingDB]         = useState(true);

  // ── Bulk fetch all session reports from Supabase ──────────────────────────
  useEffect(() => {
    if (sessions.length === 0) { setLoadingDB(false); return; }
    const ids = sessions.map((s) => s.sessionId);

    (async () => {
      const { data, error } = await supabase
        .from("interview_sessions")            // ✅ correct table name
        .select("session_id, overall_score, scores, final_recommendation")
        .in("session_id", ids);

      if (error) {
        console.warn("HistoryPage DB fetch:", error.message);
        setLoadingDB(false);
        return;
      }

      if (data) {
        const map: Record<string, DBSessionReport> = {};
        data.forEach((row: DBSessionReport) => {
          if (row.overall_score && row.overall_score > 0) {
            map[row.session_id] = row;
          }
        });
        setDbReports(map);
      }
      setLoadingDB(false);
    })();
  }, [sessions.length]); // eslint-disable-line

  const filtered = sessions.filter((s) =>
    s.sessionId.toLowerCase().includes(search.toLowerCase()) ||
    s.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleViewDetail = (sessionId: string) => {
    typeof onViewDetail === "function"
      ? onViewDetail(sessionId)
      : setLocalSelected(sessionId);
  };

  if (localSelected) {
    return (
      <InterviewDetailPage
        sessionId={localSelected}
        onBack={() => setLocalSelected(null)}
        onNewInterview={() => (window.location.href = "/")}
      />
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[#020408] cursor-none relative overflow-hidden selection:bg-primary/30">
      <CustomCursor />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <AnimatedBackground />
      </div>

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Historical Archive</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Interview History</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground text-sm font-medium">{sessions.length} sessions synthesized</p>
              {loadingDB && (
                <div className="flex items-center gap-1 text-[10px] text-primary/70 font-bold uppercase tracking-widest">
                  <RefreshCw className="w-3 h-3 animate-spin" /> syncing scores from DB
                </div>
              )}
            </div>
          </div>
          {sessions.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearHistory}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-destructive hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-destructive/20 border border-transparent hover:border-destructive/30"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </motion.button>
          )}
        </motion.div>

        {/* ── Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="relative"
        >
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or Technical Domain..."
            className="w-full bg-card/20 backdrop-blur-xl border border-white/10 rounded-[1.5rem] pl-12 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-white shadow-2xl"
          />
        </motion.div>

        {/* ── Cards ── */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 bg-card/10 rounded-[3rem] border border-white/5 backdrop-blur-sm"
          >
            <Clock className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No records found</p>
          </motion.div>
        ) : (
          <div className="grid gap-5">
            {filtered.map((session, i) => (
              <SessionCard
                key={session.sessionId}
                session={session}
                index={i}
                dbReport={dbReports[session.sessionId] ?? null}
                onClick={() => handleViewDetail(session.sessionId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Session Card ──────────────────────────────────────────────────────────────
const SessionCard = ({
  session, index, dbReport, onClick,
}: {
  session: InterviewSession;
  index: number;
  dbReport: DBSessionReport | null;
  onClick: () => void;
}) => {
  const rawScore    = dbReport?.overall_score ?? session.overallScore;
  const scaledScore = scaleScore(rawScore);
  const grade       = getGradeInfo(rawScore);
  const finalRec    = dbReport?.final_recommendation ?? (session as any).final_recommendation;
  const date        = new Date(session.date);

  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ scale: 1.01, y: -2, backgroundColor: "rgba(255,255,255,0.03)" }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full text-left bg-card/20 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 hover:border-primary/40 transition-all group shadow-xl"
    >
      <div className="flex items-center gap-6">

        {/* Grade Badge */}
        <div className={`w-16 h-16 rounded-2xl border-2 ${grade.bg} flex flex-col items-center justify-center shrink-0 shadow-2xl transition-transform group-hover:scale-110`}>
          <span className={`text-2xl font-black ${grade.color}`}>{grade.grade}</span>
          <span className="text-[9px] text-muted-foreground font-black tracking-tighter">{scaledScore}%</span>
        </div>

        <div className="flex-1 min-w-0 space-y-3">

          {/* ID + Status + Recommendation + Verified badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-primary/80 tracking-tight">{session.sessionId}</span>
            <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
              session.status === "completed"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {session.status === "completed" ? "Completed" : "Incomplete"}
            </div>
            {finalRec && (
              <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] border ${getRecStyle(finalRec)}`}>
                {finalRec}
              </span>
            )}
            {dbReport && (
              <span className="text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-[0.15em] bg-primary/5 text-primary/40 border border-primary/10">
                ✓ verified
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 opacity-50" /> {date.toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              {modeIcons[session.mode]} {session.mode}
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500/60" /> {session.answers?.length || 0} Interactions
            </span>
          </div>

          {/* Sub-scores from DB */}
          {dbReport?.scores && (
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Clarity",    val: dbReport.scores.clarity,    color: "text-blue-400" },
                { label: "Confidence", val: dbReport.scores.confidence, color: "text-purple-400" },
                { label: "Technical",  val: dbReport.scores.technical,  color: "text-emerald-400" },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1 border border-white/5">
                  <span className={`text-[11px] font-black ${color}`}>{scaleScore(val)}</span>
                  <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Topics */}
          <div className="flex flex-wrap gap-2">
            {session.topics.map((t) => (
              <span
                key={t}
                className="text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity"
              >
                <Tag className="w-2.5 h-2.5" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 shrink-0">
          <ChevronRight className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.button>
  );
};

export default HistoryPage;