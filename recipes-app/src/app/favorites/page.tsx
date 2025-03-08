'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconHeartOff, IconHome, IconHeart, IconX } from "@tabler/icons-react";
import Image from "next/image";

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
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center`}>
        <div className="flex items-center">
          {type === 'success' ? (
            <IconHeart size={18} className="mr-2" />
          ) : (
            <IconX size={18} className="mr-2" />
          )}
          <span>{message}</span>
        </div>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
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
        setFavorites((prev) => prev.filter((fav) => fav.recipe_id !== recipe_id));
        setToast({
          show: true,
          message: "Recipe removed from favorites",
          type: "success"
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
          type: "error"
        });
        setError(err.message);
      } else {
        setToast({
          show: true,
          message: "An unknown error occurred",
          type: "error"
        });
        setError("An unknown error occurred.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="card bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 text-center max-w-md w-full">
          <div className="bg-rose-100 dark:bg-rose-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconHeartOff size={40} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">No Favorite Recipes Yet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Start adding recipes to your favorites by clicking the heart icon on any recipe card.
          </p>
          <Link href="/" className="btn btn-primary btn-lg rounded-full w-full">
            <IconHome size={18} className="mr-2" />
            Browse Recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
          My Favorites
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your collection of favorite recipes
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav) => (
            <div 
              key={fav.id} 
              className="card bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden"
            >
              <figure className="relative h-48">
                <Image
                  src={fav.recipe.image}
                  alt={fav.recipe.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                
                {/* Remove from favorites button */}
                <button
                  className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFavorite(fav.recipe_id);
                  }}
                  aria-label="Remove from favorites"
                >
                  <IconHeartOff size={20} className="text-rose-500" />
                </button>
                
                {/* Category badge */}
                <div className="absolute bottom-2 left-2 z-10">
                  <div className="badge badge-primary">
                    {fav.recipe.category && typeof fav.recipe.category === 'string'
                      ? fav.recipe.category.charAt(0).toUpperCase() + fav.recipe.category.slice(1)
                      : "Uncategorized"}
                  </div>
                </div>
              </figure>
              
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2 line-clamp-1">{fav.recipe.title}</h2>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{fav.recipe.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400">
                    {fav.recipe.portion} {parseInt(fav.recipe.portion.toString()) === 1 ? 'serving' : 'servings'}
                  </span>
                  <span className="text-xs text-gray-400">
                    Added {new Date(fav.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Link 
                  href={`/recipes/${fav.recipe.id}`} 
                  className="btn btn-primary w-full rounded-full"
                >
                  View Recipe
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
