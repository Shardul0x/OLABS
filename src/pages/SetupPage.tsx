import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Mic, Video, MessageSquare, ArrowRight, X, Shuffle, Check, Sparkles, Loader2 } from "lucide-react";
import { useInterview, InterviewMode, TOPIC_SUBTOPICS } from "@/contexts/InterviewContext";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // 🔥 Added for navigation
import { FluidTabs, type TabItem } from "@/components/ui/fluid-tabs";
import AnimatedBackground from "@/components/AnimatedBackground";
import ScrollReveal from "@/components/ScrollReveal";

const modeTabs: TabItem[] = [
  { id: "text", label: "Text Mode", icon: <MessageSquare size={20} /> },
  { id: "voice", label: "Voice Mode", icon: <Mic size={20} /> },
  { id: "video", label: "Video + Audio", icon: <Video size={20} /> },
];

const topicMeta: Record<string, { icon: string; color: string; desc: string }> = {
  OS: { icon: "🖥️", color: "from-orange-500/20 to-amber-500/10 border-orange-500/20", desc: "Processes, Memory, Scheduling" },
  DBMS: { icon: "🗄️", color: "from-blue-500/20 to-cyan-500/10 border-blue-500/20", desc: "SQL, Normalization, Transactions" },
  CN: { icon: "🌐", color: "from-green-500/20 to-emerald-500/10 border-green-500/20", desc: "TCP/IP, OSI, DNS, HTTP" },
  OOP: { icon: "🧱", color: "from-purple-500/20 to-violet-500/10 border-purple-500/20", desc: "SOLID, Patterns, Inheritance" },
  DSA: { icon: "⚡", color: "from-red-500/20 to-pink-500/10 border-red-500/20", desc: "Arrays, Trees, DP, Graphs" },
};

const SetupPage = () => {
  const navigate = useNavigate(); // 🔥 Hook for URL changes
  const {
    sessionId, setSessionId, mode, setMode, resumeFile, setResumeFile,
    additionalFiles, setAdditionalFiles, startSession, addChatMessage,
    selectedTopics, setSelectedTopics, setPhase,
    selectedSubtopics, setSelectedSubtopics,
    randomTopics, setRandomTopics,
  } = useInterview();
  
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [isStarting, setIsStarting] = useState(false);

  const toggleTopic = (topic: string) => {
    if (randomTopics) return;
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    setSelectedTopics(next);
    const validSubs = selectedSubtopics.filter((s) =>
      next.some((t) => TOPIC_SUBTOPICS[t]?.includes(s))
    );
    setSelectedSubtopics(validSubs);
  };

  const toggleSubtopic = (sub: string) => {
    if (randomTopics) return;
    setSelectedSubtopics(
      selectedSubtopics.includes(sub)
        ? selectedSubtopics.filter((s) => s !== sub)
        : [...selectedSubtopics, sub]
    );
  };

  const handleRandom = () => {
    setRandomTopics(!randomTopics);
    if (!randomTopics) {
      setSelectedTopics([]);
      setSelectedSubtopics([]);
    }
  };

  const handleStart = async () => {
    if (!resumeFile) {
      alert("Please upload your resume to begin.");
      return;
    }

    setIsStarting(true);

    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

      const formData = new FormData();
      formData.append("file", resumeFile);
      formData.append("mode", mode);
      
      const userId = localStorage.getItem("user_id") || `user_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("user_id", userId);
      formData.append("user_id", userId);
      
      const response = await fetch(`${apiUrl}/api/start`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Backend Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update Context States
      setSessionId(data.session_id);
      localStorage.setItem("current_session_id", data.session_id);

      // Add the first question to the chat history
      addChatMessage({
        id: `msg-ai-first-${Date.now()}`,
        role: 'ai',
        content: data.first_question,
        timestamp: new Date(),
      });

      // 🔥 THE FIX: Change the URL and Phase to move to the next screen
      startSession(data.session_id, data.first_question); 
      setPhase("interview");
      navigate("/interview");

    } catch (err: any) {
      console.error("Failed to start session:", err);
      alert(`Backend Error: ${err.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="text-3xl font-bold mb-2">Session Setup</h2>
          <p className="text-muted-foreground">Configure your interview session</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
            <span className="text-xs text-muted-foreground">User ID:</span>
            <span className="text-xs font-mono font-semibold text-primary">{localStorage.getItem("user_id") || "Guest"}</span>
          </div>
        </motion.div>

        {/* Resume Upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Resume</h3>
          <input ref={resumeInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
          {resumeFile ? (
            <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm"><FileText className="w-4 h-4 text-primary" />{resumeFile.name}</div>
              <button onClick={() => setResumeFile(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => resumeInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload PDF</span>
            </motion.button>
          )}
        </motion.div>

        {/* Topic Selection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Select Topics
            </h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRandom}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors ${
                randomTopics ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <Shuffle className="w-4 h-4" /> Random
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(topicMeta).map(([topic, meta]) => {
              const selected = selectedTopics.includes(topic);
              return (
                <motion.button
                  key={topic}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleTopic(topic)}
                  disabled={randomTopics}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    randomTopics
                      ? "opacity-40 cursor-not-allowed border-border"
                      : selected
                        ? `border-primary bg-gradient-to-br ${meta.color}`
                        : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{topic}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{meta.desc}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Subtopics */}
          <AnimatePresence>
            {selectedTopics.length > 0 && !randomTopics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden pt-2"
              >
                {selectedTopics.map((topic) => (
                  <div key={topic} className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <span>{topicMeta[topic]?.icon}</span> {topic} Subtopics
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {TOPIC_SUBTOPICS[topic]?.map((sub) => {
                        const subSelected = selectedSubtopics.includes(sub);
                        return (
                          <motion.button
                            key={sub}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleSubtopic(sub)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                              subSelected
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border hover:border-primary/40 text-muted-foreground"
                            }`}
                          >
                            {sub}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mode Selection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <h3 className="font-semibold">Interview Mode</h3>
          <div className="flex justify-center">
            <FluidTabs
              tabs={modeTabs}
              defaultActive={mode}
              onChange={(id) => setMode(id as InterviewMode)}
            />
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          disabled={isStarting}
          className="btn-glow w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-2xl font-semibold text-lg disabled:opacity-50"
        >
          {isStarting ? (
             <>
               <Loader2 className="w-5 h-5 animate-spin" />
               Processing Resume...
             </>
          ) : (
             <>
               Start Interview
               <ArrowRight className="w-5 h-5" />
             </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default SetupPage;
