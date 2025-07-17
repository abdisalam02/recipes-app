"use client";

import { motion } from "framer-motion";

interface MinimalistLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const MinimalistLoader = ({
  message = "Loading...",
  size = "md",
}: MinimalistLoaderProps) => {
  const sizeClasses = {
    sm: "h-32",
    md: "h-48",
    lg: "h-64",
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white/95 border border-gray-200 rounded-2xl p-8 shadow-lg text-center max-w-md"
      >
        {/* Simple Circle Loading */}
        <div className="w-12 h-12 mx-auto mb-4 relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>

        {/* Fade-in Text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
};

// Simple Circle Loader for inline use - Optimized with CSS animations
export const CircleLoader = ({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) => {
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`${sizeMap[size]} relative`}>
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-b-2 border-orange-500`}
      ></div>
    </div>
  );
};

// Simple Loading Overlay
export const LoadingOverlay = ({
  message = "Loading...",
}: {
  message?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex justify-center items-center bg-black/20 backdrop-blur-sm z-50"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className="bg-white/95 border border-gray-200 p-6 rounded-2xl shadow-lg"
      >
        <div className="flex flex-col items-center gap-4">
          <CircleLoader size="md" />
          <span
            className="font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {message}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Specific loader for recipe cards while loading
export const RecipeCardLoader = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
      >
        <motion.div
          className="h-40 bg-gradient-to-r from-gray-200/50 to-gray-300/50"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
        />
        <div className="p-4 space-y-3">
          <motion.div
            className="h-4 bg-gradient-to-r from-gray-200/50 to-gray-300/50 rounded"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1 + 0.2,
            }}
          />
          <motion.div
            className="h-3 bg-gradient-to-r from-gray-200/50 to-gray-300/50 rounded w-3/4"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1 + 0.4,
            }}
          />
          <div className="flex justify-between">
            <motion.div
              className="h-3 bg-gradient-to-r from-gray-200/50 to-gray-300/50 rounded w-16"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1 + 0.6,
              }}
            />
            <motion.div
              className="h-3 bg-gradient-to-r from-gray-200/50 to-gray-300/50 rounded w-12"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1 + 0.8,
              }}
            />
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);
