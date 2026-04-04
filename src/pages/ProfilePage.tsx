import { motion } from "framer-motion";
import { 
  TrendingUp, Activity, Target, Award, 
  Clock, CheckCircle2, Star, Zap, MessageSquare, 
  ShieldCheck, BrainCircuit, LineChart as LucideLineChart,
  BarChart3, Code2, Database, Globe, Cpu, ChevronRight,
  Sparkles, Gauge, Laptop, Fingerprint, Layers, Terminal
} from "lucide-react";
import { useHistory } from "../contexts/InterviewHistoryContext";
import CustomCursor from "../components/CustomCursor";
import AnimatedBackground from "../components/AnimatedBackground"; // 🚀 Added live background
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
  AreaChart, Area
} from "recharts";

// ⚡ Consistent Scale logic: Standardizes scores (e.g. 5 becomes 50%)
const scale = (v: number) => {
  if (!v || v === 0) return 0;
  return v <= 10 ? Math.round(v * 10) : Math.round(v);
};

// ⚡ Topic Normalization: Ensures "dsa", "coding", "algo" all merge into "DSA"
const normalizeTopic = (t: string) => {
  const upper = t.trim().toUpperCase();
  if (upper === "DSA" || upper === "CODING" || upper === "ALGORITHMS") return "DSA";
  if (upper === "OS" || upper === "OPERATING SYSTEM") return "OS";
  if (upper === "DBMS" || upper === "DATABASE") return "DBMS";
  if (upper === "CN" || upper === "NETWORKING") return "CN";
  return upper.charAt(0) + upper.slice(1).toLowerCase(); 
};

const topicIcons: Record<string, any> = {
  DSA: <Code2 className="w-3.5 h-3.5 text-primary" />,
  DBMS: <Database className="w-3.5 h-3.5 text-blue-400" />,
  OS: <Cpu className="w-3.5 h-3.5 text-purple-400" />,
  CN: <Globe className="w-3.5 h-3.5 text-emerald-400" />,
  General: <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />,
  OOP: <Layers className="w-3.5 h-3.5 text-orange-400" />,
  Project: <Laptop className="w-3.5 h-3.5 text-rose-400" />,
};

