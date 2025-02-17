'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowUp, IconArrowDown, IconX } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

// AnimatedInstructions: one definition only.
const AnimatedInstructions: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="mb-8 text-center"
    >
      <h2 className="text-2xl font-bold mb-2">Welcome to AI Recipe Generator!</h2>
      <p className="text-lg">
        Enter your ingredients and preferences below, then click "Generate Recipe" to see your custom AI recipe.
      </p>
    </motion.div>
  );
};

// ImageSlider: cycles through AI recipe images.
const ImageSlider: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch('/api/ai-recipes');
        if (!res.ok) {
          throw new Error('Failed to fetch AI recipes for slider');
        }
        const data = await res.json();
        const urls = data
          .map((r: any) => r.image)
          .filter((url: string) => url && url.trim() !== '');
        setImages(urls);
      } catch (error: any) {
        console.error(error.message);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [images]);

  if (images.length === 0) return null;

  return (
    <div className="w-full h-48 mb-8 relative overflow-hidden rounded-lg shadow-lg">
      <AnimatePresence>
        <motion.img
          key={images[currentIndex]}
          src={images[currentIndex]}
          alt="AI Recipe Slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="w-full h-48 object-cover"
        />
      </AnimatePresence>
    </div>
  );
};

// StepsModal: for the "Start Recipe" feature.
const StepsModal: React.FC<{ steps: { id: number; order: number; description: string }[]; onClose: () => void }> = ({ steps, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const stepIcons = [IconArrowDown, IconX];
  const StepIcon = stepIcons[currentStep % stepIcons.length];

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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md"></div>
        <div className="modal-box max-w-md bg-gradient-to-br from-green-200 to-cyan-200 border-4 border-green-300 shadow-2xl rounded-lg p-6 relative">
          <button className="btn btn-sm btn-circle absolute top-2 right-2" onClick={onClose} aria-label="Close Steps">
            <IconX size={16} />
          </button>
          <motion.div
            className="flex flex-col items-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <StepIcon size={48} className="text-primary" />
          </motion.div>
          <motion.div
            key={steps[currentStep].id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-2">Step {steps[currentStep].order}</h3>
            <p className="text-base">{steps[currentStep].description}</p>
          </motion.div>
          <div className="flex justify-between mt-4">
            <button onClick={prevStep} className="btn btn-outline" disabled={currentStep === 0}>
              Previous
            </button>
            <button onClick={nextStep} className="btn btn-primary">
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
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

  useEffect(() => {
    setScrollY(scroll.y);
  }, [scroll.y]);

  const openModal = (step: { id: number; order: number; description: string }) => {
    setStepsModalOpen(true);
  };

  const generateRecipe = async () => {
    setLoading(true);
    setError("");
    setGeneratedRecipe(null);
    try {
      const prompt = `Generate a creative recipe using these ingredients: ${ingredientsInput}. ` +
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
        body: JSON.stringify({ prompt })
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

  const scalingFactor = generatedRecipe ? currentPortions / generatedRecipe.portion : 1;

  const scaledNutritionalInfo = generatedRecipe && generatedRecipe.nutritional_info ? {
    calories: generatedRecipe.nutritional_info.calories * scalingFactor,
    protein: generatedRecipe.nutritional_info.protein * scalingFactor,
    fat: generatedRecipe.nutritional_info.fat * scalingFactor,
    carbohydrates: generatedRecipe.nutritional_info.carbohydrates * scalingFactor,
    fiber: generatedRecipe.nutritional_info.fiber * scalingFactor,
    sugar: generatedRecipe.nutritional_info.sugar * scalingFactor,
    sodium: generatedRecipe.nutritional_info.sodium * scalingFactor,
    cholesterol: generatedRecipe.nutritional_info.cholesterol * scalingFactor,
  } : null;

  const renderTopNutritionalInfo = () => {
    if (!scaledNutritionalInfo) return null;
    return (
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <p className="text-sm font-semibold">Calories</p>
          <p className="text-lg">{scaledNutritionalInfo.calories.toFixed(2)} kcal</p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <p className="text-sm font-semibold">Protein</p>
          <p className="text-lg">{scaledNutritionalInfo.protein.toFixed(2)} g</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-base-200/70 z-10">
          <button className="btn btn-square btn-lg loading">Loading</button>
        </div>
      )}

      <AnimatedInstructions />

      <ImageSlider />

      <h1 className="text-4xl font-bold mb-6 text-center">Generate Your Custom Recipe</h1>

      {/* Browse AI Recipes Button */}
      <div className="flex justify-center mb-6">
        <button
          className="btn btn-outline"
          onClick={() => router.push('/ai-recipes')}
        >
          Browse AI Recipes
        </button>
      </div>

      <div className="mb-4">
        <label className="label">Ingredients (comma separated):</label>
        <input
          type="text"
          placeholder="e.g., Chicken, Basil, Garlic"
          className="input input-bordered w-full"
          value={ingredientsInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setIngredientsInput(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="label">Any dietary or flavor preferences?</label>
        <input
          type="text"
          placeholder="e.g., low-carb, spicy, vegan"
          className="input input-bordered w-full"
          value={preferences}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPreferences(e.target.value)}
        />
      </div>
      <button className="btn btn-primary mb-8" onClick={generateRecipe} disabled={loading || !ingredientsInput.trim()}>
        {loading ? "Generating Recipe..." : "Generate Recipe"}
      </button>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {generatedRecipe && (
        <div className="card bg-base-100 shadow-md rounded-lg p-8">
          <img
            src={generatedRecipe.image || "/default-image.png"}
            alt={generatedRecipe.title}
            className="w-full h-72 object-cover rounded-md mb-6"
          />

          {generatedRecipe.steps && generatedRecipe.steps.length > 0 && (
            <div className="flex justify-center mb-6">
              <button onClick={() => setStepsModalOpen(true)} className="btn btn-accent animate-pulse transition-all hover:scale-110">
                Start Recipe
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">{generatedRecipe.title}</h2>
            {generatedRecipe.category && (
              <span className="badge badge-secondary">
                {generatedRecipe.category.charAt(0).toUpperCase() + generatedRecipe.category.slice(1)}
              </span>
            )}
          </div>

          {renderTopNutritionalInfo()}

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="text-sm">Portions: {currentPortions}</span>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={currentPortions}
              onChange={handlePortionChange}
              className="range range-primary w-full max-w-xs"
              aria-label="Portion Slider"
            />
            <input
              type="number"
              value={currentPortions}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPortions(Number(e.target.value))}
              min="1"
              max="20"
              step="1"
              className="input input-bordered w-16"
              aria-label="Portions Number Input"
            />
          </div>

          <p className="text-lg mb-6">{generatedRecipe.description}</p>

          <h3 className="text-2xl font-semibold mb-4">Ingredients</h3>
          <ul className="list-disc list-inside mb-6">
            {generatedRecipe.ingredients.map((ing: any, idx: number) => (
              <li key={idx}>
                {(ing.quantity * scalingFactor).toFixed(2)} {ing.unit} {ing.name}
              </li>
            ))}
          </ul>

          <h3 className="text-2xl font-semibold mb-4">Steps</h3>
          <div className="space-y-4 mb-6">
            {generatedRecipe.steps.map((step: any) => (
              <div key={step.id || step.order} className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
                <input type="checkbox" />
                <div className="collapse-title text-xl font-medium">
                  Step {step.order}: {step.description}
                </div>
                <div className="collapse-content">
                  <div className="flex items-center gap-4">
                    <p className="text-sm">{step.description}</p>
                    <button
                      onClick={() => setStepsModalOpen(true)}
                      className="btn btn-sm btn-ghost"
                      aria-label={`View more details for Step ${step.order}`}
                    >
                      View More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {scaledNutritionalInfo && (
            <>
              <div ref={fullNutritionalInfoRef}></div>
              <h3 className="text-2xl font-semibold mt-8 mb-4">Full Nutritional Information (Per Recipe)</h3>
              <div className="overflow-auto" style={{ maxHeight: "400px" }}>
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Calories</td>
                      <td>{scaledNutritionalInfo.calories.toFixed(2)} kcal</td>
                    </tr>
                    <tr>
                      <td>Protein</td>
                      <td>{scaledNutritionalInfo.protein.toFixed(2)} g</td>
                    </tr>
                    <tr>
                      <td>Fat</td>
                      <td>{scaledNutritionalInfo.fat.toFixed(2)} g</td>
                    </tr>
                    <tr>
                      <td>Carbohydrates</td>
                      <td>{scaledNutritionalInfo.carbohydrates.toFixed(2)} g</td>
                    </tr>
                    <tr>
                      <td>Fiber</td>
                      <td>{scaledNutritionalInfo.fiber.toFixed(2)} g</td>
                    </tr>
                    <tr>
                      <td>Sugar</td>
                      <td>{scaledNutritionalInfo.sugar.toFixed(2)} g</td>
                    </tr>
                    <tr>
                      <td>Sodium</td>
                      <td>{scaledNutritionalInfo.sodium.toFixed(2)} mg</td>
                    </tr>
                    <tr>
                      <td>Cholesterol</td>
                      <td>{scaledNutritionalInfo.cholesterol.toFixed(2)} mg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {generatedRecipe.per_ingredient_nutritional_info && generatedRecipe.per_ingredient_nutritional_info.length > 0 && (
            <>
              <h3 className="text-2xl font-semibold mt-8 mb-4">Per-Ingredient Nutritional Information (Per Portion)</h3>
              <div className="overflow-auto" style={{ maxHeight: "400px" }}>
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Calories</th>
                      <th>Protein (g)</th>
                      <th>Fat (g)</th>
                      <th>Carbs (g)</th>
                      <th>Fiber (g)</th>
                      <th>Sugar (g)</th>
                      <th>Sodium (mg)</th>
                      <th>Cholesterol (mg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedRecipe.per_ingredient_nutritional_info.map((info: any, idx: number) => (
                      <tr key={idx}>
                        <td>{info.ingredient}</td>
                        <td>{(info.calories * scalingFactor).toFixed(2)}</td>
                        <td>{(info.protein * scalingFactor).toFixed(2)}</td>
                        <td>{(info.fat * scalingFactor).toFixed(2)}</td>
                        <td>{(info.carbohydrates * scalingFactor).toFixed(2)}</td>
                        <td>{(info.fiber * scalingFactor).toFixed(2)}</td>
                        <td>{(info.sugar * scalingFactor).toFixed(2)}</td>
                        <td>{(info.sodium * scalingFactor).toFixed(2)}</td>
                        <td>{(info.cholesterol * scalingFactor).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {scroll.y > 100 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="btn btn-circle fixed bottom-6 right-6 transition-transform hover:scale-110"
          aria-label="Scroll to top"
        >
          <IconArrowUp size={24} className="rotate-180" />
        </button>
      )}

      {stepsModalOpen && generatedRecipe?.steps && (
        <StepsModal steps={generatedRecipe.steps} onClose={() => setStepsModalOpen(false)} />
      )}
    </div>
  );
}
