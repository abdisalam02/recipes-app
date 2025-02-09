'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { IconHeart, IconX } from '@tabler/icons-react';

//
// SwipeableCard Component
//
interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
}

interface SwipeableCardProps {
  recipe: Recipe;
  onSwipe: (direction: 'left' | 'right', recipe: Recipe) => void;
  triggerSwipe: 'left' | 'right' | null;
  onSwipeButton?: (direction: 'left' | 'right') => void;
  style?: React.CSSProperties;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  recipe,
  onSwipe,
  triggerSwipe,
  onSwipeButton,
  style,
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [transition, setTransition] = useState('');
  const threshold = 100;

  // Compute a fun random "age" based on recipe id.
  const age = useMemo(() => 20 + (recipe.id % 31), [recipe.id]);

  // --- Touch Events ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    setTransition('');
    setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !startPos) return;
    const dx = e.touches[0].clientX - startPos.x;
    const dy = e.touches[0].clientY - startPos.y;
    setOffset({ x: dx, y: dy });
  };

  const handleTouchEnd = () => {
    setDragging(false);
    if (offset.x > threshold) {
      setTransition('transform 300ms ease-out');
      setOffset({ x: window.innerWidth, y: offset.y });
      setTimeout(() => onSwipe('right', recipe), 300);
    } else if (offset.x < -threshold) {
      setTransition('transform 300ms ease-out');
      setOffset({ x: -window.innerWidth, y: offset.y });
      setTimeout(() => onSwipe('left', recipe), 300);
    } else {
      setTransition('transform 300ms ease-out');
      setOffset({ x: 0, y: 0 });
    }
  };

  // --- Mouse Events (for desktop) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setTransition('');
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !startPos) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    setOffset({ x: dx, y: dy });
  };

  const handleMouseUp = () => {
    setDragging(false);
    if (offset.x > threshold) {
      setTransition('transform 300ms ease-out');
      setOffset({ x: window.innerWidth, y: offset.y });
      setTimeout(() => onSwipe('right', recipe), 300);
    } else if (offset.x < -threshold) {
      setTransition('transform 300ms ease-out');
      setOffset({ x: -window.innerWidth, y: offset.y });
      setTimeout(() => onSwipe('left', recipe), 300);
    } else {
      setTransition('transform 300ms ease-out');
      setOffset({ x: 0, y: 0 });
    }
  };

  // Programmatic swipe effect when triggerSwipe changes.
  React.useEffect(() => {
    if (triggerSwipe && !dragging) {
      setTransition('transform 300ms ease-out');
      if (triggerSwipe === 'right') {
        setOffset({ x: window.innerWidth, y: 0 });
        setTimeout(() => onSwipe('right', recipe), 300);
      } else if (triggerSwipe === 'left') {
        setOffset({ x: -window.innerWidth, y: 0 });
        setTimeout(() => onSwipe('left', recipe), 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSwipe]);

  return (
    <div
      className="tinder-card"
      style={{
        ...style,
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 20}deg)`,
        transition: transition,
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={dragging ? handleMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={dragging ? handleMouseUp : undefined}
    >
      <div className="card bg-base-100 shadow-2xl w-full h-full relative overflow-hidden">
        <figure>
          <img
            src={recipe.image || 'https://via.placeholder.com/300'}
            alt={recipe.title}
            className="object-cover w-full h-32 sm:h-40"
          />
        </figure>
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-lg">{recipe.title}</h2>
            <span className="badge badge-secondary">Age {age}</span>
          </div>
          <p className="text-sm text-gray-200 line-clamp-2">{recipe.description}</p>
        </div>
        {/* Animated Overlay Icons on Drag */}
        {offset.x > 0 && (
          <motion.div
            className="absolute top-4 right-4"
            style={{ opacity: Math.min(offset.x / threshold, 1) }}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
          >
            <IconHeart size={40} className="text-green-300 drop-shadow-lg" />
          </motion.div>
        )}
        {offset.x < 0 && (
          <motion.div
            className="absolute top-4 left-4"
            style={{ opacity: Math.min(-offset.x / threshold, 1) }}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
          >
            <IconX size={40} className="text-red-300 drop-shadow-lg" />
          </motion.div>
        )}
        {/* Overlay Text for Quick Feedback */}
        {offset.x > threshold * 0.7 && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-5xl font-extrabold text-green-400 drop-shadow-2xl">
              YUP
            </span>
          </motion.div>
        )}
        {offset.x < -threshold * 0.7 && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-5xl font-extrabold text-red-400 drop-shadow-2xl">
              NOPE
            </span>
          </motion.div>
        )}
        {/* In-Card Swipe Buttons */}
        <div className="absolute bottom-4 left-4 animate-pulse">
          <button
            onClick={() => onSwipeButton && onSwipeButton('left')}
            className="btn btn-circle btn-error"
          >
            <IconX size={24} className="text-white" />
          </button>
        </div>
        <div className="absolute bottom-4 right-4 animate-pulse">
          <button
            onClick={() => onSwipeButton && onSwipeButton('right')}
            className="btn btn-circle btn-success"
          >
            <IconHeart size={24} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

//
// HeartsAnimation: Random, larger, cooler animated hearts that overlay the modal content.
// They appear diagonally and fade away without taking up extra space.
//
const HeartsAnimation: React.FC = () => {
  const hearts = Array.from({ length: 7 });
  return (
    <div className="absolute inset-0 pointer-events-none">
      {hearts.map((_, i) => {
        // Generate random values for varied animations.
        const left = Math.random() * 85 + 5; // random left between 5% and 90%
        const delay = Math.random() * 0.5;   // random delay between 0 and 0.5 seconds
        const scale = Math.random() * 0.75 + 1; // random scale between 1 and 1.75
        const rotation = Math.random() < 0.5 ? 360 : -360;
        const yOffset = Math.random() * 50 + 50; // random vertical travel between 50 and 100px
        return (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: 0, x: 50, y: -yOffset, scale: scale, rotate: rotation }}
            transition={{ duration: 1.5, delay: delay }}
            style={{ left: `${left}%` }}
          >
            <IconHeart size={28} className="text-pink-400 drop-shadow-2xl" />
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
  const [triggerSwipe, setTriggerSwipe] = useState<'left' | 'right' | null>(null);
  const [matchRecipe, setMatchRecipe] = useState<Recipe | null>(null);

  // Fetch recipes from API on mount.
  useEffect(() => {
    async function fetchRecipes() {
      try {
        setLoading(true);
        const res = await fetch('/api/recipes');
        if (!res.ok) throw new Error('Failed to fetch recipes');
        const data: Recipe[] = await res.json();
        setRecipes(data);
        setDeck(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, []);

  // Handle swipe events – if swiped right, show match modal.
  const handleSwipe = (direction: 'left' | 'right', recipe: Recipe) => {
    if (direction === 'right') {
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
  const handleSwipeButton = (direction: 'left' | 'right') => {
    setTriggerSwipe(direction);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-3xl text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="tinder-page min-h-screen bg-animated-gradient flex flex-col items-center p-4">
      <h1 className="tinder-heading text-5xl font-bold mb-8 text-white drop-shadow-2xl">
        Recipe Tinder
      </h1>

      {/* Card Stack Container */}
      <div className="tinder-deck relative w-full max-w-sm h-96 mb-8">
        <AnimatePresence>
          {deck.map((recipe, index) => (
            <SwipeableCard
              key={recipe.id}
              recipe={recipe}
              onSwipe={handleSwipe}
              triggerSwipe={index === deck.length - 1 ? triggerSwipe : null}
              onSwipeButton={index === deck.length - 1 ? handleSwipeButton : undefined}
              style={{ position: 'absolute', width: '100%', height: '100%', zIndex: index }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Match Modal with Enhanced Styling and More Animations */}
      {matchRecipe && (
        <div className="tinder-modal modal modal-open">
          <motion.div
            className="modal-box max-w-xs bg-gradient-to-br from-green-100 to-cyan-100 relative border-4 shadow-2xl"
            initial={{ opacity: 0, y: 50, scale: 0.8, borderColor: "#ff4b2b" }}
            animate={{ opacity: 1, y: 0, scale: 1, borderColor: "#50fa7b" }}
            exit={{ opacity: 0, y: 50, scale: 0.8, borderColor: "#ff4b2b" }}
            transition={{
              default: { duration: 0.6, type: 'spring', stiffness: 260, damping: 20 },
              borderColor: {
                type: "tween",
                duration: 2,
                ease: "linear",
                repeat: Infinity,
                repeatType: "mirror",
              },
            }}
          >
            <div className="relative flex flex-col items-center">
              <div className="relative w-40 h-40 mb-4">
                <img
                  src={matchRecipe.image || 'https://via.placeholder.com/150'}
                  alt={matchRecipe.title}
                  className="w-full h-full rounded-lg object-cover"
                />
                {/* Optional Heart Overlay on Image */}
                <div className="absolute inset-0 flex justify-center items-center">
                  <IconHeart size={32} className="text-red-400 opacity-40" />
                </div>
              </div>
              {/* Absolute overlay hearts */}
              <HeartsAnimation />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1.2 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="mb-4"
              >
                <IconHeart size={64} className="text-red-500 drop-shadow-2xl" />
              </motion.div>
              <h3 className="font-bold text-xl mb-2 text-gray-800">It's a Match!</h3>
              <p className="text-base mb-4 text-center text-gray-800">
                You liked <strong>{matchRecipe.title}</strong>.
              </p>
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 2 }}
                  whileTap={{ scale: 0.9 }}
                  className="btn btn-primary hover:animate-pulse"
                  onClick={() => router.push(`/recipes/${matchRecipe.id}`)}
                >
                  View Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="btn btn-outline hover:animate-pulse"
                  onClick={() => setMatchRecipe(null)}
                >
                  Keep Swiping
                </motion.button>
              </div>
            </div>
          </motion.div>
          <div className="modal-backdrop bg-black opacity-50"></div>
        </div>
      )}
    </div>
  );
}
