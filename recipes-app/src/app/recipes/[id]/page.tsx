"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowDown,
  IconX,
  IconClock,
  IconChefHat,
  IconRocket,
  IconShoppingCart,
  IconListCheck,
  IconSparkles,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { RecipeDetail, Step } from "../../../../lib/types";
import Image from "next/image";
import { useTheme } from "../../contexts/ThemeContext";

// Memoized StepsModal Component
const StepsModal = memo(({ steps, onClose }: { steps: Step[]; onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  }, [currentStep, steps.length, onClose]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex justify-center items-center z-50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="fixed inset-0 bg-base-content/50 backdrop-blur-sm" onClick={onClose}></div>

        <motion.div
          className="neo-card relative max-w-md w-full overflow-hidden z-10 flex flex-col"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <div className="p-8 text-center bg-primary border-b-3 border-base-content">
            <h2 className="text-2xl font-black mb-2 text-base-content">
              Step {currentStep + 1} of {steps.length}
            </h2>
            <p className="text-lg font-bold text-base-content/90">
              {steps[currentStep].description}
            </p>
          </div>

          <div className="p-6 bg-base-100">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="neo-button px-6 py-3 bg-base-200 text-base-content disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-neo disabled:translate-y-0 disabled:translate-x-0"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="neo-button px-6 py-3 bg-secondary text-base-content"
              >
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
              </button>
            </div>

            <div className="flex justify-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 border-2 border-base-content rounded-full transition-colors ${
                    index === currentStep ? "bg-accent shadow-neo-sm" : "bg-base-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
StepsModal.displayName = "StepsModal";

// Memoized Nutrition Card Component
const NutritionCard = memo(({ label, value, unit = "", colorClass }: { label: string; value: string; unit?: string, colorClass: string }) => (
  <div className={`neo-card p-4 text-center ${colorClass}`}>
    <div className="text-2xl font-black mb-1 text-base-content">
      {value}{unit}
    </div>
    <div className="text-xs font-bold uppercase tracking-wider text-base-content">
      {label}
    </div>
  </div>
));
NutritionCard.displayName = "NutritionCard";

// Memoized Ingredient Item Component
const IngredientItem = memo(({ ingredient, scaledQuantity, isAvailable, onToggle }: { ingredient: any; scaledQuantity: string; isAvailable: boolean; onToggle: () => void }) => (
  <div className="neo-card p-4 mb-3 flex items-center gap-4 bg-base-100 hover:bg-base-200 cursor-pointer" onClick={onToggle}>
    <div className={`w-6 h-6 border-3 border-base-content rounded flex items-center justify-center shrink-0 transition-colors ${isAvailable ? 'bg-primary' : 'bg-base-100'}`}>
      {isAvailable && <IconX size={16} stroke={4} className="text-base-content" />}
    </div>
    <span className={`text-base font-bold text-base-content ${isAvailable ? "line-through opacity-50" : ""}`}>
      <span className="text-primary font-black mr-2">
        {scaledQuantity} {ingredient.unit}
      </span>
      {ingredient.ingredient.name}
    </span>
  </div>
));
IngredientItem.displayName = "IngredientItem";

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPortions, setCurrentPortions] = useState<number>(1);
  const [portionsInput, setPortionsInput] = useState<string>("1");
  const [availableIngredients, setAvailableIngredients] = useState<{ [key: number]: boolean }>({});
  const [stepsModalOpen, setStepsModalOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollButton(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (id) {
      fetch(`/api/recipes/${id}`)
        .then((res) => {
          if (!res.ok) return res.json().then((data) => { throw new Error(data.error || "Failed to fetch recipe"); });
          return res.json();
        })
        .then((data: RecipeDetail) => {
          setRecipe(data);
          setCurrentPortions(Number(data.portion));
          setPortionsInput(Number(data.portion).toString());
          const initialAvailability: { [key: number]: boolean } = {};
          data.recipe_ingredients.forEach((ri) => { initialAvailability[ri.ingredient_id] = false; });
          setAvailableIngredients(initialAvailability);
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "An unknown error occurred.");
          setLoading(false);
        });
    }
  }, [id]);

  const handleIngredientToggle = useCallback((ingredientId: number) => {
    setAvailableIngredients((prev) => ({ ...prev, [ingredientId]: !prev[ingredientId] }));
  }, []);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  const scalingFactor = useMemo(() => currentPortions / (recipe?.portion || 1), [currentPortions, recipe?.portion]);

  const scaledNutritionalInfo = useMemo(() => {
    if (!recipe?.nutritional_info) return null;
    return {
      calories: (parseFloat(recipe.nutritional_info.calories.toString()) * scalingFactor).toFixed(1),
      protein: (parseFloat(recipe.nutritional_info.protein.toString()) * scalingFactor).toFixed(1),
      fat: (parseFloat(recipe.nutritional_info.fat.toString()) * scalingFactor).toFixed(1),
      carbohydrates: (parseFloat(recipe.nutritional_info.carbohydrates.toString()) * scalingFactor).toFixed(1),
    };
  }, [recipe?.nutritional_info, scalingFactor]);

  const imageUrl = useMemo(() => recipe?.image && recipe.image.trim() !== "" ? recipe.image : "/default-image.png", [recipe?.image]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="neo-card w-full h-[40vh] bg-base-300 animate-pulse mb-8" />
          <div className="h-10 bg-base-300 rounded-xl w-3/4 mb-4 border-2 border-base-content animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
        <div className="neo-card p-12 text-center max-w-md bg-base-200">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-3xl font-black mb-4 text-base-content uppercase">{error ? "Error" : "Not Found"}</h2>
          <button onClick={() => router.push("/")} className="neo-button px-8 py-3 bg-primary text-base-content uppercase">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 pb-24">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="neo-card relative h-72 md:h-96 overflow-hidden mb-8 border-4">
          <Image src={imageUrl} alt={recipe.title} fill className="object-cover" priority sizes="100vw" />
          {recipe.category && (
            <div className="absolute top-4 left-4">
              <span className="neo-badge bg-secondary text-base-content px-4 py-2 text-sm uppercase tracking-wider">{recipe.category}</span>
            </div>
          )}
        </div>

        <div className="mb-10">
          <h1 className="text-4xl md:text-6xl font-black mb-4 text-base-content leading-tight uppercase">{recipe.title}</h1>
          <p className="text-lg md:text-xl font-bold text-base-content/80 max-w-3xl border-l-4 border-primary pl-4">{recipe.description}</p>
          
          {recipe.steps && recipe.steps.length > 0 && (
            <button onClick={() => setStepsModalOpen(true)} className="neo-button mt-6 px-8 py-4 bg-primary text-base-content flex items-center gap-3 text-xl uppercase tracking-wider">
              <IconRocket size={24} stroke={2.5} />
              Start Cooking
            </button>
          )}
        </div>

        {/* Nutritional Info */}
        {scaledNutritionalInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <NutritionCard label="Calories" value={scaledNutritionalInfo.calories} colorClass="bg-secondary" />
            <NutritionCard label="Protein" value={scaledNutritionalInfo.protein} unit="g" colorClass="bg-accent" />
            <NutritionCard label="Carbs" value={scaledNutritionalInfo.carbohydrates} unit="g" colorClass="bg-primary" />
            <NutritionCard label="Fat" value={scaledNutritionalInfo.fat} unit="g" colorClass="bg-base-200" />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Ingredients */}
          <div className="w-full md:w-1/3">
            <div className="neo-card p-6 bg-accent mb-6">
              <h3 className="text-2xl font-black flex items-center gap-3 mb-6 uppercase text-base-content">
                <IconSparkles size={24} stroke={2.5} />
                Portions
              </h3>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => { const v = Math.max(1, currentPortions - 1); setCurrentPortions(v); setPortionsInput(v.toString()); }}
                  className="neo-button w-12 h-12 flex items-center justify-center bg-base-100 text-xl font-black shrink-0"
                  disabled={currentPortions <= 1}
                >-</button>
                <input
                  type="number" min="1" value={portionsInput}
                  onChange={(e) => setPortionsInput(e.target.value)}
                  onBlur={() => { const v = parseInt(portionsInput); if (v > 0) { setCurrentPortions(v); } else { setCurrentPortions(1); setPortionsInput("1"); } }}
                  className="neo-input w-20 h-12 text-center text-xl font-black bg-base-100 m-0 p-0 focus:shadow-none shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => { const v = currentPortions + 1; setCurrentPortions(v); setPortionsInput(v.toString()); }}
                  className="neo-button w-12 h-12 flex items-center justify-center bg-base-100 text-xl font-black shrink-0"
                >+</button>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-3xl font-black flex items-center gap-3 mb-6 uppercase text-base-content">
                <IconShoppingCart size={28} stroke={2.5} /> Ingredients
              </h3>
              <div>
                {recipe.recipe_ingredients.map((ing) => (
                  <IngredientItem
                    key={ing.ingredient_id}
                    ingredient={ing}
                    scaledQuantity={(ing.quantity * scalingFactor).toFixed(2).replace(/\.00$/, '')}
                    isAvailable={availableIngredients[ing.ingredient_id] || false}
                    onToggle={() => handleIngredientToggle(ing.ingredient_id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Instructions */}
          <div className="w-full md:w-2/3">
            {recipe.steps && recipe.steps.length > 0 && (
              <div className="mb-10">
                <h3 className="text-3xl font-black flex items-center gap-3 mb-6 uppercase text-base-content">
                  <IconListCheck size={28} stroke={2.5} /> Instructions
                </h3>
                <div className="space-y-4">
                  {recipe.steps.map((step, index) => (
                    <div key={step.id} className="neo-card p-6 bg-base-200 flex items-start gap-4">
                      <div className="w-10 h-10 border-3 border-base-content bg-primary rounded-xl flex items-center justify-center text-base-content font-black text-xl shrink-0 shadow-neo-sm">
                        {index + 1}
                      </div>
                      <p className="text-lg font-bold text-base-content pt-1">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="neo-card p-6 bg-base-200">
                <h4 className="text-xl font-black mb-2 uppercase flex items-center gap-2"><IconClock size={20} stroke={3} /> Time</h4>
                <p className="text-2xl font-bold text-primary">{recipe.steps ? recipe.steps.length * 5 : 30} mins</p>
              </div>
              <div className="neo-card p-6 bg-base-200">
                <h4 className="text-xl font-black mb-2 uppercase flex items-center gap-2"><IconChefHat size={20} stroke={3} /> Level</h4>
                <p className="text-2xl font-bold text-primary">
                  {recipe.steps && recipe.steps.length > 8 ? "Advanced" : recipe.steps && recipe.steps.length > 4 ? "Medium" : "Easy"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Ingredient Nutritional Info */}
        {recipe.per_ingredient_nutritional_info && recipe.per_ingredient_nutritional_info.length > 0 && (
          <div className="mt-16 mb-4">
            <h3 className="text-3xl font-black flex items-center gap-3 mb-6 uppercase text-base-content">
              <IconSparkles size={28} stroke={2.5} /> Caloric Table
            </h3>
            <div className="neo-card p-0 overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-primary text-base-content border-b-3 border-base-content uppercase font-black text-sm sm:text-base">
                    <th className="p-4 border-r-3 border-base-content">Ingredient</th>
                    <th className="p-4 border-r-3 border-base-content">Calories</th>
                    <th className="p-4 border-r-3 border-base-content">Protein</th>
                    <th className="p-4 border-r-3 border-base-content">Fat</th>
                    <th className="p-4">Carbs</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.per_ingredient_nutritional_info.map((info, idx, arr) => {
                    const ingredient = recipe.recipe_ingredients?.find(
                      (ri) => ri.ingredient_id === info.ingredient_id
                    )?.ingredient;
                    const isLast = idx === arr.length - 1;
                    return (
                      <tr 
                        key={info.id} 
                        className={`${!isLast ? 'border-b-2 border-base-content' : ''} font-bold text-base-content hover:bg-accent transition-colors ${idx % 2 === 0 ? 'bg-base-100' : 'bg-base-200'}`}
                      >
                        <td className="p-4 border-r-2 border-base-content capitalize">
                          {ingredient ? ingredient.name : "Unknown"}
                        </td>
                        <td className="p-4 border-r-2 border-base-content">{info.calories || 0}</td>
                        <td className="p-4 border-r-2 border-base-content">{info.protein || 0}g</td>
                        <td className="p-4 border-r-2 border-base-content">{info.fat || 0}g</td>
                        <td className="p-4">{info.carbohydrates || 0}g</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-28 md:bottom-8 left-4 z-40 w-12 h-12 rounded-xl bg-accent border-3 border-base-content shadow-neo flex items-center justify-center text-base-content hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-hover active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            <IconArrowDown size={24} stroke={3} className="rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>

      {stepsModalOpen && recipe.steps && (
        <StepsModal steps={recipe.steps} onClose={() => setStepsModalOpen(false)} />
      )}
    </div>
  );
}
