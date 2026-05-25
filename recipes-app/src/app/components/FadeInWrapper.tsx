"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInWrapperProps {
  children: ReactNode;
}

export const FadeInWrapper = ({ children }: FadeInWrapperProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      style={{ willChange: "opacity" }}
    >
      {children}
    </motion.div>
  );
};
