"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { IconHeartOff, IconHeart, IconX, IconChefHat, IconClock, IconUsers } from "@tabler/icons-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { useRouter } from "next/navigation";
import { useTheme } from "../contexts/ThemeContext";
import { useMemo } from "react";

export interface Recipe {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  portion: number;
}

export interface Favorite {
  id: number;
  recipe_id: number;
  recipe: Recipe;
  created_at: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(() => themes.find((t) => t.name === theme) || themes[0], [theme, themes]);

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch("/api/favorites");
        if (!response.ok) throw new Error("Failed to fetch favorites");
        const data: Favorite[] = await response.json();
        setFavorites(data);
      } catch {
        setToast({ show: true, message: "Failed to load favorites", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const removeFavorite = useCallback(async (recipe_id: number) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id }),
      });
      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.recipe_id !== recipe_id));
        setToast({ show: true, message: "Removed from favorites", type: "success" });
      }
    } catch {
      setToast({ show: true, message: "Failed to remove favorite", type: "error" });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-24 bg-base-200 rounded-3xl animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-base-100 border border-base-200 animate-pulse">
                <div className="h-48 bg-base-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-base-200 rounded-lg w-3/4" />
                  <div className="h-3 bg-base-200 rounded-lg w-full" />
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
      {/* Header */}
      <div className="bg-gradient-to-br from-base-100 via-base-200 to-base-100 border-b border-base-200 px-4 py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 blur-3xl bg-red-400" />
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <IconHeart size={32} className="text-red-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-base-content">My Favourites</h1>
          <p className="text-base-content/50 mt-2 text-sm">{favorites.length} saved recipe{favorites.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-32 md:pb-16">
        {favorites.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-7xl mb-6">💔</div>
            <h2 className="text-2xl font-bold text-base-content mb-3">No favourites yet</h2>
            <p className="text-base-content/50 mb-8 max-w-xs">Start adding recipes to your favourites by tapping the heart icon on any recipe card.</p>
            <Link href="/" className="px-7 py-3.5 rounded-2xl text-white font-semibold shadow-lg shadow-primary/20 transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}>
              Browse Recipes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {favorites.map((fav, index) => (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-3xl overflow-hidden bg-base-100 border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <Link href={`/recipes/${fav.recipe.id}`} prefetch={true} className="block">
                    {/* Image */}
                    <div className="relative h-44">
                      <Image
                        src={fav.recipe.image || "/default-image.png"}
                        alt={fav.recipe.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/default-image.png"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {fav.recipe.category && (
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: currentTheme.colors.primary }}>
                            {fav.recipe.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-base-content line-clamp-1 mb-1">{fav.recipe.title}</h3>
                      <p className="text-xs text-base-content/50 line-clamp-2 leading-relaxed mb-3">{fav.recipe.description}</p>
                      <div className="flex items-center gap-3 text-xs text-base-content/40">
                        <span className="flex items-center gap-1"><IconUsers size={11} />{fav.recipe.portion} serv.</span>
                        <span className="flex items-center gap-1"><IconClock size={11} />30 min</span>
                      </div>
                    </div>
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFavorite(fav.recipe_id); }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-base-100/90 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                  >
                    <IconHeartOff size={14} className="text-red-400" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-28 md:bottom-8 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium flex items-center gap-2 ${toast.type === "success" ? "bg-success" : "bg-error"}`}
          >
            {toast.type === "success" ? <IconHeart size={16} /> : <IconX size={16} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
