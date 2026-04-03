import { motion } from "framer-motion";
import { TrendingUp, Brain, Eye, Smile } from "lucide-react";
import CircularScore from "./CircularScore";
import ScoreBar from "./ScoreBar";
import type { Answer } from "@/contexts/InterviewContext";

interface EvaluationPanelProps {
  answer: Answer;
}

const sentimentColor = {
  Confident: "text-green-500",
  Neutral: "text-yellow-500",
  Nervous: "text-red-400",
};

const EvaluationPanel = ({ answer }: EvaluationPanelProps) => {
  const { scores, analysis } = answer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-xl p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Evaluation
        </h3>
        <span className={`text-sm font-medium ${sentimentColor[analysis.sentiment]}`}>
          {analysis.sentiment}
        </span>
      </div>

      <div className="flex justify-around">
        <CircularScore score={scores.clarity} label="Clarity" />
        <CircularScore score={scores.confidence} label="Confidence" />
        <CircularScore score={scores.technical} label="Technical" />
        <CircularScore score={scores.overall} label="Overall" size={90} highlight />
      </div>

      <div className="space-y-3">
        <ScoreBar label="Speaking Confidence" value={analysis.speakingConfidence} delay={0.1} />
        <ScoreBar label="Communication Quality" value={analysis.communicationQuality} color="accent" delay={0.2} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-lg p-3 text-center space-y-1">
          <Eye className="w-4 h-4 mx-auto text-primary" />
          <div className="text-xs text-muted-foreground">Eye Contact</div>
          <div className="text-sm font-semibold">{analysis.eyeContact}%</div>
        </div>
        <div className="glass rounded-lg p-3 text-center space-y-1">
          <Smile className="w-4 h-4 mx-auto text-accent" />
          <div className="text-xs text-muted-foreground">Facial Conf.</div>
          <div className="text-sm font-semibold">{analysis.facialConfidence}%</div>
        </div>
        <div className="glass rounded-lg p-3 text-center space-y-1">
          <Brain className="w-4 h-4 mx-auto text-primary" />
          <div className="text-xs text-muted-foreground">Body Lang.</div>
          <div className="text-sm font-semibold">{analysis.bodyLanguage}%</div>
        </div>
      </div>
    </motion.div>
  );
};

export default EvaluationPanel;
