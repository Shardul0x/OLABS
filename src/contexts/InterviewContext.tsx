import React, { createContext, useContext, useState, useCallback } from "react";

export type InterviewMode = "text" | "voice" | "video";
export type InterviewPhase = "landing" | "setup" | "interview" | "report";

export interface Answer {
  questionIndex: number;
  question: string;
  topic: string;
  answer: string;
  facesDetected: number;
  scores: {
    clarity: number;
    confidence: number;
    technical: number;
    overall: number;
  };
  analysis: {
    sentiment: "Confident" | "Neutral" | "Nervous";
    speakingConfidence: number;
    communicationQuality: number;
    bodyLanguage: number;
    eyeContact: number;
    facialConfidence: number;
  };
}

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
  questionIndex?: number;
  topic?: string;
  questionType?: string;
}

export const TOPIC_SUBTOPICS: Record<string, string[]> = {
  OS:   ["Deadlock", "Scheduling", "Memory Management", "Process Synchronization", "File Systems"],
  DBMS: ["Normalization", "Transactions", "SQL Queries", "Indexing", "ACID Properties"],
  CN:   ["TCP/IP", "OSI Model", "DNS", "HTTP/HTTPS", "Subnetting"],
  OOP:  ["Polymorphism", "Inheritance", "Encapsulation", "Abstraction", "Design Patterns"],
  DSA:  ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Sorting & Searching", "Linked Lists"],
};

// ── API CONFIG ────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface InterviewState {
  phase: InterviewPhase;
  setPhase: (p: InterviewPhase) => void;
  sessionId: string;
  mode: InterviewMode;
  setMode: (m: InterviewMode) => void;
  resumeFile: File | null;
  setResumeFile: (f: File | null) => void;
  additionalFiles: File[];
  setAdditionalFiles: (f: File[]) => void;
  currentQuestionIndex: number;
  questions: { text: string; topic: string; type: string; round: string }[];
  answers: Answer[];
  addAnswer: (a: Answer) => void;
  nextQuestion: () => void;
  isLoading: boolean;
  setIsLoading: (b: boolean) => void;
  startSession: () => Promise<void>;
  stopSession: () => void;
  cameraOn: boolean;
  setCameraOn: (b: boolean) => void;
  micOn: boolean;
  setMicOn: (b: boolean) => void;
  isRecording: boolean;
  setIsRecording: (b: boolean) => void;
  facesDetected: number;
  setFacesDetected: (n: number) => void;
  selectedTopics: string[];
  setSelectedTopics: (t: string[]) => void;
  selectedSubtopics: string[];
  setSelectedSubtopics: (s: string[]) => void;
  randomTopics: boolean;
  setRandomTopics: (b: boolean) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (m: ChatMessage) => void;
  environmentWarnings: string[];
  addEnvironmentWarning: (w: string) => void;
  clearEnvironmentWarnings: () => void;
  interviewActive: boolean;
  submitAnswer: (answer: string) => Promise<void>;
  llmReport: Record<string, unknown> | null;
  apiError: string | null;
}

const InterviewContext = createContext<InterviewState | null>(null);

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error("useInterview must be inside InterviewProvider");
  return ctx;
};

// ── Topic/Type helpers ────────────────────────────────────────
function guessTopic(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("os") || t.includes("process") || t.includes("thread") || t.includes("deadlock") || t.includes("memory") || t.includes("scheduling")) return "OS";
  if (t.includes("sql") || t.includes("dbms") || t.includes("database") || t.includes("normaliz") || t.includes("transaction")) return "DBMS";
  if (t.includes("tcp") || t.includes("osi") || t.includes("network") || t.includes("dns") || t.includes("http") || t.includes("routing")) return "CN";
  if (t.includes("oop") || t.includes("class") || t.includes("inherit") || t.includes("polymorphism") || t.includes("solid") || t.includes("encapsul")) return "OOP";
  if (t.includes("array") || t.includes("tree") || t.includes("graph") || t.includes("dynamic programming") || t.includes("sorting") || t.includes("linked list") || t.includes("lru") || t.includes("binary")) return "DSA";
  if (t.includes("project") || t.includes("architect") || t.includes("built") || t.includes("experience") || t.includes("skill")) return "Project";
  if (t.includes("team") || t.includes("motivat") || t.includes("fail") || t.includes("challenge") || t.includes("years")) return "HR";
  return "General";
}

