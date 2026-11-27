import type { Transition, Variants } from "framer-motion";

export const spring: Transition = { type: "spring", stiffness: 260, damping: 24 };
export const softSpring: Transition = { type: "spring", stiffness: 180, damping: 22 };

export function getEntranceVariants(reduce: boolean) {
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: spring },
  };
  const fade: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: reduce ? 0 : 0.3 } },
  };
  return { container, item, fade };
}

export const tapPhysics = { scale: 0.94 };
