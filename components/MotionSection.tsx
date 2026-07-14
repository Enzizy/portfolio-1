"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type MotionSectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
};

export function MotionSection({ children, className, id, labelledBy }: MotionSectionProps) {
  return (
    <motion.section
      id={id}
      data-cat-perch={id}
      data-cat-zone={id}
      data-cat-zone-root={id}
      aria-labelledby={labelledBy}
      className={className}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}
