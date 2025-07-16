"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInWrapperProps {
  children: ReactNode;
}

export const FadeInWrapper = ({ children }: FadeInWrapperProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: 0.1,
      }}
    >
      {children}
    </motion.div>
  );
};
