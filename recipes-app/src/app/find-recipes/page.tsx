'use client';

import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import debounce from 'lodash.debounce';
import {
  Container,
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  LoadingOverlay,
  Slider,
  Transition,
  Affix,
  Autocomplete,
  Tooltip,
  Chip,
} from '@mantine/core';
import { IconArrowUp, IconSearch, IconX, IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDebouncedValue, useWindowScroll } from '@mantine/hooks';

// Import your types from your library – adjust as necessary
import { Recipe, Favorite } from '../../lib/types';

// If you need a local alias for JSON data (since your lib/types.ts does not export JsonData)
type JsonData = any;

// For the secret link, we use the Link component from next/link

export default function FindRecipesPage() {
  const router = useRouter();

  // State declarations
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
  const [inputValue, setInputValue] = useState<string>(''); // For the autocomplete input
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  // Drawer state (for mobile filters)
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Scroll state
  const scroll = useWindowScroll();

  // Fetch data on mount
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

        // Fetch recipes
        const recipesRes = await fetch('/api/recipes');
        if (!recipesRes.ok) {
          const errorData = await recipesRes.json();
          throw new Error(errorData.error || 'Failed to fetch recipes');
        }
        const recipesData = await recipesRes.json();
        setRecipes(recipesData || []);
        setFilteredRecipes(recipesData || []);
        console.log('Fetched Recipes:', recipesData);

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
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to fetch data. Please try again later.',
          color: 'red',
        });
        alert(`Error: ${error.message || 'Failed to fetch data.'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Derived state for filtering
  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category)));
  const regions = Array.from(new Set(recipes.map((recipe) => recipe.region)));
  const uniqueIngredientNames = Array.from(new Set(allIngredients.map((ing) => ing.name)));
  console.log('Unique Ingredient Names:', uniqueIngredientNames);

  // Filter recipes on dependency changes
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

  // Helpers for favorites
  const isFavorited = (recipe_id: number): boolean => {
    return favorites.some((fav) => fav.recipe_id === recipe_id);
  };

  const toggleFavorite = async (recipe_id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        notifications.show({
          title: 'Removed from Favorites',
          message: 'The recipe has been unfavorited.',
          color: 'gray',
        });
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
        notifications.show({
          title: 'Added to Favorites',
          message: 'The recipe has been favorited.',
          color: 'green',
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error.message);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update favorite status.',
        color: 'red',
      });
      alert(`Error: ${error.message || 'An error occurred.'}`);
    }
  };

  // Helper for image URL fallback
  const getImageUrl = (image: string): string => {
    return image && image.trim() !== ''
      ? image
      : 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
  };

  // For scroll-to-top
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // The rendered component
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Secret Link to Admin Page */}
      <div className="fixed bottom-0 left-0 p-2 z-50">
        <Link
          href="/admin"
          className="text-xs text-gray-500 opacity-10 hover:opacity-100 transition-opacity duration-500"
          title="Secret Admin Access"
        >
          Admin Access
        </Link>
      </div>

      {/* Title */}
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-4xl font-bold">Recipe Collection</h1>
      </div>

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
          onChange={(e) => setSearchTerm(e.target.value)}
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
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setDrawerOpen(false)}
          ></div>
          <div className="fixed top-0 right-0 w-64 h-full bg-base-200 shadow-lg p-4 z-50 transform transition-transform duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Filters</h2>
              <button
                className="btn btn-sm btn-square"
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            {/* Categories */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() =>
                      setSelectedCategory((prev) =>
                        prev === category.value ? '' : category.value
                      )
                    }
                    className={`btn btn-xs ${
                      selectedCategory === category.value
                        ? 'btn-primary'
                        : 'btn-outline'
                    }`}
                  >
                    {category.label}
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
                    key={region.value}
                    onClick={() =>
                      setSelectedRegion((prev) =>
                        prev === region.value ? '' : region.value
                      )
                    }
                    className={`btn btn-xs ${
                      selectedRegion === region.value
                        ? 'btn-primary'
                        : 'btn-outline'
                    }`}
                  >
                    {region.label}
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
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
          spacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
          verticalSpacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
        >
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
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
                    {recipe.category.charAt(0).toUpperCase() +
                      recipe.category.slice(1)}
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-3">
                  {recipe.description.length > 100
                    ? `${recipe.description.substring(0, 100)}...`
                    : recipe.description}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">Portions: {recipe.portion}</p>
                  <div className="tooltip" data-tip={isFavorited(recipe.id) ? 'Unfavorite' : 'Favorite'}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(recipe.id, e);
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
                    router.push(`/recipes/${recipe.id}`);
                  }}
                  className="btn btn-primary btn-sm mt-4"
                  aria-label={`View details of ${recipe.title}`}
                >
                  View Recipe
                </button>
              </div>
            </Link>
          ))}
        </SimpleGrid>
      )}

      {/* Scroll-to-Top Button */}
      <Affix position={{ bottom: 20, right: 20 }}>
        <Transition transition="slide-up" mounted={scroll.y > 0}>
          {(transitionStyles) => (
            <Button
              style={transitionStyles}
              onClick={() => scrollTo({ y: 0 })}
              aria-label="Scroll to top"
            >
              Scroll to top
            </Button>
          )}
        </Transition>
      </Affix>
    </div>
  );
}

// Dummy helper functions for favorites – replace these with your actual implementations.
function isFavorited(recipe_id: number): boolean {
  return false;
}

async function toggleFavorite(recipe_id: number, e: React.MouseEvent): Promise<void> {
  console.log(`Toggling favorite for recipe ${recipe_id}`);
}
