import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, History, BarChart3, ChevronDown, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ProfileDropdownProps {
  userName: string;
  userTitle: string;
  onEditProfile: () => void;
  onViewProfile: () => void;
  onViewHistory: () => void;
  onLogout: () => void;
}

const ProfileDropdown = ({
  userName,
  userTitle,
  onEditProfile,
  onViewProfile,
  onViewHistory,
  onLogout,
}: ProfileDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="text-left hidden md:block">
          <p className="text-xs font-semibold leading-tight">{userName}</p>
          <p className="text-[10px] text-muted-foreground">{userTitle}</p>
        </div>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
          >
            {/* Mini profile header */}
            <div className="p-3 border-b border-border">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-muted-foreground">{userTitle}</p>
            </div>

            <div className="p-1">
              <button
                onClick={() => { onEditProfile(); close(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary/60 transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-muted-foreground" /> Edit Profile
              </button>
              <button
                onClick={() => { onViewProfile(); close(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary/60 transition-colors text-left"
              >
                <BarChart3 className="w-4 h-4 text-muted-foreground" /> Profile Analytics
              </button>
              <button
                onClick={() => { onViewHistory(); close(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary/60 transition-colors text-left"
              >
                <History className="w-4 h-4 text-muted-foreground" /> Interview History
              </button>
            </div>

            <div className="p-1 border-t border-border">
              <button
                onClick={() => { onLogout(); close(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
