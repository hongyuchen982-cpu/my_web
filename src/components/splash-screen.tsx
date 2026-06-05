"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SPLASH_KEY = "splash-shown";

export default function SplashScreen() {
  const [stage, setStage] = useState<"typing" | "ready" | "exiting" | "done">(
    "typing"
  );
  const [mounted, setMounted] = useState(true);

  // Check if already shown this session
  useEffect(() => {
    const shown = sessionStorage.getItem(SPLASH_KEY);
    if (shown === "1") {
      setMounted(false);
      setStage("done");
    }
  }, []);

  // Auto-advance from typing to ready
  useEffect(() => {
    if (stage !== "typing") return;
    const t = setTimeout(() => setStage("ready"), 2800);
    return () => clearTimeout(t);
  }, [stage]);

  const handleEnter = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setStage("exiting");
  }, []);

  // After exit animation, unmount
  useEffect(() => {
    if (stage !== "exiting") return;
    const t = setTimeout(() => setStage("done"), 1000);
    return () => clearTimeout(t);
  }, [stage]);

  if (!mounted || stage === "done") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="splash"
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ y: "-100%" }}
        transition={{
          duration: 0.9,
          ease: [0.76, 0, 0.24, 1],
        }}
        >
          {/* Subtle background grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          {/* Ambient glow orbs */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
            style={{
              background:
                "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Scanning line */}
          <motion.div
            className="absolute left-0 right-0 h-[1px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent)",
              top: "50%",
            }}
            animate={{
              top: ["10%", "90%", "10%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-10">
            {/* Logo / Brand mark */}
            <motion.div
              className="w-12 h-12 rounded-full border border-cyan-500/30 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-cyan-400"
                animate={{
                  boxShadow: [
                    "0 0 8px rgba(6,182,212,0.6)",
                    "0 0 20px rgba(6,182,212,0.9)",
                    "0 0 8px rgba(6,182,212,0.6)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Typing text */}
            <div className="h-8 flex items-center">
              {stage === "typing" && <TypingText />}
            </div>

            {/* Enter button */}
            <AnimatePresence>
              {stage === "ready" && (
                <motion.button
                  onClick={handleEnter}
                  className="relative group px-8 py-3 font-mono text-sm tracking-[0.2em] uppercase text-cyan-400 border border-cyan-500/20 rounded-full bg-black/40 backdrop-blur-sm overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  whileHover={{
                    scale: 1.03,
                    borderColor: "rgba(6,182,212,0.6)",
                    boxShadow: "0 0 40px rgba(6,182,212,0.15)",
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Button glow background on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(6,182,212,0.08) 0%, transparent 70%)",
                    }}
                  />

                  <span className="relative z-10">Enter Lab</span>

                  {/* Subtle pulsing dot */}
                  <motion.span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 ml-2 relative z-10"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom status line */}
          <motion.div
            className="absolute bottom-8 left-0 right-0 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center gap-4 text-[10px] font-mono text-cyan-500/30">
              <span>SYS.ONLINE</span>
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ●
              </motion.span>
              <span>READY</span>
            </div>
          </motion.div>
        </motion.div>
    </AnimatePresence>
  );
}

/**
 * Minimalist typing text with cursor blink.
 */
function TypingText() {
  const fullText = "INITIALIZING SYSTEM...";
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= fullText.length) {
        setDisplayed(fullText.slice(0, i));
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-0.5">
      <span className="text-sm font-mono tracking-[0.3em] text-cyan-300/80">
        {displayed}
      </span>
      <motion.span
        className="inline-block w-[2px] h-4 bg-cyan-400 ml-0.5"
        animate={{ opacity: done ? [0, 1] : 1 }}
        transition={
          done
            ? { duration: 0.8, repeat: Infinity }
            : { duration: 0.1 }
        }
      />
    </div>
  );
}
