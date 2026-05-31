"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useAnimation, PanInfo } from "framer-motion";
import { IconHeart, IconX, IconFlame, IconRefresh } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { useTheme } from "../contexts/ThemeContext";

interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
  category?: string;
  portion?: number;
  tags?: string[];
}

// Lightweight swipeable card optimised for mobile
const SwipeableCard: React.FC<{
  recipe: Recipe;
  onSwipe: (direction: "left" | "right", recipe: Recipe) => void;
  triggerSwipe: "left" | "right" | null;
  isTop: boolean;
}> = ({ recipe, onSwipe, triggerSwipe, isTop }) => {
  const controls = useAnimation();
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (triggerSwipe && isTop) {
      const x = triggerSwipe === "right" ? 1200 : -1200;
      controls.start({ x, rotate: triggerSwipe === "right" ? 30 : -30, opacity: 0, transition: { duration: 0.35, ease: "easeOut" } })
        .then(() => onSwipe(triggerSwipe, recipe));
    }
  }, [triggerSwipe, isTop]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setSwipeDir(null);
    setProgress(0);
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      const dir = info.offset.x > 0 ? "right" : "left";
      controls.start({ x: dir === "right" ? 1200 : -1200, rotate: dir === "right" ? 30 : -30, opacity: 0, transition: { duration: 0.3, ease: "easeOut" } })
        .then(() => onSwipe(dir, recipe));
    } else {
      controls.start({ x: 0, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 30 } });
    }
  }, [controls, onSwipe, recipe]);

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDrag={(_, info) => {
        const dir = info.offset.x > 50 ? "right" : info.offset.x < -50 ? "left" : null;
        setSwipeDir(dir);
        setProgress(Math.min(Math.abs(info.offset.x) / 150, 1));
      }}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="absolute inset-0 flex items-center justify-center"
      style={{ touchAction: "pan-y", willChange: "transform" }}
    >
      <div className="neo-card relative w-[88vw] max-w-sm h-[62vh] md:h-[55vh] overflow-hidden cursor-grab active:cursor-grabbing select-none hover:translate-x-0 hover:translate-y-0 hover:shadow-neo">
        {/* Image */}
        <Image
          src={recipe.image || "/default-image.png"}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="88vw"
          priority={isTop}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* LIKE / NOPE indicators */}
        {swipeDir === "right" && (
          <div className="absolute top-8 left-8 z-20 rotate-[-15deg]" style={{ opacity: progress }}>
            <div className="border-4 border-success bg-base-100 shadow-neo-sm rounded-xl px-4 py-2">
              <span className="text-success font-black text-3xl tracking-widest uppercase">LIKE</span>
            </div>
          </div>
        )}
        {swipeDir === "left" && (
          <div className="absolute top-8 right-8 z-20 rotate-[15deg]" style={{ opacity: progress }}>
            <div className="border-4 border-error bg-base-100 shadow-neo-sm rounded-xl px-4 py-2">
              <span className="text-error font-black text-3xl tracking-widest uppercase">NOPE</span>
            </div>
          </div>
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10 bg-gradient-to-t from-black/80 to-transparent">
          {recipe.category && (
            <span className="inline-block px-3 py-1 border-2 border-white bg-black/50 text-white rounded-lg shadow-neo-white font-black text-xs uppercase tracking-widest mb-3">{recipe.category}</span>
          )}
          <h2 className="text-3xl font-black leading-tight drop-shadow-lg mb-2">{recipe.title}</h2>
          <p className="text-sm font-bold text-white/90 line-clamp-2 drop-shadow">{recipe.description}</p>
          {recipe.portion && (
            <p className="text-xs font-bold text-white/80 mt-2 bg-black/40 inline-block px-2 py-1 rounded-md border border-white/30">{recipe.portion} servings</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Hearts animation for match
const HeartsAnimation: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-2xl"
        initial={{ opacity: 0, y: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], y: -(80 + Math.random() * 80), x: (Math.random() - 0.5) * 60, scale: [0, 1, 0.8] }}
        transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 1.2, ease: "easeOut" }}
        style={{ left: `${10 + Math.random() * 80}%`, bottom: "15%" }}
      >
        ❤️
      </motion.div>
    ))}
  </div>
);

