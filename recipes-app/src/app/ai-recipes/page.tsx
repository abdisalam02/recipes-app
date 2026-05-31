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
          <div className="neo-card h-40 bg-base-300 animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="neo-card overflow-hidden bg-base-200 border-4 animate-pulse">
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
      <div className="bg-secondary border-b-4 border-base-content px-4 py-10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-20 h-20 bg-primary border-4 border-base-content rounded-xl shadow-neo flex items-center justify-center mx-auto mb-6">
            <IconRobot size={40} className="text-base-content" stroke={2.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-base-content uppercase tracking-wider mb-4">AI Recipes</h1>
          <p className="text-base-content font-bold mt-2 text-lg border-2 border-base-content bg-base-100 inline-block px-4 py-2 rounded-xl shadow-neo-sm mb-6">Unique recipes created by artificial intelligence ✨</p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/AI" className="neo-button px-6 py-3 bg-primary text-base-content text-sm font-black uppercase tracking-wider">
              <IconSparkles size={18} className="inline mr-2" stroke={2.5} />
              Create New
            </Link>
            <Link href="/" className="px-6 py-3 rounded-xl bg-base-200 border-3 border-transparent text-base-content font-black uppercase tracking-wider hover:bg-base-300 transition-colors text-sm">
              Browse All
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
            className="neo-input w-full pl-11 pr-4 py-3 bg-base-100 text-sm"
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
                <div
                  className="neo-card group relative overflow-hidden bg-base-100 border-4 transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] cursor-pointer"
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
                        <span className="neo-badge bg-secondary text-base-content px-3 py-1 text-xs uppercase tracking-wider">
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>


    </div>
  );
}
