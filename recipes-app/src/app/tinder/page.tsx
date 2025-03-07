'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { IconHeart, IconX, IconUser } from '@tabler/icons-react';
import Image from 'next/image';

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
  onSwipe: (direction: 'left' | 'right', recipe: Recipe) => void;
  triggerSwipe: 'left' | 'right' | null;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ recipe, onSwipe, triggerSwipe }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);

  useEffect(() => {
    if (triggerSwipe) {
      const xOffset = triggerSwipe === 'right' ? 1500 : -1500;
      controls.start({
        x: xOffset,
        rotate: triggerSwipe === 'right' ? 45 : -45,
        opacity: 0,
        transition: { duration: 0.5 }
      }).then(() => {
        onSwipe(triggerSwipe, recipe);
      });
    }
  }, [triggerSwipe, onSwipe, recipe]);

  const controls = useAnimation();
  const constraintsRef = useRef(null);

  return (
    <motion.div
      ref={constraintsRef}
      className="absolute w-full h-full flex items-center justify-center pointer-events-none"
    >
      <motion.div
        ref={cardRef}
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.7}
        whileDrag={{ scale: 1.02 }}
        onDragStart={() => setIsDragging(true)}
        onDrag={(event, info) => {
          const threshold = 50;
          const xOffset = info.offset.x;
          const direction = xOffset > 0 ? 'right' : 'left';
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
            const direction = info.offset.x > 0 ? 'right' : 'left';
            controls.start({
              x: direction === 'right' ? 1500 : -1500,
              rotate: direction === 'right' ? 45 : -45,
              opacity: 0,
              transition: { duration: 0.5 }
            }).then(() => {
              onSwipe(direction, recipe);
            });
          } else {
            controls.start({
              x: 0,
              rotate: 0,
              opacity: 1,
              transition: { type: "spring", stiffness: 300, damping: 20 }
            });
          }
        }}
        animate={controls}
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden w-[90vw] max-w-md h-[70vh] pointer-events-auto relative transform-gpu"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-10" />
        <Image
          src={recipe.image || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
          priority
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
          }}
        />
        
        {/* Tinder-like swipe indicators */}
        {swipeDirection === 'right' && (
          <div 
            className="absolute top-8 right-8 z-30 transform rotate-12 border-4 border-green-500 rounded-lg px-4 py-2"
            style={{ opacity: swipeProgress }}
          >
            <span className="text-green-500 font-extrabold text-3xl">LIKE</span>
          </div>
        )}
        
        {swipeDirection === 'left' && (
          <div 
            className="absolute top-8 left-8 z-30 transform -rotate-12 border-4 border-red-500 rounded-lg px-4 py-2"
            style={{ opacity: swipeProgress }}
          >
            <span className="text-red-500 font-extrabold text-3xl">NOPE</span>
          </div>
        )}
        
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">{recipe.title}</h2>
          <p className="text-sm opacity-90 line-clamp-2 drop-shadow-lg">{recipe.description}</p>
          <div className="flex gap-2 mt-3">
            {recipe.tags && recipe.tags.map((tag) => (
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
        const delay = Math.random() * 1.5;   // random delay between 0 and 1.5 seconds
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
              rotate: rotation 
            }}
            transition={{ 
              duration: duration, 
              delay: delay, 
              ease: "easeOut",
              times: [0, 0.2, 1]
            }}
            style={{ left: `${left}%`, bottom: '10%' }}
          >
            <IconHeart size={28} className="text-pink-500 drop-shadow-xl" fill="#ec4899" />
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
        
        // Ensure each recipe has a tags property
        const processedData = data.map(recipe => ({
          ...recipe,
          tags: recipe.tags || []
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
      <div className="min-h-screen bg-gradient-to-br from-rose-100 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden relative">
      {/* Tinder-like header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 shadow-sm z-30 flex items-center justify-center">
        <div className="flex items-center">
          <IconHeart size={28} className="text-rose-500 mr-2" fill="#f43f5e" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
            Recipe Matcher
          </h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 pt-20 relative">
        <div className="flex flex-col items-center justify-center min-h-[80vh] relative">
          {deck.length === 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-8 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4">No More Recipes</h2>
              <p className="mb-6">You've gone through all available recipes!</p>
              <button 
                onClick={() => setDeck(recipes)}
                className="px-6 py-3 rounded-full bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors"
              >
                Start Over
              </button>
            </motion.div>
          )}
          
          <div className="relative w-full h-[70vh] flex items-center justify-center">
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
            <div className="flex gap-6 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipeButton('left')}
                className="p-5 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
                aria-label="Dislike"
              >
                <IconX size={32} className="text-red-500" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipeButton('right')}
                className="p-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 shadow-lg hover:shadow-xl transition-all"
                aria-label="Like"
              >
                <IconHeart size={32} className="text-white" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {matchRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMatchRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-rose-500 to-pink-600 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <HeartsAnimation />
              
              <div className="text-center relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
                  className="text-white font-extrabold text-4xl mb-4"
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
                      src={matchRecipe.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={matchRecipe.title}
                      fill
                      className="object-cover"
                      sizes="128px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
                      }}
                    />
                  </motion.div>
                </div>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-white text-lg mb-6"
                >
                  You and <span className="font-bold">{matchRecipe.title}</span> have liked each other!
                </motion.p>
                
                <div className="flex flex-col gap-3 mt-6">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/recipes/${matchRecipe.id}`)}
                    className="w-full py-3 rounded-full bg-white text-pink-600 font-bold text-lg hover:bg-gray-100 transition-colors"
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
                    className="w-full py-3 rounded-full bg-transparent border-2 border-white text-white font-bold text-lg hover:bg-white/10 transition-colors"
                  >
                    Keep Swiping
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
