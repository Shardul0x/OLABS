import { motion } from "framer-motion";
import { Clock, Tag, Mic, Video, MessageSquare, Trophy, Search, Trash2, ChevronRight, Sparkles } from "lucide-react";
import { useHistory, InterviewSession } from "../contexts/InterviewHistoryContext";
import { useState } from "react";
import InterviewDetailPage from "./InterviewDetailPage";
import CustomCursor from "../components/CustomCursor";
import AnimatedBackground from "../components/AnimatedBackground"; 

interface HistoryPageProps {
  onViewDetail?: (sessionId: string) => void;
}

const modeIcons: Record<string, React.ReactNode> = {
  text: <MessageSquare className="w-3.5 h-3.5" />,
  voice: <Mic className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
};

const scaleScore = (v: number) => {
  if (!v || v === 0) return 0;
  return v <= 10 ? Math.round(v * 10) : Math.round(v);
};

const getGradeInfo = (score: number) => {
  const scaled = scaleScore(score);
  if (scaled >= 90) return { grade: "A+", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (scaled >= 80) return { grade: "A", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (scaled >= 70) return { grade: "B", color: "text-primary", bg: "bg-primary/10 border-primary/20" };
  if (scaled >= 50) return { grade: "C", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  return { grade: "D", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
};

const HistoryPage = ({ onViewDetail }: HistoryPageProps) => {
  const { sessions, clearHistory } = useHistory();
  const [search, setSearch] = useState("");
  const [localSelectedSession, setLocalSelectedSession] = useState<string | null>(null);

  const filtered = sessions.filter((s) =>
    s.sessionId.toLowerCase().includes(search.toLowerCase()) ||
    s.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleViewDetail = (sessionId: string) => {
    if (typeof onViewDetail === 'function') {
      onViewDetail(sessionId);
    } else {
      setLocalSelectedSession(sessionId);
    }
  };

  if (localSelectedSession) {
    return (
      <InterviewDetailPage 
        sessionId={localSelectedSession} 
        onBack={() => setLocalSelectedSession(null)}
        onNewInterview={() => window.location.href = "/"}
      />
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[#020408] cursor-none relative overflow-hidden selection:bg-primary/30">
      <CustomCursor />
      
      {/* 🚀 Live Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <AnimatedBackground />
      </div>
      
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <Sparkles className="w-4 h-4 text-primary animate-pulse" />
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Historical Archive</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Interview History</h2>
            <p className="text-muted-foreground text-sm mt-1 font-medium">{sessions.length} sessions synthesized</p>
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or Technical Domain..."
            className="w-full bg-card/20 backdrop-blur-xl border border-white/10 rounded-[1.5rem] pl-12 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-white shadow-2xl"
          />
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-card/10 rounded-[3rem] border border-white/5 backdrop-blur-sm">
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
                onClick={() => handleViewDetail(session.sessionId)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SessionCard = ({ session, index, onClick }: { session: InterviewSession; index: number; onClick: () => void }) => {
  const scaledScore = scaleScore(session.overallScore);
  const grade = getGradeInfo(session.overallScore);
  const date = new Date(session.date);

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
        <div className={`w-16 h-16 rounded-2xl border-2 ${grade.bg} flex flex-col items-center justify-center shrink-0 shadow-2xl transition-transform group-hover:scale-110`}>
          <span className={`text-2xl font-black ${grade.color}`}>{grade.grade}</span>
          <span className="text-[9px] text-muted-foreground font-black tracking-tighter">{scaledScore}%</span>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-primary/80 tracking-tight">{session.sessionId}</span>
            <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
              session.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {session.status === "completed" ? "Completed" : "Incomplete"}
            </div>
            {(session as any).final_recommendation && (
               <span className="text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 shadow-inner">
                 {(session as any).final_recommendation}
               </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-50" /> {date.toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5">{modeIcons[session.mode]} {session.mode}</span>
            <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-500/60" /> {session.answers?.length || 0} Interactions</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {session.topics.map((t) => (
              <span key={t} className="text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <Tag className="w-2.5 h-2.5" /> {t}
              </span>
            ))}
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
          <ChevronRight className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.button>
  );
};

export default HistoryPage;