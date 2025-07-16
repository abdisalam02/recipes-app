"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  IconHeart,
  IconX,
  IconUser,
  IconSparkles,
  IconFlame,
  IconArrowUp,
} from "@tabler/icons-react";
import Image from "next/image";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { MinimalistLoader } from "../components/MinimalistLoader";

//
// SwipeableCard Component
//
interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
  tags?: string[];
}

interface SwipeableCardProps {
  recipe: Recipe;
  onSwipe: (direction: "left" | "right", recipe: Recipe) => void;
  triggerSwipe: "left" | "right" | null;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  recipe,
  onSwipe,
  triggerSwipe,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [swipeProgress, setSwipeProgress] = useState(0);

  useEffect(() => {
    if (triggerSwipe) {
      const xOffset = triggerSwipe === "right" ? 1500 : -1500;
      controls
        .start({
          x: xOffset,
          rotate: triggerSwipe === "right" ? 45 : -45,
          opacity: 0,
          transition: { duration: 0.5 },
        })
        .then(() => {
          onSwipe(triggerSwipe, recipe);
        });
    }
  }, [triggerSwipe, onSwipe, recipe]);

  const controls = useAnimation();
  const constraintsRef = useRef(null);

  return (
    <motion.div
      ref={constraintsRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <motion.div
        ref={cardRef}
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.9}
        whileDrag={{ scale: 1.02 }}
        onDragStart={() => setIsDragging(true)}
        onDrag={(event, info) => {
          const threshold = 50;
          const xOffset = info.offset.x;
          const direction = xOffset > 0 ? "right" : "left";
          const progress = Math.min(Math.abs(xOffset) / 150, 1);

          setSwipeDirection(Math.abs(xOffset) > threshold ? direction : null);
          setSwipeProgress(progress);
        }}
        onDragEnd={(event, info) => {
          setIsDragging(false);
          setSwipeDirection(null);
          setSwipeProgress(0);

          const threshold = 100;
          if (Math.abs(info.offset.x) > threshold) {
            const direction = info.offset.x > 0 ? "right" : "left";
            controls
              .start({
                x: direction === "right" ? 1500 : -1500,
                rotate: direction === "right" ? 45 : -45,
                opacity: 0,
                transition: { duration: 0.5, ease: "easeOut" },
              })
              .then(() => {
                onSwipe(direction, recipe);
              });
          } else {
            controls.start({
              x: 0,
              rotate: 0,
              opacity: 1,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            });
          }
        }}
        animate={controls}
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        className="glass-panel backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl overflow-hidden w-[90vw] max-w-md h-[60vh] pointer-events-auto relative transform-gpu"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          touchAction: "pan-y",
          background: "var(--bg-primary)",
        }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-10"
          style={{ opacity: 0.8 }}
        />
        <Image
          src={
            recipe.image || "https://via.placeholder.com/400x300?text=No+Image"
          }
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
          priority
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = "https://via.placeholder.com/400x300?text=Image+Error";
          }}
        />

        {/* Tinder-like swipe indicators */}
        {swipeDirection === "right" && (
          <div
            className="absolute top-8 right-8 z-30 transform rotate-12 border-4 border-green-500 rounded-lg px-4 py-2"
            style={{ opacity: swipeProgress }}
          >
            <span className="text-green-500 font-extrabold text-3xl">LIKE</span>
          </div>
        )}

        {swipeDirection === "left" && (
          <div
            className="absolute top-8 left-8 z-30 transform -rotate-12 border-4 border-red-500 rounded-lg px-4 py-2"
            style={{ opacity: swipeProgress }}
          >
            <span className="text-red-500 font-extrabold text-3xl">NOPE</span>
          </div>
        )}

        <motion.div
          className="absolute bottom-0 left-0 right-0 p-6 z-20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ color: "#ffffff" }}
        >
          <h2
            className="text-2xl font-bold mb-2 drop-shadow-lg"
            style={{ color: "#ffffff" }}
          >
            {recipe.title}
          </h2>
          <p
            className="text-sm opacity-90 line-clamp-2 drop-shadow-lg"
            style={{ color: "#ffffff" }}
          >
            {recipe.description}
          </p>
          <div className="flex gap-2 mt-3">
            {recipe.tags &&
              recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

//
// HeartsAnimation: Random, larger, cooler animated hearts that overlay the modal content.
// They appear diagonally and fade away without taking up extra space.
//
const HeartsAnimation: React.FC = () => {
  const hearts = Array.from({ length: 15 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((_, i) => {
        // Generate random values for varied animations.
        const left = Math.random() * 85 + 5; // random left between 5% and 90%
        const delay = Math.random() * 1.5; // random delay between 0 and 1.5 seconds
        const scale = Math.random() * 0.75 + 0.75; // random scale between 0.75 and 1.5
        const rotation = Math.random() < 0.5 ? 360 : -360;
        const yOffset = Math.random() * 100 + 50; // random vertical travel between 50 and 150px
        const duration = 1.5 + Math.random() * 1; // random duration between 1.5 and 2.5 seconds

        return (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [0, 1, 0],
              x: [0, Math.random() * 40 - 20],
              y: [-10, -yOffset],
              scale: [0, scale, scale * 0.8],
              rotate: rotation,
            }}
            transition={{
              duration: duration,
              delay: delay,
              ease: "easeOut",
              times: [0, 0.2, 1],
            }}
            style={{ left: `${left}%`, bottom: "10%" }}
          >
            <IconHeart
              size={28}
              className="text-pink-500 drop-shadow-xl"
              fill="#ec4899"
            />
          </motion.div>
        );
      })}
    </div>
  );
};

