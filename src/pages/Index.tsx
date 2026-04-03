import { useState, useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { InterviewProvider, useInterview } from "@/contexts/InterviewContext";
import { HistoryProvider } from "@/contexts/InterviewHistoryContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import LandingPage from "@/pages/LandingPage";
import SetupPage from "@/pages/SetupPage";
import InterviewPage from "@/pages/InterviewPage";
import ReportPage from "@/pages/ReportPage";
import LoginPage from "@/pages/LoginPage";
import HistoryPage from "@/pages/HistoryPage";
import InterviewDetailPage from "@/pages/InterviewDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import EditProfileModal, { ProfileData } from "@/components/EditProfileModal";
import { AnimatePresence, motion } from "framer-motion";

type AppView = "main" | "history" | "detail" | "profile";

const AppContent = () => {
  const { phase, setPhase } = useInterview();
  const { user, isLoading, signOut } = useAuth(); 
  const [view, setView] = useState<AppView>("main");
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Initialize with empty/default
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    title: "Software Engineer",
    email: "",
    experienceLevel: "Mid-Level",
    targetCompany: "Enterprise",
    
  });

  // AUTOMATION LOGIC: This runs the moment the user data is available
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "User",
        email: user.email || "",
      }));
    }
  }, [user]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading HireMind AI...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleNewInterview = () => {
    setView("main");
    setPhase("landing");
  };

  const navbarProps = {
    onGoHome: () => {
      setView("main");
      setPhase("landing");
      setProfileModalOpen(false); 
    },
    onViewHistory: () => {
      setView("history");
      setProfileModalOpen(false);
    },
    onViewProfile: () => {
      setView("profile");
      setProfileModalOpen(false);
    },
    onEditProfile: () => setProfileModalOpen(true),
    onLogout: async () => { await signOut(); },
    profile: profile,
  };

  const renderContent = () => {
    if (view === "history") return <HistoryPage onViewDetails={handleViewDetails} onNewInterview={handleNewInterview} />;
    if (view === "detail" && detailSessionId) return <InterviewDetailPage sessionId={detailSessionId} onBack={() => setView("history")} onNewInterview={handleNewInterview} />;
    if (view === "profile") return <ProfilePage />;
    return (
      <AnimatePresence mode="wait">
        <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {phase === "landing" && <LandingPage />}
          {phase === "setup" && <SetupPage />}
          {phase === "interview" && <InterviewPage />}
          {phase === "report" && <ReportPage onViewHistory={() => setView("history")} />}
        </motion.div>
      </AnimatePresence>
    );
  };

  const handleViewDetails = (sessionId: string) => {
    setDetailSessionId(sessionId);
    setView("detail");
  };

  return (
    <div className="min-h-screen">
      <Navbar {...navbarProps} />
      {renderContent()}
      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialData={profile}
        onSave={(newData) => {
          setProfile(newData);
          setProfileModalOpen(false);
        }}
      />
    </div>
  );
};

const Index = () => (
  <ThemeProvider>
    <HistoryProvider>
      <InterviewProvider>
        <AppContent />
      </InterviewProvider>
    </HistoryProvider>
  </ThemeProvider>
);

export default Index;