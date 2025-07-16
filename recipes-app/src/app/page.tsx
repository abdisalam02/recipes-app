"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, ChangeEvent, useRef, useCallback } from "react";
import {
  IconHeart,
  IconHeartFilled,
  IconArrowUp,
  IconCheck,
  IconX,
  IconClock,
  IconChefHat,
  IconShare,
  IconChevronLeft,
  IconChevronRight,
  IconRobot,
  IconCalendarEvent,
  IconSearch,
  IconFilter,
  IconStar,
  IconSparkles,
  IconTrendingUp,
  IconBookmark,
  IconUser,
  IconHome,
  IconPlus,
  IconMenu2,
} from "@tabler/icons-react";
import { Recipe, Favorite } from "../../lib/types";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { FloatingNavigation } from "./components/FloatingNavigation";
import {
  MinimalistLoader,
  RecipeCardLoader,
} from "./components/MinimalistLoader";

// Scroll animation hook for mobile optimizations
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "0px 0px -20px 0px", // More aggressive trigger - show content sooner
  });

  useEffect(() => {
    if (isInView) {
      setIsVisible(true);
    }
  }, [isInView]);

  return { ref, isVisible };
}

// Enhanced animated component wrapper for mobile scroll effects
const AnimatedSection = ({
  children,
  delay = 0,
  className = "",
  animationType = "slideUp",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  animationType?: "slideUp" | "slideLeft" | "slideRight" | "fadeIn" | "scale";
}) => {
  const { ref, isVisible } = useScrollAnimation();

  const getAnimationVariants = () => {
    switch (animationType) {
      case "slideLeft":
        return {
          hidden: { opacity: 0, x: -30 },
          visible: { opacity: 1, x: 0 },
        };
      case "slideRight":
        return {
          hidden: { opacity: 0, x: 30 },
          visible: { opacity: 1, x: 0 },
        };
      case "fadeIn":
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
      case "scale":
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1 },
        };
      default: // slideUp
        return {
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 },
        };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={getAnimationVariants()}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Enhanced Toast with Glassmorphism
