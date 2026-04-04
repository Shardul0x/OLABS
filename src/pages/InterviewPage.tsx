import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Mic, MicOff, AlertTriangle,
  User, StopCircle, Cpu, AlertCircle, Terminal
} from "lucide-react";
import { useInterview, ChatMessage } from "../contexts/InterviewContext";
import VideoPreview from "../components/VideoPreview";
import TypingIndicator from "../components/TypingIndicator";
import HistoryPanel from "../components/HistoryPanel";

const topicColors: Record<string, string> = {
  Resume:  "bg-blue-500/20 text-blue-400",
  OS:      "bg-orange-500/20 text-orange-400",
  CN:      "bg-green-500/20 text-green-400",
  DSA:     "bg-red-500/20 text-red-400",
  HR:      "bg-purple-500/20 text-purple-400",
  OOP:     "bg-cyan-500/20 text-cyan-400",
  DBMS:    "bg-yellow-500/20 text-yellow-400",
  Project: "bg-pink-500/20 text-pink-400",
  General: "bg-slate-500/20 text-slate-400",
};

const roundColors: Record<string, string> = {
  "Computer Basics":     "bg-blue-600/20 text-blue-400",
  "DSA":                 "bg-red-600/20 text-red-400",
  "Project & Technical": "bg-emerald-600/20 text-emerald-400",
  "HR":                  "bg-violet-600/20 text-violet-400",
};

function useSpeechRecognition({
  onResult, onEnd, onError,
}: {
  onResult: (text: string) => void;
  onEnd: () => void;
  onError: (msg: string) => void;
}) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const runningRef     = useRef(false);
  const accumulatedRef = useRef("");
  const interimRef     = useRef("");

  const isSupported = useCallback((): boolean => {
    return typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }, []);

  const finalizeTranscript = useCallback(() => {
    if (interimRef.current.trim()) {
      accumulatedRef.current += interimRef.current + " ";
      interimRef.current = "";
    }
    const final = accumulatedRef.current.trim();
    if (final) onResult(final);
  }, [onResult]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    if (!isSupported()) {
      onError("Speech recognition is not supported in this browser. Use Chrome or Edge, or type your answer.");
      return;
    }
    try {
      const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
      if (status.state === "denied") {
        onError("Microphone access is blocked. Open browser Settings → Site permissions → Microphone and allow this site.");
        return;
      }
    } catch { /* proceed */ }

    const SR: typeof SpeechRecognition =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = "en-US";
    rec.maxAlternatives = 1;

    accumulatedRef.current = "";
    interimRef.current     = "";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let finalSegment = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalSegment += t + " ";
        else interim += t;
      }
      if (finalSegment) {
        accumulatedRef.current += finalSegment;
        interimRef.current = "";
      } else {
        interimRef.current = interim;
      }
      onResult((accumulatedRef.current + interim).trim());
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (!["aborted", "no-speech"].includes(e.error)) {
        onError(
          e.error === "not-allowed"
            ? "Microphone permission denied. Allow mic access in your browser and reload."
            : `Mic error: ${e.error}. Check browser permissions.`
        );
      }
      runningRef.current = false;
      onEnd();
    };

    rec.onend = () => {
      if (runningRef.current) {
        try { rec.start(); } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "";
          if (!msg.includes("already") && !msg.includes("InvalidState"))
            console.warn("SpeechRecognition restart failed:", err);
        }
      } else {
        finalizeTranscript();
        onEnd();
      }
    };

    recognitionRef.current = rec;
    runningRef.current     = true;
    try {
      rec.start();
    } catch (err) {
      console.warn("SpeechRecognition.start() threw:", err);
      runningRef.current = false;
      onError("Could not start speech recognition. Try reloading the page.");
    }
  }, [isSupported, onResult, onEnd, onError, finalizeTranscript]);

  const stop = useCallback(() => {
    runningRef.current = false;
    finalizeTranscript();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;
    onEnd();
  }, [onEnd, finalizeTranscript]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    };
  }, []);

  return { start, stop, isSupported };
}