export default function RecipeTinderPage() {
  const router = useRouter();
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(() => themes.find((t) => t.name === theme) || themes[0], [theme, themes]);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [deck, setDeck] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerSwipe, setTriggerSwipe] = useState<"left" | "right" | null>(null);
  const [matchRecipe, setMatchRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data: Recipe[]) => {
        setRecipes(data);
        setDeck(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSwipe = useCallback((direction: "left" | "right", recipe: Recipe) => {
    if (direction === "right") setMatchRecipe(recipe);
    setDeck((prev) => {
      const next = prev.filter((r) => r.id !== recipe.id);
      if (next.length === 0) setTimeout(() => setDeck(recipes), 600);
      return next;
    });
    setTriggerSwipe(null);
  }, [recipes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">🍽️</div>
          <p className="text-base-content/50 font-medium">Loading recipes...</p>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 px-4 py-5 border-b-3 border-base-content bg-base-100 shadow-neo-sm">
        <div className="w-10 h-10 border-3 border-base-content bg-accent shadow-neo-sm rounded-xl flex items-center justify-center">
          <IconFlame size={24} className="text-base-content" stroke={2.5} />
        </div>
        <h1 className="text-2xl font-black text-base-content tracking-wider uppercase">Recipe Matcher</h1>
        <span className="text-2xl">✨</span>
      </div>

      {/* Cards area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 pb-32 md:pb-10">
        {deck.length === 0 ? (
          <div className="text-center space-y-5">
            <div className="text-7xl">🎉</div>
            <h2 className="text-3xl font-black text-base-content uppercase">All caught up!</h2>
            <p className="text-base-content font-bold text-lg border-2 border-base-content bg-base-200 p-4 rounded-xl shadow-neo-sm">You've swiped through all the recipes.</p>
            <button
              onClick={() => setDeck(recipes)}
              className="neo-button flex items-center justify-center gap-2 mx-auto px-8 py-4 bg-primary text-base-content text-lg uppercase tracking-wider"
            >
              <IconRefresh size={22} stroke={2.5} />
              Start Over
            </button>
          </div>
        ) : (
          <>
            {/* Deck counter */}
            <div className="text-xs text-base-content/40 font-medium mb-4">{deck.length} recipe{deck.length !== 1 ? "s" : ""} left</div>

            {/* Stack visual */}
            <div className="relative w-[88vw] max-w-sm h-[62vh] md:h-[55vh] mb-8">
              {/* Background card ghost */}
              {deck.length > 1 && (
                <div className="absolute inset-0 rounded-2xl border-3 border-base-content bg-base-200 shadow-neo scale-[0.96] translate-y-3 -z-10" />
              )}
              {deck.map((recipe, index) => {
                const isTop = index === deck.length - 1;
                return isTop ? (
                  <SwipeableCard
                    key={recipe.id}
                    recipe={recipe}
                    onSwipe={handleSwipe}
                    triggerSwipe={triggerSwipe}
                    isTop={isTop}
                  />
                ) : null;
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => setTriggerSwipe("left")}
                className="w-16 h-16 rounded-full neo-button flex items-center justify-center text-base-content bg-error hover:bg-red-400"
                aria-label="Dislike"
              >
                <IconX size={32} strokeWidth={3} />
              </button>

              <button
                onClick={() => setTriggerSwipe("right")}
                className="w-20 h-20 rounded-full neo-button flex items-center justify-center text-base-content bg-success hover:bg-emerald-400"
                aria-label="Like"
              >
                <IconHeart size={36} fill="currentColor" stroke={2} />
              </button>
            </div>

            <p className="text-sm font-bold text-base-content/60 mt-6 border-2 border-base-content/20 px-4 py-2 rounded-lg border-dashed">SWIPE RIGHT TO LIKE · LEFT TO SKIP</p>
          </>
        )}
      </div>

      {/* Match Modal */}
      <AnimatePresence>
        {matchRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setMatchRecipe(null)}
          >
            <motion.div
              initial={{ y: "100%", scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: "100%", scale: 0.9 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative neo-card p-8 w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <HeartsAnimation />

              {/* Image */}
              <div className="relative w-32 h-32 rounded-2xl border-3 border-base-content shadow-neo-sm overflow-hidden mx-auto mb-6">
                <Image src={matchRecipe.image || "/default-image.png"} alt={matchRecipe.title} fill className="object-cover" sizes="128px" />
              </div>

              <div className="text-center relative z-10">
                <div className="text-4xl font-black bg-accent border-3 border-base-content shadow-neo-sm inline-block px-4 py-2 rounded-xl text-base-content mb-3 -rotate-2">
                  IT'S A MATCH! 🎉
                </div>
                <p className="text-base-content font-bold text-lg mb-1">You liked</p>
                <h3 className="text-2xl font-black text-base-content mb-8">{matchRecipe.title}</h3>

                <div className="flex flex-col gap-4">
                  <Link
                    href={`/recipes/${matchRecipe.id}`}
                    className="w-full neo-button py-4 bg-primary text-base-content text-center uppercase tracking-wider text-lg block"
                  >
                    View Recipe →
                  </Link>
                  <button
                    onClick={() => setMatchRecipe(null)}
                    className="w-full neo-button py-4 bg-base-200 text-base-content uppercase tracking-wider text-lg"
                  >
                    Keep Swiping
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
