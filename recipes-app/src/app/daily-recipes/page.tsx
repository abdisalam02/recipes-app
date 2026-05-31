"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  IconChefHat,
  IconClock,
  IconHeart,
  IconHeartFilled,
  IconShare,
  IconArrowUp,
  IconSparkles,
  IconCalendarEvent,
  IconStar,
  IconCheck,
  IconX,
  IconUser,
  IconAward,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { Favorite } from "../../../lib/types";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { MinimalistLoader } from "../components/MinimalistLoader";
import { useTheme } from "../contexts/ThemeContext";

// Define the Recipe type based on the API response structure
interface DailyRecipeItem {
  id: number;
  title: string;
  description: string;
  image: string;
  source: string;
  sourceUrl?: string;
  readyInMinutes?: number;
  servings?: number;
  portion?: number;
  category: string;
  instructions?: string;
  ingredients?: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
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

// Enhanced Toast notification component with glassmorphism
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
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
        className={`neo-card p-4 border-4 ${
          type === "success"
            ? "bg-success"
            : "bg-error"
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

// Removed BottomNavigation - now using FloatingNavigation

// Removed FloatingActionButton - now using FloatingNavigation

export default function DailyRecipesPage() {
  const [dailyRecipes, setDailyRecipes] = useState<DailyRecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const router = useRouter();
  const { scroll, showScrollButton, scrollToTop } = useWindowScroll();
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(
    () => themes.find((t) => t.name === theme) || themes[0],
    [theme, themes]
  );

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Function to show toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  // Function to hide toast
  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  // Helper for image URL fallback
  const getImageUrl = (image: string): string => {
    return image && image.trim() !== "" ? image : "/default-image.png";
  };

  // Fetch daily recipes and favorites on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch daily recipes and favorites in parallel
        const [recipesRes, favoritesRes] = await Promise.all([
          fetch("/api/daily-recipes"),
          fetch("/api/favorites"),
        ]);

        if (!recipesRes.ok) {
          throw new Error(
            `Failed to fetch daily recipes: ${recipesRes.status}`
          );
        }
        if (!favoritesRes.ok) {
          throw new Error(`Failed to fetch favorites: ${favoritesRes.status}`);
        }

        const [recipesData, favoritesData] = await Promise.all([
          recipesRes.json(),
          favoritesRes.json(),
        ]);

        setDailyRecipes(recipesData || []);
        setFavorites(favoritesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        showToast("Failed to load recipes", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle favorite state
  const toggleFavorite = async (e: React.MouseEvent, recipe_id: number) => {
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
        showToast("Removed from favorites", "success");
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id }),
        });

        if (res.ok) {
          const newFavorite = await res.json();
          setFavorites([...favorites, newFavorite]);
          showToast("Added to favorites", "success");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast("Failed to update favorites", "error");
    }
  };

  // Share recipe
  const shareRecipe = (e: React.MouseEvent, recipe: DailyRecipeItem) => {
    e.stopPropagation();

    if (navigator.share) {
      navigator
        .share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url: window.location.origin + `/daily-recipes/${recipe.id}`,
        })
        .catch((err) => console.error("Error sharing", err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard
        .writeText(window.location.origin + `/daily-recipes/${recipe.id}`)
        .then(() => showToast("Link copied to clipboard!", "success"))
        .catch((err) => console.error("Failed to copy link:", err));
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen relative overflow-hidden"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <div className="container mx-auto px-4 py-8 relative z-10">
          <MinimalistLoader message="Loading daily recipes..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      {/* Enhanced Background decorative elements */}
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{
          backgroundColor: currentTheme.colors.primary,
          opacity: 0.1,
        }}
      ></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.colors.secondary}, ${currentTheme.colors.primary})`,
          opacity: 0.1,
          animationDelay: "2s",
        }}
      ></div>

      <div className="container mx-auto px-4 py-8 relative z-10 pb-24 md:pb-8">
        {/* Enhanced Back to top button */}
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

        {/* Enhanced Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative py-16 px-6 mb-16 rounded-4xl overflow-hidden"
        >
          <div className="neo-card p-8 bg-base-200 border-4">
            <div className="max-w-5xl mx-auto text-center relative z-10">
              {/* Enhanced featured badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="neo-badge inline-flex items-center gap-2 px-6 py-3 bg-primary text-base-content mb-6"
              >
                <IconCalendarEvent size={20} />
                <span className="font-semibold">Daily Fresh Collection</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent display-font">
                  Today's Culinary
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent display-font">
                  Inspirations
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              >
                Fresh recipes updated daily to inspire your next{" "}
                <span className="font-semibold text-emerald-600">
                  cooking adventure
                </span>
                . Discover new flavors and techniques!
              </motion.p>

              {/* Enhanced Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto"
              >
                <div className="neo-card p-6 text-center bg-base-100">
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                    {dailyRecipes.length}
                  </div>
                  <div className="text-sm text-gray-600 uppercase tracking-wide">
                    Fresh Recipes
                  </div>
                </div>
                <div className="neo-card p-6 text-center bg-base-100">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Daily
                  </div>
                  <div className="text-sm text-gray-600 uppercase tracking-wide">
                    Updated
                  </div>
                </div>
                <div className="neo-card p-6 text-center bg-base-100">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Chef's
                  </div>
                  <div className="text-sm text-gray-600 uppercase tracking-wide">
                    Selection
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <div
              className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </motion.div>

        {/* Enhanced Grid display of recipes */}
        {dailyRecipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="neo-card p-12 text-center max-w-md bg-base-100 border-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <IconChefHat size={48} className="text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                No recipes available
              </h3>
              <p className="text-gray-600 mb-6">
                Check back later for new daily recipes!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/")}
                className="neo-button px-6 py-3 bg-primary text-base-content text-sm font-black uppercase tracking-wider"
              >
                Explore All Recipes
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Enhanced Section Header */}
            <div className="mb-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="neo-badge inline-flex items-center gap-2 px-4 py-2 bg-secondary text-base-content mb-4"
              >
                <IconStar size={16} />
                <span>Curated Selection</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
              >
                Fresh Recipe Discoveries
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 max-w-2xl mx-auto"
              >
                Each recipe is carefully selected and updated daily to bring you
                the most exciting culinary experiences
              </motion.p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 96 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="h-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mx-auto mt-6 shadow-lg"
              ></motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {dailyRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => router.push(`/daily-recipes/${recipe.id}`)}
                  className="neo-card group relative overflow-hidden bg-base-100 border-4 transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  <figure className="relative h-56 overflow-hidden">
                    <Image
                      src={getImageUrl(recipe.image)}
                      alt={recipe.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />

                    {/* Enhanced gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Enhanced favorite button */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="absolute top-4 right-4"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => toggleFavorite(e, recipe.id)}
                        className="p-2 rounded-xl border-3 border-base-content bg-base-100 shadow-neo-sm hover:bg-error hover:text-base-content transition-all duration-300"
                        aria-label={
                          favorites.some((fav) => fav.recipe_id === recipe.id)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        {favorites.some(
                          (fav) => fav.recipe_id === recipe.id
                        ) ? (
                          <IconHeartFilled size={18} className="text-red-400" />
                        ) : (
                          <IconHeart
                            size={18}
                            className="text-white group-hover:text-red-400 transition-colors"
                          />
                        )}
                      </motion.button>
                    </motion.div>

                    {/* Enhanced category badge */}
                    <div className="absolute bottom-4 left-4">
                      <span className="neo-badge bg-secondary text-base-content px-3 py-1 text-xs uppercase tracking-wider">
                        {recipe.category.charAt(0).toUpperCase() +
                          recipe.category.slice(1)}
                      </span>
                    </div>

                    {/* Enhanced source badge */}
                    <div className="absolute top-4 left-4">
                      <span className="neo-badge bg-primary text-base-content px-3 py-1 text-xs uppercase tracking-wider flex items-center gap-1">
                        <IconAward size={12} />
                        {recipe.source === "api" ? "Featured" : "Curated"}
                      </span>
                    </div>
                  </figure>

                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300">
                      {recipe.title}
                    </h2>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {recipe.description}
                    </p>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center text-xs text-gray-500 gap-4">
                        <div className="flex items-center gap-1">
                          <IconClock size={14} />
                          <span>{recipe.readyInMinutes || 30} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconUser size={14} />
                          <span>
                            {recipe.servings || recipe.portion || 2} servings
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-xl border-2 border-base-content bg-base-200 shadow-neo-sm hover:bg-primary transition-colors"
                        onClick={(e) => shareRecipe(e, recipe)}
                        aria-label="Share recipe"
                      >
                        <IconShare size={14} className="text-emerald-600" />
                      </motion.button>
                    </div>

                    {/* Enhanced Ingredients preview */}
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div className="neo-card p-3 bg-base-200">
                        <div className="flex items-center gap-2 mb-2">
                          <IconSparkles
                            size={14}
                            className="text-emerald-600"
                          />
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Key Ingredients
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients
                            .slice(0, 3)
                            .map((ingredient, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-medium"
                              >
                                {ingredient.name}
                              </span>
                            ))}
                          {recipe.ingredients.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              +{recipe.ingredients.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 flex flex-wrap gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="neo-button px-6 py-3 bg-primary text-base-content text-sm font-black uppercase tracking-wider flex items-center gap-2"
          >
            <IconChefHat size={18} stroke={2.5} />
            <span>All Recipes</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/AI")}
            className="px-6 py-3 rounded-xl bg-base-200 border-3 border-transparent text-base-content font-black uppercase tracking-wider hover:bg-base-300 transition-colors text-sm flex items-center gap-2"
          >
            <IconSparkles size={18} stroke={2.5} />
            <span>AI Generator</span>
          </motion.button>
        </motion.div>
      </div>

      {/* New Floating Navigation */}

    </div>
  );
}
