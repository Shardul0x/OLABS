import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Brain, Eye, MessageCircle, Mic2, Clock, Award, User as UserIcon, Activity } from "lucide-react";
import { useHistory } from "@/contexts/InterviewHistoryContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from "recharts";

const ProfilePage = () => {
  const { sessions } = useHistory();

  const totalInterviews = sessions.length;
  const completedCount = sessions.filter((s) => s.status === "completed").length;

  const avgScore = (fn: (s: typeof sessions[0]) => number) =>
    sessions.length ? Math.round(sessions.reduce((sum, s) => sum + fn(s), 0) / sessions.length) : 0;

  const avgConfidence = avgScore((s) => s.scores.confidence);
  const avgCommunication = avgScore((s) => s.scores.communication);
  const avgBody = avgScore((s) => s.scores.bodyLanguage);
  const avgEye = avgScore((s) => s.scores.eyeContact);
  const avgOverall = avgScore((s) => s.overallScore);

  // Progress over time
  const progressData = sessions.slice().reverse().map((s, i) => ({
    session: `#${i + 1}`,
    confidence: s.scores.confidence,
    communication: s.scores.communication,
    bodyLanguage: s.scores.bodyLanguage,
    eyeContact: s.scores.eyeContact,
    overall: s.overallScore,
  }));

  // Topic performance
  const topicMap: Record<string, { total: number; count: number }> = {};
  sessions.forEach((s) => {
    s.topics.forEach((t) => {
      if (!topicMap[t]) topicMap[t] = { total: 0, count: 0 };
      topicMap[t].total += s.overallScore;
      topicMap[t].count += 1;
    });
  });
  const topicData = Object.entries(topicMap).map(([topic, { total, count }]) => ({
    topic,
    score: Math.round(total / count),
  }));

  const recentSessions = sessions.slice(0, 5);

  const overallMetrics = [
    { label: "Confidence", value: avgConfidence, icon: Mic2, color: "from-blue-500 to-cyan-400" },
    { label: "Communication", value: avgCommunication, icon: MessageCircle, color: "from-violet-500 to-purple-400" },
    { label: "Body Language", value: avgBody, icon: Brain, color: "from-emerald-500 to-green-400" },
    { label: "Eye Contact", value: avgEye, icon: Eye, color: "from-amber-500 to-orange-400" },
  ];

  const chartConfig = {
    confidence: { label: "Confidence", color: "hsl(var(--primary))" },
    communication: { label: "Communication", color: "hsl(280, 70%, 60%)" },
    bodyLanguage: { label: "Body Language", color: "hsl(150, 60%, 50%)" },
    eyeContact: { label: "Eye Contact", color: "hsl(35, 80%, 55%)" },
    overall: { label: "Overall", color: "hsl(var(--primary))" },
    score: { label: "Score", color: "hsl(var(--primary))" },
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold">Profile Analytics</h2>
          <p className="text-muted-foreground text-sm mt-1">Track your interview performance over time</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{totalInterviews}</p>
            <p className="text-xs text-muted-foreground">Total Interviews</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-3xl font-bold">{avgOverall}%</p>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-bold">{sessions.reduce((s, sess) => s + sess.answers.length, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Questions</p>
          </motion.div>
        </div>

        {/* Metric Bars */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {overallMetrics.map((metric, i) => (
            <div key={metric.label} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metric.value}%</p>
                <p className="text-xs text-muted-foreground">Avg {metric.label}</p>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                  initial={{ width: 0 }} animate={{ width: `${metric.value}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Progress Chart */}
        {progressData.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Performance Over Time
            </h3>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="session" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="overall" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="confidence" stroke="hsl(210, 70%, 55%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="communication" stroke="hsl(280, 70%, 60%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ChartContainer>
          </motion.div>
        )}

        {/* Topic Performance */}
        {topicData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Topic-wise Performance
            </h3>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={topicData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="topic" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        )}

        {/* Recent Activity */}
        {recentSessions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {recentSessions.map((s, i) => {
                const date = new Date(s.date);
                return (
                  <motion.div key={s.sessionId}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex items-center gap-4 bg-secondary/30 rounded-xl p-3"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      s.overallScore >= 70 ? "bg-green-500/10" : s.overallScore >= 50 ? "bg-yellow-500/10" : "bg-red-500/10"
                    }`}>
                      <span className={`text-sm font-bold ${
                        s.overallScore >= 70 ? "text-green-400" : s.overallScore >= 50 ? "text-yellow-400" : "text-red-400"
                      }`}>{s.overallScore}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-semibold text-primary truncate">{s.sessionId}</p>
                      <p className="text-[10px] text-muted-foreground">{date.toLocaleDateString()} • {s.topics.join(", ")} • {s.mode}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      s.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                    }`}>{s.status}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {sessions.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No data yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Complete interviews to see analytics</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
