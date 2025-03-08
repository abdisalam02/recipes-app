'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, ChangeEvent } from 'react';
import { IconHeart, IconHeartFilled, IconArrowUp, IconCheck, IconX } from '@tabler/icons-react';
import { Recipe, Favorite } from '../../lib/types';

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto close after 3 seconds
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center`}>
        <div className="flex items-center">
          {type === 'success' ? <IconCheck size={18} /> : <IconX size={18} />}
          <span className="ml-2">{message}</span>
        </div>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
};

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

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Function to show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };
  
  // Function to hide toast
  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

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
        showToast('Removed from Favorites', 'success');
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
        showToast('Added to Favorites', 'success');
      }
    } catch (error: any) {
      console.error('Favorite toggle error:', error);
      showToast(error.message || 'Failed to update favorites', 'error');
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
      {/* Back to top button */}
      {scroll.y > 300 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary-focus transition-colors"
          aria-label="Back to top"
        >
          <IconArrowUp size={20} />
        </button>
      )}
      
      {/* Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
      {/* Secret Link Trigger (for admin page) */}
      <button
        className="absolute top-4 right-4 btn btn-xs btn-ghost opacity-50 hover:opacity-100 transition-opacity"
        title="Secret Admin Page"
        onClick={() => router.push('/admin')}
      >
        ?
      </button>

      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Recipe Collection
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Discover and explore delicious recipes
        </p>
      </div>

      {/* Tab Slider */}
      <div className="flex justify-center mb-8">
        <div className="bg-base-200 p-1 rounded-full inline-flex">
          <button
            className={`px-6 py-2 rounded-full transition-all ${
              selectedTab === 'recipes' 
                ? 'bg-primary text-white shadow-md' 
                : 'hover:bg-base-300'
            }`}
            onClick={() => setSelectedTab('recipes')}
          >
            Recipes
          </button>
          <button
            className={`px-6 py-2 rounded-full transition-all ${
              selectedTab === 'ai-recipes' 
                ? 'bg-primary text-white shadow-md' 
                : 'hover:bg-base-300'
            }`}
            onClick={() => setSelectedTab('ai-recipes')}
          >
            AI Recipes
          </button>
        </div>
      </div>

      {selectedTab === 'ai-recipes' && (
        <div className="flex justify-center mb-8">
          <button
            className="btn btn-primary btn-lg rounded-full shadow-md hover:shadow-lg transition-shadow"
            onClick={() => router.push('/AI')}
          >
            Generate Recipe with AI
          </button>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-8 bg-base-200 rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* Search Input */}
          <div className="flex-1 w-full">
            <label className="text-sm font-medium mb-2 block">
              Search Recipes
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full pl-10 py-3 text-base"
                style={{ minHeight: '3rem' }}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <IconX size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Button (Mobile) */}
          <div className="md:hidden w-full">
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn btn-outline w-full py-3"
              style={{ minHeight: '3rem' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:flex gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">All Categories</option>
                {categories.map((category) => {
                  // Safely handle category formatting
                  const displayCategory = typeof category === 'string' && category 
                    ? category.charAt(0).toUpperCase() + category.slice(1) 
                    : 'Other';
                    
                  return (
                    <option key={category} value={category}>
                      {displayCategory}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">All Regions</option>
                {regions.map((region) => {
                  // Safely handle region formatting
                  const displayRegion = typeof region === 'string' && region 
                    ? region.charAt(0).toUpperCase() + region.slice(1) 
                    : 'Other';
                    
                  return (
                    <option key={region} value={region}>
                      {displayRegion}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-xl text-gray-500">No recipes found.</p>
          <p className="text-gray-400 mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() =>
                router.push(
                  selectedTab === 'ai-recipes'
                    ? `/ai-recipes/${recipe.id}`
                    : `/recipes/${recipe.id}`
                )
              }
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] overflow-hidden"
            >
              <figure className="relative h-48">
                <img
                  src={getImageUrl(recipe.image)}
                  alt={recipe.title}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe.id);
                    }}
                    className="btn btn-circle btn-sm bg-white/80 hover:bg-white border-none"
                  >
                    {isFavorited(recipe.id) ? (
                      <IconHeartFilled size={18} className="text-red-500" />
                    ) : (
                      <IconHeart size={18} className="text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="badge badge-primary">
                    {recipe.category && typeof recipe.category === 'string'
                      ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)
                      : 'Uncategorized'}
                  </div>
                </div>
              </figure>
              <div className="card-body p-4">
                <h2 className="card-title text-lg">{recipe.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-2">{recipe.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-400">
                    {recipe.portion ? `${recipe.portion} servings` : '30 min'}
                  </div>
                  <div className="badge badge-outline badge-sm">
                    {recipe.region && typeof recipe.region === 'string'
                      ? recipe.region.charAt(0).toUpperCase() + recipe.region.slice(1)
                      : 'Global'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Replace the current filter UI with a cooler one */}
      <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-base-100 to-base-200 rounded-t-3xl p-6 transition-transform duration-300 shadow-2xl ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Refine Results</h3>
            <button 
              onClick={() => setDrawerOpen(false)} 
              className="btn btn-circle btn-sm bg-base-300 hover:bg-base-300/80 border-none"
            >
              <IconX size={18} />
            </button>
          </div>
          
          {/* Visual indicator for active filters */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-sm">
              {selectedCategory || selectedRegion 
                ? `Filtering by ${[
                    selectedCategory && 'category',
                    selectedRegion && 'region'
                  ].filter(Boolean).join(' and ')}`
                : 'No filters applied'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Filter with visual chips */}
            <div className="space-y-4">
              <label className="text-base font-medium block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedCategory === '' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-base-300 hover:bg-base-300/80'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => {
                  // Safely handle category formatting
                  const displayCategory = typeof category === 'string' && category 
                    ? category.charAt(0).toUpperCase() + category.slice(1) 
                    : 'Other';
                    
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        selectedCategory === category 
                          ? 'bg-primary text-white shadow-md' 
                          : 'bg-base-300 hover:bg-base-300/80'
                      }`}
                    >
                      {displayCategory}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Region Filter with visual chips */}
            <div className="space-y-4">
              <label className="text-base font-medium block">
                Region
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRegion('')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedRegion === '' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-base-300 hover:bg-base-300/80'
                  }`}
                >
                  All
                </button>
                {regions.map((region) => {
                  // Safely handle region formatting
                  const displayRegion = typeof region === 'string' && region 
                    ? region.charAt(0).toUpperCase() + region.slice(1) 
                    : 'Other';
                    
                  return (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        selectedRegion === region 
                          ? 'bg-primary text-white shadow-md' 
                          : 'bg-base-300 hover:bg-base-300/80'
                      }`}
                    >
                      {displayRegion}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <button 
              className="btn btn-outline flex-1"
              onClick={() => {
                setSelectedCategory('');
                setSelectedRegion('');
              }}
            >
              Reset Filters
            </button>
            <button 
              className="btn btn-primary flex-1"
              onClick={() => setDrawerOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dummy helpers for favorites
function isFavorited(recipe_id: number): boolean {
  return false;
}

async function toggleFavorite(recipe_id: number): Promise<void> {
  try {
    // This is a dummy function that would be replaced with actual implementation
    console.log(`Toggling favorite for recipe ${recipe_id}`);
    
    // Create and show a toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-end z-50';
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-success flex items-center';
    
    const message = document.createElement('span');
    message.textContent = 'Updated favorites';
    
    alert.appendChild(message);
    toast.appendChild(alert);
    document.body.appendChild(toast);
    
    // Remove the toast after 3 seconds
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
}
