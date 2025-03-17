'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IconChefHat, IconClock, IconHeart, IconHeartFilled, IconShare, IconArrowUp } from '@tabler/icons-react';
import { Favorite } from '../../../lib/types';

// Define the Recipe type based on the API response structure
interface DailyRecipeItem {
  id: number;
  title: string;
  description: string;
  image: string;
  source: string;
  sourceUrl?: string;
  readyInMinutes?: number;
  servings?: number;
  portion?: number;
  category: string;
  instructions?: string;
  ingredients?: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
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
        <span className="ml-2">{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function DailyRecipesPage() {
  const [dailyRecipes, setDailyRecipes] = useState<DailyRecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const router = useRouter();
  const scroll = useWindowScroll();
  
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
  
  // Helper for image URL fallback
  const getImageUrl = (image: string): string => {
    return image && image.trim() !== '' ? image : '/default-image.png';
  };
  
  // Fetch daily recipes and favorites on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch daily recipes
        const recipesRes = await fetch('/api/daily-recipes');
        if (!recipesRes.ok) {
          throw new Error(`Failed to fetch daily recipes: ${recipesRes.status}`);
        }
        const recipesData = await recipesRes.json();
        setDailyRecipes(recipesData || []);
        
        // Fetch favorites
        const favoritesRes = await fetch('/api/favorites');
        if (!favoritesRes.ok) {
          throw new Error(`Failed to fetch favorites: ${favoritesRes.status}`);
        }
        const favoritesData = await favoritesRes.json();
        setFavorites(favoritesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Toggle favorite state
  const toggleFavorite = async (e: React.MouseEvent, recipe_id: number) => {
    e.stopPropagation();
    
    try {
      const isFavorited = favorites.some(fav => fav.recipe_id === recipe_id);
      
      if (isFavorited) {
        await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id }),
        });
        
        setFavorites(favorites.filter(fav => fav.recipe_id !== recipe_id));
        showToast('Removed from favorites', 'success');
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id }),
        });
        
        if (res.ok) {
          const newFavorite = await res.json();
          setFavorites([...favorites, newFavorite]);
          showToast('Added to favorites', 'success');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorites', 'error');
    }
  };
  
  // Share recipe
  const shareRecipe = (e: React.MouseEvent, recipe: DailyRecipeItem) => {
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: `Check out this recipe: ${recipe.title}`,
        url: window.location.origin + `/daily-recipes/${recipe.id}`,
      }).catch(err => console.error('Error sharing', err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.origin + `/daily-recipes/${recipe.id}`)
        .then(() => showToast('Link copied to clipboard!', 'success'))
        .catch(err => console.error('Failed to copy link:', err));
    }
  };
  
  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Recipes of the Day
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Discover curated recipes updated daily
        </p>
      </div>
      
      {/* Grid display of recipes */}
      {dailyRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <IconChefHat size={64} className="text-gray-400 mb-4" />
          <p className="text-xl text-gray-500">No recipes available for today.</p>
          <p className="text-gray-400 mt-2">Check back later for new recipes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dailyRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => router.push(`/daily-recipes/${recipe.id}`)}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] overflow-hidden cursor-pointer"
            >
              <figure className="relative h-48">
                <Image
                  src={getImageUrl(recipe.image)}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => toggleFavorite(e, recipe.id)}
                    className="btn btn-circle btn-sm bg-white/80 hover:bg-white border-none"
                    aria-label={favorites.some(fav => fav.recipe_id === recipe.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    {favorites.some(fav => fav.recipe_id === recipe.id) ? (
                      <IconHeartFilled size={18} className="text-red-500" />
                    ) : (
                      <IconHeart size={18} className="text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="badge badge-primary">
                    {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
                  </div>
                </div>
              </figure>
              <div className="card-body p-4">
                <h2 className="card-title text-lg">{recipe.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-2">{recipe.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-xs text-gray-400">
                    <IconClock size={14} className="mr-1" />
                    {recipe.readyInMinutes || 30} min
                  </div>
                  <button 
                    className="btn btn-circle btn-xs btn-ghost"
                    onClick={(e) => shareRecipe(e, recipe)}
                    aria-label="Share recipe"
                  >
                    <IconShare size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
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
    </div>
  );
} 