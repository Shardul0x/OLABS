import { motion } from "framer-motion";
import { Clock, Tag, Mic, Video, MessageSquare, Trophy, AlertTriangle, Search, Trash2, ChevronRight } from "lucide-react";
import { useHistory, InterviewSession } from "@/contexts/InterviewHistoryContext";
import { useState } from "react";

interface HistoryPageProps {
  onViewDetail: (sessionId: string) => void;
}

const modeIcons: Record<string, React.ReactNode> = {
  text: <MessageSquare className="w-3.5 h-3.5" />,
  voice: <Mic className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
};

const getGradeInfo = (score: number) => {
  if (score >= 90) return { grade: "A+", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (score >= 80) return { grade: "A", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (score >= 70) return { grade: "B", color: "text-primary", bg: "bg-primary/10 border-primary/20" };
  if (score >= 60) return { grade: "C", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  return { grade: "D", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
};

const HistoryPage = ({ onViewDetail }: HistoryPageProps) => {
  const { sessions, clearHistory } = useHistory();
  const [search, setSearch] = useState("");

  const filtered = sessions.filter((s) =>
    s.sessionId.toLowerCase().includes(search.toLowerCase()) ||
    s.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Interview History</h2>
            <p className="text-muted-foreground text-sm mt-1">{sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded</p>
          </div>
          {sessions.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearHistory}
              className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors px-3 py-2 rounded-lg hover:bg-destructive/5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </motion.button>
          )}
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by session ID or topic..."
            className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </motion.div>

        {/* Sessions */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No interviews yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Complete an interview to see it here</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((session, i) => (
              <SessionCard key={session.sessionId} session={session} index={i} onClick={() => onViewDetail(session.sessionId)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SessionCard = ({ session, index, onClick }: { session: InterviewSession; index: number; onClick: () => void }) => {
  const grade = getGradeInfo(session.overallScore);
  const date = new Date(session.date);

  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ scale: 1.005, y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-center gap-4">
        {/* Grade */}
        <div className={`w-14 h-14 rounded-xl border ${grade.bg} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-xl font-black ${grade.color}`}>{grade.grade}</span>
          <span className="text-[9px] text-muted-foreground">{session.overallScore}%</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold text-primary">{session.sessionId}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              session.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
            }`}>
              {session.status === "completed" ? "Completed" : "Aborted"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="flex items-center gap-1">
              {modeIcons[session.mode]}
              {session.mode}
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {session.answers.length} Q&A
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {session.topics.map((t) => (
              <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary border border-border flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
    </motion.button>
  );
};

export default HistoryPage;
