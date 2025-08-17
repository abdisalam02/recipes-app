"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  IconHeart,
  IconHeartFilled,
  IconArrowUp,
  IconClock,
  IconChefHat,
  IconCalendarEvent,
  IconSearch,
  IconStar,
  IconSparkles,
  IconTrendingUp,
  IconUser,
  IconPlus,
  IconRobot,
} from "@tabler/icons-react";
import { Recipe, Favorite } from "../../lib/types";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "./components/FloatingNavigation";
import { useTheme } from "./contexts/ThemeContext";
import Link from "next/link";

// Memoized Toast Component
const Toast = memo(
  ({
    message,
    type,
    onClose,
  }: {
    message: string;
    type: "success" | "error";
    onClose: () => void;
  }) => {
    useEffect(() => {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div
        className="fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-lg max-w-sm"
        style={{
          backgroundColor: type === "success" ? "#10b981" : "#ef4444",
          color: "white",
        }}
      >
        <div className="flex items-center gap-2">
          <IconHeart size={16} />
          <span className="text-sm">{message}</span>
        </div>
      </div>
    );
  }
);
Toast.displayName = "Toast";

// Memoized Hero Section
const HeroSection = memo(
  ({ onExploreClick }: { onExploreClick: () => void }) => {
    const { theme, themes } = useTheme();
    const currentTheme = useMemo(
      () => themes.find((t) => t.name === theme) || themes[0],
      [theme, themes]
    );

    return (
      <section
        className="text-center py-12 px-4 relative"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.colors.background}, ${currentTheme.colors.surface})`,
        }}
      >
        {/* Hidden admin link near header */}
        <Link
          href="/admin"
          aria-label="Admin"
          title="?"
          className="absolute top-3 right-3 opacity-40 hover:opacity-90 text-xs rounded-full px-2 py-1"
          style={{
            backgroundColor: `${currentTheme.colors.surface}`,
            color: currentTheme.colors.textSecondary,
            border: `1px solid ${currentTheme.colors.primary}30`,
          }}
        >
          ?
        </Link>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${currentTheme.colors.primary}20`,
                color: currentTheme.colors.primary,
              }}
            >
              <IconChefHat size={16} />
              Recipe Collection
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ color: currentTheme.colors.text }}
          >
            Discover Amazing
            <span
              className="block"
              style={{ color: currentTheme.colors.primary }}
            >
              Recipes
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl mb-8 max-w-2xl mx-auto"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Find your next favorite dish from our curated collection of
            delicious recipes
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExploreClick}
            className="text-white font-semibold px-8 py-4 rounded-xl shadow-lg transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
            }}
          >
            Explore Recipes
          </motion.button>
        </div>
      </section>
    );
  }
);
HeroSection.displayName = "HeroSection";

