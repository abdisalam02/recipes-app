'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconArrowDown, IconX, IconClipboardList, IconChecklist, IconHelpCircle, IconBulb, IconStars, IconRocket } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecipeDetail, Step } from '../../../../lib/types';

// Custom hook to get window scroll position.
function useWindowScroll() {
  const [scroll, setScroll] = useState({ y: 0 });
  useEffect(() => {
    const handleScroll = () => setScroll({ y: window.scrollY });
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return scroll;
}

//
// StepsModal Component: Displays recipe steps one-by-one with dynamic icons and animations
//
interface StepsModalProps {
  steps: Step[];
  onClose: () => void;
}

const StepsModal: React.FC<StepsModalProps> = ({ steps, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Define an array of icons (using Tabler icons)
  const stepIcons = [IconClipboardList, IconChecklist, IconHelpCircle, IconBulb, IconStars, IconRocket];
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
        {/* Blurred backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md"></div>
        <div className="modal-box max-w-md bg-gradient-to-br from-green-200 to-cyan-200 border-4 border-green-300 shadow-2xl rounded-lg p-6 relative">
          <button
            className="btn btn-sm btn-circle absolute top-2 right-2"
            onClick={onClose}
            aria-label="Close Steps"
          >
            <IconX size={16} />
          </button>
          <motion.div
            className="flex flex-col items-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Display a dynamic icon for the current step */}
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
            <button
              onClick={prevStep}
              className="btn btn-outline"
              disabled={currentStep === 0}
            >
              Previous
            </button>
            <button onClick={nextStep} className="btn btn-primary">
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

//
// RecipeDetailPage Component with Start Recipe Feature
//
export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const scroll = useWindowScroll();
  const fullNutritionalInfoRef = useRef<HTMLDivElement>(null);

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [currentPortions, setCurrentPortions] = useState<number>(1);
  const [availableIngredients, setAvailableIngredients] = useState<{ [key: number]: boolean }>({});
  // State for the Steps modal (Start Recipe feature)
  const [stepsModalOpen, setStepsModalOpen] = useState(false);

  // Fetch recipe details on mount.
  useEffect(() => {
    if (id) {
      fetch(`/api/recipes/${id}`)
        .then((res) => {
          if (!res.ok) {
            return res.json().then((data) => {
              throw new Error(data.error || 'Failed to fetch recipe');
            });
          }
          return res.json();
        })
        .then((data: RecipeDetail) => {
          setRecipe(data);
          setCurrentPortions(Number(data.portion));
          const initialAvailability: { [key: number]: boolean } = {};
          data.recipe_ingredients.forEach((ri) => {
            initialAvailability[ri.ingredient_id] = false;
          });
          setAvailableIngredients(initialAvailability);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('An unknown error occurred.');
          }
          setLoading(false);
        });
    }
  }, [id]);

  const openModal = (step: Step) => {
    setSelectedStep(step);
    setModalOpened(true);
  };

  const closeModal = () => {
    setSelectedStep(null);
    setModalOpened(false);
  };

  const handleIngredientToggle = (ingredientId: number) => {
    setAvailableIngredients((prev) => ({
      ...prev,
      [ingredientId]: !prev[ingredientId],
    }));
  };

  const scrollToFullInfo = () => {
    if (fullNutritionalInfoRef.current) {
      fullNutritionalInfoRef.current.scrollIntoView({ behavior: 'smooth' });
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
        <h2 className="text-2xl font-bold mb-4">{error ? 'Error' : 'Recipe Not Found'}</h2>
        <p className="text-gray-500">{error || 'The recipe you are looking for does not exist.'}</p>
      </div>
    );
  }

  // Calculate scaling factor for portions.
  const scalingFactor = currentPortions / recipe.portion;

  // Destructure nutritional info from recipe.
  const { nutritional_info, per_ingredient_nutritional_info } = recipe;
  const scaledNutritionalInfo = nutritional_info
    ? {
        calories: (parseFloat(nutritional_info.calories.toString()) * scalingFactor).toFixed(2),
        protein: (parseFloat(nutritional_info.protein.toString()) * scalingFactor).toFixed(2),
        fat: (parseFloat(nutritional_info.fat.toString()) * scalingFactor).toFixed(2),
        carbohydrates: (parseFloat(nutritional_info.carbohydrates.toString()) * scalingFactor).toFixed(2),
        fiber: (parseFloat(nutritional_info.fiber.toString()) * scalingFactor).toFixed(2),
        sugar: (parseFloat(nutritional_info.sugar.toString()) * scalingFactor).toFixed(2),
        sodium: (parseFloat(nutritional_info.sodium.toString()) * scalingFactor).toFixed(2),
        cholesterol: (parseFloat(nutritional_info.cholesterol.toString()) * scalingFactor).toFixed(2),
      }
    : null;

  const imageUrl =
    recipe.image && recipe.image.trim() !== '' ? recipe.image : '/default-image.png';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="card bg-base-100 shadow-md rounded-lg p-8 relative">
        {/* Image Section */}
        <img
          src={imageUrl}
          alt={recipe.title}
          className="w-full h-72 object-cover rounded-md mb-6"
        />

        {/* Start Recipe Button */}
        {recipe.steps && recipe.steps.length > 0 && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setStepsModalOpen(true)}
              className="btn btn-accent animate-pulse transition-all hover:scale-110"
            >
              Start Recipe
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">{recipe.title}</h2>
          <span className="badge badge-secondary">
            {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
          </span>
        </div>

        {/* Portion Control Section */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className="text-sm">Portions:</span>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={currentPortions}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPortions(Number(e.target.value))}
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

        {/* Full Nutritional Information (Per Portion) */}
        {scaledNutritionalInfo && (
          <>
            <h3 className="text-2xl font-semibold mb-4">
              Full Nutritional Information (Per Portion)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 border rounded-lg shadow-sm">
                <p className="text-sm font-semibold">Calories</p>
                <p className="text-lg">{scaledNutritionalInfo.calories} kcal</p>
              </div>
              <div className="p-4 border rounded-lg shadow-sm">
                <p className="text-sm font-semibold">Protein</p>
                <p className="text-lg">{scaledNutritionalInfo.protein} g</p>
              </div>
            </div>
            <button
              onClick={() => fullNutritionalInfoRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="btn btn-outline btn-primary btn-lg mb-6"
              aria-label="See Per-Ingredient Nutritional Info"
            >
              <IconArrowDown size={16} className="mr-2" />
              See Per-Ingredient Nutritional Info
            </button>
          </>
        )}

        {/* Description Section */}
        <p className="text-lg mb-6">{recipe.description}</p>

        {/* Ingredients Section */}
        <h3 className="text-2xl font-semibold mb-4">Ingredients</h3>
        <div className="space-y-2 mb-6">
          {recipe.recipe_ingredients.map((ingredient) => {
            const scaledQuantity = (ingredient.quantity * scalingFactor).toFixed(2);
            return (
              <div key={ingredient.ingredient_id} className="flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={availableIngredients[ingredient.ingredient_id] || false}
                    onChange={() => handleIngredientToggle(ingredient.ingredient_id)}
                    className="checkbox checkbox-primary"
                  />
                  <span>
                    {scaledQuantity} {ingredient.unit} of {ingredient.ingredient.name}
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        {/* Steps Section using DaisyUI Collapse */}
        <h3 className="text-2xl font-semibold mb-4">Steps</h3>
        <div className="space-y-4 mb-6">
          {recipe.steps.map((step) => (
            <div key={step.id} className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
              <input type="checkbox" />
              <div className="collapse-title text-xl font-medium">
                Step {step.order}: {step.description}
              </div>
              <div className="collapse-content">
                <div className="flex items-center gap-4">
                  <p className="text-sm">{step.description}</p>
                  <button
                    onClick={() => openModal(step)}
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

        {/* Modal for "View More" on individual steps */}
        {modalOpened && selectedStep && (
          <>
            <div className="modal modal-open">
              <div className="modal-box max-w-md">
                <h3 className="font-bold text-xl mb-4">{selectedStep.description}</h3>
                <p className="py-4">
                  Here are more details for the step: <strong>{selectedStep.description}</strong>.
                </p>
                <div className="modal-action">
                  <button className="btn" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-backdrop bg-black opacity-50"></div>
          </>
        )}

        {/* Per-Ingredient Nutritional Information Table */}
        {recipe.per_ingredient_nutritional_info && recipe.per_ingredient_nutritional_info.length > 0 && (
          <>
            <div ref={fullNutritionalInfoRef}></div>
            <h3 className="text-2xl font-semibold mt-8 mb-4">
              Per-Ingredient Nutritional Information
            </h3>
            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Calories</th>
                    <th>Protein (g)</th>
                    <th>Fat (g)</th>
                    <th>Carbohydrates (g)</th>
                    <th>Fiber (g)</th>
                    <th>Sugar (g)</th>
                    <th>Sodium (mg)</th>
                    <th>Cholesterol (mg)</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.per_ingredient_nutritional_info.map((info) => {
                    const ingredient = recipe.recipe_ingredients.find(
                      (ri) => ri.ingredient_id === info.ingredient_id
                    )?.ingredient;
                    return (
                      <tr key={info.id}>
                        <td>{ingredient ? ingredient.name : 'Unknown'}</td>
                        <td>{info.calories || 0}</td>
                        <td>{info.protein || 0}</td>
                        <td>{info.fat || 0}</td>
                        <td>{info.carbohydrates || 0}</td>
                        <td>{info.fiber || 0}</td>
                        <td>{info.sugar || 0}</td>
                        <td>{info.sodium || 0}</td>
                        <td>{info.cholesterol || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Scroll-to-Top Button */}
      {scroll.y > 100 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn btn-circle fixed bottom-6 right-6 transition-transform hover:scale-110"
          aria-label="Scroll to top"
        >
          <IconArrowDown size={24} className="rotate-180" />
        </button>
      )}

      {/* Steps Modal for "Start Recipe" Feature */}
      {stepsModalOpen && recipe.steps && (
        <StepsModal steps={recipe.steps} onClose={() => setStepsModalOpen(false)} />
      )}
    </div>
  );
}
