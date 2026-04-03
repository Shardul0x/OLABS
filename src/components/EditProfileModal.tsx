import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, User, Pencil } from "lucide-react";

export interface ProfileData {
  fullName: string;
  email: string;
  timezone: string;
  workingHours: string;
  title: string;
}

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ProfileData;
  onSave: (data: ProfileData) => void;
}

const EditProfileModal = ({ isOpen, onClose, initialData, onSave }: EditProfileProps) => {
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    if (isOpen) setFormData(initialData);
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left - Form */}
            <div className="flex-1 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Edit Profile</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input name="fullName" value={formData.fullName} onChange={handleChange}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                  <input name="email" value={formData.email} onChange={handleChange}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timezone</label>
                    <select name="timezone" value={formData.timezone} onChange={handleChange}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all">
                      <option>GMT-8</option><option>GMT-5</option><option>GMT+0</option><option>GMT+5</option><option>GMT+5:30</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Working Hours
                    </label>
                    <input name="workingHours" value={formData.workingHours} onChange={handleChange}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</label>
                  <input name="title" value={formData.title} onChange={handleChange}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSave(formData)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow-lg"
                >
                  Save Changes
                </motion.button>
              </div>
            </div>

            {/* Right - Profile Preview */}
            <div className="w-56 bg-secondary/20 border-l border-border p-6 hidden md:flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm">{formData.fullName || "Your Name"}</p>
                <p className="text-xs text-muted-foreground">{formData.title || "Your Title"}</p>
              </div>
              <div className="w-full space-y-2 pt-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formData.workingHours}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>🌍</span>
                  <span>{formData.timezone}</span>
                </div>
              </div>
              <div className="w-full space-y-1.5 opacity-20 pt-4">
                <div className="h-1 bg-foreground rounded-full w-full" />
                <div className="h-1 bg-foreground rounded-full w-2/3 mx-auto" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