const InterviewPage = () => {
  const {
    sessionId, questions, currentQuestionIndex,
    isLoading, mode, setIsLoading,
    setMicOn,
    isRecording, setIsRecording,
    facesDetected, addAnswer, nextQuestion,
    chatMessages, addChatMessage,
    environmentWarnings,
    stopSession: stopContextSession,
  } = useInterview();

  const [userInput,   setUserInput]   = useState("");
  const [codeInput,   setCodeInput]   = useState("");
  const [isTyping,    setIsTyping]    = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinished,  setIsFinished]  = useState(false);
  const [voiceError,  setVoiceError]  = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const apiUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  const currentQ     = questions[currentQuestionIndex];
  const currentRound = currentQ?.round;
  const latestAIMsg  = chatMessages.slice().reverse().find(m => m.role === "ai");
  const activeTopic  = latestAIMsg?.topic?.toUpperCase() || currentQ?.topic?.toUpperCase() || "";

  const isDSA = activeTopic === "DSA" ||
    currentQ?.type === "dsa" ||
    currentRound === "DSA" ||
    (latestAIMsg?.content &&
      /write a function|implement a function|coding challenge|time complexity|space complexity|pseudo-?code|array of/i
        .test(latestAIMsg.content));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping, isLoading, isAnalyzing]);

  const stopSession = useCallback(async () => {
    try {
      await fetch(`${apiUrl}/api/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ session_id: sessionId }),
      });
    } catch { console.warn("Backend monitor stop failed."); }
    stopContextSession();
  }, [sessionId, stopContextSession, apiUrl]);

  const onResult = useCallback((text: string) => setUserInput(text), []);
  const onEnd    = useCallback(() => setIsRecording(false), [setIsRecording]);
  const onError  = useCallback((msg: string) => {
    setVoiceError(msg);
    setIsRecording(false);
    setTimeout(() => setVoiceError(null), 8000);
  }, [setIsRecording]);

  const { start: startRec, stop: stopRec, isSupported } =
    useSpeechRecognition({ onResult, onEnd, onError });

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRec();
    } else {
      setVoiceError(null);
      setUserInput("");
      startRec();
      setIsRecording(true);
    }
  }, [isRecording, startRec, stopRec, setIsRecording]);

  const handleSubmit = useCallback(async () => {
    if (isRecording) stopRec();

    const answerText = isDSA
      ? (codeInput.trim() || userInput.trim())
      : userInput.trim();

    if (!answerText || isLoading) return;

    const isCodeLike = /function|for|while|if|return|def|class|{|}|;/i.test(answerText);
    let formattedContent =
      (isDSA || isCodeLike || codeInput.trim()) && !answerText.startsWith("```")
        ? `\`\`\`\n${answerText}\n\`\`\``
        : answerText;

    if (isDSA && !answerText.toLowerCase().includes("complexity")) {
      formattedContent +=
        "\n\n[System Note to AI: The candidate provided the code implementation but omitted the time/space complexity estimation. Please grade the provided code logic accurately, and gently remind them to provide the complexity.]";
    }

    addChatMessage({
      id:            `msg-user-${Date.now()}`,
      role:          "user",
      content:       formattedContent,
      timestamp:     new Date(),
      questionIndex: currentQuestionIndex,
    });

    setUserInput("");
    setCodeInput("");
    setIsTyping(true);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/answer`, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          session_id:     sessionId,
          answer:         formattedContent,
          faces_detected: facesDetected.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Server error occurred");
      }

      addAnswer({
        questionIndex: currentQuestionIndex,
        question:      currentQ?.text  || "",
        topic:         currentQ?.topic || "General",
        answer:        answerText,
        facesDetected,
        scores: {
          clarity:    Math.round((data.analysis?.clarity    ?? 5) * 10),
          confidence: Math.round((data.analysis?.confidence ?? 5) * 10),
          technical:  Math.round((data.analysis?.technical  ?? 5) * 10),
          overall:    Math.round((data.analysis?.overall    ?? 5) * 10),
        },
        analysis: {
          sentiment:            data.sentiment?.tone || "Neutral",
          speakingConfidence:   Math.round((data.analysis?.confidence ?? 5) * 10),
          communicationQuality: Math.round((data.analysis?.clarity    ?? 5) * 10),
          bodyLanguage:         80,
          eyeContact:           85,
          facialConfidence:     Math.round((data.analysis?.confidence ?? 5) * 10),
        },
      });

      const env = data.environment ?? {};
      (env.warnings    ?? []).forEach((w: string) => addChatMessage({
        id: `warn-${Date.now()}-${w}`, role: "ai",
        content: w, timestamp: new Date(),
      }));

      // ✅ Check completion using is_complete flag OR string match
      const isComplete =
        data.is_complete === true ||
        (typeof data.next_question === "string" &&
          data.next_question.toLowerCase().includes("interview complete"));

      if (isComplete) {
        setIsTyping(false);
        setIsFinished(true);
        setIsAnalyzing(true);
        setTimeout(() => {
          setIsAnalyzing(false);
          stopSession();
        }, 3000);

      } else if (data.next_question) {
        const nextText = typeof data.next_question === "string"
          ? data.next_question
          : String(data.next_question);

        setTimeout(() => {
          setIsTyping(false);
          addChatMessage({
            id:            `msg-ai-${Date.now()}`,
            role:          "ai",
            content:       nextText,
            timestamp:     new Date(),
            questionIndex: currentQuestionIndex + 1,
            topic:         data.topic || "Technical",
          });
          nextQuestion();
        }, 1200);

      } else {
        // Graceful fallback — don't throw
        setIsTyping(false);
        console.warn("Unexpected response shape:", data);
      }

    } catch (err: any) {
      console.error(err);
      setIsTyping(false);
      setVoiceError(err.message || "Failed to reach backend server.");
      setTimeout(() => setVoiceError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [
    isRecording, stopRec, isDSA, codeInput, userInput,
    isLoading, addChatMessage, currentQuestionIndex,
    sessionId, facesDetected, currentQ, addAnswer,
    nextQuestion, stopSession, setIsLoading, apiUrl,
  ]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    } else if (!isDSA && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit, isDSA]);

  const canSubmit = (userInput.trim() || codeInput.trim()) && !isLoading;

  return (
    <div className="min-h-screen pt-16 flex flex-col bg-[#020408]">
      <HistoryPanel />

      <AnimatePresence>
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg max-w-lg text-center"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">{voiceError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {environmentWarnings.map((w, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{w}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {facesDetected > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">⚠️ Multiple people detected</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto w-full px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentRound && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${roundColors[currentRound] ?? "bg-secondary text-muted-foreground"}`}>
              Round: {currentRound}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Q{Math.min(currentQuestionIndex + 1, Math.max(questions.length, 1))}
          </span>
          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.min((currentQuestionIndex / 6) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={stopSession}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
        >
          <StopCircle className="w-4 h-4" /> Stop Interview
        </motion.button>
      </div>

      <div className="flex-1 flex max-w-6xl mx-auto w-full gap-4 px-4">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2">
            {chatMessages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}

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

            {isLoading && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 items-start"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm text-muted-foreground">Analysing your answer…</span>
                </div>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
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
                    Analysing your interview…
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Generating feedback &amp; insights</p>
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

          {!isAnalyzing && (
            <div className="sticky bottom-0 glass-strong border-t border-border p-4 space-y-3">
              {isDSA && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-green-400" />
                      <span className="font-mono text-green-400/80">Code Editor / Pseudocode</span>
                    </div>
                    <span className="text-[10px]">Cmd/Ctrl + Enter to submit</span>
                  </div>
                  <textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="// Write your approach or code here..."
                    disabled={isLoading}
                    rows={6}
                    onKeyDown={onKeyDown}
                    spellCheck={false}
                    className="w-full bg-[#0d1117] text-[#e6edf3] border border-white/10 rounded-lg p-4 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-green-500/50 disabled:opacity-50 transition-all"
                  />
                </motion.div>
              )}

              {mode === "text" && (
                <div className="flex gap-3">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={isDSA
                      ? "Explain your approach here (optional)..."
                      : "Type your answer here… (Press Enter to send)"}
                    disabled={isLoading}
                    rows={2}
                    onKeyDown={onKeyDown}
                    className="flex-1 bg-secondary/50 border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="self-end px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              )}

              {(mode === "voice" || mode === "video") && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-secondary/30 border border-border rounded-lg p-3 text-sm text-muted-foreground min-h-[44px] flex items-center">
                    {userInput ? (
                      <span className="text-foreground">{userInput}</span>
                    ) : (
                      <span>
                        {isRecording
                          ? "Listening… speak now"
                          : isSupported()
                            ? "Press mic to speak"
                            : "Speech not supported — type above or use Chrome/Edge"}
                      </span>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleRecording}
                    disabled={isLoading}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      isRecording
                        ? "bg-destructive text-destructive-foreground mic-pulse"
                        : "bg-secondary hover:bg-secondary/80"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </motion.button>

                  <AnimatePresence>
                    {(userInput.trim() || (isDSA && codeInput.trim())) && (
                      <motion.button
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 shrink-0 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <AnimatePresence>
                {isRecording && (mode === "voice" || mode === "video") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass rounded-lg p-2 flex items-center gap-2 overflow-hidden"
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
                    <span className="text-xs text-muted-foreground ml-2">Listening…</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {mode === "video" && (
          <div className="hidden lg:block w-72 shrink-0 pt-4">
            <div className="sticky top-20">
              <VideoPreview />
              <div className="mt-2 text-center">
                <span className={`text-xs px-3 py-1 rounded-full ${
                  facesDetected <= 1
                    ? "bg-green-500/20 text-green-400"
                    : "bg-destructive/20 text-destructive"
                }`}>
                  {facesDetected <= 1 ? "1 person detected" : `${facesDetected} people detected`}
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
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 items-start ${isAI ? "" : "flex-row-reverse"}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAI ? "bg-primary/20" : "bg-secondary"}`}>
        {isAI ? <Cpu className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
      </div>
      <div className={`max-w-[75%] space-y-1 ${isAI ? "" : "items-end flex flex-col"}`}>
        {isAI && message.topic && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${topicColors[message.topic] ?? "bg-secondary text-muted-foreground"}`}>
            {message.topic} {message.questionIndex !== undefined && `• Q${message.questionIndex + 1}`}
          </span>
        )}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isAI ? "glass rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm"}`}>
          {message.content.startsWith("```")
            ? <pre className="font-mono text-xs whitespace-pre-wrap">{message.content.replace(/```\n?/g, "")}</pre>
            : message.content}
        </div>
      </div>
    </motion.div>
  );
};

export default InterviewPage;

