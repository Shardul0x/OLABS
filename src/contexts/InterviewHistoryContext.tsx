import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Answer, ChatMessage, InterviewMode } from "./InterviewContext";

export interface InterviewSession {
  sessionId: string;
  date: string;
  topics: string[];
  mode: InterviewMode;
  status: "completed" | "aborted";
  answers: Answer[];
  chatMessages: ChatMessage[];
  overallScore: number;
  scores: {
    confidence: number;
    communication: number;
    bodyLanguage: number;
    eyeContact: number;
    clarity: number;
    technical: number;
  };
  strengths: string[];
  improvements: string[];
  environmentWarnings: string[];
}

interface HistoryState {
  sessions: InterviewSession[];
  addSession: (s: InterviewSession) => void;
  getSession: (id: string) => InterviewSession | undefined;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryState | null>(null);

export const useHistory = () => {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be inside HistoryProvider");
  return ctx;
};

const STORAGE_KEY = "hiremind_history";

const serializeSessions = (sessions: InterviewSession[]): string => {
  return JSON.stringify(sessions);
};

const deserializeSessions = (raw: string): InterviewSession[] => {
  try {
    const parsed = JSON.parse(raw);
    return parsed.map((s: any) => ({
      ...s,
      chatMessages: s.chatMessages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return [];
  }
};

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<InterviewSession[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? deserializeSessions(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serializeSessions(sessions));
  }, [sessions]);

  const addSession = useCallback((s: InterviewSession) => {
    setSessions((prev) => [s, ...prev]);
  }, []);

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.sessionId === id),
    [sessions]
  );

  const clearHistory = useCallback(() => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <HistoryContext.Provider value={{ sessions, addSession, getSession, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};
