import { useState } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { InterviewProvider, useInterview } from "@/contexts/InterviewContext";
import { HistoryProvider } from "@/contexts/InterviewHistoryContext";
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
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<AppView>("main");
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    fullName: "Demo User",
    title: "Software Engineer",
    email: "demo@hiremind.ai",
    timezone: "GMT+5:30",
    workingHours: "9 AM – 6 PM",
  });

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  const handleViewDetail = (id: string) => {
    setDetailSessionId(id);
    setView("detail");
  };

  const handleNewInterview = () => {
    setView("main");
    setPhase("landing");
  };

  // Shared navbar props — defined once, used everywhere
  const navbarProps = {
    profile: { fullName: profile.fullName, title: profile.title },
    onEditProfile: () => setProfileModalOpen(true),
    onViewProfile: () => setView("profile"),
    onViewHistory: () => setView("history"),
    onLogout: () => setLoggedIn(false),
    onGoHome: () => { setView("main"); setPhase("landing"); },
  };

  const renderContent = () => {
    if (view === "history") {
      return <HistoryPage onViewDetail={handleViewDetail} />;
    }
    if (view === "detail" && detailSessionId) {
      return (
        <InterviewDetailPage
          sessionId={detailSessionId}
          onBack={() => setView("history")}
          onNewInterview={handleNewInterview}
        />
      );
    }
    if (view === "profile") {
      return <ProfilePage />;
    }
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {phase === "landing" && <LandingPage />}
          {phase === "setup" && <SetupPage />}
          {phase === "interview" && <InterviewPage />}
          {phase === "report" && <ReportPage onViewHistory={() => setView("history")} />}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar {...navbarProps} />

      {renderContent()}

      {/* Global Edit Profile Modal — opened from Navbar → ProfileDropdown */}
      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialData={profile}
        onSave={(data) => {
          setProfile(data);
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
