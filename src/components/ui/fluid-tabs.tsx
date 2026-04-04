'use client';

import { useState, type ReactNode, type FC } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Mic, Video } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface FluidTabsProps {
  tabs?: TabItem[];
  defaultActive?: string;
  onChange?: (id: string) => void;
}

const DEFAULT_TABS: TabItem[] = [
  { id: 'text',  label: 'Text Mode',     icon: <MessageSquare size={16} /> },
  { id: 'voice', label: 'Voice Mode',    icon: <Mic size={16} /> },
  { id: 'video', label: 'Video + Audio', icon: <Video size={16} /> },
];

export const FluidTabs: FC<FluidTabsProps> = ({
  tabs = DEFAULT_TABS,
  defaultActive = tabs[0]?.id,
  onChange,
}) => {
  const [active, setActive] = useState<string>(defaultActive);

  const handleChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div
      className="
        relative flex items-center gap-1 rounded-2xl px-1.5 py-1.5
        sm:gap-1.5 transition-colors
        bg-slate-100/90 border border-slate-200/80
        dark:bg-white/[0.05] dark:border-white/[0.08]
        backdrop-blur-xl overflow-hidden w-full
      "
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className="group relative flex-1 rounded-xl px-3 py-2.5 outline-none sm:px-4 sm:py-3 min-w-0"
          >
            {/* Sliding active pill */}
            {isActive && (
              <motion.div
                layoutId="active-pill"
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 25,
                  mass: 0.8,
                }}
                className="
                  absolute inset-0 rounded-xl
                  bg-white border border-slate-200 shadow-sm
                  dark:bg-white/[0.12] dark:border-white/[0.14] dark:shadow-none
                "
                style={{ boxShadow: '0 2px 14px rgba(59,130,246,0.10)' }}
              />
            )}

            {/* Content */}
            <motion.div
              transition={{ duration: 0.3, ease: 'easeOut' }}
              animate={{
                filter: isActive
                  ? ['blur(0px)', 'blur(4px)', 'blur(0px)']
                  : 'blur(0px)',
              }}
              className={`
                relative z-10 flex items-center justify-center gap-2
                transition-colors duration-200
                font-['Orbitron',sans-serif] text-xs sm:text-sm font-semibold
                tracking-wide whitespace-nowrap
                ${isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-400 dark:text-white/30 group-hover:text-slate-600 dark:group-hover:text-white/55'
                }
              `}
            >
              {/* Icon */}
              <motion.div
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={`
                  flex shrink-0 items-center justify-center transition-colors duration-200
                  ${isActive
                    ? 'text-blue-600 dark:text-cyan-400'
                    : 'text-slate-400 dark:text-white/25 group-hover:text-slate-500 dark:group-hover:text-white/50'
                  }
                `}
              >
                {tab.icon}
              </motion.div>

              <span>{tab.label}</span>
            </motion.div>
          </button>
        );
      })}
    </div>
  );
};