import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

export function AnimatedNumber({ value, decimals = 0, className = "" }: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const reduce = !!useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useTransform(motionValue, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    if (reduce) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.9, ease: "easeOut" });
    return () => controls.stop();
  }, [value, reduce, motionValue]);

  return <motion.span className={className}>{spring}</motion.span>;
}
