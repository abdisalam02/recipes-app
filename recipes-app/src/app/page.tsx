'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, ChangeEvent } from 'react';
import { IconHeart, IconHeartFilled, IconArrowUp } from '@tabler/icons-react';
import { Recipe, Favorite } from '../../lib/types';

/**
 * A simple debounce hook.
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/**
 * A simple hook to track the vertical scroll position.
 */
function useWindowScroll() {
  const [scroll, setScroll] = useState({ y: 0 });
  useEffect(() => {
    const handleScroll = () => setScroll({ y: window.scrollY });
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return scroll;
}

export default function FindRecipesPage() {
  const router = useRouter();

  // Tab state: "recipes" or "ai-recipes"
  const [selectedTab, setSelectedTab] = useState<'recipes' | 'ai-recipes'>("recipes");

  // Data state
  const [allIngredients, setAllIngredients] = useState<{ id: number; name: string }[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  // Drawer state (for mobile filters)
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Scroll state
  const scroll = useWindowScroll();

  // Secret link trigger (for admin page)
  const [secretVisible, setSecretVisible] = useState<boolean>(false);

  // Fetch data on mount and whenever selectedTab changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch ingredients
        const ingredientsRes = await fetch('/api/ingredients');
        if (!ingredientsRes.ok) {
          const errorData = await ingredientsRes.json();
          throw new Error(errorData.error || 'Failed to fetch ingredients');
        }
        const ingredientsData = await ingredientsRes.json();
        setAllIngredients(ingredientsData || []);
        console.log('Fetched Ingredients:', ingredientsData);

        // Determine endpoint based on selected tab
        const endpoint = selectedTab === "recipes" ? "/api/recipes" : "/api/ai-recipes";
        const recipesRes = await fetch(endpoint);
        // Read the response text first
        const resText = await recipesRes.text();
        if (!resText) {
          throw new Error(`Empty response from ${endpoint}`);
        }
        const recipesData = JSON.parse(resText);
        setRecipes(recipesData || []);
        setFilteredRecipes(recipesData || []);
        console.log(`Fetched ${selectedTab}:`, recipesData);

        // Fetch favorites
        const favoritesRes = await fetch('/api/favorites');
        if (!favoritesRes.ok) {
          const errorData = await favoritesRes.json();
          throw new Error(errorData.error || 'Failed to fetch favorites');
        }
        const favoritesData = await favoritesRes.json();
        setFavorites(favoritesData || []);
        console.log('Fetched Favorites:', favoritesData);
      } catch (error: any) {
        console.error('Error fetching data:', error.message);
        alert(`Error: ${error.message || 'Failed to fetch data.'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTab]);

  // Derived state for filtering
  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category)));
  const regions = Array.from(new Set(recipes.map((recipe) => recipe.region)));
  const uniqueIngredientNames = Array.from(new Set(allIngredients.map((ing) => ing.name)));
  console.log('Unique Ingredient Names:', uniqueIngredientNames);

  // Filter recipes when dependencies change
  useEffect(() => {
    let filtered = recipes;
    if (debouncedSearchTerm) {
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((recipe) => recipe.category === selectedCategory);
    }
    if (selectedRegion) {
      filtered = filtered.filter((recipe) => recipe.region === selectedRegion);
    }
    if (selectedIngredients.length > 0) {
      filtered = filtered.filter((recipe) =>
        selectedIngredients.every((ing) =>
          recipe.recipe_ingredients
            .map((ri) => ri.ingredient.name.toLowerCase())
            .includes(ing.toLowerCase())
        )
      );
    }
    setFilteredRecipes(filtered);
    console.log('Filtered Recipes:', filtered);
  }, [selectedIngredients, recipes, debouncedSearchTerm, selectedCategory, selectedRegion]);

  // Favorites helpers
  const isFavorited = (recipe_id: number): boolean => {
    return favorites.some((fav) => fav.recipe_id === recipe_id);
  };

  const toggleFavorite = async (recipe_id: number) => {
    try {
      if (isFavorited(recipe_id)) {
        const res = await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to remove favorite');
        }
        setFavorites((prev) => prev.filter((fav) => fav.recipe_id !== recipe_id));
        alert('Removed from Favorites');
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to add favorite');
        }
        const newFavorite: Favorite = await res.json();
        setFavorites((prev) => [...prev, newFavorite]);
        alert('Added to Favorites');
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'An error occurred.'}`);
    }
  };

  // Helper for image URL fallback
  const getImageUrl = (image: string): string => {
    return image && image.trim() !== ''
      ? image
      : 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
  };

  // Scroll-to-top helper
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <button className="btn btn-square btn-lg loading">Loading...</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Secret Link Trigger (for admin page) */}
      <button
        className="absolute top-4 right-4 btn btn-xs btn-ghost opacity-50 hover:opacity-100 transition-opacity"
        title="Secret Admin Page"
        onClick={() => router.push('/admin')}
      >
        ?
      </button>

      {/* Page Title */}
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-4xl font-bold">Recipe Collection</h1>
      </div>

      {/* Tab Slider */}
      <div className="flex justify-center mb-6">
        <button
          className={`btn ${selectedTab === 'recipes' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setSelectedTab('recipes')}
        >
          Recipes
        </button>
        <button
          className={`btn ml-2 ${selectedTab === 'ai-recipes' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setSelectedTab('ai-recipes')}
        >
          AI Recipes
        </button>
      </div>

      {selectedTab === 'ai-recipes' && (
  <div className="flex justify-center mb-6">
    <button
      className="btn btn-primary"
      onClick={() => router.push('/AI')}
    >
      Generate Recipe with AI
    </button>
  </div>
)}


      {/* Search Input */}
      <div className="mb-6">
        <label className="label">
          <span className="label-text">Search Recipes</span>
        </label>
        <input
          type="text"
          placeholder="Type recipe name..."
          className="input input-bordered w-full"
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          aria-label="Search Recipes"
        />
      </div>

      {/* Filter Drawer Button */}
      <div className="mb-6">
        <button
          className="btn btn-outline"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open Filters"
        >
          Filter Recipes
        </button>
      </div>

      {/* Drawer for Filters */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setDrawerOpen(false)}></div>
          <div className="fixed top-0 right-0 w-64 h-full bg-base-200 shadow-lg p-4 z-50 transform transition-transform duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Filters</h2>
              <button className="btn btn-sm btn-square" onClick={() => setDrawerOpen(false)}>
                ✕
              </button>
            </div>
            {/* Categories */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory((prev) => (prev === category ? '' : category))
                    }
                    className={`btn btn-xs ${selectedCategory === category ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Uncategorized'}
                  </button>
                ))}
              </div>
            </div>
            {/* Regions */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Regions</h3>
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() =>
                      setSelectedRegion((prev) => (prev === region ? '' : region))
                    }
                    className={`btn btn-xs ${selectedRegion === region ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {region ? region.charAt(0).toUpperCase() + region.slice(1) : 'Unknown'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="flex justify-center">
          <p className="text-gray-500">No recipes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
         {filteredRecipes.map((recipe) => (
  <Link
    key={recipe.id}
    href={selectedTab === 'ai-recipes' ? `/ai-recipes/${recipe.id}` : `/recipes/${recipe.id}`}
    className="card bg-base-100 shadow-lg hover:shadow-2xl transition transform hover:scale-105 cursor-pointer"
  >
    <figure>
      <img
        src={getImageUrl(recipe.image)}
        alt={recipe.title}
        className="object-cover w-full h-40"
        loading="lazy"
      />
    </figure>
    <div className="card-body p-4">
      <div className="flex items-center justify-between">
        <h2 className="card-title">{recipe.title}</h2>
        <div className="badge badge-secondary font-semibold">
          {recipe.category ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) : 'Uncategorized'}
        </div>
      </div>
      <p className="text-sm text-gray-500 line-clamp-3">
        {recipe.description.length > 100
          ? `${recipe.description.substring(0, 100)}...`
          : recipe.description}
      </p>
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">Portions: {recipe.portion}</span>
        <div className="tooltip" data-tip={isFavorited(recipe.id) ? 'Unfavorite' : 'Favorite'}>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(recipe.id);
            }}
            className="btn btn-ghost btn-sm"
            aria-label={isFavorited(recipe.id) ? 'Unfavorite' : 'Favorite'}
          >
            {isFavorited(recipe.id) ? (
              <IconHeartFilled size={24} className="text-red-500" />
            ) : (
              <IconHeart size={24} className="text-gray-500" />
            )}
          </button>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          router.push(selectedTab === 'ai-recipes' ? `/ai-recipes/${recipe.id}` : `/recipes/${recipe.id}`);
        }}
        className="btn btn-primary btn-sm mt-4"
        aria-label={`View details of ${recipe.title}`}
      >
        View Recipe
      </button>
    </div>
  </Link>
))}

        </div>
      )}

      {/* Scroll-to-Top Button */}
      {scroll.y > 100 && (
        <button
          onClick={scrollToTop}
          className="btn btn-circle fixed bottom-6 right-6 transition-transform hover:scale-110"
          aria-label="Scroll to top"
        >
          <IconArrowUp size={24} />
        </button>
      )}
    </div>
  );
}

// Dummy helpers for favorites
function isFavorited(recipe_id: number): boolean {
  return false;
}

async function toggleFavorite(recipe_id: number): Promise<void> {
  console.log(`Toggling favorite for recipe ${recipe_id}`);
}
