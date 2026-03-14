"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  IconHeart,
  IconHeartFilled,
  IconArrowUp,
  IconClock,
  IconChefHat,
  IconSearch,
  IconStar,
  IconUser,
  IconLayoutGrid,
  IconList,
  IconAdjustmentsHorizontal,
} from "@tabler/icons-react";
import { Recipe, Favorite } from "../../lib/types";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "./components/FloatingNavigation";
import { useTheme } from "./contexts/ThemeContext";
import Link from "next/link";

const CATEGORIES = ["All", "Breakfast", "Lunch", "Dinner", "Dessert", "Snacks", "Vegetarian", "Healthy"];
const INITIAL_COUNT = 12;

// Toast Component
const Toast = memo(({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-28 md:bottom-8 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl max-w-xs flex items-center gap-2.5 text-white text-sm font-medium ${type === "success" ? "bg-success" : "bg-error"}`}
    >
      {type === "success" ? <IconHeart size={16} /> : <span>⚠️</span>}
      <span>{message}</span>
    </motion.div>
  );
});
Toast.displayName = "Toast";

// Recipe Card Component
const RecipeCard = memo(({
  recipe,
  isFavorite,
  onToggleFavorite,
  viewMode = "grid",
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onClick: () => void;
  viewMode?: "grid" | "list";
}) => {
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(() => themes.find((t) => t.name === theme) || themes[0], [theme, themes]);

  if (viewMode === "list") {
    return (
      <div className="flex flex-row h-36 rounded-2xl overflow-hidden bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="relative w-36 shrink-0">
          <Image src={recipe.image || "/default-image.png"} alt={recipe.title} fill className="object-cover" sizes="144px" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
          <button
            onClick={onToggleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-base-100/90 backdrop-blur-sm shadow-sm"
          >
            {isFavorite ? <IconHeartFilled size={14} className="text-red-500" /> : <IconHeart size={14} className="text-base-content/50" />}
          </button>
        </div>
        <div className="flex flex-col justify-between p-4 flex-1 overflow-hidden">
          <div>
            {recipe.category && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white mb-1.5" style={{ backgroundColor: currentTheme.colors.primary }}>
                {recipe.category}
              </span>
            )}
            <h3 className="text-base font-bold text-base-content line-clamp-1">{recipe.title}</h3>
            <p className="text-xs text-base-content/60 line-clamp-2 mt-0.5 leading-relaxed">{recipe.description}</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-base-content/50 font-medium">
            <span className="flex items-center gap-1"><IconClock size={12} />30 min</span>
            <span className="flex items-center gap-1"><IconUser size={12} />{recipe.portion} servings</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-3xl overflow-hidden bg-base-100 border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
      <div className="relative aspect-[4/3] w-full">
        <Image src={recipe.image || "/default-image.png"} alt={recipe.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button
          onClick={onToggleFavorite}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-base-100/90 backdrop-blur-sm shadow-sm transition-transform hover:scale-110"
        >
          {isFavorite ? <IconHeartFilled size={13} className="text-red-500" /> : <IconHeart size={13} className="text-base-content/50" />}
        </button>
        {recipe.category && (
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: currentTheme.colors.primary }}>
              {recipe.category}
            </span>
          </div>
        )}
      </div>
      <div className="px-3 py-3 md:px-4 md:py-4 flex flex-col gap-1.5">
        <h3 className="text-sm md:text-base font-bold text-base-content line-clamp-1 leading-snug">{recipe.title}</h3>
        <p className="text-xs text-base-content/60 line-clamp-2 leading-relaxed">{recipe.description}</p>
        <div className="flex items-center gap-2 text-[10px] text-base-content/50 font-medium pt-0.5">
          <span className="flex items-center gap-1 bg-base-200 px-1.5 py-0.5 rounded-md"><IconClock size={10} />30 min</span>
          <span className="flex items-center gap-1 bg-base-200 px-1.5 py-0.5 rounded-md"><IconUser size={10} />{recipe.portion} serv.</span>
        </div>
      </div>
    </div>
  );
});
RecipeCard.displayName = "RecipeCard";

// Main Homepage
export default function HomePage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const { theme, themes } = useTheme();
  const currentTheme = useMemo(() => themes.find((t) => t.name === theme) || themes[0], [theme, themes]);

  // Scroll handler
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollButton(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesRes, favoritesRes] = await Promise.all([
          fetch(`/api/recipes?ts=${Date.now()}&nocache=1`),
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

  // Filtered recipes
  const allFiltered = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch = !searchTerm || recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) || recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || recipe.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchTerm, selectedCategory]);

  const filteredRecipes = useMemo(() => allFiltered.slice(0, visibleCount), [allFiltered, visibleCount]);
  const hasMore = allFiltered.length > visibleCount;

  // Toggle favorite
  const toggleFavorite = useCallback(async (recipeId: number) => {
    try {
      const isFavorited = favorites.some((fav) => fav.recipe_id === recipeId);
      if (isFavorited) {
        await fetch("/api/favorites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipe_id: recipeId }) });
        setFavorites((prev) => prev.filter((fav) => fav.recipe_id !== recipeId));
        setToast({ show: true, message: "Removed from favorites", type: "success" });
      } else {
        const res = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipe_id: recipeId }) });
        if (res.ok) {
          const newFavorite = await res.json();
          setFavorites((prev) => [...prev, newFavorite]);
          setToast({ show: true, message: "Added to favorites! ❤️", type: "success" });
        }
      }
    } catch (error) {
      setToast({ show: true, message: "Failed to update favorites", type: "error" });
    }
  }, [favorites]);

  const scrollToRecipes = useCallback(() => {
    document.getElementById("recipes-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const hideToast = useCallback(() => setToast((prev) => ({ ...prev, show: false })), []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="w-full h-64 bg-base-200 rounded-3xl animate-pulse mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-base-100 border border-base-200 animate-pulse">
                <div className="h-40 bg-base-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-base-200 rounded-lg w-3/4" />
                  <div className="h-3 bg-base-200 rounded-lg w-full" />
                  <div className="h-3 bg-base-200 rounded-lg w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-base-100 via-base-200 to-base-100 py-16 px-4">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: currentTheme.colors.primary }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: currentTheme.colors.secondary }} />

        {/* Hidden admin link */}
        <Link
          href="/admin"
          aria-label="Admin"
          title="?"
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold opacity-20 hover:opacity-60 transition-opacity bg-base-300 text-base-content"
        >
          ?
        </Link>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary mb-6">
              <IconChefHat size={16} />
              Recipe Collection
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-base-content mb-4 leading-tight"
          >
            Discover Amazing
            <span className="block text-primary">Recipes</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-base md:text-xl text-base-content/60 mb-8 max-w-xl mx-auto"
          >
            Find your next favourite dish from our curated collection of delicious recipes.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={scrollToRecipes}
            className="px-8 py-4 rounded-2xl text-white font-semibold shadow-lg shadow-primary/25 transition-all text-base"
            style={{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}
          >
            Explore Recipes ↓
          </motion.button>
        </div>
      </section>

      {/* Search + Filter Section */}
      <section id="recipes-section" className="sticky top-16 z-30 bg-base-100/95 backdrop-blur-xl border-b border-base-200 px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <IconSearch size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(INITIAL_COUNT); }}
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-base-300 bg-base-200 text-base-content focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-base-100 transition-all text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex bg-base-200 p-1 rounded-xl border border-base-300 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-base-100 text-primary shadow-sm" : "text-base-content/40 hover:text-base-content"}`}
                title="2-column grid"
              >
                <IconLayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "list" ? "bg-base-100 text-primary shadow-sm" : "text-base-content/40 hover:text-base-content"}`}
                title="Single column list"
              >
                <IconList size={18} />
              </button>
            </div>
          </div>

          {/* Category filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setVisibleCount(INITIAL_COUNT); }}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-base-200 text-base-content/60 hover:bg-base-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recipes Grid/List */}
      <section className="max-w-6xl mx-auto px-4 py-8 pb-32 md:pb-16">
        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-base-content">
              {searchTerm ? "Search Results" : selectedCategory === "All" ? "All Recipes" : selectedCategory}
            </h2>
            <p className="text-sm text-base-content/50 mt-0.5">
              {allFiltered.length === 0 ? "No results" : `${allFiltered.length} recipe${allFiltered.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <IconStar size={12} />
            Featured
          </span>
        </div>

        {/* Empty state */}
        {allFiltered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-base-content mb-2">No recipes found</h3>
            <p className="text-base-content/50 mb-6">Try adjusting your search or filter</p>
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
              className="px-6 py-3 rounded-2xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className={viewMode === "list" ? "flex flex-col gap-3" : "grid grid-cols-2 md:grid-cols-3 gap-4"}
            >
              {filteredRecipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`} prefetch={true} className="block">
                  <RecipeCard
                    viewMode={viewMode}
                    recipe={recipe}
                    isFavorite={favorites.some((fav) => fav.recipe_id === recipe.id)}
                    onToggleFavorite={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(recipe.id); }}
                    onClick={() => {}}
                  />
                </Link>
              ))}
            </motion.div>

            {/* View More */}
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white shadow-lg shadow-primary/20 transition-all"
                  style={{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}
                >
                  <span>Load More Recipes</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{allFiltered.length - visibleCount} more</span>
                </motion.button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Back to Top */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-28 md:bottom-8 left-4 z-40 w-11 h-11 rounded-2xl bg-base-100 border border-base-300 shadow-lg flex items-center justify-center text-base-content hover:bg-base-200 transition-colors"
          >
            <IconArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </AnimatePresence>

      {/* Floating Navigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
