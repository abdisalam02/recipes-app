'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconChefHat, IconArrowUp } from '@tabler/icons-react';
import Image from 'next/image';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollY, setScrollY] = useState(0);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch AI recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/ai-recipes');
        if (!res.ok) {
          throw new Error('Failed to fetch AI recipes');
        }
        const data = await res.json();
        setRecipes(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching AI recipes:', err);
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <IconChefHat size={48} className="text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 text-center">AI-Generated Recipes</h1>
        <p className="text-lg text-center max-w-2xl mb-6">
          Discover unique recipes created by artificial intelligence
        </p>
        
        {/* Navigation buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => router.push('/AI')}
            className="btn btn-primary"
          >
            Create New AI Recipe
          </button>
          <button
            onClick={() => router.push('/recipes')}
            className="btn btn-outline"
          >
            Browse All Recipes
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="form-control mb-8 max-w-md mx-auto">
        <div className="input-group">
          <input
            type="text"
            placeholder="Search AI recipes..."
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-square">
            <IconSearch size={20} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <button className="btn btn-square btn-lg loading">Loading</button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-error mb-8">
          <p>{error}</p>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-2xl font-bold mb-2">No recipes found</h3>
          <p className="text-gray-500">
            {searchTerm
              ? `No recipes matching "${searchTerm}"`
              : "No AI recipes available yet. Create your first one!"}
          </p>
        </div>
      )}

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="card bg-base-100 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            onClick={() => router.push(`/ai-recipes/${recipe.id}`)}
          >
            {/* Card Image */}
            <figure className="relative h-48">
              <div className="absolute inset-0">
                <img
                  src={recipe.image || '/default-recipe-image.jpg'}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-recipe-image.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
              
              {/* Category Badge */}
              {recipe.category && (
                <div className="absolute top-2 right-2">
                  <span className="badge badge-primary">
                    {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) || 'AI Recipe'}
                  </span>
                </div>
              )}
            </figure>
            
            <div className="card-body">
              <h2 className="card-title">{recipe.title}</h2>
              <p className="line-clamp-2 text-sm text-gray-600">{recipe.description}</p>
              <div className="card-actions justify-end mt-2">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/ai-recipes/${recipe.id}`);
                  }}
                >
                  View Recipe
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll-to-Top Button */}
      {scrollY > 100 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn btn-circle fixed bottom-6 right-6 transition-transform hover:scale-110"
          aria-label="Scroll to top"
        >
          <IconArrowUp size={24} />
        </button>
      )}
    </div>
  );
} 