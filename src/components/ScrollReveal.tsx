import { motion, useInView, useAnimation } from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function ScrollReveal({ 
  children, 
  delay = 0, 
  className = ""
}: ScrollRevealProps) {
  const ref = useRef(null);
  const controls = useAnimation();
  
  // REMOVED "once: true". Now it tracks entering AND leaving the screen!
  const isInView = useInView(ref, { amount: 0.15 });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else {
      // Resets the animation when you scroll past it!
      controls.start("hidden");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { 
          opacity: 0, 
          y: 80, 
          scale: 0.9, 
          filter: "blur(10px)" 
        },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          filter: "blur(0px)" 
        }
      }}
      transition={{ 
        duration: 0.6, 
        // We only use the delay when appearing. When disappearing, it hides instantly!
        delay: isInView ? delay : 0, 
        type: "spring", 
        stiffness: 100, 
        damping: 20 
      }}
    >
      {children}
    </motion.div>
  );
}