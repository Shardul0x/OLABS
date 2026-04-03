import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronRight, Cpu, User, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useInterview } from "@/contexts/InterviewContext";

const HistoryPanel = () => {
  const [open, setOpen] = useState(false);
  const { chatMessages, answers } = useInterview();

  const totalMessages = chatMessages.length;

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 glass-strong rounded-l-xl px-3 py-5 hover:bg-secondary/50 transition-colors group"
      >
        <History className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        {totalMessages > 0 && (
          <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalMessages}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[90vw] z-50 bg-card border-l border-border flex flex-col"
            >
              {/* Header */}
              <div className="p-5 flex items-center justify-between border-b border-border shrink-0">
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Session History
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    {answers.length} answered
                  </span>
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">No conversation yet</p>
                    <p className="text-xs opacity-60">Start an interview to see history</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => {
                  const isAI = msg.role === "ai";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`flex gap-2 items-start ${isAI ? "" : "flex-row-reverse"}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isAI ? "bg-primary/20" : "bg-secondary"
                      }`}>
                        {isAI ? <Cpu className="w-3 h-3 text-primary" /> : <User className="w-3 h-3" />}
                      </div>
                      <div className={`max-w-[85%] space-y-1 ${isAI ? "" : "items-end flex flex-col"}`}>
                        {isAI && msg.topic && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {msg.topic} {msg.questionIndex !== undefined && `• Q${msg.questionIndex + 1}`}
                          </span>
                        )}
                        <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          isAI
                            ? "bg-secondary/60 rounded-tl-sm"
                            : "bg-primary text-primary-foreground rounded-tr-sm"
                        }`}>
                          {msg.content.startsWith("```") ? (
                            <pre className="font-mono text-[10px] whitespace-pre-wrap">{msg.content.replace(/```\n?/g, "")}</pre>
                          ) : (
                            msg.content
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HistoryPanel;