//
// RecipeTinderPage Component
//
export default function RecipeTinderPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [deck, setDeck] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerSwipe, setTriggerSwipe] = useState<"left" | "right" | null>(
    null
  );
  const [matchRecipe, setMatchRecipe] = useState<Recipe | null>(null);

  // Fetch recipes from API on mount.
  useEffect(() => {
    async function fetchRecipes() {
      try {
        setLoading(true);
        const res = await fetch("/api/recipes");
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data: Recipe[] = await res.json();

        // Ensure each recipe has a tags property
        const processedData = data.map((recipe) => ({
          ...recipe,
          tags: recipe.tags || [],
        }));

        setRecipes(processedData);
        setDeck(processedData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, []);

  // Handle swipe events – if swiped right, show match modal.
  const handleSwipe = (direction: "left" | "right", recipe: Recipe) => {
    if (direction === "right") {
      setMatchRecipe(recipe);
    }
    setDeck((prev) => {
      const newDeck = prev.filter((r) => r.id !== recipe.id);
      if (newDeck.length === 0) {
        // Reload deck when empty after a short delay.
        setTimeout(() => {
          setDeck(recipes);
        }, 500);
      }
      return newDeck;
    });
    setTriggerSwipe(null);
  };

  // For the top card, trigger programmatic swipe when a button is pressed.
  const handleSwipeButton = (direction: "left" | "right") => {
    setTriggerSwipe(direction);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="container mx-auto px-4 py-8 relative z-10 flex items-center justify-center min-h-screen">
          <MinimalistLoader message="Loading Recipe Matches" size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Enhanced glassmorphic header */}
      <div className="absolute top-0 left-0 right-0 h-16 glass-panel backdrop-blur-xl border-b border-white/20 shadow-2xl z-30 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-3"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <IconHeart size={28} className="text-rose-500" fill="#f43f5e" />
          </motion.div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
            Recipe Matcher
          </h1>
          <IconSparkles size={20} className="text-yellow-500" />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 pt-20 pb-8 flex flex-col h-[100vh] relative z-10">
        <div className="flex-grow flex flex-col items-center justify-center relative">
          {deck.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 glass-panel backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl max-w-md"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <IconHeart
                  size={40}
                  className="text-white"
                  fill="currentColor"
                />
              </motion.div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                No More Recipes
              </h2>
              <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                You've gone through all available recipes!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDeck(recipes)}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-rose-500/25 transition-all duration-300"
              >
                Start Over
              </motion.button>
            </motion.div>
          )}

          <div className="relative w-full flex-grow flex items-center justify-center">
            {deck.map((recipe, index) => {
              const isTop = index === deck.length - 1;
              return (
                <SwipeableCard
                  key={recipe.id}
                  recipe={recipe}
                  onSwipe={handleSwipe}
                  triggerSwipe={isTop ? triggerSwipe : null}
                />
              );
            })}
          </div>

          {deck.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-6 mb-4 mt-auto"
            >
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipeButton("left")}
                className="p-5 rounded-full glass-panel backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
                aria-label="Dislike"
              >
                <IconX
                  size={28}
                  className="text-red-500 group-hover:scale-110 transition-transform"
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipeButton("right")}
                className="p-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 shadow-lg hover:shadow-xl hover:shadow-rose-500/25 transition-all duration-300 group"
                aria-label="Like"
              >
                <IconHeart
                  size={28}
                  className="text-white group-hover:scale-110 transition-transform"
                  fill="currentColor"
                />
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {matchRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            onClick={() => setMatchRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30, rotateY: -15 }}
              animate={{ scale: 1, y: 0, rotateY: 0 }}
              exit={{ scale: 0.8, y: 30, rotateY: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="glass-panel backdrop-blur-xl border border-white/30 bg-gradient-to-b from-rose-500/90 to-pink-600/90 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{ perspective: "1000px" }}
            >
              <HeartsAnimation />

              <div className="text-center relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
                  className="font-extrabold text-4xl mb-4"
                  style={{ color: "#ffffff" }}
                >
                  IT'S A MATCH!
                </motion.div>

                <div className="flex justify-center items-center mb-6 relative">
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl z-10 -mr-4"
                  >
                    {/* User placeholder image */}
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <IconUser size={48} className="text-white" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl z-20 -ml-4"
                  >
                    {/* Recipe image */}
                    <Image
                      src={
                        matchRecipe.image ||
                        "https://via.placeholder.com/400x300?text=No+Image"
                      }
                      alt={matchRecipe.title}
                      fill
                      className="object-cover"
                      sizes="128px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://via.placeholder.com/400x300?text=Image+Error";
                      }}
                    />
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-lg mb-6"
                  style={{ color: "#ffffff" }}
                >
                  You and <span className="font-bold">{matchRecipe.title}</span>{" "}
                  have liked each other!
                </motion.p>

                <div className="flex flex-col gap-3 mt-6">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/recipes/${matchRecipe.id}`)}
                    className="glass-panel backdrop-blur-xl bg-white border border-white/30 text-pink-600 font-bold text-lg hover:bg-white/80 transition-all duration-300 rounded-full py-3 w-full"
                  >
                    View Recipe
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMatchRecipe(null)}
                    className="w-full py-3 rounded-full bg-transparent border-2 border-white font-bold text-lg hover:bg-white/10 transition-colors"
                    style={{ color: "#ffffff" }}
                  >
                    Keep Swiping
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Navigation */}
      <FloatingNavigation router={router} />

      {/* Back to Top Button */}
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 left-4 z-40 glass-panel backdrop-blur-xl border border-white/30 p-3 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 md:bottom-6"
          aria-label="Back to top"
        >
          <IconArrowUp size={20} style={{ color: "var(--text-primary)" }} />
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
