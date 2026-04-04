"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";

type CursorState = "default" | "pointer" | "text" | "clicking";

const CustomCursor = () => {
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);

  // Tight spring — main cursor snaps almost instantly
  const springX = useSpring(cursorX, { stiffness: 1000, damping: 55, mass: 0.2 });
  const springY = useSpring(cursorY, { stiffness: 1000, damping: 55, mass: 0.2 });

  // Lazy spring — trailing orb lags behind
  const trailX = useSpring(cursorX, { stiffness: 90, damping: 18, mass: 1.2 });
  const trailY = useSpring(cursorY, { stiffness: 90, damping: 18, mass: 1.2 });

  const [state, setState]         = useState<CursorState>("default");
  const [isDark, setIsDark]       = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const rafRef = useRef<number>();

  // Must wait for client mount before using createPortal
  useEffect(() => { setMounted(true); }, []);

  // Watch dark/light mode
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => mo.disconnect();
  }, []);

  const detectState = useCallback((e: MouseEvent): CursorState => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return "default";
    const tag    = el.tagName.toLowerCase();
    const role   = el.getAttribute("role");
    const cs     = window.getComputedStyle(el).cursor;

    if (
      tag === "button" || tag === "a" || tag === "label" ||
      role === "button" || role === "link" || role === "tab" ||
      role === "menuitem" || role === "option" ||
      cs === "pointer"
    ) return "pointer";

    if (
      tag === "input" || tag === "textarea" || tag === "select" ||
      el.getAttribute("contenteditable") === "true" || cs === "text"
    ) return "text";

    return "default";
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
        setState(prev => (prev === "clicking" ? "clicking" : detectState(e)));
        setIsVisible(true);
      });
    };
    const onDown  = ()              => setState("clicking");
    const onUp    = (e: MouseEvent) => setState(detectState(e));
    const onLeave = ()              => setIsVisible(false);
    const onEnter = ()              => setIsVisible(true);

    window.addEventListener("mousemove",    onMove,  { passive: true });
    window.addEventListener("mousedown",    onDown);
    window.addEventListener("mouseup",      onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove",    onMove);
      window.removeEventListener("mousedown",    onDown);
      window.removeEventListener("mouseup",      onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cursorX, cursorY, detectState]);

  // Kill native cursor everywhere — injected at <head> level
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "hm-cursor-hide";
    style.textContent = `*, *::before, *::after { cursor: none !important; }`;
    document.head.appendChild(style);
    return () => document.getElementById("hm-cursor-hide")?.remove();
  }, []);

  // ── Theme-aware color palette ─────────────────────────────────
  const C = isDark ? {
    arrowFill:   "#ffffff",
    arrowStroke: "rgba(40,220,255,0.92)",
    arrowFilter: "drop-shadow(0 0 6px rgba(40,220,255,0.72))",
    tipGlow:     "rgba(40,220,255,0.65)",
    pointerTip:  "rgba(40,220,255,1)",
    clickFill:   "rgba(140,215,255,1)",
    trailBg:     "rgba(40,220,255,0.07)",
    trailBorder: "rgba(40,220,255,0.35)",
    trailShadow: "0 0 22px rgba(40,220,255,0.18), 0 0 8px rgba(40,220,255,0.28)",
    ibeamShaft:  "#ffffff",
    ibeamSerf:   "rgba(40,220,255,0.95)",
    textOrb:     "rgba(40,220,255,0.50)",
    boom:        "rgba(40,220,255,0.18)",
  } : {
    arrowFill:   "#0f172a",
    arrowStroke: "rgba(37,99,235,0.88)",
    arrowFilter: "drop-shadow(0 2px 5px rgba(37,99,235,0.48))",
    tipGlow:     "rgba(37,99,235,0.55)",
    pointerTip:  "rgba(37,99,235,1)",
    clickFill:   "rgba(99,102,241,1)",
    trailBg:     "rgba(59,130,246,0.07)",
    trailBorder: "rgba(59,130,246,0.32)",
    trailShadow: "0 0 16px rgba(59,130,246,0.14)",
    ibeamShaft:  "#0f172a",
    ibeamSerf:   "rgba(37,99,235,0.92)",
    textOrb:     "rgba(37,99,235,0.45)",
    boom:        "rgba(37,99,235,0.15)",
  };

  const cursorScale = state === "clicking" ? 0.80 : state === "pointer" ? 0.90 : 1;

  // ── Portal styles — these divs live directly on document.body ──
  // No parent stacking context can trap them
  const portalStyle: React.CSSProperties = {
    position:      "fixed",
    top:           0,
    left:          0,
    pointerEvents: "none",
    zIndex:        2147483647, // absolute max CSS integer
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* ── Trailing glow orb ───────────────────────────────────── */}
      <motion.div
        style={{
          ...portalStyle,
          zIndex: 2147483646,
          x: trailX,
          y: trailY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
        }}
      >
        <motion.div
          animate={{
            width:        state === "text" ? 3  : state === "pointer" ? 40 : 30,
            height:       state === "text" ? 30 : state === "pointer" ? 40 : 30,
            borderRadius: state === "text" ? "2px" : "50%",
            opacity:      isVisible ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          style={{
            background:  state === "text" ? C.textOrb : C.trailBg,
            border:      `1px solid ${C.trailBorder}`,
            boxShadow:   C.trailShadow,
          }}
        />
      </motion.div>

      {/* ── Main cursor ─────────────────────────────────────────── */}
      <motion.div
        style={{
          ...portalStyle,
          zIndex: 2147483647,
          x: springX,
          y: springY,
          opacity: isVisible ? 1 : 0,
        }}
      >
        <motion.div
          animate={{
            scale:  cursorScale,
            rotate: state === "clicking" ? 6 : 0,
          }}
          transition={{ type: "spring", stiffness: 550, damping: 30 }}
        >
          {/* ── DEFAULT / CLICKING — Windows arrow ── */}
          {(state === "default" || state === "clicking") && (
            <svg
              width="20" height="24" viewBox="0 0 20 24"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ filter: C.arrowFilter }}
            >
              {/* Arrow body — exact Windows arrow geometry */}
              <path
                d="M2 2 L2 18.5 L6.2 13.8 L10.2 22.5 L12.8 21.3 L8.8 12.6 L15.5 12.6 Z"
                fill={state === "clicking" ? C.clickFill : C.arrowFill}
                stroke={C.arrowStroke}
                strokeWidth="1.1"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Left-face inner highlight */}
              <path
                d="M2 2 L2 9 L5.2 12.5 Z"
                fill={isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.55)"}
              />
              {/* Tip glow */}
              <circle cx="2" cy="2" r="2.6"
                fill={C.tipGlow}
                style={{ filter: "blur(1.8px)" }}
              />
            </svg>
          )}

          {/* ── POINTER — pointing hand ── */}
          {state === "pointer" && (
            <svg
              width="20" height="25" viewBox="0 0 20 25"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: isDark
                  ? "drop-shadow(0 0 8px rgba(40,220,255,0.82))"
                  : "drop-shadow(0 2px 6px rgba(37,99,235,0.58))",
              }}
            >
              {/* Index finger — glowing stroke */}
              <path
                d="M8.5 1 C8.5 0.4 9 0 10 0 C11 0 11.5 0.5 11.5 1 L11.5 10.5"
                stroke={C.pointerTip} strokeWidth="2.9" strokeLinecap="round" fill="none"
              />
              {/* Middle finger */}
              <path
                d="M11.5 3 C11.5 2.4 12 2 13 2 C14 2 14.5 2.5 14.5 3 L14.5 11"
                stroke={C.arrowFill} strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.58"
              />
              {/* Ring finger */}
              <path
                d="M14.5 4.5 C14.5 4 15 3.5 15.8 3.5 C16.6 3.5 17 4 17 4.5 L17 11"
                stroke={C.arrowFill} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.36"
              />
              {/* Palm */}
              <path
                d="M8.5 10.5 C7 10.5 5.8 11.2 5.5 12.5 L5.5 18 C5.5 20.5 7 22.5 9.5 23 L14.5 23 C17 22.5 17.5 20.5 17.5 18 L17.5 11 L14.5 11 L14.5 10 L11.5 10 L11.5 10.5 Z"
                fill={C.arrowFill}
                stroke={C.arrowStroke}
                strokeWidth="0.95"
                strokeLinejoin="round"
              />
              {/* Index finger tip glow */}
              <circle cx="10" cy="0" r="3.4"
                fill={C.tipGlow}
                style={{ filter: "blur(2.5px)" }}
              />
            </svg>
          )}

          {/* ── TEXT — I-beam ── */}
          {state === "text" && (
            <svg
              width="12" height="24" viewBox="0 0 12 24"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: "translateX(-45%)",
                filter: isDark
                  ? "drop-shadow(0 0 5px rgba(40,220,255,0.78))"
                  : "drop-shadow(0 0 4px rgba(37,99,235,0.58))",
              }}
            >
              {/* Top serif */}
              <line x1="1.5" y1="2" x2="10.5" y2="2"
                stroke={C.ibeamSerf} strokeWidth="1.9" strokeLinecap="round" />
              {/* Vertical shaft */}
              <line x1="6" y1="2" x2="6" y2="22"
                stroke={C.ibeamShaft} strokeWidth="1.7" strokeLinecap="round" />
              {/* Bottom serif */}
              <line x1="1.5" y1="22" x2="10.5" y2="22"
                stroke={C.ibeamSerf} strokeWidth="1.9" strokeLinecap="round" />
              {/* Mid glow orb */}
              <circle cx="6" cy="12" r="3.5"
                fill={C.textOrb}
                style={{ filter: "blur(3px)" }}
              />
            </svg>
          )}
        </motion.div>

        {/* Glow bloom at the cursor tip */}
        {state !== "text" && (
          <motion.div
            animate={{
              opacity: state === "clicking" ? 1.0 : state === "pointer" ? 0.55 : 0.28,
              scale:   state === "clicking" ? 2.4 : 1,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            style={{
              position:   "absolute",
              top:        -3,
              left:       -3,
              width:      16,
              height:     16,
              borderRadius: "50%",
              background: C.boom,
              filter:     "blur(8px)",
              pointerEvents: "none",
            }}
          />
        )}
      </motion.div>
    </>,
    document.body   // ← teleported directly onto body, no stacking context parent
  );
};

export default CustomCursor;