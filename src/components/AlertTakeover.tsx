import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, BellRing, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../services/store";
import { formatTime } from "../utils";
import { Button } from "./ui";

export function AlertTakeover() {
  const { alerts, currentUser, markAlertRead } = useApp();
  const reduce = !!useReducedMotion();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const unread = alerts
    .filter((alert) => alert.isUrgent && alert.active !== false && currentUser && !alert.readBy.includes(currentUser.uid) && !dismissed.includes(alert.id))
    .sort((a, b) => b.createdAt - a.createdAt);
  const active = unread[0] || null;

  useEffect(() => {
    if (!active || reduce) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [active, reduce]);

  function dismiss() {
    if (!active || !currentUser) return;
    markAlertRead(active.id, currentUser.uid);
    setDismissed((prev) => [...prev, active.id]);
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-400/40 bg-zinc-950 p-1 shadow-[0_0_60px_rgba(245,158,11,0.22)]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 22 }}
          >
            {!reduce && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-amber-400/40"
                animate={{ opacity: [0.35, 1, 0.35], boxShadow: ["0 0 0px rgba(245,158,11,0)", "0 0 34px rgba(245,158,11,0.45)", "0 0 0px rgba(245,158,11,0)"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <div className="relative overflow-hidden rounded-[1.35rem] bg-zinc-950 p-6">
              <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-amber-300">
                    <BellRing size={14} /> Urgent batch alert
                  </div>
                  <span className="mono text-[0.65rem] text-zinc-500">{formatTime(active.createdAt)}</span>
                </div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                  <AlertTriangle size={28} />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white">{active.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{active.message}</p>
                <div className="mt-6 flex items-center gap-3">
                  <Button onClick={dismiss} className="flex-1">Okay, Got It</Button>
                  <button onClick={dismiss} aria-label="Close alert" className="rounded-xl border border-white/10 p-2.5 text-zinc-400 hover:text-white">
                    <X size={17} />
                  </button>
                </div>
                <p className="mt-4 text-center text-[0.65rem] text-zinc-600">Acknowledged alerts won’t appear again. CR can remove broadcasts anytime.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
