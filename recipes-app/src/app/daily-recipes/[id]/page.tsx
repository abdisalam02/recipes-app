"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  IconChefHat,
  IconClock,
  IconArrowDown,
  IconHeart,
  IconHeartFilled,
  IconShoppingCart,
  IconListCheck,
  IconX,
  IconRocket,
} from "@tabler/icons-react";
import { Favorite } from "../../../../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "../../components/FloatingNavigation";
import { MinimalistLoader } from "../../components/MinimalistLoader";
import { useTheme } from "../../contexts/ThemeContext";

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
  nutritional_info?: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber: number;
    sugar: number;
    sodium: number;
    cholesterol: number;
  };
}

// Custom hook to get window scroll position
function useWindowScroll() {
  const [scroll, setScroll] = useState({ y: 0 });
  useEffect(() => {
    const handleScroll = () => setScroll({ y: window.scrollY });
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return scroll;
}

// Toast notification component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`${
          type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white px-4 py-3 rounded-lg shadow-lg flex items-center`}
      >
        <span className="ml-2">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Steps Modal Component
const StepsModal = ({
  steps,
  onClose,
}: {
  steps: { order: number; description: string }[];
  onClose: () => void;
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = steps.length;

  // Define an array of background colors for steps
  const bgColors = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-indigo-500 to-blue-600",
  ];

  // Get current background color based on step index
  const currentBgColor = bgColors[currentStep % bgColors.length];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      {/* Blurred backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md"
        onClick={onClose}
      ></div>

      <div
        className={`relative max-w-md w-full mx-4 rounded-2xl overflow-hidden shadow-2xl`}
        style={{ maxHeight: "calc(100vh - 40px)" }}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-300 z-10">
          <div
            className="h-full bg-white"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div
          className={`bg-gradient-to-br ${currentBgColor} p-4 sm:p-6 pt-6 overflow-y-auto`}
          style={{ maxHeight: "calc(100vh - 40px)" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white z-10"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Step counter */}
          <div className="text-white/80 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Step {currentStep + 1} of {totalSteps}
          </div>

          {/* Step content */}
          <div className="text-white">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                {currentStep + 1}
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">
              {steps[currentStep].description}
            </h3>

            <p className="text-white/90 text-sm sm:text-base text-center mb-6 sm:mb-8">
              Follow this step carefully before moving to the next one.
            </p>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6 sm:mt-8">
            <button
              onClick={prevStep}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base ${
                currentStep === 0
                  ? "bg-white/20 text-white/50 cursor-not-allowed"
                  : "bg-white/30 text-white hover:bg-white/40"
              }`}
              disabled={currentStep === 0}
            >
              Previous
            </button>

            <button
              onClick={nextStep}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white text-gray-900 font-medium hover:bg-opacity-90 text-sm sm:text-base"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DailyRecipeDetailPage() {
  const params = useParams();
  const recipeId = params?.id;
  const router = useRouter();
  const scroll = useWindowScroll();
  const fullNutritionalInfoRef = useRef<HTMLDivElement>(null);
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(
    () => themes.find((t) => t.name === theme) || themes[0],
    [theme, themes]
  );

  const [recipe, setRecipe] = useState<DailyRecipeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [currentPortions, setCurrentPortions] = useState<number>(1);
  const [availableIngredients, setAvailableIngredients] = useState<{
    [key: string]: boolean;
  }>({});
  const [stepsModalOpen, setStepsModalOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Move imageUrl useMemo to the top with other hooks
  const imageUrl = useMemo(
    () =>
      recipe && recipe.image && recipe.image.trim() !== ""
        ? recipe.image
        : "/default-image.png",
    [recipe?.image]
  );

  // Function to show toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  // Function to hide toast
  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  // Helper function to clean HTML
  const cleanHtml = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  // Parse steps from instructions
  const parseSteps = (
    instructions: string
  ): Array<{ order: number; description: string }> => {
    if (!instructions) return [];

    // If instructions are already in HTML list format
    if (instructions.includes("<li>")) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = instructions;
      const listItems = tempDiv.querySelectorAll("li");

      return Array.from(listItems).map((item, index) => ({
        order: index + 1,
        description: item.textContent || `Step ${index + 1}`,
      }));
    }

    // Otherwise, split by periods or line breaks
    const text = cleanHtml(instructions);
    const sentences = text.split(/[.\n]+/).filter((s) => s.trim().length > 0);

    return sentences.map((sentence, index) => ({
      order: index + 1,
      description: sentence.trim(),
    }));
  };

  // Fetch recipe details
  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        setLoading(true);

        // Fetch all daily recipes
        const res = await fetch("/api/daily-recipes");

        if (!res.ok) {
          throw new Error(`Failed to fetch recipes: ${res.status}`);
        }

        const recipes = await res.json();

        // Find the recipe with matching ID
        const matchingRecipe = recipes.find(
          (r: DailyRecipeItem) => r.id.toString() === recipeId
        );

        if (!matchingRecipe) {
          throw new Error("Recipe not found");
        }

        setRecipe(matchingRecipe);
        setCurrentPortions(
          matchingRecipe.servings || matchingRecipe.portion || 1
        );

        // Initialize ingredient availability
        if (matchingRecipe.ingredients) {
          const initialAvailability: { [key: string]: boolean } = {};
          matchingRecipe.ingredients.forEach((_, index) => {
            const ingredientKey = `${index}-${
              matchingRecipe.ingredients![index].name
            }`;
            initialAvailability[ingredientKey] = false;
          });
          setAvailableIngredients(initialAvailability);
        }

        // Fetch favorites to show favorite status
        try {
          const favRes = await fetch("/api/favorites");
          if (favRes.ok) {
            const favData = await favRes.json();
            setFavorites(favData || []);
          }
        } catch (favError) {
          console.error("Error fetching favorites:", favError);
        }
      } catch (error) {
        console.error("Error fetching recipe details:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipeDetails();
    }
  }, [recipeId]);

  // Toggle favorite state
  const toggleFavorite = async () => {
    if (!recipe) return;

    try {
      const isFavorited = favorites.some((fav) => fav.recipe_id === recipe.id);

      if (isFavorited) {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: recipe.id }),
        });

        setFavorites(favorites.filter((fav) => fav.recipe_id !== recipe.id));
        showToast("Removed from favorites", "success");
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: recipe.id }),
        });

        if (res.ok) {
          const newFavorite = await res.json();
          setFavorites([...favorites, newFavorite]);
          showToast("Added to favorites", "success");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast("Failed to update favorite status", "error");
    }
  };

  const handleIngredientToggle = (ingredientKey: string) => {
    setAvailableIngredients((prev) => ({
      ...prev,
      [ingredientKey]: !prev[ingredientKey],
    }));
  };

  const scrollToFullInfo = () => {
    if (fullNutritionalInfoRef.current) {
      fullNutritionalInfoRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <MinimalistLoader message="Loading Recipe..." size="lg" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <div
          className="p-12 rounded-3xl text-center max-w-md shadow-2xl"
          style={{ backgroundColor: currentTheme.colors.surface }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
            }}
          >
            <IconX size={48} className="text-white" />
          </motion.div>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: currentTheme.colors.text }}
          >
            {error ? "Error" : "Recipe Not Found"}
          </h2>
          <p
            className="mb-6"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            {error || "The recipe you are looking for does not exist."}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/daily-recipes")}
            className="text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
            }}
          >
            Back to Daily Recipes
          </motion.button>
        </div>
      </div>
    );
  }

  const isFavorited = favorites.some((fav) => fav.recipe_id === recipe.id);

  // Calculate scaling factor for portions
  const scalingFactor =
    currentPortions / (recipe.servings || recipe.portion || 1);

  // Process nutritional info if available
  const scaledNutritionalInfo = recipe.nutritional_info
    ? {
        calories: Math.round(recipe.nutritional_info.calories * scalingFactor),
        protein: +(recipe.nutritional_info.protein * scalingFactor).toFixed(1),
        fat: +(recipe.nutritional_info.fat * scalingFactor).toFixed(1),
        carbohydrates: +(
          recipe.nutritional_info.carbohydrates * scalingFactor
        ).toFixed(1),
        fiber: +(recipe.nutritional_info.fiber * scalingFactor).toFixed(1),
        sugar: +(recipe.nutritional_info.sugar * scalingFactor).toFixed(1),
        sodium: +(recipe.nutritional_info.sodium * scalingFactor).toFixed(1),
        cholesterol: +(
          recipe.nutritional_info.cholesterol * scalingFactor
        ).toFixed(1),
      }
    : null;

  // Parse steps from instructions
  const steps = recipe.instructions ? parseSteps(recipe.instructions) : [];

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      {/* Background Image with Parallax Effect */}
      <div className="fixed inset-0 z-0">
        <Image
          src={imageUrl}
          alt={recipe.title}
          fill
          className="object-cover opacity-30 blur-sm scale-110"
          sizes="100vw"
          priority
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/default-image.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Toast notification */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}

        <div
          className="rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl bg-white/90 border border-white/30 overflow-hidden"
          style={{ backgroundColor: `${currentTheme.colors.surface}f5` }}
        >
          {/* Hero Image Section */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full rounded-2xl overflow-hidden">
            <Image
              src={imageUrl}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/default-image.png";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={toggleFavorite}
                className="btn btn-circle bg-white/80 hover:bg-white border-none"
                aria-label={
                  isFavorited ? "Remove from favorites" : "Add to favorites"
                }
              >
                {isFavorited ? (
                  <IconHeartFilled size={20} className="text-red-500" />
                ) : (
                  <IconHeart size={20} className="text-gray-500" />
                )}
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                {recipe.title}
              </h2>
              <div className="flex items-center gap-2">
                <span className="badge badge-lg bg-primary text-white border-none">
                  {recipe.category.charAt(0).toUpperCase() +
                    recipe.category.slice(1)}
                </span>
                <div className="flex items-center text-white text-sm">
                  <IconClock size={18} className="mr-1" />
                  {recipe.readyInMinutes || 30} min
                </div>
                <span className="text-sm opacity-90">
                  {currentPortions}{" "}
                  {currentPortions === 1 ? "serving" : "servings"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {/* Start Recipe Button */}
            {steps.length > 0 && (
              <div className="flex justify-center -mt-8 sm:-mt-10 md:-mt-16 mb-6 relative z-10">
                <button
                  onClick={() => setStepsModalOpen(true)}
                  className="btn btn-primary rounded-full shadow-lg px-6 py-2 sm:px-8 sm:py-3 hover:scale-105 transition-transform text-sm sm:text-base"
                >
                  Start Cooking
                </button>
              </div>
            )}

            {/* Description Section */}
            <p className="text-base sm:text-lg mb-6 sm:mb-8">
              {recipe.description}
            </p>

            {/* Simplified Nutritional Info - Only Calories and Protein */}
            {scaledNutritionalInfo && (
              <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8 p-4 backdrop-blur-lg bg-white/60 border border-white/20 rounded-xl">
                <div className="text-center">
                  <div
                    className="text-xl sm:text-2xl font-bold mb-1"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    {scaledNutritionalInfo.calories}
                  </div>
                  <div
                    className="text-xs sm:text-sm uppercase tracking-wide"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Calories
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-xl sm:text-2xl font-bold mb-1"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    {scaledNutritionalInfo.protein}g
                  </div>
                  <div
                    className="text-xs sm:text-sm uppercase tracking-wide"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Protein
                  </div>
                </div>

                {/* Link to full nutritional info */}
                <div className="col-span-2 text-center mt-2">
                  <button
                    onClick={scrollToFullInfo}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: `${currentTheme.colors.primary}20`,
                      color: currentTheme.colors.primary,
                    }}
                  >
                    View Full Nutritional Info
                  </button>
                </div>
              </div>
            )}

            {/* Portion Control Section */}
            <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8 p-4 backdrop-blur-lg bg-white/60 border border-white/20 rounded-xl">
              <span className="font-semibold text-sm sm:text-base">
                Adjust Portions:
              </span>
              <div className="flex items-center">
                <button
                  onClick={() =>
                    setCurrentPortions(Math.max(1, currentPortions - 1))
                  }
                  className="btn btn-circle btn-sm"
                  disabled={currentPortions <= 1}
                >
                  -
                </button>
                <span className="mx-3 sm:mx-4 font-bold">
                  {currentPortions}
                </span>
                <button
                  onClick={() => setCurrentPortions(currentPortions + 1)}
                  className="btn btn-circle btn-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center">
                <IconShoppingCart className="mr-2" size={20} />
                Ingredients
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                {recipe.ingredients?.map((ingredient, index) => {
                  const scaledQuantity = (
                    ingredient.quantity * scalingFactor
                  ).toFixed(ingredient.quantity % 1 === 0 ? 0 : 1);
                  const ingredientKey = `${index}-${ingredient.name}`;

                  return (
                    <div
                      key={ingredientKey}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={availableIngredients[ingredientKey] || false}
                        onChange={() => handleIngredientToggle(ingredientKey)}
                        className="checkbox checkbox-primary checkbox-sm"
                      />
                      <span
                        className={
                          availableIngredients[ingredientKey]
                            ? "line-through opacity-60 text-sm sm:text-base"
                            : "text-sm sm:text-base"
                        }
                      >
                        <span className="font-medium">
                          {scaledQuantity} {ingredient.unit}
                        </span>{" "}
                        {ingredient.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* View Source Button */}
            {recipe.sourceUrl && (
              <div className="mb-6">
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-primary"
                >
                  View Original Recipe
                </a>
              </div>
            )}

            {/* Steps Section - Simplified without dropdowns */}
            {steps.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center">
                  <IconListCheck className="mr-2" size={20} />
                  Steps
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  {steps.map((step) => (
                    <div
                      key={step.order}
                      className="p-3 sm:p-4 bg-base-200 rounded-xl"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 text-sm sm:text-base">
                          {step.order}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm sm:text-lg">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Nutritional Info Section */}
            {scaledNutritionalInfo && (
              <>
                <div ref={fullNutritionalInfoRef}></div>
                <h3 className="text-2xl font-semibold mt-8 mb-4">
                  Complete Nutritional Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-base-200 rounded-xl">
                  <div className="stat bg-base-100 rounded-lg shadow-sm">
                    <div className="stat-title text-xs">Calories</div>
                    <div className="stat-value text-primary text-2xl">
                      {scaledNutritionalInfo.calories}
                    </div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow-sm">
                    <div className="stat-title text-xs">Protein</div>
                    <div className="stat-value text-2xl">
                      {scaledNutritionalInfo.protein}g
                    </div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow-sm">
                    <div className="stat-title text-xs">Fat</div>
                    <div className="stat-value text-2xl">
                      {scaledNutritionalInfo.fat}g
                    </div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow-sm">
                    <div className="stat-title text-xs">Carbs</div>
                    <div className="stat-value text-2xl">
                      {scaledNutritionalInfo.carbohydrates}g
                    </div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow-sm">
                    <div className="stat-title text-xs">Fiber</div>
                    <div className="stat-value text-2xl">
                      {scaledNutritionalInfo.fiber}g
                    </div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow-sm">
                    <div className="stat-title text-xs">Sugar</div>
                    <div className="stat-value text-2xl">
                      {scaledNutritionalInfo.sugar}g
                    </div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow-sm">
                    <div className="stat-title text-xs">Sodium</div>
                    <div className="stat-value text-2xl">
                      {scaledNutritionalInfo.sodium}mg
                    </div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow-sm">
                    <div className="stat-title text-xs">Cholesterol</div>
                    <div className="stat-value text-2xl">
                      {scaledNutritionalInfo.cholesterol}mg
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Back Button */}
            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/daily-recipes")}
                className="text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                }}
              >
                Back to Daily Recipes
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll-to-Top Button */}
      <AnimatePresence>
        {scroll.y > 100 && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 left-4 z-40 shadow-lg p-3 rounded-full hover:shadow-xl transition-shadow md:bottom-6"
            style={{
              backgroundColor: currentTheme.colors.background,
              border: `1px solid ${currentTheme.colors.primary}30`,
            }}
          >
            <IconArrowDown
              size={20}
              className="rotate-180"
              style={{ color: currentTheme.colors.text }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Steps Modal for "Start Recipe" Feature */}
      {stepsModalOpen && steps.length > 0 && (
        <StepsModal steps={steps} onClose={() => setStepsModalOpen(false)} />
      )}

      {/* Floating Navigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
