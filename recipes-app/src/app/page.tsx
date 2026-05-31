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
  IconLayoutDashboard,
  IconAdjustmentsHorizontal,
  IconX
} from "@tabler/icons-react";
import { Recipe, Favorite } from "../../lib/types";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "./components/FloatingNavigation";
import { useTheme } from "./contexts/ThemeContext";
import Link from "next/link";

const CATEGORIES = ["All", "Breakfast", "Lunch", "Dinner", "Dessert", "Snacks", "Vegetarian", "Healthy"];
const INITIAL_COUNT = 12;

const getBentoConfig = (index: number) => {
  const patternIndex = index % 11;
  switch (patternIndex) {
    case 0:
      return {
        gridClasses: "col-span-2 row-span-2 md:col-span-2 md:row-span-2 h-[380px] md:h-[450px]",
        type: "giant" as const
      };
    case 1:
    case 2:
      return {
        gridClasses: "col-span-1 row-span-1 h-[180px] md:h-[210px]",
        type: "standard" as const
      };
    case 3:
      return {
        gridClasses: "col-span-2 row-span-1 md:col-span-2 md:row-span-1 h-[180px] md:h-[210px]",
        type: "wide" as const
      };
    case 4:
    case 5:
      return {
        gridClasses: "col-span-1 row-span-1 h-[180px] md:h-[210px]",
        type: "standard" as const
      };
    case 6:
      return {
        gridClasses: "col-span-2 row-span-1 md:col-span-2 md:row-span-1 h-[180px] md:h-[210px]",
        type: "wide" as const
      };
    case 7:
      return {
        gridClasses: "col-span-1 row-span-2 md:col-span-1 md:row-span-2 h-[380px] md:h-[450px]",
        type: "tall" as const
      };
    case 8:
    case 9:
      return {
        gridClasses: "col-span-1 row-span-1 h-[180px] md:h-[210px]",
        type: "standard" as const
      };
    case 10:
      return {
        gridClasses: "col-span-2 row-span-1 md:col-span-2 md:row-span-1 h-[180px] md:h-[210px]",
        type: "wide" as const
      };
    default:
      return {
        gridClasses: "col-span-1 row-span-1 h-[180px] md:h-[210px]",
        type: "standard" as const
      };
  }
};

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
      className={`fixed bottom-28 md:bottom-8 right-4 z-50 px-4 py-3 rounded-xl border-3 border-base-content shadow-neo max-w-xs flex items-center gap-2.5 text-base-content text-sm font-bold ${type === "success" ? "bg-accent" : "bg-error"}`}
    >
      {type === "success" ? <IconHeart size={20} stroke={2.5} /> : <span>⚠️</span>}
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
  onClick,
  viewMode = "grid",
  bentoType = "standard",
  priority = false,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onClick: () => void;
  viewMode?: "grid" | "list" | "bento";
  bentoType?: "giant" | "wide" | "tall" | "standard";
  priority?: boolean;
}) => {
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(() => themes.find((t) => t.name === theme) || themes[0], [theme, themes]);

  if (viewMode === "list") {
    return (
      <div className="neo-card flex flex-row h-36 overflow-hidden bg-base-100 hover:shadow-neo-hover cursor-pointer group">
        <div className="relative w-36 shrink-0 border-r-3 border-base-content">
          <Image 
            src={recipe.image || "/default-image.png"} 
            alt={recipe.title} 
            fill 
            className="object-cover" 
            sizes="144px" 
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
          <button
            onClick={onToggleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-lg border-2 border-base-content bg-base-100 shadow-neo-sm hover:translate-y-px hover:translate-x-px hover:shadow-none transition-all"
          >
            {isFavorite ? <IconHeartFilled size={16} className="text-error" /> : <IconHeart size={16} className="text-base-content" stroke={2.5} />}
          </button>
        </div>
        <div className="flex flex-col justify-between p-4 flex-1 overflow-hidden bg-base-100">
          <div>
            {recipe.category && (
              <span className="inline-block px-2 py-0.5 border-2 border-base-content rounded-lg text-[10px] font-black uppercase text-base-content shadow-neo-sm mb-2" style={{ backgroundColor: currentTheme.colors.secondary }}>
                {recipe.category}
              </span>
            )}
            <h3 className="text-lg font-black text-base-content line-clamp-1">{recipe.title}</h3>
            <p className="text-sm font-medium text-base-content/80 line-clamp-2 mt-1 leading-tight">{recipe.description}</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-base-content mt-2">
            <span className="flex items-center gap-1 border-2 border-base-content bg-primary px-2 py-0.5 rounded-lg"><IconClock size={14} stroke={2.5} />30m</span>
            <span className="flex items-center gap-1 border-2 border-base-content bg-accent px-2 py-0.5 rounded-lg"><IconUser size={14} stroke={2.5} />{recipe.portion}p</span>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "bento") {
    if (bentoType === "giant") {
      return (
        <div className="neo-card flex flex-col h-full overflow-hidden bg-base-100 hover:shadow-neo-hover cursor-pointer group">
          <div className="relative flex-1 min-h-[200px] md:min-h-[240px] border-b-3 border-base-content">
            <Image 
              src={recipe.image || "/default-image.png"} 
              alt={recipe.title} 
              fill 
              className="object-cover" 
              sizes="(max-width: 768px) 100vw, 50vw" 
              priority={priority}
              loading={priority ? undefined : "lazy"}
            />
            <button
              onClick={onToggleFavorite}
              className="absolute top-4 right-4 p-2.5 rounded-xl border-3 border-base-content bg-base-100 shadow-neo-sm hover:translate-y-px hover:translate-x-px hover:shadow-none transition-all"
            >
              {isFavorite ? <IconHeartFilled size={20} className="text-error" /> : <IconHeart size={20} className="text-base-content" stroke={2.5} />}
            </button>
            {recipe.category && (
              <div className="absolute bottom-4 left-4">
                <span className="px-3.5 py-1.5 border-3 border-base-content rounded-xl text-xs font-black uppercase text-base-content shadow-neo-sm" style={{ backgroundColor: currentTheme.colors.secondary }}>
                  {recipe.category}
                </span>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 border-3 border-base-content rounded-xl text-xs font-black uppercase bg-primary text-base-content shadow-neo-sm">
                ⭐ Featured
              </span>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-2 shrink-0 bg-base-100">
            <h3 className="text-2xl font-black text-base-content line-clamp-1 leading-snug">{recipe.title}</h3>
            <p className="text-sm font-semibold text-base-content/85 line-clamp-2 md:line-clamp-3 leading-relaxed">{recipe.description}</p>
            <div className="flex items-center gap-3 text-xs text-base-content font-bold mt-2">
              <span className="flex items-center gap-1.5 border-2 border-base-content bg-primary px-2.5 py-1 rounded-lg shadow-neo-sm"><IconClock size={15} stroke={2.5} />30m</span>
              <span className="flex items-center gap-1.5 border-2 border-base-content bg-accent px-2.5 py-1 rounded-lg shadow-neo-sm"><IconUser size={15} stroke={2.5} />{recipe.portion} portions</span>
            </div>
          </div>
        </div>
      );
    }

    if (bentoType === "wide") {
      return (
        <div className="neo-card flex flex-row h-full overflow-hidden bg-base-100 hover:shadow-neo-hover cursor-pointer group">
          <div className="relative w-1/3 md:w-2/5 shrink-0 border-r-3 border-base-content">
            <Image 
              src={recipe.image || "/default-image.png"} 
              alt={recipe.title} 
              fill 
              className="object-cover" 
              sizes="200px" 
              priority={priority}
              loading={priority ? undefined : "lazy"}
            />
            <button
              onClick={onToggleFavorite}
              className="absolute top-2 right-2 p-1.5 rounded-lg border-2 border-base-content bg-base-100 shadow-neo-sm hover:translate-y-px hover:translate-x-px hover:shadow-none transition-all"
            >
              {isFavorite ? <IconHeartFilled size={16} className="text-error" /> : <IconHeart size={16} className="text-base-content" stroke={2.5} />}
            </button>
          </div>
          <div className="flex flex-col justify-between p-4 flex-1 overflow-hidden bg-base-100">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                {recipe.category && (
                  <span className="inline-block px-2 py-0.5 border-2 border-base-content rounded-lg text-[9px] font-black uppercase text-base-content shadow-neo-sm" style={{ backgroundColor: currentTheme.colors.secondary }}>
                    {recipe.category}
                  </span>
                )}
              </div>
              <h3 className="text-base md:text-lg font-black text-base-content line-clamp-1 leading-snug mt-1">{recipe.title}</h3>
              <p className="text-xs font-medium text-base-content/80 line-clamp-2 md:line-clamp-3 leading-snug">{recipe.description}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-base-content mt-2">
              <span className="flex items-center gap-1 border-2 border-base-content bg-primary px-2 py-0.5 rounded-lg"><IconClock size={12} stroke={2.5} />30m</span>
              <span className="flex items-center gap-1 border-2 border-base-content bg-accent px-2 py-0.5 rounded-lg"><IconUser size={12} stroke={2.5} />{recipe.portion}p</span>
            </div>
          </div>
        </div>
      );
    }

    if (bentoType === "tall") {
      return (
        <div className="neo-card flex flex-col h-full overflow-hidden bg-base-100 hover:shadow-neo-hover cursor-pointer group">
          <div className="relative flex-1 min-h-[160px] border-b-3 border-base-content">
            <Image 
              src={recipe.image || "/default-image.png"} 
              alt={recipe.title} 
              fill 
              className="object-cover" 
              sizes="300px" 
              priority={priority}
              loading={priority ? undefined : "lazy"}
            />
            <button
              onClick={onToggleFavorite}
              className="absolute top-3 right-3 p-2 rounded-xl border-3 border-base-content bg-base-100 shadow-neo-sm hover:translate-y-px hover:translate-x-px hover:shadow-none transition-all"
            >
              {isFavorite ? <IconHeartFilled size={18} className="text-error" /> : <IconHeart size={18} className="text-base-content" stroke={2.5} />}
            </button>
            {recipe.category && (
              <div className="absolute bottom-3 left-3">
                <span className="px-2.5 py-1 border-3 border-base-content rounded-xl text-[10px] font-black uppercase text-base-content shadow-neo-sm" style={{ backgroundColor: currentTheme.colors.secondary }}>
                  {recipe.category}
                </span>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col gap-2 shrink-0 bg-base-100 h-[170px] justify-between">
            <div>
              <h3 className="text-lg font-black text-base-content line-clamp-2 leading-snug">{recipe.title}</h3>
              <p className="text-xs font-semibold text-base-content/80 line-clamp-3 leading-snug mt-1">{recipe.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-base-content font-bold">
              <span className="flex items-center gap-1 border-2 border-base-content bg-primary px-2 py-0.5 rounded-lg shadow-neo-sm"><IconClock size={13} stroke={2.5} />30m</span>
              <span className="flex items-center gap-1 border-2 border-base-content bg-accent px-2 py-0.5 rounded-lg shadow-neo-sm"><IconUser size={13} stroke={2.5} />{recipe.portion}p</span>
            </div>
          </div>
        </div>
      );
    }

    // Default 'standard' bento card
    return (
      <div className="neo-card flex flex-col h-full overflow-hidden bg-base-100 hover:shadow-neo-hover cursor-pointer group">
        <div className="relative flex-1 min-h-[90px] border-b-3 border-base-content">
          <Image 
            src={recipe.image || "/default-image.png"} 
            alt={recipe.title} 
            fill 
            className="object-cover" 
            sizes="200px" 
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
          <button
            onClick={onToggleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-lg border-2 border-base-content bg-base-100 shadow-neo-sm hover:translate-y-px hover:translate-x-px hover:shadow-none transition-all"
          >
            {isFavorite ? <IconHeartFilled size={14} className="text-error" /> : <IconHeart size={14} className="text-base-content" stroke={2.5} />}
          </button>
        </div>
        <div className="p-3 flex flex-col justify-between shrink-0 bg-base-100 h-[85px]">
          <h3 className="text-sm font-black text-base-content line-clamp-1 leading-snug">{recipe.title}</h3>
          <div className="flex items-center justify-between text-[10px] text-base-content font-black mt-1">
            <span className="flex items-center gap-0.5 border border-base-content bg-primary px-1 py-0.2 rounded shadow-neo-sm"><IconClock size={11} stroke={2.5} />30m</span>
            <span className="flex items-center gap-0.5 border border-base-content bg-accent px-1 py-0.2 rounded shadow-neo-sm"><IconUser size={11} stroke={2.5} />{recipe.portion}p</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-card flex flex-col overflow-hidden bg-base-100 cursor-pointer neo-card-hover group">
      <div className="relative aspect-[4/3] w-full border-b-3 border-base-content">
        <Image 
          src={recipe.image || "/default-image.png"} 
          alt={recipe.title} 
          fill 
          className="object-cover" 
          sizes="(max-width: 768px) 50vw, 33vw" 
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
        <button
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 p-2 rounded-xl border-3 border-base-content bg-base-100 shadow-neo-sm hover:translate-y-px hover:translate-x-px hover:shadow-none transition-all"
        >
          {isFavorite ? <IconHeartFilled size={18} className="text-error" /> : <IconHeart size={18} className="text-base-content" stroke={2.5} />}
        </button>
        {recipe.category && (
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 border-3 border-base-content rounded-xl text-xs font-black uppercase text-base-content shadow-neo-sm" style={{ backgroundColor: currentTheme.colors.secondary }}>
              {recipe.category}
            </span>
          </div>
        )}
      </div>
      <div className="px-4 py-4 flex flex-col gap-2 bg-base-100">
        <h3 className="text-lg font-black text-base-content line-clamp-1 leading-snug">{recipe.title}</h3>
        <p className="text-sm font-medium text-base-content/80 line-clamp-2 leading-tight">{recipe.description}</p>
        <div className="flex items-center gap-2 text-xs text-base-content font-bold mt-1">
          <span className="flex items-center gap-1 border-2 border-base-content bg-primary px-2 py-0.5 rounded-lg shadow-neo-sm"><IconClock size={14} stroke={2.5} />30m</span>
          <span className="flex items-center gap-1 border-2 border-base-content bg-accent px-2 py-0.5 rounded-lg shadow-neo-sm"><IconUser size={14} stroke={2.5} />{recipe.portion}p</span>
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
  const [viewMode, setViewMode] = useState<"grid" | "list" | "bento">("bento");
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
          fetch(`/api/recipes`),
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
          <div className="w-full h-64 neo-card animate-pulse mb-10 bg-base-300" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="neo-card animate-pulse bg-base-200">
                <div className="h-40 bg-base-300 border-b-3 border-base-content" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-base-300 rounded-lg w-3/4 border-2 border-base-content" />
                  <div className="h-4 bg-base-300 rounded-lg w-full border-2 border-base-content" />
                  <div className="h-4 bg-base-300 rounded-lg w-5/6 border-2 border-base-content" />
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
      <section className="relative overflow-hidden py-16 px-4">
        {/* Decorative background shapes */}
        <div className="absolute top-10 right-10 w-32 h-32 border-4 border-base-content bg-primary shadow-neo rotate-12 -z-10" />
        <div className="absolute bottom-10 left-10 w-24 h-24 border-4 border-base-content rounded-full bg-accent shadow-neo -rotate-12 -z-10" />

        {/* Hidden admin link */}
        <Link
          href="/admin"
          aria-label="Admin"
          title="?"
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl border-3 border-base-content shadow-neo-sm font-black bg-base-200 text-base-content hover:translate-y-px hover:translate-x-px hover:shadow-none transition-all"
        >
          ?
        </Link>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 border-3 border-base-content shadow-neo-sm bg-secondary text-base-content font-black rounded-xl uppercase tracking-widest mb-6">
              <IconChefHat size={20} stroke={2.5} />
              Recipe Collection
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-base-content mb-6 leading-tight uppercase"
          >
            Discover <br/>Amazing
            <span className="inline-block bg-base-content px-4 py-1 ml-3 -rotate-2 rounded-xl text-base-100">Recipes</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg md:text-xl font-medium text-base-content mb-10 max-w-xl mx-auto border-2 border-base-content bg-base-200 p-4 rounded-xl shadow-neo-sm"
          >
            Find your next favourite dish from our curated collection of delicious recipes.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            onClick={scrollToRecipes}
            className="neo-button px-8 py-4 bg-primary text-base-content text-lg uppercase tracking-wider"
          >
            Explore Recipes ↓
          </motion.button>
        </div>
      </section>

      {/* Search + Filter Section */}
      <section id="recipes-section" className="sticky top-16 z-30 bg-base-100 border-b-3 border-base-content px-4 py-4 shadow-neo-sm">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <IconSearch size={24} stroke={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(INITIAL_COUNT); }}
                className="neo-input w-full pl-12 pr-12 py-3.5 text-base font-bold bg-base-200"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg border-2 border-base-content bg-error text-base-content hover:bg-red-400">
                  <IconX size={20} stroke={2.5} />
                </button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex bg-base-200 border-3 border-base-content p-1 rounded-xl shadow-neo-sm shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg border-2 font-bold transition-all ${viewMode === "grid" ? "bg-accent border-base-content shadow-neo-sm" : "border-transparent text-base-content hover:bg-base-300"}`}
                title="2-column grid"
              >
                <IconLayoutGrid size={22} stroke={2.5} />
              </button>
              <button
                onClick={() => setViewMode("bento")}
                className={`p-2.5 rounded-lg border-2 font-bold transition-all ${viewMode === "bento" ? "bg-accent border-base-content shadow-neo-sm" : "border-transparent text-base-content hover:bg-base-300"}`}
                title="Bento Box grid"
              >
                <IconLayoutDashboard size={22} stroke={2.5} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg border-2 font-bold transition-all ${viewMode === "list" ? "bg-accent border-base-content shadow-neo-sm" : "border-transparent text-base-content hover:bg-base-300"}`}
                title="Single column list"
              >
                <IconList size={22} stroke={2.5} />
              </button>
            </div>
          </div>

          {/* Category filter chips */}
          <div className="flex gap-3 overflow-x-auto pb-2 pt-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setVisibleCount(INITIAL_COUNT); }}
                className={`shrink-0 px-5 py-2 border-3 border-base-content rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-neo-sm active:translate-y-px active:translate-x-px active:shadow-none ${
                  selectedCategory === cat
                    ? "bg-primary text-base-content"
                    : "bg-base-200 text-base-content hover:bg-secondary hover:shadow-neo"
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-base-content uppercase">
              {searchTerm ? "Search Results" : selectedCategory === "All" ? "All Recipes" : selectedCategory}
            </h2>
            <p className="text-base font-bold text-base-content mt-1 border-2 border-base-content bg-base-200 inline-block px-3 py-1 rounded-lg shadow-neo-sm">
              {allFiltered.length === 0 ? "No results" : `${allFiltered.length} RECIPE${allFiltered.length !== 1 ? "S" : ""} FOUND`}
            </p>
          </div>
          <span className="hidden md:flex items-center gap-2 text-sm font-black text-base-content bg-accent border-3 border-base-content px-4 py-2 rounded-xl shadow-neo-sm uppercase">
            <IconStar size={18} fill="currentColor" stroke={2} />
            Featured
          </span>
        </div>

        {/* Empty state */}
        {allFiltered.length === 0 ? (
          <div className="text-center py-20 bg-base-200 border-4 border-base-content rounded-2xl shadow-neo">
            <div className="text-6xl mb-4 animate-bounce">🔍</div>
            <h3 className="text-3xl font-black text-base-content mb-2 uppercase">No recipes found</h3>
            <p className="text-lg font-bold text-base-content mb-8">Try adjusting your search or filter</p>
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
              className="neo-button px-8 py-4 bg-error text-base-content text-lg uppercase tracking-wider"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "list"
                  ? "flex flex-col gap-6"
                  : viewMode === "bento"
                  ? "grid grid-cols-2 md:grid-cols-3 gap-6 auto-rows-max"
                  : "grid grid-cols-2 md:grid-cols-3 gap-6"
              }
            >
              {filteredRecipes.map((recipe, index) => {
                const bentoConfig = viewMode === "bento" ? getBentoConfig(index) : null;
                return (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    prefetch={true}
                    className={`block ${bentoConfig ? bentoConfig.gridClasses : ""}`}
                  >
                    <RecipeCard
                      viewMode={viewMode}
                      bentoType={bentoConfig ? bentoConfig.type : undefined}
                      recipe={recipe}
                      isFavorite={favorites.some((fav) => fav.recipe_id === recipe.id)}
                      onToggleFavorite={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(recipe.id); }}
                      onClick={() => {}}
                      priority={index < 4}
                    />
                  </Link>
                );
              })}
            </div>

            {/* View More */}
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="neo-button flex items-center gap-3 px-8 py-4 bg-primary text-base-content uppercase tracking-wider text-lg"
                >
                  <span>Load More Recipes</span>
                  <span className="bg-base-content text-base-100 px-3 py-1 rounded-lg text-sm font-black border-2 border-base-content shadow-neo-sm">{allFiltered.length - visibleCount} more</span>
                </button>
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
            className="fixed bottom-28 md:bottom-8 left-4 z-40 w-12 h-12 rounded-xl bg-accent border-3 border-base-content shadow-neo flex items-center justify-center text-base-content hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-hover active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            <IconArrowUp size={24} stroke={3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </AnimatePresence>

      {/* Floating Navigation */}

    </div>
  );
}
