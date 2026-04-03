import { motion } from "framer-motion";
import { ArrowRight, Mic, Video, Brain, BarChart3, Shield } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import AnimatedBackground from "@/components/AnimatedBackground";

const features = [
  { icon: Mic, title: "Voice Analysis", desc: "Real-time speech clarity & confidence scoring" },
  { icon: Video, title: "Video Interview", desc: "Live webcam with behavioral analysis" },
  { icon: Brain, title: "AI Evaluation", desc: "Intelligent feedback on every answer" },
  { icon: BarChart3, title: "Score Reports", desc: "Detailed performance analytics" },
  { icon: Shield, title: "Practice Safe", desc: "No data stored, pure practice mode" },
];

const LandingPage = () => {
  const { setPhase } = useInterview();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-muted-foreground">AI-Powered Interview Platform</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            HireMind
            <br />
            <span className="gradient-text">AI</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Practice real interviews with AI-powered evaluation. Get instant feedback on clarity, confidence, and technical depth.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase("setup")}
            className="btn-glow inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg"
          >
            Start Interview
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl w-full"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass rounded-xl p-4 text-center space-y-2 cursor-default"
            >
              <f.icon className="w-5 h-5 mx-auto text-primary" />
              <div className="text-xs font-semibold">{f.title}</div>
              <div className="text-[10px] text-muted-foreground leading-snug">{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;