const Toast = ({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-24 left-4 right-4 z-50 md:bottom-6 md:right-6 md:left-auto md:w-96"
    >
      <div
        className={`glass-panel backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 ${
          type === "success"
            ? "bg-emerald-500/20 border-emerald-400/30"
            : "bg-red-500/20 border-red-400/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              type === "success" ? "bg-emerald-500/30" : "bg-red-500/30"
            }`}
          >
            {type === "success" ? (
              <IconCheck size={18} className="text-emerald-100" />
            ) : (
              <IconX size={18} className="text-red-100" />
            )}
          </div>
          <span className="font-medium text-white flex-1">{message}</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <IconX size={16} className="text-white/70" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Removed duplicate FloatingActionButton and BottomNavigation - now using FloatingNavigation

// Enhanced Recipe Carousel with Glassmorphism and Mobile Optimization
const RecipeCarousel = ({
  recipes,
  favorites,
  onToggleFavorite,
  showToast,
  isDailyRecipes = false,
}: {
  recipes: Recipe[];
  favorites: Favorite[];
  onToggleFavorite: (e: React.MouseEvent, id: number) => void;
  showToast: (message: string, type: "success" | "error") => void;
  isDailyRecipes?: boolean;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  const getImageUrl = (image?: string): string => {
    return image && image.trim() !== "" ? image : "/default-image.png";
  };

  useEffect(() => {
    if (recipes.length <= 1 || isHovering) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % recipes.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [recipes.length, isHovering]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((currentIndex - 1 + recipes.length) % recipes.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((currentIndex + 1) % recipes.length);
  };

  if (recipes.length === 0) {
    return (
      <div className="h-[300px] md:h-[400px] flex items-center justify-center">
        No recipes available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative h-[300px] md:h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={() => {
              const recipe = recipes[currentIndex];
              if (isDailyRecipes) {
                router.push(`/daily-recipes/${recipe.id}`);
              } else {
                router.push(`/recipes/${recipe.id}`);
              }
            }}
          >
            <Image
              src={getImageUrl(recipes[currentIndex].image)}
              alt={recipes[currentIndex].title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Enhanced favorite button - Mobile optimized */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute top-3 right-3 md:top-4 md:right-4 z-20"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => onToggleFavorite(e, recipes[currentIndex].id)}
                className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-2 md:p-3 shadow-2xl hover:bg-white/30 transition-all duration-300"
                aria-label="Toggle favorite"
              >
                {favorites.some(
                  (fav) => fav.recipe_id === recipes[currentIndex].id
                ) ? (
                  <IconHeartFilled
                    size={16}
                    className="text-red-400 md:w-5 md:h-5"
                  />
                ) : (
                  <IconHeart
                    size={16}
                    className="text-white group-hover:text-red-400 transition-colors md:w-5 md:h-5"
                  />
                )}
              </motion.button>
            </motion.div>

            {/* Enhanced category badge - Mobile optimized */}
            <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
              <span className="px-3 py-1 md:px-4 md:py-2 bg-gradient-to-r from-emerald-500/80 to-blue-500/80 backdrop-blur-sm rounded-full text-white text-xs md:text-sm font-bold uppercase tracking-wide shadow-lg">
                {recipes[currentIndex].category?.charAt(0).toUpperCase() +
                  recipes[currentIndex].category?.slice(1) || "Recipe"}
              </span>
            </div>

            {/* Enhanced content overlay - Mobile optimized */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-4 line-clamp-2"
              >
                {recipes[currentIndex].title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm md:text-lg text-white/90 mb-3 md:mb-6 line-clamp-2"
              >
                {recipes[currentIndex].description}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3 md:gap-6 text-white/80"
              >
                <div className="flex items-center gap-1 md:gap-2">
                  <IconClock size={14} className="md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-medium">
                    {recipes[currentIndex].steps?.length
                      ? recipes[currentIndex].steps.length * 5
                      : 30}{" "}
                    min
                  </span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <IconChefHat size={14} className="md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-medium">
                    {recipes[currentIndex].region || "International"}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows - Mobile optimized */}
        {recipes.length > 1 && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovering ? 1 : 0.7 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePrev}
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-2 md:p-3 shadow-2xl hover:bg-white/30 transition-all duration-300 z-20"
            >
              <IconChevronLeft size={16} className="text-white md:w-5 md:h-5" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovering ? 1 : 0.7 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNext}
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-2 md:p-3 shadow-2xl hover:bg-white/30 transition-all duration-300 z-20"
            >
              <IconChevronRight
                size={16}
                className="text-white md:w-5 md:h-5"
              />
            </motion.button>
          </>
        )}

        {/* Enhanced indicators - Mobile optimized */}
        {recipes.length > 1 && (
          <div className="absolute bottom-16 md:bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {recipes.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white shadow-lg"
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Tab Switcher with Glassmorphism
function TabSwitcher({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: "recipes" | "ai-recipes";
  setSelectedTab: (tab: "recipes" | "ai-recipes") => void;
}) {
  const handleTabClick = (
    e: React.MouseEvent,
    tab: "recipes" | "ai-recipes"
  ) => {
    e.preventDefault();
    setSelectedTab(tab);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center mb-8"
    >
      <div className="glass-panel backdrop-blur-xl bg-white/10 border border-white/20 p-1.5 rounded-2xl shadow-2xl">
        <div className="flex relative">
          <motion.div
            className="absolute inset-y-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl shadow-lg"
            initial={false}
            animate={{
              x: selectedTab === "recipes" ? 0 : "100%",
              width: selectedTab === "recipes" ? "50%" : "50%",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          <button
            className={`relative z-10 px-6 py-3 rounded-xl transition-all text-sm font-medium ${
              selectedTab === "recipes"
                ? "text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={(e) => handleTabClick(e, "recipes")}
          >
            <div className="flex items-center gap-2">
              <IconChefHat size={16} />
              <span>Recipes</span>
            </div>
          </button>

          <button
            className={`relative z-10 px-6 py-3 rounded-xl transition-all text-sm font-medium ${
              selectedTab === "ai-recipes"
                ? "text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={(e) => handleTabClick(e, "ai-recipes")}
          >
            <div className="flex items-center gap-2">
              <IconRobot size={16} />
              <span>AI Recipes</span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Window scroll hook
function useWindowScroll() {
  const [scroll, setScroll] = useState({ y: 0 });
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScroll({ y: window.scrollY });
      setShowScrollButton(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { scroll, showScrollButton, scrollToTop };
}

// Main Component
export default function FindRecipesPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"recipes" | "ai-recipes">(
    "recipes"
  );
  const [allIngredients, setAllIngredients] = useState<
    { id: number; name: string }[]
  >([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { scroll, showScrollButton, scrollToTop } = useWindowScroll();
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
  const [loadingDailyRecipes, setLoadingDailyRecipes] = useState(true);
  const [dailyRecipes, setDailyRecipes] = useState<Recipe[]>([]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ingredientsRes, recipesRes, favoritesRes] = await Promise.all([
          fetch("/api/ingredients"),
          fetch(selectedTab === "recipes" ? "/api/recipes" : "/api/ai-recipes"),
          fetch("/api/favorites"),
        ]);

        const [ingredientsData, recipesData, favoritesData] = await Promise.all(
          [ingredientsRes.json(), recipesRes.json(), favoritesRes.json()]
        );

        setAllIngredients(ingredientsData || []);
        setRecipes(recipesData || []);
        setFilteredRecipes(recipesData || []);
        setFavorites(favoritesData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
        showToast("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchDailyRecipes();
  }, [selectedTab]);

  const fetchDailyRecipes = async () => {
    try {
      setLoadingDailyRecipes(true);
      const res = await fetch("/api/daily-recipes");
      const data = await res.json();
      setDailyRecipes(data || []);
    } catch (error) {
      console.error("Error fetching daily recipes:", error);
    } finally {
      setLoadingDailyRecipes(false);
    }
  };

  // Filter recipes
  useEffect(() => {
    let filtered = recipes;
    if (debouncedSearchTerm) {
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(
        (recipe) => recipe.category === selectedCategory
      );
    }
    if (selectedRegion) {
      filtered = filtered.filter((recipe) => recipe.region === selectedRegion);
    }
    setFilteredRecipes(filtered);
  }, [recipes, debouncedSearchTerm, selectedCategory, selectedRegion]);

  const categories = Array.from(
    new Set(recipes.map((recipe) => recipe.category).filter(Boolean))
  );
  const regions = Array.from(
    new Set(recipes.map((recipe) => recipe.region).filter(Boolean))
  );

  const toggleFavorite = async (
    e: React.MouseEvent,
    recipe_id: number,
    showToastMsg: boolean = true
  ) => {
    e.stopPropagation();

    try {
      const isFavorited = favorites.some((fav) => fav.recipe_id === recipe_id);

      if (isFavorited) {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id }),
        });

        setFavorites(favorites.filter((fav) => fav.recipe_id !== recipe_id));
        if (showToastMsg) showToast("Removed from favorites", "success");
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id }),
        });

        if (res.ok) {
          const newFavorite = await res.json();
          setFavorites([...favorites, newFavorite]);
          if (showToastMsg) showToast("Added to favorites", "success");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast("Failed to update favorites", "error");
    }
  };

  const getImageUrl = (image: string): string => {
    return image && image.trim() !== "" ? image : "/default-image.png";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <MinimalistLoader message="Loading delicious recipes..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 rounded-full opacity-20 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>

      <div className="container mx-auto px-4 py-8 relative z-10 pb-24 md:pb-8">
        {/* Back to top button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="fixed bottom-24 left-4 z-40 glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-3 rounded-full shadow-2xl hover:bg-white/30 transition-all duration-300 md:bottom-6"
              aria-label="Back to top"
            >
              <IconArrowUp size={20} className="text-gray-700" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Toast notification */}
        <AnimatePresence>
          {toast.show && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={hideToast}
            />
          )}
        </AnimatePresence>

        {/* Daily Recipes Section */}
        {!loadingDailyRecipes && dailyRecipes.length > 0 && (
          <AnimatedSection animationType="fadeIn" delay={0.2} className="mb-16">
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 backdrop-blur-xl border border-orange-200 rounded-full text-orange-600 font-semibold mb-4"
              >
                <IconCalendarEvent size={16} />
                <span>Daily Fresh Collection</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
              >
                Today's Culinary Inspirations
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 max-w-2xl mx-auto mb-6"
              >
                Fresh recipes updated daily to inspire your next cooking
                adventure. Discover new flavors and techniques!
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/daily-recipes")}
                className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 text-gray-700 font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-white/30 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <IconTrendingUp size={18} />
                <span>Explore All Daily Recipes</span>
              </motion.button>
            </div>

            <RecipeCarousel
              recipes={dailyRecipes}
              favorites={favorites}
              onToggleFavorite={(e, id) => toggleFavorite(e, id, true)}
              showToast={showToast}
              isDailyRecipes={true}
            />
          </AnimatedSection>
        )}

        {/* Tab Switcher */}
        <TabSwitcher
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />

        {/* AI Recipes CTA */}
        {selectedTab === "ai-recipes" && (
          <AnimatedSection
            animationType="fadeIn"
            delay={0.3}
            className="flex justify-center mb-12"
          >
            <div className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-8 text-center max-w-xl shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <IconRobot size={32} className="text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                AI-Powered Recipes
              </h3>
              <p className="text-gray-600 mb-6">
                Unlock innovative recipes created with artificial intelligence.
                Let our AI chef inspire your next meal!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center gap-2 mx-auto"
                onClick={() => router.push("/AI")}
              >
                <IconSparkles size={20} />
                <span>Generate New Recipe with AI</span>
              </motion.button>
            </div>
          </AnimatedSection>
        )}

        {/* Enhanced Search Section */}
        <AnimatedSection animationType="fadeIn" delay={0.4} className="mb-8">
          <div className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium mb-2 block text-gray-700">
                  Search Recipes
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-panel backdrop-blur-xl bg-white/30 border border-white/40 w-full pl-12 pr-4 py-4 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 transition-all duration-300 placeholder-gray-500"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <IconSearch size={20} />
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <IconX size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="md:hidden w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDrawerOpen(true)}
                  className="glass-panel backdrop-blur-xl bg-white/30 border border-white/40 w-full py-4 rounded-xl font-medium text-gray-700 hover:bg-white/40 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <IconFilter size={18} />
                  <span>Filters</span>
                </motion.button>
              </div>

              <div className="hidden md:flex gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="glass-panel backdrop-blur-xl bg-white/30 border border-white/40 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all duration-300"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option
                        key={category || "unknown"}
                        value={category || ""}
                      >
                        {typeof category === "string" && category
                          ? category.charAt(0).toUpperCase() + category.slice(1)
                          : "Other"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700">
                    Region
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="glass-panel backdrop-blur-xl bg-white/30 border border-white/40 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all duration-300"
                  >
                    <option value="">All Regions</option>
                    {regions.map((region) => (
                      <option key={region || "unknown"} value={region || ""}>
                        {typeof region === "string" && region
                          ? region.charAt(0).toUpperCase() + region.slice(1)
                          : "Other"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Enhanced Recipes Grid */}
        {filteredRecipes.length === 0 ? (
          <AnimatedSection
            animationType="fadeIn"
            delay={0.5}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-12 rounded-3xl text-center max-w-md shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl mb-6"
              >
                🍽️
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                No recipes found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filters
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  setSelectedRegion("");
                }}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300"
              >
                Clear Filters
              </motion.button>
            </div>
          </AnimatedSection>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {filteredRecipes.map((recipe, index) => (
              <AnimatedSection
                key={recipe.id}
                animationType="scale"
                delay={index * 0.1}
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() =>
                    router.push(
                      selectedTab === "ai-recipes"
                        ? `/ai-recipes/${recipe.id}`
                        : `/recipes/${recipe.id}`
                    )
                  }
                  className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-xl md:rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group"
                >
                  <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden">
                    <Image
                      src={getImageUrl(recipe.image)}
                      alt={recipe.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Mobile-optimized favorite button */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="absolute top-3 right-3"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => toggleFavorite(e, recipe.id)}
                        className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-2 md:p-2.5 shadow-lg hover:bg-white/40 transition-all duration-300"
                      >
                        {favorites.some(
                          (fav) => fav.recipe_id === recipe.id
                        ) ? (
                          <IconHeartFilled
                            size={16}
                            className="text-red-400 md:w-5 md:h-5"
                          />
                        ) : (
                          <IconHeart
                            size={16}
                            className="text-white md:w-5 md:h-5"
                          />
                        )}
                      </motion.button>
                    </motion.div>

                    {/* Mobile-optimized category badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="glass-panel backdrop-blur-xl bg-gradient-to-r from-emerald-500/90 to-blue-500/90 border border-white/30 rounded-full text-white text-xs md:text-sm font-bold uppercase tracking-wide shadow-lg">
                        {recipe.category && typeof recipe.category === "string"
                          ? recipe.category.charAt(0).toUpperCase() +
                            recipe.category.slice(1)
                          : "Recipe"}
                      </span>
                    </div>

                    {/* Mobile-optimized quick actions */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.share) {
                            navigator
                              .share({
                                title: recipe.title,
                                text: `Check out this recipe: ${recipe.title}`,
                                url:
                                  window.location.origin +
                                  `/recipes/${recipe.id}`,
                              })
                              .catch((err) =>
                                console.log("Error sharing", err)
                              );
                          } else {
                            navigator.clipboard
                              .writeText(
                                window.location.origin + `/recipes/${recipe.id}`
                              )
                              .then(() =>
                                showToast(
                                  "Link copied to clipboard!",
                                  "success"
                                )
                              )
                              .catch((err) =>
                                console.error("Failed to copy link:", err)
                              );
                          }
                        }}
                        className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-2 shadow-lg hover:bg-white/40 transition-all duration-300"
                      >
                        <IconShare
                          size={14}
                          className="text-white md:w-4 md:h-4"
                        />
                      </motion.button>
                    </div>
                  </div>

                  {/* Mobile-optimized content area */}
                  <div className="p-4 md:p-5">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300 leading-tight">
                      {recipe.title}
                    </h2>
                    <p className="text-gray-600 text-sm md:text-base line-clamp-2 mb-4 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Mobile-optimized info row */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500 gap-3 md:gap-4">
                        <div className="flex items-center gap-1">
                          <IconClock size={14} className="md:w-4 md:h-4" />
                          <span className="font-medium">
                            {recipe.steps?.length
                              ? recipe.steps.length * 5
                              : 30}
                            m
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconUser size={14} className="md:w-4 md:h-4" />
                          <span className="font-medium">
                            {recipe.portion || 2}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconStar
                          size={14}
                          className="text-yellow-500 md:w-4 md:h-4"
                        />
                        <span className="text-sm text-gray-500 font-medium">
                          4.8
                        </span>
                      </div>
                    </div>

                    {/* Mobile-optimized action buttons */}
                    <div className="mt-4 flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            selectedTab === "ai-recipes"
                              ? `/ai-recipes/${recipe.id}`
                              : `/recipes/${recipe.id}`
                          );
                        }}
                        className="glass-panel backdrop-blur-xl bg-gradient-to-r from-emerald-500 to-blue-500 border border-white/30 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center gap-2 flex-1"
                      >
                        <IconChefHat size={14} />
                        <span>View Recipe</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => toggleFavorite(e, recipe.id)}
                        className="glass-panel backdrop-blur-xl bg-white/30 border border-white/40 text-gray-700 font-semibold p-2 rounded-lg hover:bg-white/40 transition-all duration-300"
                      >
                        {favorites.some(
                          (fav) => fav.recipe_id === recipe.id
                        ) ? (
                          <IconBookmark size={14} className="text-orange-500" />
                        ) : (
                          <IconBookmark size={14} />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        )}

        {/* Enhanced Mobile Filter Drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 glass-panel backdrop-blur-xl bg-white/90 border-t border-white/30 rounded-t-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Filter Recipes
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDrawerOpen(false)}
                    className="glass-panel backdrop-blur-xl bg-white/30 border border-white/40 rounded-full p-2 hover:bg-white/40 transition-colors"
                  >
                    <IconX size={18} />
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <label className="text-base font-medium block text-gray-800">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCategory("")}
                        className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                          selectedCategory === ""
                            ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
                            : "glass-panel backdrop-blur-xl bg-white/30 border border-white/40 text-gray-700 hover:bg-white/40"
                        }`}
                      >
                        All
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category || "unknown"}
                          onClick={() => setSelectedCategory(category || "")}
                          className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                            selectedCategory === category
                              ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
                              : "glass-panel backdrop-blur-xl bg-white/30 border border-white/40 text-gray-700 hover:bg-white/40"
                          }`}
                        >
                          {typeof category === "string" && category
                            ? category.charAt(0).toUpperCase() +
                              category.slice(1)
                            : "Other"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-base font-medium block text-gray-800">
                      Region
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedRegion("")}
                        className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                          selectedRegion === ""
                            ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
                            : "glass-panel backdrop-blur-xl bg-white/30 border border-white/40 text-gray-700 hover:bg-white/40"
                        }`}
                      >
                        All
                      </button>
                      {regions.map((region) => (
                        <button
                          key={region || "unknown"}
                          onClick={() => setSelectedRegion(region || "")}
                          className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                            selectedRegion === region
                              ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
                              : "glass-panel backdrop-blur-xl bg-white/30 border border-white/40 text-gray-700 hover:bg-white/40"
                          }`}
                        >
                          {typeof region === "string" && region
                            ? region.charAt(0).toUpperCase() + region.slice(1)
                            : "Other"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-panel backdrop-blur-xl bg-white/30 border border-white/40 text-gray-700 font-medium px-6 py-3 rounded-xl hover:bg-white/40 transition-all duration-300 flex-1"
                    onClick={() => {
                      setSelectedCategory("");
                      setSelectedRegion("");
                    }}
                  >
                    Reset Filters
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 flex-1"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Apply Filters
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Floating Navigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
