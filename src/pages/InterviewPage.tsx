import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, AlertTriangle, Code2, User, StopCircle, Cpu } from "lucide-react";
import { useInterview, Answer, ChatMessage } from "@/contexts/InterviewContext";
import VideoPreview from "@/components/VideoPreview";
import TypingIndicator from "@/components/TypingIndicator";
import HistoryPanel from "@/components/HistoryPanel";

const topicColors: Record<string, string> = {
  Resume: "bg-blue-500/20 text-blue-400",
  OS: "bg-orange-500/20 text-orange-400",
  CN: "bg-green-500/20 text-green-400",
  DSA: "bg-red-500/20 text-red-400",
  HR: "bg-purple-500/20 text-purple-400",
  OOP: "bg-cyan-500/20 text-cyan-400",
  DBMS: "bg-yellow-500/20 text-yellow-400",
  Project: "bg-pink-500/20 text-pink-400",
};

const roundColors: Record<string, string> = {
  "Computer Basics": "bg-blue-600/20 text-blue-400",
  "DSA": "bg-red-600/20 text-red-400",
  "Project & Technical": "bg-emerald-600/20 text-emerald-400",
  "HR": "bg-violet-600/20 text-violet-400",
};

const randomScore = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const InterviewPage = () => {
  const {
    questions, currentQuestionIndex, answers, addAnswer, nextQuestion,
    isLoading, setIsLoading, mode, micOn, setMicOn,
    isRecording, setIsRecording, facesDetected,
    chatMessages, addChatMessage, environmentWarnings,
    interviewActive, stopSession,
  } = useInterview();

  const [userInput, setUserInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isFinished = currentQuestionIndex >= questions.length;
  const currentQ = questions[currentQuestionIndex];
  const isDSA = currentQ?.type === "dsa";
  const currentRound = currentQ?.round;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping, isLoading, isAnalyzing]);

  // When all questions done, show final analysis then go to report
  useEffect(() => {
    if (isFinished && interviewActive && !isAnalyzing) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        stopSession();
      }, 3000);
    }
  }, [isFinished, interviewActive, stopSession, isAnalyzing]);

  const handleSubmit = useCallback(() => {
    const answerText = isDSA ? (codeInput.trim() || userInput.trim()) : userInput.trim();
    if (!answerText || isLoading) return;

    addChatMessage({
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: isDSA && codeInput.trim() ? `\`\`\`\n${codeInput}\n\`\`\`` : answerText,
      timestamp: new Date(),
      questionIndex: currentQuestionIndex,
    });

    const sentiments = ["Confident", "Neutral", "Nervous"] as const;
    const mockAnswer: Answer = {
      questionIndex: currentQuestionIndex,
      question: currentQ.text,
      topic: currentQ.topic,
      answer: answerText,
      facesDetected,
      scores: {
        clarity: randomScore(60, 95),
        confidence: randomScore(55, 92),
        technical: randomScore(50, 98),
        overall: randomScore(60, 95),
      },
      analysis: {
        sentiment: sentiments[Math.floor(Math.random() * 3)],
        speakingConfidence: randomScore(50, 95),
        communicationQuality: randomScore(55, 90),
        bodyLanguage: randomScore(40, 85),
        eyeContact: randomScore(45, 90),
        facialConfidence: randomScore(50, 88),
      },
    };

    setIsLoading(true);
    setUserInput("");
    setCodeInput("");

    setTimeout(() => {
      addAnswer(mockAnswer);
      setIsLoading(false);

      const nextIdx = currentQuestionIndex + 1;
      if (nextIdx < questions.length) {
        setIsTyping(true);
        setTimeout(() => {
          nextQuestion();
          addChatMessage({
            id: `msg-ai-${Date.now()}`,
            role: "ai",
            content: questions[nextIdx].text,
            timestamp: new Date(),
            questionIndex: nextIdx,
            topic: questions[nextIdx].topic,
            questionType: questions[nextIdx].type,
          });
          setIsTyping(false);
        }, 1200);
      } else {
        nextQuestion();
      }
    }, 1500);
  }, [userInput, codeInput, isLoading, currentQuestionIndex, currentQ, addAnswer, setIsLoading, nextQuestion, facesDetected, isDSA, addChatMessage, questions]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setUserInput("This is a simulated voice response for demo purposes.");
        setIsRecording(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen pt-16 flex flex-col">
      {/* History Panel */}
      <HistoryPanel />

      {/* Environment Warnings */}
      <AnimatePresence>
        {environmentWarnings.map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{w}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Faces detected warning */}
      <AnimatePresence>
        {facesDetected > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">⚠️ Multiple people detected</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Round indicator + Stop button */}
      <div className="max-w-6xl mx-auto w-full px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentRound && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${roundColors[currentRound] || "bg-secondary text-muted-foreground"}`}>
              Round: {currentRound}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Q{Math.min(currentQuestionIndex + 1, questions.length)} / {questions.length}
          </span>
          {/* Progress bar */}
          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${(Math.min(currentQuestionIndex + 1, questions.length) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={stopSession}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
        >
          <StopCircle className="w-4 h-4" />
          Stop Interview
        </motion.button>
      </div>

      <div className="flex-1 flex max-w-6xl mx-auto w-full gap-4 px-4">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2">
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm text-muted-foreground">Processing...</span>
                </div>
              </motion.div>
            )}

            {/* Final analyzing - shows only when all Q done */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 space-y-4"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Cpu className="w-8 h-8 text-primary" />
                </motion.div>
                <div className="text-center space-y-2">
                  <motion.p
                    className="text-lg font-semibold"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Analyzing your interview...
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Generating feedback & insights</p>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-8 bg-primary/30 rounded-full"
                      animate={{ height: [8, 32, 8] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Sticky Input Area */}
          {!isFinished && (
            <div className="sticky bottom-0 glass-strong border-t border-border p-4 space-y-3">
              {/* DSA Code Editor */}
              {isDSA && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Code / Pseudocode Editor</span>
                  </div>
                  <textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Write your approach / pseudocode / code here..."
                    disabled={isLoading}
                    rows={6}
                    className="w-full bg-secondary/50 border border-border rounded-lg p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all"
                  />
                </div>
              )}

              {/* TEXT MODE */}
              {mode === "text" && (
                <div className="flex gap-3">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={isDSA ? "Optional: explain your approach..." : "Type your answer here..."}
                    disabled={isLoading}
                    rows={2}
                    className="flex-1 bg-secondary/50 border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all"
                    onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleSubmit(); }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={(!userInput.trim() && !codeInput.trim()) || isLoading}
                    className="self-end px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              )}

              {/* VOICE MODE */}
              {mode === "voice" && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-secondary/30 border border-border rounded-lg p-3 text-sm text-muted-foreground min-h-[44px] flex items-center">
                    {userInput ? (
                      <span className="text-foreground">{userInput}</span>
                    ) : (
                      <span>{isRecording ? "Listening..." : "Press mic to speak"}</span>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleRecording}
                    disabled={isLoading}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      isRecording ? "bg-destructive text-destructive-foreground mic-pulse" : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </motion.button>
                  {userInput.trim() && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* VIDEO MODE */}
              {mode === "video" && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-secondary/30 border border-border rounded-lg p-3 text-sm text-muted-foreground min-h-[44px] flex items-center">
                    {userInput ? (
                      <span className="text-foreground">{userInput}</span>
                    ) : (
                      <span>{isRecording ? "Listening..." : "Press mic to speak"}</span>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleRecording}
                    disabled={isLoading}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      isRecording ? "bg-destructive text-destructive-foreground mic-pulse" : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </motion.button>
                  {userInput.trim() && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Audio waveform */}
              {isRecording && (mode === "voice" || mode === "video") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-lg p-2 flex items-center gap-2"
                >
                  <div className="recording-dot" />
                  <div className="flex-1 flex items-end gap-0.5 h-5">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 bg-primary rounded-full"
                        animate={{ height: [3, Math.random() * 20 + 3, 3] }}
                        transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.03 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">Listening...</span>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Video Preview */}
        {mode === "video" && (
          <div className="hidden lg:block w-72 shrink-0 pt-4">
            <div className="sticky top-20">
              <VideoPreview />
              <div className="mt-2 text-center">
                <span className={`text-xs px-3 py-1 rounded-full ${
                  facesDetected === 1 ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"
                }`}>
                  {facesDetected === 1 ? "1 person detected" : `${facesDetected} people detected`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isAI = message.role === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 items-start ${isAI ? "" : "flex-row-reverse"}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isAI ? "bg-primary/20" : "bg-secondary"
      }`}>
        {isAI ? <Cpu className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
      </div>
      <div className={`max-w-[75%] space-y-1 ${isAI ? "" : "items-end flex flex-col"}`}>
        {isAI && message.topic && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${topicColors[message.topic] || "bg-secondary text-muted-foreground"}`}>
            {message.topic} {message.questionIndex !== undefined && `• Q${message.questionIndex + 1}`}
          </span>
        )}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAI
            ? "glass rounded-tl-sm"
            : "bg-primary text-primary-foreground rounded-tr-sm"
        }`}>
          {message.content.startsWith("```") ? (
            <pre className="font-mono text-xs whitespace-pre-wrap">{message.content.replace(/```\n?/g, "")}</pre>
          ) : (
            message.content
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InterviewPage;
