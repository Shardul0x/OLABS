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
  OS: ["Deadlock", "Scheduling", "Memory Management", "Process Synchronization", "File Systems"],
  DBMS: ["Normalization", "Transactions", "SQL Queries", "Indexing", "ACID Properties"],
  CN: ["TCP/IP", "OSI Model", "DNS", "HTTP/HTTPS", "Subnetting"],
  OOP: ["Polymorphism", "Inheritance", "Encapsulation", "Abstraction", "Design Patterns"],
  DSA: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Sorting & Searching", "Linked Lists"],
};

// 4 Rounds: Computer Basics, DSA, Project/Technical, HR
const MOCK_QUESTIONS: { text: string; topic: string; type: string; round: string }[] = [
  // Round 1: Computer Basics
  { text: "What is the difference between a process and a thread in operating systems?", topic: "OS", type: "theory", round: "Computer Basics" },
  { text: "Explain TCP/IP three-way handshake and its significance.", topic: "CN", type: "theory", round: "Computer Basics" },
  { text: "What are the SOLID principles? Give examples of how you've applied them.", topic: "OOP", type: "theory", round: "Computer Basics" },
  // Round 2: DSA
  { text: "How would you implement a LRU Cache? Write your approach or code.", topic: "DSA", type: "dsa", round: "DSA" },
  { text: "Given a binary tree, write code to find the lowest common ancestor of two nodes.", topic: "DSA", type: "dsa", round: "DSA" },
  // Round 3: Project / Technical
  { text: "Tell me about your most challenging project. What technologies did you use?", topic: "Project", type: "behavioral", round: "Project & Technical" },
  { text: "Explain the architecture of a system you've built. How did you handle scalability?", topic: "Project", type: "behavioral", round: "Project & Technical" },
  // Round 4: HR
  { text: "How do you handle disagreements with team members during code reviews?", topic: "HR", type: "behavioral", round: "HR" },
  { text: "Where do you see yourself in 5 years? What motivates you?", topic: "HR", type: "behavioral", round: "HR" },
  { text: "Describe a time you failed and what you learned from it.", topic: "HR", type: "behavioral", round: "HR" },
];

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
  startSession: () => void;
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
}

const generateId = () => `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

const InterviewContext = createContext<InterviewState | null>(null);

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error("useInterview must be inside InterviewProvider");
  return ctx;
};

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<InterviewPhase>("landing");
  const [sessionId] = useState(generateId);
  const [mode, setMode] = useState<InterviewMode>("video");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [facesDetected, setFacesDetected] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [randomTopics, setRandomTopics] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [environmentWarnings, setEnvironmentWarnings] = useState<string[]>([]);
  const [interviewActive, setInterviewActive] = useState(false);

  const addAnswer = useCallback((a: Answer) => {
    setAnswers((prev) => [...prev, a]);
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => prev + 1);
  }, []);

  const addChatMessage = useCallback((m: ChatMessage) => {
    setChatMessages((prev) => [...prev, m]);
  }, []);

  const addEnvironmentWarning = useCallback((w: string) => {
    setEnvironmentWarnings((prev) => [...prev, w]);
  }, []);

  const clearEnvironmentWarnings = useCallback(() => {
    setEnvironmentWarnings([]);
  }, []);

  const startSession = useCallback(() => {
    setPhase("interview");
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setChatMessages([]);
    setEnvironmentWarnings([]);
    setInterviewActive(true);
    // Add first question as AI message
    const firstQ = MOCK_QUESTIONS[0];
    setChatMessages([{
      id: `msg-${Date.now()}`,
      role: "ai",
      content: firstQ.text,
      timestamp: new Date(),
      questionIndex: 0,
      topic: firstQ.topic,
      questionType: firstQ.type,
    }]);
  }, []);

  const stopSession = useCallback(() => {
    setInterviewActive(false);
    setPhase("report");
  }, []);

  return (
    <InterviewContext.Provider
      value={{
        phase, setPhase, sessionId, mode, setMode,
        resumeFile, setResumeFile, additionalFiles, setAdditionalFiles,
        currentQuestionIndex, questions: MOCK_QUESTIONS, answers, addAnswer,
        nextQuestion, isLoading, setIsLoading, startSession, stopSession,
        cameraOn, setCameraOn, micOn, setMicOn, isRecording, setIsRecording,
        facesDetected, setFacesDetected,
        selectedTopics, setSelectedTopics,
        selectedSubtopics, setSelectedSubtopics,
        randomTopics, setRandomTopics,
        chatMessages, addChatMessage,
        environmentWarnings, addEnvironmentWarning, clearEnvironmentWarnings,
        interviewActive,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};