// Memoized Recipe Card Component
const RecipeCard = memo(
  ({
    recipe,
    isFavorite,
    onToggleFavorite,
    onClick,
  }: {
    recipe: Recipe;
    isFavorite: boolean;
    onToggleFavorite: (e: React.MouseEvent) => void;
    onClick: () => void;
  }) => {
    const { theme, themes } = useTheme();
    const currentTheme = useMemo(
      () => themes.find((t) => t.name === theme) || themes[0],
      [theme, themes]
    );

    return (
      <div
        className="rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
        style={{ backgroundColor: currentTheme.colors.background }}
        onClick={onClick}
      >
        <div className="relative h-48">
          <Image
            src={recipe.image || "/default-image.png"}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
          <button
            onClick={onToggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full shadow-sm transition-colors"
            style={{
              backgroundColor: `${currentTheme.colors.background}e6`,
            }}
          >
            {isFavorite ? (
              <IconHeartFilled size={18} className="text-red-500" />
            ) : (
              <IconHeart
                size={18}
                style={{ color: currentTheme.colors.textSecondary }}
              />
            )}
          </button>
          <div className="absolute bottom-3 left-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: currentTheme.colors.primary }}
            >
              {recipe.category}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3
            className="text-lg font-bold mb-2 line-clamp-2"
            style={{ color: currentTheme.colors.text }}
          >
            {recipe.title}
          </h3>
          <p
            className="text-sm mb-3 line-clamp-2"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            {recipe.description}
          </p>
          <div
            className="flex items-center gap-4 text-sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            <div className="flex items-center gap-1">
              <IconClock size={14} />
              <span>30 min</span>
            </div>
            <div className="flex items-center gap-1">
              <IconUser size={14} />
              <span>{recipe.portion} servings</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
RecipeCard.displayName = "RecipeCard";

// Optimized Daily Recipe Carousel with reduced re-renders
const DailyRecipeCarousel = memo(
  ({
    recipes,
    favorites,
    onToggleFavorite,
    onRecipeClick,
  }: {
    recipes: Recipe[];
    favorites: Favorite[];
    onToggleFavorite: (recipeId: number) => void;
    onRecipeClick: (recipeId: number) => void;
  }) => {
    const { theme, themes } = useTheme();
    const currentTheme = useMemo(
      () => themes.find((t) => t.name === theme) || themes[0],
      [theme, themes]
    );
    const [currentIndex, setCurrentIndex] = useState(0);

    // Memoize the timer effect
    useEffect(() => {
      if (recipes.length <= 1) return;

      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % recipes.length);
      }, 5000);

      return () => clearInterval(timer);
    }, [recipes.length]);

    // Memoize current recipe
    const currentRecipe = useMemo(
      () => recipes[currentIndex],
      [recipes, currentIndex]
    );

    // Memoize favorite check
    const isFavorite = useMemo(
      () => favorites.some((fav) => fav.recipe_id === currentRecipe?.id),
      [favorites, currentRecipe?.id]
    );

    if (recipes.length === 0 || !currentRecipe) return null;

    return (
      <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
        <Image
          src={currentRecipe.image || "/default-image.png"}
          alt={currentRecipe.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(currentRecipe.id);
          }}
          className="absolute top-4 right-4 p-2 rounded-full shadow-sm"
          style={{
            backgroundColor: `${currentTheme.colors.background}e6`,
          }}
        >
          {isFavorite ? (
            <IconHeartFilled size={18} className="text-red-500" />
          ) : (
            <IconHeart
              size={18}
              style={{ color: currentTheme.colors.textSecondary }}
            />
          )}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-2xl font-bold mb-2">{currentRecipe.title}</h3>
          <p className="text-white/90 mb-4 line-clamp-2">
            {currentRecipe.description}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <IconClock size={14} />
              <span>30 min</span>
            </div>
            <div className="flex items-center gap-1">
              <IconUser size={14} />
              <span>{currentRecipe.portion} servings</span>
            </div>
          </div>
        </div>

        {recipes.length > 1 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
            {recipes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    index === currentIndex
                      ? "white"
                      : "rgba(255, 255, 255, 0.5)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
DailyRecipeCarousel.displayName = "DailyRecipeCarousel";

// Memoized Quick Actions Section
const QuickActions = memo(({ router }: { router: any }) => {
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(
    () => themes.find((t) => t.name === theme) || themes[0],
    [theme, themes]
  );

  return (
    <section
      className="py-12"
      style={{ backgroundColor: currentTheme.colors.surface }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <h2
          className="text-3xl font-bold text-center mb-8"
          style={{ color: currentTheme.colors.text }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push("/recipes/add")}
            className="text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow text-center"
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
            }}
          >
            <IconPlus size={32} className="mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">Add Recipe</h3>
            <p className="text-green-100 text-sm">Share your favorite recipe</p>
          </button>

          <button
            onClick={() => router.push("/AI")}
            className="text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow text-center"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
            }}
          >
            <IconSparkles size={32} className="mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">AI Generator</h3>
            <p className="opacity-90 text-sm">Create recipes with AI</p>
          </button>

          <button
            onClick={() => router.push("/daily-recipes")}
            className="text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow text-center"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.colors.accent}, #f59e0b)`,
            }}
          >
            <IconCalendarEvent size={32} className="mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">Daily Recipes</h3>
            <p className="opacity-90 text-sm">Fresh daily selections</p>
          </button>
        </div>
      </div>
    </section>
  );
});
QuickActions.displayName = "QuickActions";

