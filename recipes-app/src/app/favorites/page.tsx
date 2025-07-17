"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconHeartOff, IconHome, IconHeart, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { MinimalistLoader } from "../components/MinimalistLoader";
import { useRouter } from "next/navigation";

// Recipe Interface
export interface Recipe {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  portion: number;
}

// Favorite Interface
export interface Favorite {
  id: number;
  recipe_id: number;
  recipe: Recipe;
  created_at: string;
}

// Toast component
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
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`${
          type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white px-4 py-3 rounded-lg shadow-lg flex items-center`}
      >
        <div className="flex items-center">
          {type === "success" ? (
            <IconHeart size={18} className="mr-2" />
          ) : (
            <IconX size={18} className="mr-2" />
          )}
          <span>{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200"
        >
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
};

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/favorites");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch favorites");
      }
      const data: Favorite[] = await response.json();
      setFavorites(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (recipe_id: number) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id }),
      });
      if (response.ok) {
        setFavorites((prev) =>
          prev.filter((fav) => fav.recipe_id !== recipe_id)
        );
        setToast({
          show: true,
          message: "Recipe removed from favorites",
          type: "success",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove favorite");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setToast({
          show: true,
          message: err.message || "Failed to remove from favorites",
          type: "error",
        });
        setError(err.message);
      } else {
        setToast({
          show: true,
          message: "An unknown error occurred",
          type: "error",
        });
        setError("An unknown error occurred.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="container mx-auto py-8 flex items-center justify-center min-h-screen relative z-10">
          <MinimalistLoader message="Loading favorites..." size="lg" />
        </div>
        <FloatingNavigation router={router} />
      </div>
    );
  }

  if (error || favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="container mx-auto py-8 flex items-center justify-center min-h-screen p-4 relative z-10 pb-24 md:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-8 text-center max-w-md w-full shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel backdrop-blur-xl bg-rose-500/20 border border-rose-400/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
            <IconHeartOff size={40} className="text-rose-500" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              No Favorite Recipes Yet
            </h2>
            <p className="text-gray-600 mb-8">
              Start adding recipes to your favorites by clicking the heart icon
              on any recipe card.
          </p>
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-panel backdrop-blur-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white border border-white/30 rounded-2xl px-8 py-4 font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 inline-flex items-center gap-2"
              >
                <IconHome size={18} />
            Browse Recipes
              </motion.div>
          </Link>
          </motion.div>
        </div>
        <FloatingNavigation router={router} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"></div>

      {/* Enhanced Toast */}
      <AnimatePresence>
      {toast.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-50 md:bottom-6 md:right-6 md:left-auto md:w-96"
          >
            <div
              className={`glass-panel backdrop-blur-xl rounded-2xl p-4 shadow-2xl border ${
                toast.type === "success"
                  ? "bg-emerald-500/20 border-emerald-400/30"
                  : "bg-red-500/20 border-red-400/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    toast.type === "success"
                      ? "bg-emerald-500/30"
                      : "bg-red-500/30"
                  }`}
                >
                  {toast.type === "success" ? (
                    <IconHeart size={18} className="text-emerald-100" />
                  ) : (
                    <IconX size={18} className="text-red-100" />
                  )}
                </div>
                <span className="font-medium text-white flex-1">
                  {toast.message}
                </span>
                <button
                  onClick={() => setToast({ ...toast, show: false })}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <IconX size={16} className="text-white/70" />
                </button>
              </div>
            </div>
          </motion.div>
      )}
      </AnimatePresence>
      
      <div className="container mx-auto py-8 px-4 relative z-10 pb-24 md:pb-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-2xl"
          >
            <IconHeart size={32} className="text-rose-500 mx-auto" />
          </motion.div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
          My Favorites
        </h1>
          <p className="text-gray-600">Your collection of favorite recipes</p>
        </motion.div>

        {/* Enhanced Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {favorites.map((fav, index) => (
            <motion.div
              key={fav.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500"
            >
              <figure className="relative h-48">
                <Image
                  src={fav.recipe.image}
                  alt={fav.recipe.title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://via.placeholder.com/400x300?text=No+Image";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                
                {/* Enhanced remove from favorites button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-4 right-4 glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-3 shadow-2xl hover:bg-white/30 transition-all duration-300 z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFavorite(fav.recipe_id);
                  }}
                  aria-label="Remove from favorites"
                >
                  <IconHeartOff size={20} className="text-rose-400" />
                </motion.button>
                
                {/* Enhanced category badge */}
                <div className="absolute bottom-4 left-4 z-10">
                  <div className="badge badge-lg bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-none shadow-lg">
                    {fav.recipe.category &&
                    typeof fav.recipe.category === "string"
                      ? fav.recipe.category.charAt(0).toUpperCase() +
                        fav.recipe.category.slice(1)
                      : "Uncategorized"}
                  </div>
                </div>
              </figure>
              
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2 line-clamp-1 text-gray-800">
                  {fav.recipe.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {fav.recipe.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500">
                    {fav.recipe.portion}{" "}
                    {parseInt(fav.recipe.portion.toString()) === 1
                      ? "serving"
                      : "servings"}
                  </span>
                  <span className="text-xs text-gray-500">
                    Added {new Date(fav.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Link href={`/recipes/${fav.recipe.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-panel backdrop-blur-xl bg-gradient-to-r from-emerald-500 to-blue-500 border border-white/30 text-white rounded-xl px-6 py-3 font-medium shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-center"
                >
                  View Recipe
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* FloatingNavigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
