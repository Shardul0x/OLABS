import { motion } from "framer-motion";

interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
  color?: "primary" | "accent";
  delay?: number;
}

const ScoreBar = ({ label, value, max = 100, color = "primary", delay = 0 }: ScoreBarProps) => {
  const pct = (value / max) * 100;
  const bg = color === "primary" ? "bg-primary" : "bg-accent";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${bg}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay }}
        />
      </div>
    </div>
  );
};

export default ScoreBar;
