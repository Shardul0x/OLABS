import { useState, useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { InterviewProvider, useInterview } from "@/contexts/InterviewContext";
import { HistoryProvider } from "@/contexts/InterviewHistoryContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import LandingPage from "@/pages/LandingPage";
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

  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    title: "Software Engineer",
    email: "",
    experienceLevel: "Mid-Level",
    targetCompany: "Enterprise",
  });

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

  // Define these BEFORE renderContent uses them
  const handleNewInterview = () => {
    setView("main");
    setPhase("landing");
  };

  const handleViewDetails = (sessionId: string) => {
    setDetailSessionId(sessionId);
    setView("detail");
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

  // 🚀 UNIFIED ANIMATION WRAPPER 🚀
  const renderContent = () => {
    // This key tells Framer Motion exactly when to trigger a page transition
    const currentKey = view === "main" ? phase : view;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentKey}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full flex-1 flex flex-col relative z-10"
        >
          {view === "history" && <HistoryPage onViewDetails={handleViewDetails} onNewInterview={handleNewInterview} />}
          {view === "detail" && detailSessionId && <InterviewDetailPage sessionId={detailSessionId} onBack={() => setView("history")} onNewInterview={handleNewInterview} />}
          {view === "profile" && <ProfilePage />}
          
          {/* SetupPage is gone! LandingPage now handles everything before the interview */}
          {view === "main" && phase === "landing" && <LandingPage />}
          {view === "main" && phase === "interview" && <InterviewPage />}
          {view === "main" && phase === "report" && <ReportPage onViewHistory={() => setView("history")} />}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    // Added flex-col and overflow-x-hidden to prevent weird scrolling bugs
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden relative">
      <Navbar {...navbarProps} />
      
      <main className="flex-1 w-full relative flex flex-col">
        {renderContent()}
      </main>

      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialData={profile}
        onSave={(newData: ProfileData) => {
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