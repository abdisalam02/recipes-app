'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, ChangeEvent, useRef, useCallback } from 'react';
import { IconHeart, IconHeartFilled, IconArrowUp, IconCheck, IconX, IconClock, IconChefHat, IconShare, IconChevronLeft, IconChevronRight, IconRobot, IconCalendarEvent } from '@tabler/icons-react';
import { Recipe, Favorite } from '../../lib/types';
import Image from 'next/image';
import RecipeCard from './components/RecipeCard';
import TabSlider from './components/TabSlider';

// Toast Notification component
const Toast = ({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center p-4 mb-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-primary/90 text-white' : 'bg-error/90 text-white'
    }`}>
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
        {type === 'success' ? <IconCheck size={24} /> : <IconX size={24} />}
      </div>
      <div className="ms-3 text-sm font-normal">{message}</div>
      <button onClick={onClose} className="ms-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8">
        <IconX size={16} />
      </button>
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
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScroll({ y: window.scrollY });
      setShowScrollButton(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return { scroll, showScrollButton, scrollToTop };
}

// Search function for filtering recipes
function searchRecipes(recipes: any[], searchQuery: string): any[] {
  if (!searchQuery.trim()) {
    return recipes;
  }
  
  const query = searchQuery.toLowerCase();
  return recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(query)
  );
}

// Enhanced RecipeCarousel component
const RecipeCarousel = ({ recipes, favorites, onToggleFavorite, showToast }: { 
  recipes: Recipe[], 
  favorites: Favorite[], 
  onToggleFavorite: (e: React.MouseEvent, id: number) => void,
  showToast: (message: string, type: 'success' | 'error') => void
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  // Helper function to get image URL with fallback
  const getImageUrl = (image?: string): string => {
    return image && image.trim() !== '' ? image : '/default-recipe.jpg';
  };
  
  // Auto advance slides every 5 seconds, but pause when hovering
  useEffect(() => {
    if (recipes.length <= 1 || isHovering) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % recipes.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [recipes.length, isHovering]);
  
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((currentIndex - 1 + recipes.length) % recipes.length);
  };
  
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((currentIndex + 1) % recipes.length);
  };
  
  // Touch gesture support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      handleNext({ stopPropagation: () => {} } as React.MouseEvent);
    }
    
    if (touchEnd - touchStart > 50) {
      handlePrev({ stopPropagation: () => {} } as React.MouseEvent);
    }
  };
  
  if (recipes.length === 0) {
    return <div className="h-[400px] flex items-center justify-center">No recipes available</div>;
  }
  
  return (
    <div 
      className="relative overflow-hidden rounded-xl shadow-lg"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel container */}
      <div className="relative h-[350px] sm:h-[400px] md:h-[450px]">
        {recipes.map((recipe, index) => (
          <div 
            key={recipe.id}
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10 transform scale-100' : 'opacity-0 z-0 transform scale-95'
            }`}
            onClick={() => router.push(`/recipes/${recipe.id}`)}
          >
            <Image
              src={getImageUrl(recipe.image)}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index === currentIndex}
            />
            
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            
            {/* Favorite button */}
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={(e) => onToggleFavorite(e, recipe.id)}
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
            
            {/* Recipe info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white z-20">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg leading-tight line-clamp-2">{recipe.title}</h2>
              <p className="text-sm md:text-base mb-3 opacity-90 line-clamp-2 max-w-3xl">{recipe.description}</p>
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="badge badge-sm sm:badge-md badge-primary">{recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}</span>
                <div className="flex items-center text-white text-xs md:text-sm">
                  <IconClock size={16} className="mr-1" />
                  {recipe.steps?.length ? recipe.steps.length * 5 : 30} min
                </div>
                <div className="text-xs md:text-sm">
                  {recipe.portion || 2} servings
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  className="btn btn-primary btn-sm sm:btn-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/recipes/${recipe.id}`);
                  }}
                >
                  View Recipe
                </button>
                
                <button 
                  className="btn btn-sm sm:btn-md btn-outline btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({
                        title: recipe.title,
                        text: `Check out this recipe: ${recipe.title}`,
                        url: window.location.origin + `/recipes/${recipe.id}`,
                      }).catch(err => console.log('Error sharing', err));
                    } else {
                      // Fallback for browsers that don't support the Web Share API
                      navigator.clipboard.writeText(window.location.origin + `/recipes/${recipe.id}`)
                        .then(() => showToast('Link copied to clipboard!', 'success'))
                        .catch(err => console.error('Failed to copy link:', err));
                    }
                  }}
                >
                  <IconShare size={16} className="mr-1" />
                  Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation buttons */}
      {recipes.length > 1 && (
        <>
          <button 
            className="absolute top-1/2 left-2 md:left-4 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg z-20 focus:outline-none opacity-80 hover:opacity-100"
            onClick={handlePrev}
            aria-label="Previous recipe"
          >
            <IconChevronLeft size={20} strokeWidth={2.5} />
          </button>
          
          <button 
            className="absolute top-1/2 right-2 md:right-4 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg z-20 focus:outline-none opacity-80 hover:opacity-100"
            onClick={handleNext}
            aria-label="Next recipe"
          >
            <IconChevronRight size={20} strokeWidth={2.5} />
          </button>
          
          {/* Indicator dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {recipes.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'w-6 bg-white' : 'bg-white/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Tab switcher that doesn't cause page jump
function TabSwitcher({ selectedTab, setSelectedTab }: {
  selectedTab: 'recipes' | 'ai-recipes',
  setSelectedTab: (tab: 'recipes' | 'ai-recipes') => void
}) {
  // Prevent default behavior to avoid page jumps
  const handleTabClick = (e: React.MouseEvent, tab: 'recipes' | 'ai-recipes') => {
    e.preventDefault();
    setSelectedTab(tab);
  };
  
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-base-200 p-1 rounded-full inline-flex shadow-md">
        <button
          className={`px-5 py-2 rounded-full transition-all text-sm font-medium ${
            selectedTab === 'recipes' 
              ? 'bg-primary text-white shadow-sm' 
              : 'hover:bg-base-300'
          }`}
          onClick={(e) => handleTabClick(e, 'recipes')}
        >
          Recipes
        </button>
        <button
          className={`px-5 py-2 rounded-full transition-all text-sm font-medium ${
            selectedTab === 'ai-recipes' 
              ? 'bg-primary text-white shadow-sm' 
              : 'hover:bg-base-300'
          }`}
          onClick={(e) => handleTabClick(e, 'ai-recipes')}
        >
          AI Recipes
        </button>
      </div>
    </div>
  );
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
  const { scroll, showScrollButton, scrollToTop } = useWindowScroll();

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

  // New state for daily recipes
  const [loadingDailyRecipes, setLoadingDailyRecipes] = useState(true);
  const [dailyRecipes, setDailyRecipes] = useState<Recipe[]>([]);
  const [activeIndex, setActiveIndex] = useState(0); // For carousel
    
  // Swipe handlers for the carousel
  const getSwipeHandlers = () => {
    let touchStartX = 0;
    let touchEndX = 0;
    
    return {
      onTouchStart: (e: React.TouchEvent) => {
        touchStartX = e.targetTouches[0].clientX;
      },
      onTouchMove: (e: React.TouchEvent) => {
        touchEndX = e.targetTouches[0].clientX;
      },
      onTouchEnd: () => {
        if (touchStartX - touchEndX > 50) {
          // Swipe left
          setActiveIndex((activeIndex + 1) % dailyRecipes.length);
        } else if (touchEndX - touchStartX > 50) {
          // Swipe right
          setActiveIndex((activeIndex - 1 + dailyRecipes.length) % dailyRecipes.length);
        }
      }
    };
  };
  
  // Function to handle favorite toggling (renamed for consistency)
  const onToggleFavorite = (e: React.MouseEvent, recipeId: number) => {
    e.stopPropagation();
    toggleFavorite(e, recipeId, true);
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
    
    // Also fetch daily recipes
    fetchDailyRecipes();
  }, [selectedTab]);
  
  // Fetch daily recipes
  const fetchDailyRecipes = async () => {
    try {
      setLoadingDailyRecipes(true);
      const res = await fetch('/api/daily-recipes');
      
      if (!res.ok) {
        throw new Error(`Failed to fetch daily recipes: ${res.status}`);
      }
      
      const data = await res.json();
      setDailyRecipes(data || []);
    } catch (error) {
      console.error('Error fetching daily recipes:', error);
    } finally {
      setLoadingDailyRecipes(false);
    }
  };

  // Reset activeIndex when dailyRecipes changes
  useEffect(() => {
    setActiveIndex(0);
  }, [dailyRecipes]);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (dailyRecipes.length <= 1) return;
    
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % dailyRecipes.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [dailyRecipes.length]);

  // Derived state for filtering
  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category).filter(Boolean)));
  const regions = Array.from(new Set(recipes.map((recipe) => recipe.region).filter(Boolean)));
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

  const toggleFavorite = async (e: React.MouseEvent, recipe_id: number, showToast: boolean) => {
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
        if (showToast) {
          showToast('Removed from favorites', 'success');
        }
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id }),
        });
        
        if (res.ok) {
          const newFavorite = await res.json();
          setFavorites([...favorites, newFavorite]);
          if (showToast) {
            showToast('Added to favorites', 'success');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorites', 'error');
    }
  };

  // Helper for image URL fallback
  const getImageUrl = (image: string): string => {
    return image && image.trim() !== ''
      ? image
      : 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
  };

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
      {showScrollButton && (
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

      {/* Enhanced Hero Section */}
      <div className="relative py-10 px-6 mb-12 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Your Kitchen Companion
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Discover, cook, and enjoy delicious recipes curated just for you
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => router.push('/recipes/add')}
              className="btn btn-primary"
            >
              Add Recipe
            </button>
            <button 
              onClick={() => router.push('/AI')}
              className="btn btn-outline btn-secondary"
            >
              Generate with AI
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-2 -left-2 w-12 h-12 rounded-full bg-primary/20 blur-xl"></div>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-secondary/20 blur-xl"></div>
      </div>
      
      {/* Daily Recipes Section with Enhanced Styling */}
      {!loadingDailyRecipes && dailyRecipes.length > 0 && (
        <div className="mb-16 relative">
          <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full bg-primary/10 blur-xl"></div>
          
          {/* Fancy header for daily recipes */}
          <div className="relative mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <div className="inline-block relative">
                  <span className="absolute -top-3 -left-3 text-xs font-bold px-2 py-1 bg-accent text-white rounded-lg rotate-[-6deg] shadow-md">
                    Daily Fresh
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Today's Culinary Inspirations
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
                  Fresh recipes updated daily to inspire your next cooking adventure. Discover new flavors and techniques to elevate your kitchen skills!
                </p>
              </div>
              <button 
                onClick={() => router.push('/daily-recipes')}
                className="btn btn-primary btn-md btn-outline gap-2"
              >
                <IconCalendarEvent size={18} />
                Explore All Daily Recipes
              </button>
            </div>
            
            {/* Decorative separator */}
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary rounded-full my-4"></div>
          </div>
          
          {/* Use RecipeCarousel component */}
          <RecipeCarousel 
            recipes={dailyRecipes}
            favorites={favorites}
            onToggleFavorite={(e, id) => toggleFavorite(e, id, true)}
            showToast={showToast}
          />
          
          {/* Featured Badge */}
          <div className="absolute -top-4 -right-4 bg-gradient-to-r from-secondary to-accent text-white py-1 px-4 rounded-full shadow-md text-sm font-semibold transform rotate-3">
            Chef's Selection
          </div>
        </div>
      )}

      {/* Tab Slider with enhanced styling */}
      <TabSwitcher selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

      {selectedTab === 'ai-recipes' && (
        <div className="flex justify-center mb-12">
          <div className="text-center max-w-xl">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Unlock a world of innovative recipes created with artificial intelligence. Let our AI chef inspire your next meal!
            </p>
            <button
              className="btn btn-secondary btn-lg rounded-full shadow-md hover:shadow-lg transition-shadow"
              onClick={() => router.push('/AI')}
            >
              <IconRobot className="mr-2" size={20} />
              Generate New Recipe with AI
            </button>
          </div>
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
                    <option key={category || 'unknown-category'} value={category || ''}>
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
                    <option key={region || 'unknown-region'} value={region || ''}>
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
                      toggleFavorite(e, recipe.id, true);
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
                      key={category || 'unknown-category'}
                      onClick={() => setSelectedCategory(category || '')}
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
                      key={region || 'unknown-region'}
                      onClick={() => setSelectedRegion(region || '')}
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

async function toggleFavorite(recipe_id: number, showToast: boolean): Promise<void> {
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
