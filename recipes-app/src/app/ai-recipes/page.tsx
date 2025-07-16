"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconChefHat, IconArrowUp } from "@tabler/icons-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { MinimalistLoader } from "../components/MinimalistLoader";

interface AIRecipe {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  portion: number;
  created_at: string;
}

export default function AIRecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<AIRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [scrollY, setScrollY] = useState(0);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch AI recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/ai-recipes");
        if (!res.ok) {
          throw new Error("Failed to fetch AI recipes");
        }
        const data = await res.json();
        setRecipes(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching AI recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Filter recipes based on search term
  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="container mx-auto px-4 py-8 relative z-10 pb-24 md:pb-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-4 mb-4 shadow-2xl"
          >
            <IconChefHat size={48} className="text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI-Generated Recipes
          </h1>
          <p className="text-lg text-center max-w-2xl mb-6 text-gray-600">
            Discover unique recipes created by artificial intelligence
          </p>

          {/* Enhanced Navigation buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/AI")}
              className="glass-panel backdrop-blur-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white border border-white/30 rounded-2xl px-6 py-3 font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
            >
              Create New AI Recipe
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/recipes")}
              className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 text-gray-700 hover:bg-white/30 transition-all duration-300 px-6 py-3 rounded-2xl font-medium shadow-lg"
            >
              Browse All Recipes
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Enhanced Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 max-w-md mx-auto"
        >
          <div className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-2 shadow-lg">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search AI recipes..."
                className="glass-panel backdrop-blur-xl bg-white/30 border border-white/20 rounded-xl w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-panel backdrop-blur-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-700 p-3 rounded-xl ml-2"
              >
                <IconSearch size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-12"
          >
            <MinimalistLoader message="Loading AI recipes..." size="lg" />
          </motion.div>
        )}

        {/* Enhanced Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-800 p-6 rounded-2xl mb-8 shadow-lg"
          >
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        {/* Enhanced No Results */}
        {!loading && filteredRecipes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-12 rounded-3xl text-center max-w-md mx-auto shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl mb-4"
              >
                🤖
              </motion.div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">
                No recipes found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? `No recipes matching "${searchTerm}"`
                  : "No AI recipes available yet. Create your first one!"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Enhanced Recipe Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer"
              onClick={() => router.push(`/ai-recipes/${recipe.id}`)}
            >
              {/* Enhanced Card Image */}
              <figure className="relative h-48">
                <div className="absolute inset-0">
                  <img
                    src={recipe.image || "/default-recipe-image.jpg"}
                    alt={recipe.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/default-recipe-image.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>

                {/* Enhanced Category Badge */}
                {recipe.category && (
                  <div className="absolute top-4 right-4">
                    <span className="badge badge-lg bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-none shadow-lg">
                      {recipe.category.charAt(0).toUpperCase() +
                        recipe.category.slice(1) || "AI Recipe"}
                    </span>
                  </div>
                )}

                {/* AI Badge */}
                <div className="absolute top-4 left-4">
                  <span className="badge badge-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none shadow-lg">
                    🤖 AI Generated
                  </span>
                </div>
              </figure>

              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 text-gray-800 line-clamp-1">
                  {recipe.title}
                </h2>
                <p className="line-clamp-2 text-sm text-gray-600 mb-4 leading-relaxed">
                  {recipe.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {recipe.portion}{" "}
                    {recipe.portion === 1 ? "serving" : "servings"}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-panel backdrop-blur-xl bg-gradient-to-r from-emerald-500 to-blue-500 border border-white/30 text-white rounded-xl px-4 py-2 font-medium shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/ai-recipes/${recipe.id}`);
                    }}
                  >
                    View Recipe
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Scroll-to-Top Button */}
        <AnimatePresence>
          {scrollY > 100 && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-3 rounded-full shadow-2xl hover:bg-white/30 transition-all duration-300 fixed bottom-24 left-4 z-40 md:bottom-6"
              aria-label="Scroll to top"
            >
              <IconArrowUp size={24} className="text-gray-700" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* FloatingNavigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