const ProfilePage = () => {
  const { sessions } = useHistory();

  // 1. Analytics calculation
  const totalInterviews = sessions.length;
  const completedInterviews = sessions.filter(s => s.status === "completed").length;
  const totalQuestions = sessions.reduce((acc, s) => acc + (s.answers?.length || 0), 0);
  
  const avgOverall = totalInterviews > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + scale(s.overallScore), 0) / totalInterviews)
    : 0;

  const avgTechnical = totalInterviews > 0
    ? Math.round(sessions.reduce((acc, s) => acc + scale(s.scores?.technical || 0), 0) / totalInterviews)
    : 0;

  const avgConfidence = totalInterviews > 0
    ? Math.round(sessions.reduce((acc, s) => acc + scale(s.scores?.confidence || 0), 0) / totalInterviews)
    : 0;

  // 2. Growth Curve Data
  const chartData = [...sessions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s, idx) => ({
      name: `S${idx + 1}`,
      score: scale(s.overallScore),
    }));

  // 3. Topic Mapping
  const topicMap: Record<string, { total: number; count: number }> = {};
  sessions.forEach(s => {
    const currentTopics = s.topics && s.topics.length > 0 ? s.topics : ["General"];
    currentTopics.forEach(topic => {
      const name = normalizeTopic(topic);
      const scaledScore = scale(s.overallScore);
      if (!topicMap[name]) topicMap[name] = { total: 0, count: 0 };
      topicMap[name].total += scaledScore;
      topicMap[name].count += 1;
    });
  });

  const topicData = Object.entries(topicMap)
    .map(([name, data]) => ({
      name,
      score: Math.round(data.total / data.count)
    }))
    .sort((a, b) => b.score - a.score);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 bg-[#020408] selection:bg-primary/40 overflow-x-hidden cursor-none relative">
      <CustomCursor />
      
      {/* 🚀 Live Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <AnimatedBackground />
      </div>

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Compact Hero */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2 shadow-glow-primary">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Neural Interface Synced</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-3">
              Technical <span className="text-primary italic">Matrix.</span>
            </h2>
            <p className="text-muted-foreground text-sm font-medium max-w-lg leading-relaxed">
              Telemetry across <span className="text-white font-bold">{totalInterviews} attempts</span>. 
              Analyzing algorithmic logic and <span className="text-primary font-bold">DSA</span> proficiency.
            </p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
            className="bg-white/[0.02] border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-xl backdrop-blur-md"
          >
            <Fingerprint size={28} className="text-primary opacity-80" />
            <div>
              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em] block mb-0.5 opacity-60">Engine Archetype</span>
              <span className="text-lg font-black text-white tracking-tight uppercase">
                {avgTechnical >= 80 ? "Architect" : avgTechnical >= 60 ? "Engineer" : "Analyst"}
              </span>
            </div>
          </motion.div>
        </section>

        {/* Scaled Down Stat Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<LucideLineChart size={16} />} label="Sessions" value={totalInterviews} subValue="Logged" color="text-blue-400" delay={0.1} />
          <StatCard icon={<CheckCircle2 size={16} />} label="Success" value={`${Math.round((completedInterviews/totalInterviews)*100 || 0)}%`} subValue="Rate" color="text-emerald-400" delay={0.2} />
          <StatCard icon={<Star size={16} />} label="Avg Score" value={`${avgOverall}%`} subValue="Percentile" color="text-amber-400" delay={0.3} />
          <StatCard icon={<BrainCircuit size={16} />} label="Domains" value={`${topicData.length}`} subValue="Active" color="text-violet-400" delay={0.4} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Growth Curve */}
          <motion.div {...fadeInUp}
            className="lg:col-span-2 bg-card/10 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden group"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-lg">
                <TrendingUp size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight leading-none">Growth Curve</h3>
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Timeline Progression Sync</p>
              </div>
            </div>
            
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff03" vertical={false} />
                  <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} dy={10} fontWeight="800" />
                  <YAxis domain={[0, 100]} stroke="#444" fontSize={10} tickLine={false} axisLine={false} dx={-10} fontWeight="800" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0c0f16', border: '1px solid #ffffff10', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
                    itemStyle={{ color: '#fff', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fill="url(#glow)" animationDuration={1800} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#020408' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Core Competency Sync */}
          <div className="space-y-6">
            <motion.div {...fadeInUp}
              className="bg-card/10 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-xl"
            >
               <h3 className="text-sm font-black text-white mb-8 flex items-center gap-3">
                 <ShieldCheck size={18} className="text-emerald-400" /> Competency Sync
               </h3>
               <div className="space-y-10">
                 <MatrixBar label="Technical Accuracy" value={avgTechnical} color="bg-blue-500" tag="Depth" />
                 <MatrixBar label="Speaking Presence" value={avgConfidence} color="bg-amber-500" tag="Vocal" />
                 <MatrixBar label="Answer Precision" value={avgOverall} color="bg-primary" tag="Logic" />
               </div>
            </motion.div>
          </div>

          {/* Domain Breakdown Heatmap */}
          <motion.div {...fadeInUp}
            className="lg:col-span-3 bg-card/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 shadow-xl relative"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/[0.03] rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                    <Terminal size={22} className="text-muted-foreground opacity-60" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight leading-none">Domain Analysis</h3>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.4em] mt-3">Proficiency Map (Includes DSA)</p>
                  </div>
               </div>
               <div className="flex flex-wrap gap-2">
                 {topicData.map(t => (
                   <div key={t.name} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-[9px] font-black text-white uppercase tracking-widest shadow-sm">
                     {topicIcons[t.name] || topicIcons.General} {t.name}
                   </div>
                 ))}
               </div>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData} barGap={12} margin={{ bottom: 10 }}>
                  <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} dy={20} fontWeight="900" />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip cursor={{ fill: '#ffffff03' }} contentStyle={{ backgroundColor: '#0c0f16', border: '1px solid #ffffff15', borderRadius: '12px' }} />
                  <Bar dataKey="score" radius={[10, 10, 4, 4]} barSize={50}>
                    {topicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#3b82f6' : entry.score >= 40 ? '#f59e0b' : '#ef4444'} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Technical Narrative Archive */}
        <motion.div {...fadeInUp} className="space-y-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Activity size={18} className="text-primary" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter">Session Narrative</h3>
           </div>

           <div className="grid gap-3">
             {sessions.slice(0, 5).map((session, i) => (
               <div key={session.sessionId} className="bg-card/10 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-5 flex items-center justify-between shadow-lg">
                 <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black border-2 shadow-xl ${
                      scale(session.overallScore) >= 75 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                      scale(session.overallScore) >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      <span className="text-base leading-none">{scale(session.overallScore)}</span>
                      <span className="text-[6px] uppercase mt-0.5 opacity-50 font-black">%</span>
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-xs font-bold text-white tracking-tight font-mono leading-none">{session.sessionId}</h4>
                       <div className="flex items-center gap-4 text-[9px] text-muted-foreground font-black uppercase tracking-[0.15em]">
                          <span className="flex items-center gap-1.5"><Clock size={10} /> {new Date(session.date).toLocaleDateString()}</span>
                          <div className="flex gap-4">
                             {session.topics.slice(0, 2).map(t => (
                               <span key={t} className="flex items-center gap-1 text-primary/70">
                                 {topicIcons[normalizeTopic(t)] || topicIcons.General} {normalizeTopic(t)}
                               </span>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center">
                    <div className={`text-[8px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-lg bg-white/5 border border-white/5 ${
                      session.status === "completed" ? "text-emerald-400/70" : "text-amber-400/70"
                    }`}>
                      {session.status === "completed" ? "COMPLETED" : "INCOMPLETE"}
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay }}
    className="bg-card/10 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-3 shadow-lg group hover:border-white/10 transition-colors"
  >
    <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${color} shadow-inner`}>
      {icon}
    </div>
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50 leading-none">{label}</p>
      <h4 className="text-2xl font-black text-white tracking-tighter leading-none">{value}</h4>
      <div className="flex items-center gap-2 mt-2">
        <div className={`w-1 h-1 rounded-full animate-pulse ${color.replace('text-', 'bg-')}`} />
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.1em]">{subValue}</p>
      </div>
    </div>
  </motion.div>
);

const MatrixBar = ({ label, value, color, tag }: any) => (
  <div className="space-y-3 group">
    <div className="flex justify-between items-end">
      <div className="space-y-0.5">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground block leading-none">{label}</span>
        <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] opacity-40">{tag}</span>
      </div>
      <span className="text-xl font-black text-white leading-none tracking-tighter">{value}%</span>
    </div>
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
      <motion.div 
        initial={{ width: 0 }} 
        whileInView={{ width: `${value}%` }} 
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className={`h-full rounded-full ${color} relative`} 
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_infinite]" />
      </motion.div>
    </div>
  </div>
);

export default ProfilePage;