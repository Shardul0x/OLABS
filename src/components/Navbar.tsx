import { motion } from "framer-motion";
import { ArrowLeft, Cpu } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import { SwitchMode } from "@/components/ui/switch-mode";
import ProfileDropdown from "@/components/ProfileDropdown";

interface NavbarProps {
  profile: { fullName: string; title: string };
  onViewProfile: () => void;
  onViewHistory: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  onEditProfile: () => void;
}

const Navbar = ({ profile, onViewProfile, onViewHistory, onLogout, onGoHome, onEditProfile }: NavbarProps) => {
  const { phase, sessionId, setPhase, stopSession } = useInterview();

  const canGoBack = phase !== "landing";

  const handleBack = () => {
    if (phase === "setup") setPhase("landing");
    else if (phase === "interview") stopSession();
    else if (phase === "report") setPhase("landing");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: back + logo */}
        <div className="flex items-center gap-3">
          {canGoBack && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onGoHome}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              HireMind<span className="text-primary"> AI</span>
            </span>
          </motion.button>
        </div>

        {/* Right: session ID + theme toggle + profile dropdown */}
        <div className="flex items-center gap-4">
          {phase !== "landing" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-full hidden sm:inline-flex"
            >
              {sessionId}
            </motion.span>
          )}

          <SwitchMode
            width={80}
            height={40}
            darkColor="#111"
            lightColor="#F9F9F9"
            knobDarkColor="#1C1C1C"
            knobLightColor="#F3F3F7"
            borderDarkColor="#444"
            borderLightColor="#DDD"
          />

          <ProfileDropdown
            userName={profile.fullName}
            userTitle={profile.title}
            onEditProfile={onEditProfile}
            onViewProfile={onViewProfile}
            onViewHistory={onViewHistory}
            onLogout={onLogout}
          />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
