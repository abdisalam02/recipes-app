"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconRobot, IconSparkles, IconClock, IconUsers } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { useTheme } from "../contexts/ThemeContext";

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
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(() => themes.find((t) => t.name === theme) || themes[0], [theme, themes]);

  const [recipes, setRecipes] = useState<AIRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/ai-recipes")
      .then((r) => r.json())
      .then(setRecipes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredRecipes = useMemo(() =>
    recipes.filter((r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [recipes, searchTerm]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-40 bg-base-200 rounded-3xl animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-base-100 border border-base-200 animate-pulse">
                <div className="h-44 bg-base-200" />
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
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: currentTheme.colors.secondary }} />
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <IconRobot size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-2">AI-Generated Recipes</h1>
          <p className="text-base-content/50 text-sm mb-6">Unique recipes created by artificial intelligence ✨</p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/AI" className="px-5 py-2.5 rounded-2xl text-white font-semibold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity text-sm" style={{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}>
              <IconSparkles size={14} className="inline mr-1.5" />
              Create New AI Recipe
            </Link>
            <Link href="/" className="px-5 py-2.5 rounded-2xl bg-base-200 hover:bg-base-300 text-base-content font-semibold transition-colors text-sm border border-base-300">
              Browse All Recipes
            </Link>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-16 z-20 bg-base-100/95 backdrop-blur-xl border-b border-base-200 px-4 py-3">
        <div className="max-w-xl mx-auto relative">
          <IconSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search AI recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-base-300 bg-base-200 text-base-content focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-base-100 transition-all text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-32 md:pb-16">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-base-content mb-2">No recipes found</h3>
            <p className="text-base-content/50 text-sm">
              {searchTerm ? `No results for "${searchTerm}"` : "No AI recipes yet. Create your first one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe, index) => (
              <Link key={recipe.id} href={`/ai-recipes/${recipe.id}`} prefetch={true}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-3xl overflow-hidden bg-base-100 border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative h-44">
                    <Image
                      src={recipe.image || "/default-image.png"}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-0.5 rounded-full bg-secondary/80 backdrop-blur-sm text-white text-[10px] font-bold">🤖 AI</span>
                    </div>
                    {recipe.category && (
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: currentTheme.colors.primary }}>
                          {recipe.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-base-content line-clamp-1 mb-1">{recipe.title}</h3>
                    <p className="text-xs text-base-content/50 line-clamp-2 leading-relaxed mb-3">{recipe.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-base-content/40">
                      <span className="flex items-center gap-1"><IconUsers size={11} />{recipe.portion} serv.</span>
                      <span className="flex items-center gap-1"><IconClock size={11} />AI Generated</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>


    </div>
  );
}