// Memoized Search Section
const SearchSection = memo(
  ({
    searchTerm,
    onSearchChange,
  }: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
  }) => {
    const { theme, themes } = useTheme();
    const currentTheme = useMemo(
      () => themes.find((t) => t.name === theme) || themes[0],
      [theme, themes]
    );

    return (
      <section
        className="py-8 px-4"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-base rounded-xl border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderColor: `${currentTheme.colors.primary}30`,
                color: currentTheme.colors.text,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = currentTheme.colors.primary;
                e.target.style.boxShadow = `0 0 0 2px ${currentTheme.colors.primary}30`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${currentTheme.colors.primary}30`;
                e.target.style.boxShadow = "none";
              }}
            />
            <IconSearch
              size={20}
              className="absolute left-4 top-1/2 transform -translate-y-1/2"
              style={{ color: currentTheme.colors.textSecondary }}
            />
          </div>
        </div>
      </section>
    );
  }
);
SearchSection.displayName = "SearchSection";

// Main Component with optimized performance
export default function HomePage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [dailyRecipes, setDailyRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showAllRecipes, setShowAllRecipes] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  // Memoize theme
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(
    () => themes.find((t) => t.name === theme) || themes[0],
    [theme, themes]
  );

  // Optimized scroll handler with throttling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollButton(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Optimized data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesRes, dailyRes, favoritesRes] = await Promise.all([
          fetch(`/api/recipes?ts=${Date.now()}&nocache=1`),
          fetch("/api/daily-recipes"),
          fetch("/api/favorites"),
        ]);

        const [recipesData, dailyData, favoritesData] = await Promise.all([
          recipesRes.json(),
          dailyRes.json(),
          favoritesRes.json(),
        ]);

        setRecipes(recipesData || []);
        setDailyRecipes(dailyData || []);
        setFavorites(favoritesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setToast({ show: true, message: "Failed to load data", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh recipes when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh recipes when page becomes visible
        fetch(`/api/recipes?ts=${Date.now()}&nocache=1`)
          .then((res) => res.json())
          .then((data) => setRecipes(data || []))
          .catch((error) => console.error("Error refreshing recipes:", error));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Manual refresh function
  const refreshRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/recipes?ts=${Date.now()}&nocache=1`);
      const data = await res.json();
      setRecipes(data || []);
      setToast({ show: true, message: "Recipes refreshed!", type: "success" });
    } catch (error) {
      console.error("Error refreshing recipes:", error);
      setToast({
        show: true,
        message: "Failed to refresh recipes",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized filtered recipes
  const filteredRecipes = useMemo(() => {
    const filtered = searchTerm
      ? recipes.filter(
          (recipe) =>
            recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : recipes;

    return showAllRecipes ? filtered : filtered.slice(0, 6);
  }, [recipes, searchTerm, showAllRecipes]);

  // Memoized toggle favorite function
  const toggleFavorite = useCallback(
    async (recipeId: number) => {
      try {
        const isFavorited = favorites.some((fav) => fav.recipe_id === recipeId);

        if (isFavorited) {
          await fetch("/api/favorites", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipe_id: recipeId }),
          });
          setFavorites((prev) =>
            prev.filter((fav) => fav.recipe_id !== recipeId)
          );
          setToast({
            show: true,
            message: "Removed from favorites",
            type: "success",
          });
        } else {
          const res = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipe_id: recipeId }),
          });
          if (res.ok) {
            const newFavorite = await res.json();
            setFavorites((prev) => [...prev, newFavorite]);
            setToast({
              show: true,
              message: "Added to favorites",
              type: "success",
            });
          }
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        setToast({
          show: true,
          message: "Failed to update favorites",
          type: "error",
        });
      }
    },
    [favorites]
  );

  // Memoized scroll functions
  const scrollToRecipes = useCallback(() => {
    document.getElementById("recipes-section")?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Memoized toast handlers
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: currentTheme.colors.primary }}
          ></div>
          <p style={{ color: currentTheme.colors.textSecondary }}>
            Loading recipes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      {/* Hero Section */}
      <HeroSection onExploreClick={scrollToRecipes} />

      {/* Daily Recipes Section */}
      {dailyRecipes.length > 0 && (
        <section
          className="py-12 px-4"
          style={{ backgroundColor: currentTheme.colors.surface }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
                style={{
                  backgroundColor: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                }}
              >
                <IconCalendarEvent size={16} />
                Daily Fresh Collection
              </span>
              <h2
                className="text-3xl font-bold mb-4"
                style={{ color: currentTheme.colors.text }}
              >
                Today's Culinary Inspirations
              </h2>
              <p
                className="max-w-2xl mx-auto"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Fresh recipes updated daily to inspire your next cooking
                adventure
              </p>
            </div>

            <DailyRecipeCarousel
              recipes={dailyRecipes}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onRecipeClick={(id) => router.push(`/daily-recipes/${id}`)}
            />

            <div className="text-center mt-8">
              <button
                onClick={() => router.push("/daily-recipes")}
                className="text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                }}
              >
                <IconTrendingUp size={18} className="inline mr-2" />
                View All Daily Recipes
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Search Section */}
      <SearchSection searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Featured Recipes Section */}
      <section
        id="recipes-section"
        className="py-12"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${currentTheme.colors.primary}20`,
                color: currentTheme.colors.primary,
              }}
            >
              <IconStar size={16} />
              Featured Recipes
            </span>
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-3xl font-bold"
                style={{ color: currentTheme.colors.text }}
              >
                {searchTerm ? "Search Results" : "Popular Recipes"}
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshRecipes}
                disabled={loading}
                className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-2 rounded-full hover:bg-white/30 transition-all duration-300"
                title="Refresh recipes"
              >
                <IconArrowUp
                  size={16}
                  className={`text-gray-700 transition-transform ${
                    loading ? "animate-spin" : ""
                  }`}
                  style={{
                    transform: loading ? "rotate(0deg)" : "rotate(180deg)",
                  }}
                />
              </motion.button>
            </div>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              {searchTerm
                ? `Found ${filteredRecipes.length} recipes matching "${searchTerm}"`
                : "Discover our most loved recipes, carefully selected by our community"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavorite={favorites.some(
                  (fav) => fav.recipe_id === recipe.id
                )}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  toggleFavorite(recipe.id);
                }}
                onClick={() => router.push(`/recipes/${recipe.id}`)}
              />
            ))}
          </div>

          {filteredRecipes.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p
                className="mb-4"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                No recipes found matching "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="font-medium hover:opacity-80 transition-opacity"
                style={{ color: currentTheme.colors.primary }}
              >
                Clear search
              </button>
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => setShowAllRecipes(!showAllRecipes)}
              className="text-white font-semibold px-8 py-3 rounded-xl shadow-md transition-colors"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
              }}
            >
              {showAllRecipes ? "View Less" : "View More"}
            </button>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <QuickActions router={router} />

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-24 left-4 z-40 shadow-lg p-3 rounded-full hover:shadow-xl transition-shadow md:bottom-6"
            style={{
              backgroundColor: currentTheme.colors.background,
              border: `1px solid ${currentTheme.colors.primary}30`,
            }}
          >
            <IconArrowUp
              size={20}
              style={{ color: currentTheme.colors.text }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* Floating Navigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
