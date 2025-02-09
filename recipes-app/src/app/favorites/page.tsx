'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconHeartOff, IconHome } from "@tabler/icons-react";

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

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
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
        setFavorites((prev) => prev.filter((fav) => fav.recipe_id !== recipe_id));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove favorite");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Failed to remove from favorites");
        setError(err.message);
      } else {
        alert("An unknown error occurred while removing favorite.");
        setError("An unknown error occurred.");
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center">
          <p className="text-lg">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (error || favorites.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="card bg-gradient-to-br from-blue-500 to-purple-500 shadow-xl rounded-lg p-8 text-center">
          <IconHeartOff size={64} className="mx-auto text-white" />
          <h2 className="text-2xl font-bold text-white mt-4">No Favourite Recipes Yet</h2>
          <p className="text-white mt-2">
            Start adding recipes to your favorites by clicking the heart icon on any recipe card.
          </p>
          <Link href="/" className="btn btn-primary mt-4">
            <IconHome size={16} className="mr-2" />
            Browse Recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Favourite Recipes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favorites.map((fav) => (
          <div key={fav.id} className="card bg-base-100 shadow-lg rounded-lg overflow-hidden group relative">
            <div className="relative">
              <figure>
                <img
                  src={fav.recipe.image}
                  alt={fav.recipe.title}
                  className="object-cover w-full h-40 transition-transform duration-300 group-hover:scale-105"
                />
              </figure>
              {/* Unfavorite Button: Always visible on mobile, and on larger screens appears on hover */}
              <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                <button
                  className="btn btn-circle btn-error"
                  onClick={() => removeFavorite(fav.recipe_id)}
                  aria-label="Remove from favorites"
                >
                  <IconHeartOff size={20} />
                </button>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="card-title text-lg">{fav.recipe.title}</h2>
                <span className="badge badge-primary">
                  {fav.recipe.category.charAt(0).toUpperCase() +
                    fav.recipe.category.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                {fav.recipe.description}
              </p>
              <Link href={`/recipes/${fav.recipe.id}`} className="btn btn-primary w-full">
                View Recipe
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
