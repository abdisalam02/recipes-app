"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowUp,
  IconArrowDown,
  IconX,
  IconShoppingCart,
  IconListCheck,
  IconChefHat,
  IconScale,
  IconCalculator,
  IconPlus,
  IconTrash,
  IconApple,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { searchRecipes } from "./recipe-search";
import { fetchGoogleImages } from "../../../lib/googleSearch";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { LoadingOverlay } from "../components/MinimalistLoader";

const AnimatedInstructions: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="mb-8 text-center"
    >
      <h2 className="text-2xl font-bold mb-2">
        Welcome to AI Recipe Generator!
      </h2>
      <p className="text-lg">
        Enter your ingredients and preferences below, then click "Generate
        Recipe" to see your custom AI recipe.
      </p>
    </motion.div>
  );
};

const ImageSlider: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validImages, setValidImages] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to validate image URL - modified to avoid CORS issues
  const isValidImageUrl = async (url: string): Promise<boolean> => {
    try {
      // Skip actual fetch for external URLs to avoid CORS issues
      // Basic URL validation (check if it has an image file extension)
      const isImageUrl = /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(url);

      // If URL doesn't have an image extension, we'll trust it's an image if it comes from known image domains
      const knownImageDomains = [
        "images.unsplash.com",
        "img.freepik.com",
        "cdn.pixabay.com",
        "media.istockphoto.com",
        "images.pexels.com",
        "upload.wikimedia.org",
        "i.imgur.com",
        "example.com/images",
        "simplyrecipes.com",
        "blogger.googleusercontent.com",
        "hannahmageerd.com",
      ];

      const isKnownImageDomain = knownImageDomains.some((domain) =>
        url.includes(domain)
      );

      return isImageUrl || isKnownImageDomain;
    } catch (error) {
      console.error(`Error validating image URL ${url}:`, error);
      return false;
    }
  };

  // Function to filter and validate image URLs using stricter domain matching
  const filterAndValidateImages = async (urls: string[]): Promise<string[]> => {
    const excludedDomains = [
      "nutrisystem.com",
      "leaf.nutrisystem.com",
      "edgesuite.net",
      "errors.edgesuite.net",
    ];

    const filteredUrls = urls.filter((url) => {
      if (!url || url.trim() === "") return false;
      try {
        const urlObj = new URL(url);
        return !excludedDomains.some(
          (domain) =>
            urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );
      } catch {
        return false;
      }
    });

    // Then validate each remaining URL
    const validationPromises = filteredUrls.map((url) => isValidImageUrl(url));
    const validationResults = await Promise.all(validationPromises);
    return filteredUrls.filter((_, index) => validationResults[index]);
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/ai-recipes");
        if (!res.ok) {
          throw new Error("Failed to fetch AI recipes for slider");
        }
        const data = await res.json();
        // Extract image URLs
        const urls = data.map((r: any) => r.image).filter(Boolean);
        // Filter and validate images
        const validatedImages = await filterAndValidateImages(urls);
        // Set both raw and validated images
        setImages(urls);
        setValidImages(validatedImages);
      } catch (error: any) {
        console.error("Error fetching images:", error.message);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (validImages.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % validImages.length);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [validImages]);

  // Only render if we have valid images
  if (validImages.length === 0) return null;

  return (
    <div className="w-full h-64 mb-8 relative overflow-hidden rounded-lg shadow-lg">
      <AnimatePresence>
        <motion.img
          key={validImages[currentIndex]}
          src={validImages[currentIndex]}
          alt="AI Recipe Slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="w-full h-64 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/default-recipe-image.jpg"; // Fallback image
          }}
        />
      </AnimatePresence>
    </div>
  );
};