function guessType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("code") || t.includes("implement") || t.includes("write") || t.includes("complexity") || t.includes("algorithm")) return "dsa";
  if (t.includes("tell me") || t.includes("describe") || t.includes("how do you") || t.includes("where do you")) return "behavioral";
  return "theory";
}

function guessRound(topic: string): string {
  if (topic === "DSA") return "DSA";
  if (topic === "Project" || topic === "General") return "Project & Technical";
  if (topic === "HR") return "HR";
  return "Computer Basics";
}

const MAX_QUESTIONS = 6;

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase]                       = useState<InterviewPhase>("landing");
  const [sessionId, setSessionId]               = useState("");
  const [mode, setMode]                         = useState<InterviewMode>("video");
  const [resumeFile, setResumeFile]             = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles]   = useState<File[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions]               = useState<{ text: string; topic: string; type: string; round: string }[]>([]);
  const [answers, setAnswers]                   = useState<Answer[]>([]);
  const [isLoading, setIsLoading]               = useState(false);
  const [cameraOn, setCameraOn]                 = useState(true);
  const [micOn, setMicOn]                       = useState(true);
  const [isRecording, setIsRecording]           = useState(false);
  const [facesDetected, setFacesDetected]       = useState(1);
  const [selectedTopics, setSelectedTopics]     = useState<string[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [randomTopics, setRandomTopics]         = useState(false);
  const [chatMessages, setChatMessages]         = useState<ChatMessage[]>([]);
  const [environmentWarnings, setEnvironmentWarnings] = useState<string[]>([]);
  const [interviewActive, setInterviewActive]   = useState(false);
  const [llmReport, setLlmReport]               = useState<Record<string, unknown> | null>(null);
  const [apiError, setApiError]                 = useState<string | null>(null);

  const addAnswer            = useCallback((a: Answer) => setAnswers((prev) => [...prev, a]), []);
  const nextQuestion         = useCallback(() => setCurrentQuestionIndex((prev) => prev + 1), []);
  const addChatMessage       = useCallback((m: ChatMessage) => setChatMessages((prev) => [...prev, m]), []);
  const addEnvironmentWarning = useCallback((w: string) => setEnvironmentWarnings((prev) => [...prev, w]), []);
  const clearEnvironmentWarnings = useCallback(() => setEnvironmentWarnings([]), []);

  // ── START SESSION ─────────────────────────────────────────────
  const startSession = useCallback(async () => {
    if (!resumeFile) { setApiError("Please upload a resume before starting."); return; }

    setIsLoading(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      additionalFiles.forEach((f) => formData.append("additional_docs", f));

      const res = await fetch(`${BASE_URL}/start-interview`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: { session_id: string; first_question: string } = await res.json();

      const firstQ  = data.first_question;
      const topic   = guessTopic(firstQ);
      const type    = guessType(firstQ);
      const round   = guessRound(topic);

      setSessionId(data.session_id);
      setQuestions([{ text: firstQ, topic, type, round }]);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setChatMessages([{
        id: `msg-${Date.now()}`,
        role: "ai",
        content: firstQ,
        timestamp: new Date(),
        questionIndex: 0,
        topic,
        questionType: type,
      }]);
      setEnvironmentWarnings([]);
      setInterviewActive(true);
      setPhase("interview");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to start interview. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  }, [resumeFile, additionalFiles]);

  // ── SUBMIT ANSWER ─────────────────────────────────────────────
  const submitAnswer = useCallback(async (answerText: string) => {
    if (!answerText.trim() || isLoading) return;

    setIsLoading(true);
    setApiError(null);

    const currentQ = questions[currentQuestionIndex];

    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("answer", answerText);
      formData.append("faces_detected", String(facesDetected));

      const res = await fetch(`${BASE_URL}/submit-answer`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      // ── Build Answer record ──────────────────────────────────
      const backendAnalysis  = data.analysis  ?? {};
      const backendSentiment = data.sentiment ?? {};
      const rawTone = (backendSentiment.tone ?? "neutral") as string;

      const sentimentMap: Record<string, "Confident" | "Neutral" | "Nervous"> = {
        confident: "Confident", neutral: "Neutral", nervous: "Nervous",
      };

      const clarity    = backendAnalysis.clarity    ?? 5;
      const confidence = backendAnalysis.confidence ?? 5;
      const technical  = backendAnalysis.technical  ?? 5;
      const overall    = backendAnalysis.overall    ?? Math.round((clarity + confidence + technical) / 3);

      const answer: Answer = {
        questionIndex: currentQuestionIndex,
        question:      currentQ?.text  ?? "",
        topic:         currentQ?.topic ?? "General",
        answer:        answerText,
        facesDetected,
        scores: {
          clarity:    Math.round(clarity    * 10),
          confidence: Math.round(confidence * 10),
          technical:  Math.round(technical  * 10),
          overall:    Math.round(overall    * 10),
        },
        analysis: {
          sentiment:            sentimentMap[rawTone] ?? "Neutral",
          speakingConfidence:   Math.round(confidence * 10),
          communicationQuality: Math.round(clarity    * 10),
          bodyLanguage:  70,
          eyeContact:    70,
          facialConfidence: Math.round(confidence * 10),
        },
      };

      addAnswer(answer);

      // ── Environment warnings ─────────────────────────────────
      const env = data.environment ?? {};
      (env.warnings    ?? []).forEach((w: string) => addEnvironmentWarning(w));
      (env.final_flags ?? []).forEach((f: string) => addEnvironmentWarning(f));

      // ✅ FIX: backend now returns { is_complete, next_question, report }
      const isComplete = data.is_complete === true ||
        (typeof data.next_question === "string" &&
          data.next_question.toLowerCase().includes("interview complete"));

      if (isComplete) {
        // ✅ Save LLM report if backend sent it
        if (data.report) setLlmReport(data.report);
        nextQuestion(); // push index past end → triggers isFinished in InterviewPage
      } else {
        // ✅ next_question is always a plain string now
        const nextText  = typeof data.next_question === "string"
          ? data.next_question
          : (data.next_question?.next_question ?? "");

        const nextTopic = guessTopic(nextText);
        const nextType  = guessType(nextText);
        const nextRound = guessRound(nextTopic);

        setQuestions((prev) => [...prev, { text: nextText, topic: nextTopic, type: nextType, round: nextRound }]);
        const nextIdx = currentQuestionIndex + 1;
        nextQuestion();

        addChatMessage({
          id:            `msg-ai-${Date.now()}`,
          role:          "ai",
          content:       nextText,
          timestamp:     new Date(),
          questionIndex: nextIdx,
          topic:         nextTopic,
          questionType:  nextType,
        });
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to submit answer.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, currentQuestionIndex, questions, facesDetected, addAnswer, addEnvironmentWarning, nextQuestion, addChatMessage]);

  const stopSession = useCallback(() => {
    setInterviewActive(false);
    setPhase("report");
  }, []);

  return (
    <InterviewContext.Provider value={{
      phase, setPhase,
      sessionId,
      mode, setMode,
      resumeFile, setResumeFile,
      additionalFiles, setAdditionalFiles,
      currentQuestionIndex,
      questions,
      answers, addAnswer,
      nextQuestion,
      isLoading, setIsLoading,
      startSession, stopSession,
      cameraOn, setCameraOn,
      micOn, setMicOn,
      isRecording, setIsRecording,
      facesDetected, setFacesDetected,
      selectedTopics, setSelectedTopics,
      selectedSubtopics, setSelectedSubtopics,
      randomTopics, setRandomTopics,
      chatMessages, addChatMessage,
      environmentWarnings, addEnvironmentWarning, clearEnvironmentWarnings,
      interviewActive,
      submitAnswer,
      llmReport,
      apiError,
    }}>
      {children}
    </InterviewContext.Provider>
  );
};