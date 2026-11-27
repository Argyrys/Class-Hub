import { motion, useReducedMotion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";

export function AttendanceRing({ percentage, tone }: { percentage: number; tone: "safe" | "warn" | "danger" }) {
  const reduce = !!useReducedMotion();
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference * (1 - clamped / 100);
  const colors = { safe: "#34d399", warn: "#fbbf24", danger: "#fb7185" };
  const color = colors[tone];

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full" aria-label={`${clamped.toFixed(1)} percent attendance`}>
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.7" />
            <stop offset="1" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform="rotate(-90 64 64)"
          initial={{ strokeDashoffset: reduce ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={reduce ? { duration: 0 } : { duration: 1.1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="mono text-3xl font-bold text-zinc-50">
          <AnimatedNumber value={clamped} decimals={1} />%
        </div>
        <div className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-widest text-zinc-500">Attendance</div>
      </div>
    </div>
  );
}