// StepsModal Component with improved design matching recipe detail page
const StepsModal: React.FC<{
  steps: { id: number; order: number; description: string }[];
  onClose: () => void;
}> = ({ steps, onClose }) => {
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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex justify-center items-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Blurred backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md"
          onClick={onClose}
        ></div>

        <motion.div
          className={`relative max-w-md w-full mx-4 rounded-2xl overflow-hidden shadow-2xl`}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          style={{ maxHeight: "calc(100vh - 40px)" }}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-300 z-10">
            <motion.div
              className="h-full bg-white"
              initial={{ width: `${(currentStep / totalSteps) * 100}%` }}
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
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
              <IconX size={20} />
            </button>

            {/* Step counter */}
            <div className="text-white/80 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              Step {currentStep + 1} of {totalSteps}
            </div>

            {/* Step content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-white"
            >
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
            </motion.div>

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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function useWindowScroll() {
  const [scroll, setScroll] = useState({ y: 0 });
  useEffect(() => {
    const handleScroll = () => setScroll({ y: window.scrollY });
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return scroll;
}

// Function to fetch food image with fallback
const fetchFoodImage = async (foodName: string): Promise<string> => {
  try {
    console.log(`Fetching image for food: ${foodName}`);
    // Try to get image from Google CSE
    const images = await fetchGoogleImages(`${foodName} food`, 1);

    if (images && images.length > 0) {
      console.log(`Found image for ${foodName}: ${images[0]}`);
      return images[0];
    }

    console.log(
      `No images found from Google CSE for ${foodName}, using fallback`
    );
    // If Google CSE failed or returned no results, use default fallback
    return "https://images.unsplash.com/photo-1495195134817-aeb325a55b65";
  } catch (error) {
    console.error(`Error fetching image for ${foodName}:`, error);
    // In case of any error, use fallback
    return "https://images.unsplash.com/photo-1495195134817-aeb325a55b65";
  }
};

export default function AiRecipePage() {
  const router = useRouter();
  const [ingredientsInput, setIngredientsInput] = useState<string>("");
  const [preferences, setPreferences] = useState<string>("");
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentPortions, setCurrentPortions] = useState<number>(1);
  const [stepsModalOpen, setStepsModalOpen] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState(0);
  const fullNutritionalInfoRef = useRef<HTMLDivElement>(null);
  const scroll = useWindowScroll();

  // New state for calorie counter feature
  const [activeMode, setActiveMode] = useState<
    "recipe-generator" | "calorie-counter"
  >("recipe-generator");
  const [mealEntries, setMealEntries] = useState<
    Array<{
      id: string;
      description: string;
      isAI: boolean;
      portion: number;
      nutritionalInfo: any;
      fromRecipe: boolean;
      recipeId?: number;
      time: string;
      tempLoading?: boolean;
      error?: string;
      source?: string;
      image?: string | null;
      imageLoading?: boolean;
      quantity?: number;
      unit?: string;
      components?: Array<{
        name: string;
        quantity: number;
        unit: string;
        nutritionalInfo: any;
      }>;
    }>
  >([]);
  const [newMealInput, setNewMealInput] = useState<string>("");
  const [newMealPortion, setNewMealPortion] = useState<number>(1);
  const [newMealTime, setNewMealTime] = useState<string>("breakfast");
  const [loadingNutrition, setLoadingNutrition] = useState<boolean>(false);
  const [availableRecipes, setAvailableRecipes] = useState<Array<any>>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [isRecipeDropdownOpen, setIsRecipeDropdownOpen] =
    useState<boolean>(false);
  const [dailyTotals, setDailyTotals] = useState<any>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    cholesterol: 0,
  });

  // Add a new state for recipe search
  const [recipeSearchQuery, setRecipeSearchQuery] = useState<string>("");
  const [filteredRecipes, setFilteredRecipes] = useState<Array<any>>([]);

  // Add this state for the detailed nutrients modal
  const [showNutrientDetails, setShowNutrientDetails] =
    useState<boolean>(false);

  useEffect(() => {
    setScrollY(scroll.y);
  }, [scroll.y]);

  // Fetch available recipes for the dropdown
  useEffect(() => {
    if (activeMode === "calorie-counter") {
      const fetchRecipes = async () => {
        try {
          const response = await fetch("/api/recipes");
          if (response.ok) {
            const data = await response.json();
            setAvailableRecipes(data);
          }
        } catch (error) {
          console.error("Error fetching recipes:", error);
        }
      };

      fetchRecipes();
    }
  }, [activeMode]);

  // Calculate daily totals whenever meal entries change
  useEffect(() => {
    const calculateTotals = () => {
      const totals = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
      };

      // Safe addition function to handle null/undefined/NaN values
      const safeAdd = (a: number, b: number | null | undefined) => {
        // If b is null, undefined, or NaN, return a
        if (b === null || b === undefined || isNaN(b)) {
          return a;
        }
        // Otherwise add them
        return a + b;
      };

      mealEntries.forEach((entry) => {
        if (entry.nutritionalInfo) {
          // Scale by portion
          const scalingFactor = entry.portion || 1;

          // Use safe addition to handle potentially bad data
          totals.calories = safeAdd(
            totals.calories,
            entry.nutritionalInfo.calories * scalingFactor
          );
          totals.protein = safeAdd(
            totals.protein,
            entry.nutritionalInfo.protein * scalingFactor
          );
          totals.fat = safeAdd(
            totals.fat,
            entry.nutritionalInfo.fat * scalingFactor
          );
          totals.carbohydrates = safeAdd(
            totals.carbohydrates,
            entry.nutritionalInfo.carbohydrates * scalingFactor
          );
          totals.fiber = safeAdd(
            totals.fiber,
            entry.nutritionalInfo.fiber * scalingFactor
          );
          totals.sugar = safeAdd(
            totals.sugar,
            entry.nutritionalInfo.sugar * scalingFactor
          );
          totals.sodium = safeAdd(
            totals.sodium,
            entry.nutritionalInfo.sodium * scalingFactor
          );
          totals.cholesterol = safeAdd(
            totals.cholesterol,
            entry.nutritionalInfo.cholesterol * scalingFactor
          );
        }
      });

      // Return totals with values rounded to 1 decimal place
      return {
        calories: Math.round(totals.calories * 10) / 10,
        protein: Math.round(totals.protein * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        carbohydrates: Math.round(totals.carbohydrates * 10) / 10,
        fiber: Math.round(totals.fiber * 10) / 10,
        sugar: Math.round(totals.sugar * 10) / 10,
        sodium: Math.round(totals.sodium * 10) / 10,
        cholesterol: Math.round(totals.cholesterol * 10) / 10,
      };
    };

    const totals = calculateTotals();
    setDailyTotals(totals);
  }, [mealEntries]);

  // Replace the recipe filtering useEffect with a simpler version
  useEffect(() => {
    if (availableRecipes.length > 0) {
      // Use the imported search function
      setFilteredRecipes(searchRecipes(availableRecipes, recipeSearchQuery));
    } else {
      setFilteredRecipes([]);
    }
  }, [recipeSearchQuery, availableRecipes]);

  const generateRecipe = async () => {
    setLoading(true);
    setError("");
    setGeneratedRecipe(null);
    try {
      const prompt =
        `Generate a creative recipe using these ingredients: ${ingredientsInput}. ` +
        (preferences ? `Include these preferences: ${preferences}. ` : "") +
        `Provide a title, a short description, a list of ingredients with quantities (in grams) and units, detailed step-by-step instructions, a portion size, and an image URL if possible.
Format the answer as JSON with the following structure:
{
  "title": string,
  "description": string,
  "image": string,
  "portion": number,
  "ingredients": [{ "name": string, "quantity": number, "unit": string }],
  "steps": [{ "order": number, "description": string }],
  "nutritional_info": { "calories": number, "protein": number, "fat": number, "carbohydrates": number, "fiber": number, "sugar": number, "sodium": number, "cholesterol": number },
  "per_ingredient_nutritional_info": [{ "ingredient": string, "calories": number, "protein": number, "fat": number, "carbohydrates": number, "fiber": number, "sugar": number, "sodium": number, "cholesterol": number }]
}`;
      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate recipe.");
      }
      setGeneratedRecipe(data.recipe);
      setCurrentPortions(data.recipe.portion || 1);
    } catch (err: any) {
      console.error("Recipe generation error:", err);
      setError(err.message || "An error occurred while generating the recipe.");
    } finally {
      setLoading(false);
    }
  };

  const handlePortionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentPortions(Number(e.target.value));
  };

  const scalingFactor = generatedRecipe
    ? currentPortions / generatedRecipe.portion
    : 1;

  const scaledNutritionalInfo =
    generatedRecipe && generatedRecipe.nutritional_info
      ? {
          calories: generatedRecipe.nutritional_info.calories * scalingFactor,
          protein: generatedRecipe.nutritional_info.protein * scalingFactor,
          fat: generatedRecipe.nutritional_info.fat * scalingFactor,
          carbohydrates:
            generatedRecipe.nutritional_info.carbohydrates * scalingFactor,
          fiber: generatedRecipe.nutritional_info.fiber * scalingFactor,
          sugar: generatedRecipe.nutritional_info.sugar * scalingFactor,
          sodium: generatedRecipe.nutritional_info.sodium * scalingFactor,
          cholesterol:
            generatedRecipe.nutritional_info.cholesterol * scalingFactor,
        }
      : null;

  // New functions for calorie counter
  const handleAddAIFoodEntry = async () => {
    if (!newMealInput.trim()) {
      setError("Please enter a meal description");
      return;
    }

    // Create a temporary entry with loading state while we wait for the nutritional data
    const tempId = `meal-${Date.now()}`;
    const tempEntry = {
      id: tempId,
      description: newMealInput.trim(),
      isAI: true,
      portion: newMealPortion,
      nutritionalInfo: null,
      time: newMealTime,
      tempLoading: true,
      fromRecipe: false,
      source: "Loading...",
      imageLoading: true, // Add image loading state
    };

    // Add the temporary entry to the list
    setMealEntries((prev) => [...prev, tempEntry]);

    // Clear the input
    setNewMealInput("");

    // Start fetching image in parallel with nutritional info
    let foodImage: string | null = null;
    const fetchImagePromise = (async () => {
      try {
        // Fetch image from Google
        const images = await fetchGoogleImages(tempEntry.description, 1);
        if (images && images.length > 0) {
          foodImage = images[0];
        } else {
          // Fallback if Google search returns no results
          console.log("Google image search failed, using fallback method");
          // Try to fetch a default image based on food category
          const fallbackImages: { [key: string]: string } = {
            pizza:
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
            cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
            burger:
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
            chicken:
              "https://images.unsplash.com/photo-1587593810167-a84920ea0781",
            salad:
              "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
            pasta: "https://images.unsplash.com/photo-1556761223-4c4282c73f77",
            default:
              "https://images.unsplash.com/photo-1495195134817-aeb325a55b65",
          };

          // Find a matching category in the food description
          const description = tempEntry.description.toLowerCase();
          for (const [category, url] of Object.entries(fallbackImages)) {
            if (description.includes(category)) {
              foodImage = url;
              break;
            }
          }

          // Use default food image if no category matches
          if (!foodImage) {
            foodImage = fallbackImages.default;
          }
        }
      } catch (error) {
        console.error("Error fetching food image:", error);
        // Provide a generic food image as ultimate fallback
        foodImage =
          "https://images.unsplash.com/photo-1495195134817-aeb325a55b65";
      }
    })();

    try {
      // Fetch nutritional info from API
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          foodDescription: tempEntry.description,
        }),
      });

      // Wait for the image fetch to complete as well
      await fetchImagePromise;

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Nutritional API response:", data);

      // Update the temporary entry with actual data
      setMealEntries((prev) =>
        prev.map((entry) => {
          if (entry.id === tempId) {
            // Check if this is a composite food with components
            if (
              data.isComposite &&
              data.components &&
              data.components.length > 0
            ) {
              return {
                ...entry,
                description: data.description,
                nutritionalInfo: data.nutritionalInfo,
                tempLoading: false,
                source: data.source || "Combined Components",
                components: data.components,
                image: foodImage, // Add the fetched image
                imageLoading: false,
              };
            }
            // Handle single food items
            else if (data.nutritionalInfo) {
              return {
                ...entry,
                description: data.name || data.description,
                nutritionalInfo: data.nutritionalInfo,
                tempLoading: false,
                source: data.source || "API",
                unit: data.unit,
                quantity: data.quantity,
                image: foodImage, // Add the fetched image
                imageLoading: false,
              };
            }
            // Handle error case
            else {
              return {
                ...entry,
                tempLoading: false,
                error: "Couldn't retrieve nutritional information",
                source: "Error",
                image: foodImage, // Still add the image even if nutrition fails
                imageLoading: false,
              };
            }
          }
          return entry;
        })
      );
    } catch (error: any) {
      console.error("Error fetching nutritional info:", error);

      // Update the temporary entry with error state
      setMealEntries((prev) =>
        prev.map((entry) => {
          if (entry.id === tempId) {
            return {
              ...entry,
              tempLoading: false,
              error: error.message || "Failed to fetch nutritional information",
              source: "Error",
              image: foodImage, // Add the image even if there's an error
              imageLoading: false,
            };
          }
          return entry;
        })
      );
    }
  };

  const handleAddRecipeEntry = async (recipeId: number) => {
    setLoadingNutrition(true);

    try {
      const recipe = availableRecipes.find((r) => r.id === recipeId);
      if (!recipe) {
        throw new Error("Recipe not found");
      }

      console.log("Adding recipe to food entries:", recipe);

      // Generate ingredient breakdown for recipes
      let ingredientBreakdown = [];

      if (
        recipe.recipe_ingredients &&
        Array.isArray(recipe.recipe_ingredients)
      ) {
        // Calculate total calories
        const totalCalories = recipe.nutritional_info?.calories || 0;

        // Create breakdown from recipe ingredients
        ingredientBreakdown = recipe.recipe_ingredients.map(
          (ingredient: any) => {
            const caloriesPerIngredient =
              totalCalories / recipe.recipe_ingredients.length; // Simple estimation
            return {
              name: ingredient.ingredient?.name || "Unknown ingredient",
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              displayText: `${ingredient.ingredient?.name || "Unknown"} (${
                ingredient.quantity
              }${ingredient.unit})`,
              calories: caloriesPerIngredient / (recipe.portion || 1), // Normalize per portion
              protein: 0, // We don't have per-ingredient breakdown for recipes
              fat: 0,
              carbs: 0,
              source: "recipe_ingredient",
              percentOfTotal: (
                (caloriesPerIngredient / totalCalories) *
                100
              ).toFixed(1),
            };
          }
        );
      }

      console.log(
        "Recipe portion:",
        recipe.portion,
        "User portion:",
        newMealPortion
      );
      console.log("Original nutritional info:", recipe.nutritional_info);

      // Get the recipe's default portion size, default to 1 if missing
      const recipeDefaultPortion = recipe.portion || 1;

      // Scale nutritional values properly by normalizing to one portion then multiplying by user-selected portion
      const newEntry = {
        id: `recipe-${Date.now()}`,
        description: recipe.title,
        isAI: false,
        portion: newMealPortion,
        image: recipe.image,
        nutritionalInfo: recipe.nutritional_info
          ? {
              // Normalize by dividing by default portion, then multiply by user-selected portion
              calories:
                (recipe.nutritional_info.calories / recipeDefaultPortion) *
                newMealPortion,
              protein:
                (recipe.nutritional_info.protein / recipeDefaultPortion) *
                newMealPortion,
              fat:
                (recipe.nutritional_info.fat / recipeDefaultPortion) *
                newMealPortion,
              carbohydrates:
                (recipe.nutritional_info.carbohydrates / recipeDefaultPortion) *
                newMealPortion,
              fiber:
                (recipe.nutritional_info.fiber / recipeDefaultPortion) *
                newMealPortion,
              sugar:
                (recipe.nutritional_info.sugar / recipeDefaultPortion) *
                newMealPortion,
              sodium:
                (recipe.nutritional_info.sodium / recipeDefaultPortion) *
                newMealPortion,
              cholesterol:
                (recipe.nutritional_info.cholesterol / recipeDefaultPortion) *
                newMealPortion,
              ingredientBreakdown: ingredientBreakdown,
            }
          : null,
        fromRecipe: true,
        recipeId: recipe.id,
        time: newMealTime,
      };

      console.log("Normalized nutritional info:", newEntry.nutritionalInfo);

      setMealEntries((prev) => [...prev, newEntry]);
      setSelectedRecipe(null);
      setIsRecipeDropdownOpen(false);
      setNewMealPortion(1);
    } catch (error: any) {
      console.error("Error adding recipe:", error);
      setError("Failed to add recipe: " + error.message);
    } finally {
      setLoadingNutrition(false);
    }
  };

  const handleRemoveMealEntry = (entryId: string) => {
    setMealEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const handleUpdatePortion = (entryId: string, newPortion: number) => {
    setMealEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, portion: newPortion } : entry
      )
    );
  };

  const resetCalorieCounter = () => {
    setMealEntries([]);
    setNewMealInput("");
    setNewMealPortion(1);
    setNewMealTime("breakfast");
    setError("");
  };

  // Formatted daily totals with specific decimal places
  const formattedTotals = {
    calories: dailyTotals.calories.toFixed(1),
    protein: dailyTotals.protein.toFixed(1),
    fat: dailyTotals.fat.toFixed(1),
    carbohydrates: dailyTotals.carbohydrates.toFixed(1),
    fiber: dailyTotals.fiber.toFixed(1),
    sugar: dailyTotals.sugar.toFixed(1),
    sodium: Math.round(dailyTotals.sodium),
    cholesterol: Math.round(dailyTotals.cholesterol),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative z-10 pb-24 md:pb-8">
        {/* Loading overlay - include both loading states */}
        {(loading || loadingNutrition) && (
          <LoadingOverlay message="Loading..." />
        )}

        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-4 sm:mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-4 mb-4 shadow-2xl"
          >
            <IconChefHat size={36} className="text-primary sm:text-5xl" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4 text-center bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            {activeMode === "recipe-generator"
              ? "AI Recipe Generator"
              : "Calorie Counter"}
          </h1>
          <p className="text-base sm:text-lg text-center max-w-2xl text-gray-600">
            {activeMode === "recipe-generator"
              ? "Create custom recipes with AI using your available ingredients and preferences"
              : "Track your food intake and calculate nutritional information with AI assistance"}
          </p>
        </motion.div>

        {/* Conditional slider - only show in recipe generator mode */}
        {activeMode === "recipe-generator" && <ImageSlider />}

        {/* Enhanced Mode selection buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`glass-panel backdrop-blur-xl border border-white/30 px-6 py-3 rounded-xl shadow-lg transition-all duration-300 ${
              activeMode === "recipe-generator"
                ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
                : "bg-white/20 text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveMode("recipe-generator")}
          >
            <div className="flex items-center gap-2">
              <IconChefHat className="mr-1 sm:mr-2" size={16} />
              <span className="text-xs sm:text-sm font-medium">
                Recipe Generator
              </span>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`glass-panel backdrop-blur-xl border border-white/30 px-6 py-3 rounded-xl shadow-lg transition-all duration-300 ${
              activeMode === "calorie-counter"
                ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
                : "bg-white/20 text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveMode("calorie-counter")}
          >
            <div className="flex items-center gap-2">
              <IconCalculator className="mr-1 sm:mr-2" size={16} />
              <span className="text-xs sm:text-sm font-medium">
                Count Calories
              </span>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 text-gray-700 hover:bg-white/30 transition-all duration-300 px-6 py-3 rounded-xl shadow-lg"
            onClick={() => router.push("/ai-recipes")}
          >
            <span className="text-xs sm:text-sm font-medium">
              Browse AI Recipes
            </span>
          </motion.button>
        </motion.div>

        {/* Recipe Generator Mode Content */}
        {activeMode === "recipe-generator" && (
          <>
            {/* Enhanced Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl overflow-hidden mb-8 shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Create Your Recipe
                </h2>

                <div className="mb-4">
                  <label className="label font-medium text-gray-700">
                    Ingredients (comma separated):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Chicken, Basil, Garlic"
                    className="input input-bordered w-full glass-panel backdrop-blur-xl bg-white/30 border-white/20"
                    value={ingredientsInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setIngredientsInput(e.target.value)
                    }
                  />
                </div>

                <div className="mb-6">
                  <label className="label font-bold text-gray-700">
                    Any dietary or flavor preferences?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., low-carb, spicy, vegan"
                    className="input input-bordered w-full glass-panel backdrop-blur-xl bg-white/30 border-white/20"
                    value={preferences}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPreferences(e.target.value)
                    }
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-none shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                  onClick={generateRecipe}
                  disabled={loading || !ingredientsInput.trim()}
                >
                  {loading ? "Generating Recipe..." : "Generate Recipe"}
                </motion.button>
              </div>
            </motion.div>

            {/* Enhanced Generated Recipe Card */}
            {generatedRecipe && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl overflow-hidden shadow-2xl"
              >
                {/* Hero Image Section */}
                <div className="relative h-64 sm:h-80 md:h-96 w-full">
                  <div className="absolute inset-0">
                    <img
                      src={generatedRecipe.image || "/default-recipe-image.jpg"}
                      alt={generatedRecipe.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-recipe-image.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                      {generatedRecipe.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      {generatedRecipe.category && (
                        <span className="badge badge-lg bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-none">
                          {generatedRecipe.category.charAt(0).toUpperCase() +
                            generatedRecipe.category.slice(1)}
                        </span>
                      )}
                      <span className="text-sm opacity-90">
                        {currentPortions}{" "}
                        {currentPortions === 1 ? "serving" : "servings"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 md:p-8">
                  {/* Start Recipe Button */}
                  {generatedRecipe.steps &&
                    generatedRecipe.steps.length > 0 && (
                      <div className="flex justify-center -mt-8 sm:-mt-10 md:-mt-16 mb-6 relative z-10">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setStepsModalOpen(true)}
                          className="glass-panel backdrop-blur-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white border border-white/30 rounded-full shadow-2xl px-6 py-2 sm:px-8 sm:py-3 transition-all duration-300 text-sm sm:text-base"
                        >
                          Start Cooking
                        </motion.button>
                      </div>
                    )}

                  {/* Description Section */}
                  <p className="text-base sm:text-lg mb-6 sm:mb-8 text-gray-700">
                    {generatedRecipe.description}
                  </p>

                  {/* Enhanced Nutritional Info */}
                  {scaledNutritionalInfo && (
                    <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8 p-6 glass-panel backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
                      <div className="text-center">
                        <div className="stat-value text-emerald-600 text-xl sm:text-2xl font-bold">
                          {scaledNutritionalInfo.calories.toFixed(2)}
                        </div>
                        <div className="stat-title text-xs sm:text-sm text-gray-600">
                          Calories
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="stat-value text-blue-600 text-xl sm:text-2xl font-bold">
                          {scaledNutritionalInfo.protein.toFixed(2)}g
                        </div>
                        <div className="stat-title text-xs sm:text-sm text-gray-600">
                          Protein
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Portion Control Section */}
                  <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8 p-4 glass-panel backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
                    <span className="font-semibold text-sm sm:text-base text-gray-700">
                      Adjust Portions:
                    </span>
                    <div className="flex items-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setCurrentPortions(Math.max(1, currentPortions - 1))
                        }
                        className="btn btn-circle btn-sm glass-panel backdrop-blur-xl bg-white/20 border-white/30"
                        disabled={currentPortions <= 1}
                      >
                        -
                      </motion.button>
                      <span className="mx-3 sm:mx-4 font-bold text-lg">
                        {currentPortions}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPortions(currentPortions + 1)}
                        className="btn btn-circle btn-sm glass-panel backdrop-blur-xl bg-white/20 border-white/30"
                      >
                        +
                      </motion.button>
                    </div>
                  </div>

                  {/* Ingredients Section */}
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center">
                      <IconShoppingCart className="mr-2" size={20} />
                      Ingredients
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                      {generatedRecipe.ingredients.map(
                        (ing: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 transition-colors"
                          >
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-sm"
                            />
                            <span className="text-sm sm:text-base">
                              <span className="font-medium">
                                {(ing.quantity * scalingFactor).toFixed(2)}{" "}
                                {ing.unit}
                              </span>{" "}
                              {ing.name}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Steps Section */}
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center">
                      <IconListCheck className="mr-2" size={20} />
                      Steps
                    </h3>
                    <div className="space-y-4 sm:space-y-6">
                      {generatedRecipe.steps.map((step: any) => (
                        <div
                          key={step.id || step.order}
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

                  {/* Full Nutritional Info Section */}
                  {scaledNutritionalInfo && (
                    <>
                      <div ref={fullNutritionalInfoRef}></div>
                      <h3 className="text-xl sm:text-2xl font-semibold mt-8 mb-4">
                        Full Nutritional Information
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                          <thead>
                            <tr>
                              <th>Nutrient</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Calories</td>
                              <td>
                                {scaledNutritionalInfo.calories.toFixed(2)} kcal
                              </td>
                            </tr>
                            <tr>
                              <td>Protein</td>
                              <td>
                                {scaledNutritionalInfo.protein.toFixed(2)} g
                              </td>
                            </tr>
                            <tr>
                              <td>Fat</td>
                              <td>{scaledNutritionalInfo.fat.toFixed(2)} g</td>
                            </tr>
                            <tr>
                              <td>Carbohydrates</td>
                              <td>
                                {scaledNutritionalInfo.carbohydrates.toFixed(2)}{" "}
                                g
                              </td>
                            </tr>
                            <tr>
                              <td>Fiber</td>
                              <td>
                                {scaledNutritionalInfo.fiber.toFixed(2)} g
                              </td>
                            </tr>
                            <tr>
                              <td>Sugar</td>
                              <td>
                                {scaledNutritionalInfo.sugar.toFixed(2)} g
                              </td>
                            </tr>
                            <tr>
                              <td>Sodium</td>
                              <td>
                                {scaledNutritionalInfo.sodium.toFixed(2)} mg
                              </td>
                            </tr>
                            <tr>
                              <td>Cholesterol</td>
                              <td>
                                {scaledNutritionalInfo.cholesterol.toFixed(2)}{" "}
                                mg
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* Per-Ingredient Nutritional Info */}
                  {generatedRecipe.per_ingredient_nutritional_info &&
                    generatedRecipe.per_ingredient_nutritional_info.length >
                      0 && (
                      <>
                        <h3 className="text-xl sm:text-2xl font-semibold mt-8 mb-4">
                          Per-Ingredient Nutritional Information
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="table table-zebra w-full">
                            <thead>
                              <tr>
                                <th>Ingredient</th>
                                <th>Calories</th>
                                <th>Protein</th>
                                <th>Fat</th>
                                <th>Carbs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedRecipe.per_ingredient_nutritional_info.map(
                                (info: any, idx: number) => (
                                  <tr key={idx}>
                                    <td>{info.ingredient}</td>
                                    <td>
                                      {(info.calories * scalingFactor).toFixed(
                                        2
                                      )}
                                    </td>
                                    <td>
                                      {(info.protein * scalingFactor).toFixed(
                                        2
                                      )}
                                      g
                                    </td>
                                    <td>
                                      {(info.fat * scalingFactor).toFixed(2)}g
                                    </td>
                                    <td>
                                      {(
                                        info.carbohydrates * scalingFactor
                                      ).toFixed(2)}
                                      g
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Calorie Counter Mode Content with enhanced styling */}
        {activeMode === "calorie-counter" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="calorie-counter-mode"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              {/* Left Column - Input Area */}
              <div className="space-y-3 sm:space-y-4">
                <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
                  <div className="card-body p-3 sm:p-6">
                    <h3 className="card-title text-md sm:text-lg font-bold mb-1 sm:mb-2">
                      Add New Food Entry
                    </h3>

                    {/* AI Food Entry */}
                    <div>
                      <div className="mb-3 sm:mb-4">
                        <label className="label py-1 sm:py-2 font-medium text-sm sm:text-base">
                          Enter food description:
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <textarea
                            value={newMealInput}
                            onChange={(e) => setNewMealInput(e.target.value)}
                            placeholder="Describe your meal (e.g., 'bowl of oatmeal with banana')"
                            className="textarea textarea-bordered w-full text-sm sm:text-base h-20 sm:h-24 p-3"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-4 mb-3 sm:mb-4">
                        <div>
                          <label className="label py-1 sm:py-2 font-medium text-sm sm:text-base">
                            Meal Time:
                          </label>
                          <select
                            value={newMealTime}
                            onChange={(e) => setNewMealTime(e.target.value)}
                            className="select select-bordered w-full text-sm sm:text-base h-12 sm:h-14"
                          >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                          </select>
                        </div>

                        <div>
                          <label className="label py-1 sm:py-2 font-medium text-sm sm:text-base">
                            Portion Size:
                          </label>
                          <input
                            type="number"
                            min="0.25"
                            max="10"
                            step="0.25"
                            value={newMealPortion}
                            onChange={(e) =>
                              setNewMealPortion(Number(e.target.value))
                            }
                            className="input input-bordered w-full text-sm sm:text-base h-12 sm:h-14"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleAddAIFoodEntry}
                        disabled={loadingNutrition || !newMealInput.trim()}
                        className="btn btn-primary w-full mb-3 sm:mb-4 h-12 sm:h-14 text-sm sm:text-base"
                      >
                        {loadingNutrition ? (
                          <>
                            <span className="loading loading-spinner loading-sm sm:loading-md"></span>
                            Analyzing...
                          </>
                        ) : (
                          <>Add Food Entry</>
                        )}
                      </button>
                    </div>

                    {/* Recipe Selection */}
                    <div className="mb-3 sm:mb-4">
                      <label className="label py-1 sm:py-2 font-medium text-sm sm:text-base">
                        Or search for a recipe:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search recipes by name..."
                          className="input input-bordered w-full h-12 sm:h-14 text-sm sm:text-base pr-10"
                          value={recipeSearchQuery}
                          onChange={(e) => {
                            setRecipeSearchQuery(e.target.value);
                            setIsRecipeDropdownOpen(true);
                          }}
                          onFocus={() => setIsRecipeDropdownOpen(true)}
                        />
                        <button
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          onClick={() =>
                            setIsRecipeDropdownOpen(!isRecipeDropdownOpen)
                          }
                        >
                          <span>{isRecipeDropdownOpen ? "▲" : "▼"}</span>
                        </button>
                      </div>
                    </div>

                    {isRecipeDropdownOpen && filteredRecipes.length > 0 && (
                      <div className="dropdown-content z-50 menu shadow bg-base-100 rounded-box w-full max-h-60 sm:max-h-80 overflow-auto mt-1 border border-base-300">
                        <ul className="p-2 sm:p-3">
                          {filteredRecipes.map((recipe) => (
                            <li
                              key={recipe.id}
                              className="border-b last:border-b-0"
                            >
                              <button
                                onClick={() => {
                                  setSelectedRecipe(recipe.id);
                                  setIsRecipeDropdownOpen(false);
                                }}
                                className="flex items-center py-3 px-3 sm:px-4 hover:bg-base-200 w-full text-left"
                              >
                                {/* Recipe image thumbnail */}
                                <div className="w-14 h-14 sm:w-16 sm:h-16 mr-3 sm:mr-4 flex-shrink-0 rounded-md overflow-hidden border border-base-300">
                                  <img
                                    src={
                                      recipe.image ||
                                      "/default-recipe-image.jpg"
                                    }
                                    alt={recipe.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.src = "/default-recipe-image.jpg";
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="font-medium text-sm sm:text-base">
                                    {recipe.title}
                                  </div>
                                  {recipe.category && (
                                    <div className="text-xs opacity-70">
                                      {recipe.category}
                                    </div>
                                  )}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedRecipe && (
                      <button
                        onClick={() => handleAddRecipeEntry(selectedRecipe)}
                        disabled={loadingNutrition}
                        className="btn btn-primary w-full mb-3 sm:mb-4 h-12 sm:h-14 text-sm sm:text-base"
                      >
                        {loadingNutrition ? (
                          <>
                            <span className="loading loading-spinner loading-sm sm:loading-md"></span>
                            Adding...
                          </>
                        ) : (
                          <>Add Recipe to Tracker</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Daily Totals Card */}
                <div className="card bg-base-100 shadow-md border border-base-200">
                  <div className="card-body p-3 sm:p-6">
                    <h3 className="card-title text-md sm:text-lg font-bold mb-3">
                      Daily Nutrition Summary
                    </h3>

                    {/* Main macros with bigger display */}
                    <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-200 w-full mb-4">
                      <div className="stat">
                        <div className="stat-title">Calories</div>
                        <div className="stat-value text-primary">
                          {Math.round(dailyTotals.calories)}
                        </div>
                        <div className="stat-desc">
                          {Math.round((dailyTotals.calories / 2000) * 100)}%
                          daily value
                        </div>
                      </div>

                      <div className="stat">
                        <div className="stat-title">Protein</div>
                        <div className="stat-value text-secondary">
                          {Math.round(dailyTotals.protein)}g
                        </div>
                        <div className="stat-desc">
                          {Math.round((dailyTotals.protein / 50) * 100)}% daily
                          value
                        </div>
                      </div>

                      <div className="stat">
                        <div className="stat-title">Carbs</div>
                        <div className="stat-value text-accent">
                          {Math.round(dailyTotals.carbohydrates)}g
                        </div>
                        <div className="stat-desc">
                          {Math.round((dailyTotals.carbohydrates / 300) * 100)}%
                          daily value
                        </div>
                      </div>

                      <div className="stat">
                        <div className="stat-title">Fat</div>
                        <div className="stat-value">
                          {Math.round(dailyTotals.fat)}g
                        </div>
                        <div className="stat-desc">
                          {Math.round((dailyTotals.fat / 65) * 100)}% daily
                          value
                        </div>
                      </div>
                    </div>

                    {/* Additional nutrition details in a grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-base-200 p-3 rounded-lg">
                        <div className="font-semibold text-sm">Fiber</div>
                        <div className="text-lg font-bold">
                          {Math.round(dailyTotals.fiber)}g
                        </div>
                        <div className="text-xs opacity-70">
                          {Math.round((dailyTotals.fiber / 25) * 100)}% daily
                          value
                        </div>
                      </div>

                      <div className="bg-base-200 p-3 rounded-lg">
                        <div className="font-semibold text-sm">Sugar</div>
                        <div className="text-lg font-bold">
                          {Math.round(dailyTotals.sugar)}g
                        </div>
                        <div className="text-xs opacity-70">
                          {Math.round((dailyTotals.sugar / 50) * 100)}% daily
                          value
                        </div>
                      </div>

                      <div className="bg-base-200 p-3 rounded-lg">
                        <div className="font-semibold text-sm">Sodium</div>
                        <div className="text-lg font-bold">
                          {Math.round(dailyTotals.sodium)}mg
                        </div>
                        <div className="text-xs opacity-70">
                          {Math.round((dailyTotals.sodium / 2300) * 100)}% daily
                          value
                        </div>
                      </div>

                      <div className="bg-base-200 p-3 rounded-lg">
                        <div className="font-semibold text-sm">Cholesterol</div>
                        <div className="text-lg font-bold">
                          {Math.round(dailyTotals.cholesterol)}mg
                        </div>
                        <div className="text-xs opacity-70">
                          {Math.round((dailyTotals.cholesterol / 300) * 100)}%
                          daily value
                        </div>
                      </div>
                    </div>

                    <div className="text-xs mt-3 opacity-70 text-right">
                      *Percent Daily Values based on a 2,000 calorie diet
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Food Entries List */}
              <div className="space-y-3 sm:space-y-4">
                <div className="card bg-base-100 shadow-md border border-base-200">
                  <div className="card-body p-3 sm:p-6">
                    <h3 className="card-title text-md sm:text-lg font-bold mb-1 sm:mb-2">
                      Food Entries
                    </h3>

                    {mealEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                        <IconApple size={36} className="mb-2" />
                        <p className="text-center text-sm">
                          No food entries yet. Add what you've eaten using the
                          form.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {/* Group entries by meal time */}
                        {["breakfast", "lunch", "dinner", "snack"].map(
                          (mealTime) => {
                            const mealTimeEntries = mealEntries.filter(
                              (entry) => entry.time === mealTime
                            );
                            if (mealTimeEntries.length === 0) return null;

                            return (
                              <div key={mealTime} className="mb-3">
                                <h4 className="font-bold text-sm sm:text-base capitalize mb-2 sticky top-0 bg-base-100 py-1 z-10">
                                  {mealTime}
                                </h4>

                                {mealTimeEntries.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="rounded-lg bg-base-100 p-4 shadow-sm mb-4 relative"
                                  >
                                    {entry.error ? (
                                      <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                          <div className="font-semibold text-md">
                                            {entry.description}
                                          </div>
                                          <div className="text-sm text-error">
                                            {entry.error}
                                          </div>
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleRemoveMealEntry(entry.id)
                                          }
                                          className="btn btn-circle btn-ghost btn-sm ml-2"
                                        >
                                          <IconTrash size={16} />
                                        </button>
                                      </div>
                                    ) : entry.tempLoading ? (
                                      <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                          <div className="font-semibold text-md">
                                            {entry.description}
                                          </div>
                                          <div className="flex items-center mt-2">
                                            <div className="loading loading-spinner loading-sm mr-2"></div>
                                            <span className="text-sm opacity-70">
                                              Fetching nutritional
                                              information...
                                            </span>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleRemoveMealEntry(entry.id)
                                          }
                                          className="btn btn-circle btn-ghost btn-sm ml-2"
                                        >
                                          <IconTrash size={16} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          {/* Display meal entry image if available */}
                                          {entry.image && (
                                            <div className="mb-3 relative rounded-lg overflow-hidden h-32 w-full">
                                              {entry.imageLoading ? (
                                                <div className="flex justify-center items-center h-32 bg-gray-200 animate-pulse">
                                                  <div className="loading loading-spinner loading-md"></div>
                                                </div>
                                              ) : (
                                                <img
                                                  src={entry.image}
                                                  alt={entry.description}
                                                  className="object-cover w-full h-full"
                                                  onError={(e) => {
                                                    // Hide broken images
                                                    (
                                                      e.target as HTMLImageElement
                                                    ).style.display = "none";
                                                  }}
                                                />
                                              )}
                                            </div>
                                          )}
                                          <div className="font-semibold text-md">
                                            {entry.description}
                                          </div>
                                          <div className="text-xs opacity-70">
                                            {entry.fromRecipe
                                              ? `Recipe entry • ${
                                                  entry.portion
                                                } portion${
                                                  entry.portion !== 1 ? "s" : ""
                                                }`
                                              : `Custom entry • ${
                                                  entry.portion
                                                } portion${
                                                  entry.portion !== 1 ? "s" : ""
                                                }`}
                                            {entry.quantity &&
                                              entry.unit &&
                                              ` (${entry.quantity} ${entry.unit})`}
                                          </div>
                                          {entry.source && (
                                            <div className="text-xs flex items-center mt-1">
                                              <span className="opacity-70">
                                                Data source:
                                              </span>
                                              <span className="ml-1 badge badge-xs badge-outline">
                                                {entry.source}
                                              </span>
                                            </div>
                                          )}
                                          {entry.nutritionalInfo ? (
                                            <div className="mt-2">
                                              <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                  <span className="font-semibold">
                                                    Calories:
                                                  </span>
                                                  <span>
                                                    {Math.round(
                                                      entry.nutritionalInfo
                                                        .calories *
                                                        entry.portion
                                                    )}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                  <span>Protein:</span>
                                                  <span>
                                                    {(
                                                      entry.nutritionalInfo
                                                        .protein * entry.portion
                                                    ).toFixed(1)}
                                                    g
                                                  </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                  <span>Carbs:</span>
                                                  <span>
                                                    {(
                                                      entry.nutritionalInfo
                                                        .carbohydrates *
                                                      entry.portion
                                                    ).toFixed(1)}
                                                    g
                                                  </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                  <span>Fat:</span>
                                                  <span>
                                                    {(
                                                      entry.nutritionalInfo
                                                        .fat * entry.portion
                                                    ).toFixed(1)}
                                                    g
                                                  </span>
                                                </div>

                                                {/* Show components if this is a composite food */}
                                                {entry.components &&
                                                  entry.components.length >
                                                    0 && (
                                                    <div className="mt-2 bg-base-300 p-2 rounded-md">
                                                      <div className="text-xs font-semibold mb-1">
                                                        Components:
                                                      </div>
                                                      <ul className="text-xs space-y-1">
                                                        {entry.components.map(
                                                          (component, idx) => (
                                                            <li
                                                              key={idx}
                                                              className="flex justify-between"
                                                            >
                                                              <span>{`${component.name} (${component.quantity} ${component.unit})`}</span>
                                                              <span>
                                                                {Math.round(
                                                                  component
                                                                    .nutritionalInfo
                                                                    .calories
                                                                )}{" "}
                                                                cal
                                                              </span>
                                                            </li>
                                                          )
                                                        )}
                                                      </ul>
                                                    </div>
                                                  )}

                                                {/* Show ingredients if available */}
                                                {entry.nutritionalInfo
                                                  .ingredients &&
                                                  entry.nutritionalInfo
                                                    .ingredients.length > 0 && (
                                                    <div className="mt-1 bg-base-300 p-2 rounded-md">
                                                      <div className="text-xs font-semibold mb-1">
                                                        Ingredients:
                                                      </div>
                                                      <ul className="text-xs space-y-1">
                                                        {entry.nutritionalInfo.ingredients.map(
                                                          (
                                                            ingredient: any,
                                                            idx: number
                                                          ) => (
                                                            <li
                                                              key={idx}
                                                              className="flex justify-between"
                                                            >
                                                              <span>
                                                                {ingredient.displayText ||
                                                                  `${ingredient.name} (${ingredient.quantity}${ingredient.unit})`}
                                                              </span>
                                                              {ingredient.calories && (
                                                                <span>
                                                                  {Math.round(
                                                                    ingredient.calories *
                                                                      entry.portion
                                                                  )}{" "}
                                                                  cal
                                                                </span>
                                                              )}
                                                            </li>
                                                          )
                                                        )}
                                                      </ul>
                                                    </div>
                                                  )}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="mt-2 text-sm opacity-70">
                                              No nutritional data available
                                            </div>
                                          )}

                                          <div className="mt-3">
                                            <div className="flex items-center">
                                              <span className="text-xs mr-2">
                                                Adjust portion:
                                              </span>
                                              <input
                                                type="number"
                                                min="0.25"
                                                max="10"
                                                step="0.25"
                                                value={entry.portion}
                                                onChange={(e) =>
                                                  handleUpdatePortion(
                                                    entry.id,
                                                    parseFloat(e.target.value)
                                                  )
                                                }
                                                className="input input-xs input-bordered w-14 text-center"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleRemoveMealEntry(entry.id)
                                          }
                                          className="btn btn-circle btn-ghost btn-sm ml-2"
                                        >
                                          <IconTrash size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-800 p-4 rounded-2xl mb-4 sm:mb-8 text-xs sm:text-sm shadow-lg"
          >
            <p>{error}</p>
          </motion.div>
        )}

        {/* Enhanced Scroll-to-Top Button */}
        {scroll.y > 100 && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-3 rounded-full shadow-2xl hover:bg-white/30 transition-all duration-300 fixed bottom-24 left-4 z-40 md:bottom-6"
            aria-label="Scroll to top"
          >
            <IconArrowUp size={18} className="text-gray-700" />
          </motion.button>
        )}

        {/* Steps Modal */}
        {stepsModalOpen && generatedRecipe?.steps && (
          <StepsModal
            steps={generatedRecipe.steps}
            onClose={() => setStepsModalOpen(false)}
          />
        )}

        {/* Nutrient Details Modal */}
        {showNutrientDetails && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => setShowNutrientDetails(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Daily Nutrition Details
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                          <thead>
                            <tr>
                              <th>Nutrient</th>
                              <th>Amount</th>
                              <th>% Daily Value*</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Calories</td>
                              <td>{Math.round(dailyTotals.calories)}</td>
                              <td>
                                {Math.round(
                                  (dailyTotals.calories / 2000) * 100
                                )}
                                %
                              </td>
                            </tr>
                            <tr>
                              <td>Protein</td>
                              <td>{Math.round(dailyTotals.protein)}g</td>
                              <td>
                                {Math.round((dailyTotals.protein / 50) * 100)}%
                              </td>
                            </tr>
                            <tr>
                              <td>Fat</td>
                              <td>{Math.round(dailyTotals.fat)}g</td>
                              <td>
                                {Math.round((dailyTotals.fat / 65) * 100)}%
                              </td>
                            </tr>
                            <tr>
                              <td>Carbohydrates</td>
                              <td>{Math.round(dailyTotals.carbohydrates)}g</td>
                              <td>
                                {Math.round(
                                  (dailyTotals.carbohydrates / 300) * 100
                                )}
                                %
                              </td>
                            </tr>
                            <tr>
                              <td>Fiber</td>
                              <td>{Math.round(dailyTotals.fiber)}g</td>
                              <td>
                                {Math.round((dailyTotals.fiber / 25) * 100)}%
                              </td>
                            </tr>
                            <tr>
                              <td>Sugar</td>
                              <td>{Math.round(dailyTotals.sugar)}g</td>
                              <td>
                                {Math.round((dailyTotals.sugar / 50) * 100)}%
                              </td>
                            </tr>
                            <tr>
                              <td>Sodium</td>
                              <td>{Math.round(dailyTotals.sodium)}mg</td>
                              <td>
                                {Math.round((dailyTotals.sodium / 2300) * 100)}%
                              </td>
                            </tr>
                            <tr>
                              <td>Cholesterol</td>
                              <td>{Math.round(dailyTotals.cholesterol)}mg</td>
                              <td>
                                {Math.round(
                                  (dailyTotals.cholesterol / 300) * 100
                                )}
                                %
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="text-xs mt-2">
                          *Percent Daily Values are based on a 2,000 calorie
                          diet.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowNutrientDetails(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FloatingNavigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
