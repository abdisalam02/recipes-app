// @ts-nocheck

// app/ai-recipes/[id]/page.tsx
"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowDown,
  IconX,
  IconShoppingCart,
  IconListCheck,
  IconHelpCircle,
  IconBulb,
  IconStars,
  IconRocket,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RecipeDetail,
  Step,
  RecipeIngredient,
  PerIngredientNutritionalInfo,
} from "../../../../lib/types";
import Image from "next/image";
import { FloatingNavigation } from "../../components/FloatingNavigation";

// Custom hook to track vertical scroll position.
function useWindowScroll() {
  const [scroll, setScroll] = useState({ y: 0 });
  useEffect(() => {
    const handleScroll = () => setScroll({ y: window.scrollY });
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return scroll;
}

// StepsModal component (for "Start Recipe" feature)
const StepsModal: React.FC<{ steps: Step[]; onClose: () => void }> = ({
  steps,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = steps.length;

  // Define an array of background colors for steps
  const bgColors = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-indigo-500 to-violet-600",
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
              key={`step-${steps[currentStep].id || currentStep}`}
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

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const scroll = useWindowScroll();
  const fullNutritionalInfoRef = useRef<HTMLDivElement>(null);

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPortions, setCurrentPortions] = useState<number>(1);
  const [stepsModalOpen, setStepsModalOpen] = useState<boolean>(false);
  const [viewStepModalOpen, setViewStepModalOpen] = useState<boolean>(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<{
    [key: number]: boolean;
  }>({});

  useEffect(() => {
    if (id) {
      fetch(`/api/ai-recipes/${id}`)
        .then((res) => {
          if (!res.ok) {
            return res.json().then((data) => {
              throw new Error(data.error || "Failed to fetch recipe");
            });
          }
          return res.json();
        })
        .then((data: RecipeDetail) => {
          setRecipe(data);
          setCurrentPortions(Number(data.portion));
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred.");
          }
          setLoading(false);
        });
    }
  }, [id]);

  const openViewStepModal = (step: Step) => {
    setSelectedStep(step);
    setViewStepModalOpen(true);
  };

  const closeViewStepModal = () => {
    setSelectedStep(null);
    setViewStepModalOpen(false);
  };

  const scrollToFullInfo = () => {
    if (fullNutritionalInfoRef.current) {
      fullNutritionalInfoRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold mb-4">Loading...</h2>
        <button className="btn btn-square btn-lg loading">Loading</button>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">
          {error ? "Error" : "Recipe Not Found"}
        </h2>
        <p className="text-gray-500">
          {error || "The recipe you are looking for does not exist."}
        </p>
      </div>
    );
  }

  const scalingFactor = currentPortions / recipe.portion;
  const { nutritional_info, per_ingredient_nutritional_info } = recipe;
  const scaledNutritionalInfo = nutritional_info
    ? {
        calories: (
          parseFloat(nutritional_info.calories?.toString() ?? "0") *
          scalingFactor
        ).toFixed(2),
        protein: (
          parseFloat(nutritional_info.protein?.toString() ?? "0") *
          scalingFactor
        ).toFixed(2),
        fat: (
          parseFloat(nutritional_info.fat?.toString() ?? "0") * scalingFactor
        ).toFixed(2),
        carbohydrates: (
          parseFloat(nutritional_info.carbohydrates?.toString() ?? "0") *
          scalingFactor
        ).toFixed(2),
        fiber: (
          parseFloat(nutritional_info.fiber?.toString() ?? "0") * scalingFactor
        ).toFixed(2),
        sugar: (
          parseFloat(nutritional_info.sugar?.toString() ?? "0") * scalingFactor
        ).toFixed(2),
        sodium: (
          parseFloat(nutritional_info.sodium?.toString() ?? "0") * scalingFactor
        ).toFixed(2),
        cholesterol: (
          parseFloat(nutritional_info.cholesterol?.toString() ?? "0") *
          scalingFactor
        ).toFixed(2),
      }
    : null;

  const imageUrl =
    recipe.image && recipe.image.trim() !== ""
      ? recipe.image
      : "/default-recipe-image.jpg";

  const handleIngredientToggle = (ingredientId: number) => {
    setAvailableIngredients((prev) => ({
      ...prev,
      [ingredientId]: !prev[ingredientId],
    }));
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Parallax Effect */}
      <div className="fixed inset-0 z-0">
        <img
          src={imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover opacity-30 blur-sm scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/default-image.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="card bg-base-100/90 backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden border border-white/30">
          {/* Hero Image Section */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full">
            <div className="absolute inset-0">
              <img
                src={imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/default-image.png";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                {recipe.title}
              </h2>
              <div className="flex items-center gap-2">
                <span className="badge badge-lg bg-primary text-white border-none">
                  {recipe.category
                    ? recipe.category.charAt(0).toUpperCase() +
                      recipe.category.slice(1)
                    : "Uncategorized"}
                </span>
                <span className="text-sm opacity-90">
                  {recipe.portion.toString()}{" "}
                  {parseInt(recipe.portion.toString()) === 1
                    ? "serving"
                    : "servings"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {/* Start Recipe Button */}
            {recipe.steps && recipe.steps.length > 0 && (
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
              <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8 p-4 bg-base-200/80 backdrop-blur-lg rounded-xl border border-white/20">
                <div className="text-center">
                  <div className="stat-value text-primary text-xl sm:text-2xl">
                    {scaledNutritionalInfo.calories}
                  </div>
                  <div className="stat-title text-xs sm:text-sm">Calories</div>
                </div>
                <div className="text-center">
                  <div className="stat-value text-primary text-xl sm:text-2xl">
                    {scaledNutritionalInfo.protein}g
                  </div>
                  <div className="stat-title text-xs sm:text-sm">Protein</div>
                </div>
              </div>
            )}

            {/* Portion Control Section */}
            <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8 p-4 bg-base-200/80 backdrop-blur-lg rounded-xl border border-white/20">
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
                {recipe.recipe_ingredients &&
                recipe.recipe_ingredients.length > 0 ? (
                  recipe.recipe_ingredients.map((ingredient) => {
                    const scaledQuantity = (
                      ingredient.quantity * scalingFactor
                    ).toFixed(2);
                    return (
                      <div
                        key={ingredient.ingredient_id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={
                            availableIngredients[ingredient.ingredient_id] ||
                            false
                          }
                          onChange={() =>
                            handleIngredientToggle(ingredient.ingredient_id)
                          }
                          className="checkbox checkbox-primary checkbox-sm"
                        />
                        <span
                          className={
                            availableIngredients[ingredient.ingredient_id]
                              ? "line-through opacity-60 text-sm sm:text-base"
                              : "text-sm sm:text-base"
                          }
                        >
                          <span className="font-medium">
                            {scaledQuantity} {ingredient.unit}
                          </span>{" "}
                          {ingredient.ingredient?.name || ingredient.name}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center p-4 bg-base-200/80 backdrop-blur-lg rounded-lg border border-white/20">
                    <p className="text-gray-500">
                      No ingredients available for this recipe.
                    </p>
                  </div>
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
                {recipe.steps &&
                  recipe.steps.map((step) => (
                    <div
                      key={step.id}
                      className="p-3 sm:p-4 bg-base-200/80 backdrop-blur-lg rounded-xl border border-white/20"
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
            {recipe.per_ingredient_nutritional_info &&
              recipe.per_ingredient_nutritional_info.length > 0 && (
                <>
                  <div ref={fullNutritionalInfoRef}></div>
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
                        {recipe.per_ingredient_nutritional_info.map((info) => {
                          const ingredient = recipe.recipe_ingredients?.find(
                            (ri) => ri.ingredient_id === info.ingredient_id
                          )?.ingredient;
                          return (
                            <tr key={info.id}>
                              <td>
                                {ingredient ? ingredient.name : "Unknown"}
                              </td>
                              <td>{info.calories || 0}</td>
                              <td>{info.protein || 0}g</td>
                              <td>{info.fat || 0}g</td>
                              <td>{info.carbohydrates || 0}g</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
          </div>
        </div>
      </div>

      {/* Scroll-to-Top Button */}
      {scroll.y > 100 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="btn btn-circle fixed bottom-6 right-6 transition-transform hover:scale-110"
          aria-label="Scroll to top"
        >
          <IconArrowDown size={24} className="rotate-180" />
        </button>
      )}

      {/* Steps Modal for "Start Recipe" Feature */}
      {stepsModalOpen && recipe.steps && (
        <StepsModal
          steps={recipe.steps}
          onClose={() => setStepsModalOpen(false)}
        />
      )}

      {/* Floating Navigation */}

    </div>
  );
}
