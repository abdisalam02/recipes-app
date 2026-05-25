"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
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
} from "@tabler/icons-react";
import { Recipe, Favorite } from "../../lib/types";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "./components/FloatingNavigation";

// Simplified, performance-optimized components
const SimpleToast = ({
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
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-lg text-white ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {message}
    </div>
  );
};

// Simplified Hero Section
const HeroSection = ({ onExploreClick }: { onExploreClick: () => void }) => (
  <section className="text-center py-16 px-4">
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
          <IconChefHat size={16} />
          Recipe Collection
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
      >
        Discover Amazing
        <span className="text-orange-500 block">Recipes</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
      >
        Find your next favorite dish from our curated collection of delicious
        recipes
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onExploreClick}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg transition-all duration-200"
      >
        Explore Recipes
      </motion.button>
    </div>
  </section>
);

// Simplified Featured Recipe Card
const FeaturedRecipeCard = ({
  recipe,
  isFavorite,
  onToggleFavorite,
  onClick,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onClick: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
    onClick={onClick}
  >
    <div className="relative h-64">
      <Image
        src={recipe.image || "/default-image.png"}
        alt={recipe.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <button
        onClick={onToggleFavorite}
        className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
      >
        {isFavorite ? (
          <IconHeartFilled size={20} className="text-red-500" />
        ) : (
          <IconHeart size={20} className="text-gray-600" />
        )}
      </button>
      <div className="absolute bottom-4 left-4">
        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          {recipe.category}
        </span>
      </div>
    </div>

    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
        {recipe.title}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {recipe.description}
      </p>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <IconClock size={16} />
          <span>30 min</span>
        </div>
        <div className="flex items-center gap-1">
          <IconUser size={16} />
          <span>{recipe.portion} servings</span>
        </div>
      </div>
    </div>
  </motion.div>
);

// Simplified Recipe Grid
const RecipeGrid = ({
  recipes,
  favorites,
  onToggleFavorite,
  onRecipeClick,
}: {
  recipes: Recipe[];
  favorites: Favorite[];
  onToggleFavorite: (recipeId: number) => void;
  onRecipeClick: (recipeId: number) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {recipes.slice(0, 6).map((recipe, index) => (
      <FeaturedRecipeCard
        key={recipe.id}
        recipe={recipe}
        isFavorite={favorites.some((fav) => fav.recipe_id === recipe.id)}
        onToggleFavorite={(e) => {
          e.stopPropagation();
          onToggleFavorite(recipe.id);
        }}
        onClick={() => onRecipeClick(recipe.id)}
      />
    ))}
  </div>
);

// Quick Actions Section
const QuickActions = ({ router }: { router: any }) => (
  <section className="py-16">
    <div className="max-w-6xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/recipes/add")}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-8 rounded-2xl shadow-lg text-center"
        >
          <IconPlus size={32} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Add Recipe</h3>
          <p className="text-green-100">Share your favorite recipe</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/AI")}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 rounded-2xl shadow-lg text-center"
        >
          <IconSparkles size={32} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">AI Generator</h3>
          <p className="text-purple-100">Create recipes with AI</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/daily-recipes")}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 rounded-2xl shadow-lg text-center"
        >
          <IconCalendarEvent size={32} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Daily Recipes</h3>
          <p className="text-orange-100">Fresh daily selections</p>
        </motion.button>
      </div>
    </div>
  </section>
);

// Main Component
export default function HomePage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesRes, favoritesRes] = await Promise.all([
          fetch("/api/recipes"),
          fetch("/api/favorites"),
        ]);

        const [recipesData, favoritesData] = await Promise.all([
          recipesRes.json(),
          favoritesRes.json(),
        ]);

        setRecipes(recipesData || []);
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

  // Toggle favorite
  const toggleFavorite = async (recipeId: number) => {
    try {
      const isFavorited = favorites.some((fav) => fav.recipe_id === recipeId);

      if (isFavorited) {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: recipeId }),
        });
        setFavorites(favorites.filter((fav) => fav.recipe_id !== recipeId));
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
          setFavorites([...favorites, newFavorite]);
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
  };

  const scrollToRecipes = () => {
    document.getElementById("recipes-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection onExploreClick={scrollToRecipes} />

      {/* Featured Recipes Section */}
      <section id="recipes-section" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4">
              <IconStar size={16} />
              Featured Recipes
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Recipes
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our most loved recipes, carefully selected by our
              community
            </p>
          </div>

          <RecipeGrid
            recipes={recipes}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onRecipeClick={(id) => router.push(`/recipes/${id}`)}
          />

          <div className="text-center mt-12">
            <button
              onClick={() => router.push("/find-recipes")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-colors"
            >
              View All Recipes
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
            className="fixed bottom-24 left-4 z-40 bg-white shadow-lg p-3 rounded-full hover:shadow-xl transition-shadow md:bottom-6"
          >
            <IconArrowUp size={20} className="text-gray-700" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast.show && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Floating Navigation */}

    </div>
  );
}
