"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowDown,
  IconX,
  IconClipboardList,
  IconChecklist,
  IconHelpCircle,
  IconBulb,
  IconStars,
  IconRocket,
  IconShoppingCart,
  IconListCheck,
  IconSparkles,
  IconClock,
  IconChefHat,
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { RecipeDetail, Step } from "../../../../lib/types";
import Image from "next/image";
import { FloatingNavigation } from "../../components/FloatingNavigation";
import { MinimalistLoader } from "../../components/MinimalistLoader";
import { useTheme } from "../../contexts/ThemeContext";

// Memoized StepsModal Component
const StepsModal = memo(
  ({ steps, onClose }: { steps: Step[]; onClose: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const { theme, themes } = useTheme();
    const currentTheme = useMemo(
      () => themes.find((t) => t.name === theme) || themes[0],
      [theme, themes]
    );

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
          className="fixed inset-0 flex justify-center items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
            onClick={onClose}
          ></div>

          <motion.div
            className="relative max-w-md w-full mx-4 rounded-3xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            style={{ backgroundColor: currentTheme.colors.background }}
          >
            <div
              className="p-8 text-center"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
              }}
            >
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: currentTheme.colors.text }}
              >
                Step {currentStep + 1} of {steps.length}
              </h2>
              <p
                className="text-lg"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                {steps[currentStep].description}
              </p>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: `${currentTheme.colors.primary}20`,
                    color: currentTheme.colors.primary,
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  className="px-4 py-2 rounded-lg text-white transition-colors"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                  }}
                >
                  {currentStep === steps.length - 1 ? "Finish" : "Next"}
                </button>
              </div>

              <div className="flex justify-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
);
StepsModal.displayName = "StepsModal";

// Memoized Nutrition Card Component
const NutritionCard = memo(
  ({
    label,
    value,
    unit = "",
  }: {
    label: string;
    value: string;
    unit?: string;
  }) => {
    const { theme, themes } = useTheme();
    const currentTheme = useMemo(
      () => themes.find((t) => t.name === theme) || themes[0],
      [theme, themes]
    );

    return (
      <div
        className="p-4 rounded-2xl text-center shadow-md backdrop-blur-lg bg-white/60 border border-white/20"
        style={{ backgroundColor: `${currentTheme.colors.surface}e0` }}
      >
        <div
          className="text-2xl font-bold mb-1"
          style={{ color: currentTheme.colors.primary }}
        >
          {value}
          {unit}
        </div>
        <div
          className="text-sm uppercase tracking-wide"
          style={{ color: currentTheme.colors.textSecondary }}
        >
          {label}
        </div>
      </div>
    );
  }
);
NutritionCard.displayName = "NutritionCard";

// Memoized Ingredient Item Component
const IngredientItem = memo(
  ({
    ingredient,
    scaledQuantity,
    isAvailable,
    onToggle,
    index,
  }: {
    ingredient: any;
    scaledQuantity: string;
    isAvailable: boolean;
    onToggle: () => void;
    index: number;
  }) => {
    const { theme, themes } = useTheme();
    const currentTheme = useMemo(
      () => themes.find((t) => t.name === theme) || themes[0],
      [theme, themes]
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="p-4 rounded-2xl transition-colors"
        style={{ backgroundColor: currentTheme.colors.surface }}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={onToggle}
            className="w-5 h-5 rounded focus:ring-2"
            style={{
              accentColor: currentTheme.colors.primary,
            }}
          />
          <span
            className={`${
              isAvailable ? "line-through opacity-60" : ""
            } text-base`}
            style={{ color: currentTheme.colors.text }}
          >
            <span
              className="font-semibold"
              style={{ color: currentTheme.colors.primary }}
            >
              {scaledQuantity} {ingredient.unit}
            </span>{" "}
            {ingredient.ingredient.name}
          </span>
        </div>
      </motion.div>
    );
  }
);
IngredientItem.displayName = "IngredientItem";

// Main Component with optimized performance
export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { theme, themes } = useTheme();
  const currentTheme = useMemo(
    () => themes.find((t) => t.name === theme) || themes[0],
    [theme, themes]
  );

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPortions, setCurrentPortions] = useState<number>(1);
  const [portionsInput, setPortionsInput] = useState<string>("1");
  const [availableIngredients, setAvailableIngredients] = useState<{
    [key: number]: boolean;
  }>({});
  const [stepsModalOpen, setStepsModalOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Optimized scroll handler
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

  // Fetch recipe details
  useEffect(() => {
    if (id) {
      fetch(`/api/recipes/${id}?nocache=1&ts=${Date.now()}`, {
        cache: "no-store",
      })
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
          setPortionsInput(Number(data.portion).toString());
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
            setError("An unknown error occurred.");
          }
          setLoading(false);
        });
    }
  }, [id]);

  // Memoized handlers
  const handleIngredientToggle = useCallback((ingredientId: number) => {
    setAvailableIngredients((prev) => ({
      ...prev,
      [ingredientId]: !prev[ingredientId],
    }));
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Memoized calculations
  const scalingFactor = useMemo(
    () => currentPortions / (recipe?.portion || 1),
    [currentPortions, recipe?.portion]
  );

  const scaledNutritionalInfo = useMemo(() => {
    if (!recipe?.nutritional_info) return null;

    return {
      calories: (
        parseFloat(recipe.nutritional_info.calories.toString()) * scalingFactor
      ).toFixed(2),
      protein: (
        parseFloat(recipe.nutritional_info.protein.toString()) * scalingFactor
      ).toFixed(2),
      fat: (
        parseFloat(recipe.nutritional_info.fat.toString()) * scalingFactor
      ).toFixed(2),
      carbohydrates: (
        parseFloat(recipe.nutritional_info.carbohydrates.toString()) *
        scalingFactor
      ).toFixed(2),
      fiber: (
        parseFloat(recipe.nutritional_info.fiber.toString()) * scalingFactor
      ).toFixed(2),
      sugar: (
        parseFloat(recipe.nutritional_info.sugar.toString()) * scalingFactor
      ).toFixed(2),
      sodium: (
        parseFloat(recipe.nutritional_info.sodium.toString()) * scalingFactor
      ).toFixed(2),
      cholesterol: (
        parseFloat(recipe.nutritional_info.cholesterol.toString()) *
        scalingFactor
      ).toFixed(2),
    };
  }, [recipe?.nutritional_info, scalingFactor]);

  const imageUrl = useMemo(
    () =>
      recipe?.image && recipe.image.trim() !== ""
        ? recipe.image
        : "/default-image.png",
    [recipe?.image]
  );

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
            onClick={() => router.push("/")}
            className="text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
            }}
          >
            Back to Home
          </motion.button>
        </div>
      </div>
    );
  }

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

      {/* Hero Section with Image */}
      <div className="relative h-96 md:h-[500px] overflow-hidden z-10">
        <Image
          src={imageUrl}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/default-image.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <span
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white text-xs md:text-sm font-bold uppercase tracking-wide"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                }}
              >
                {recipe.category.charAt(0).toUpperCase() +
                  recipe.category.slice(1)}
              </span>
              <span className="text-white/90 text-xs md:text-sm bg-white/20 px-2 md:px-3 py-1 rounded-full">
                {recipe.portion.toString()}{" "}
                {parseInt(recipe.portion.toString()) === 1
                  ? "serving"
                  : "servings"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 leading-tight text-white line-clamp-2">
              {recipe.title}
            </h1>
            <p className="text-sm md:text-lg text-white/90 leading-relaxed max-w-2xl line-clamp-3">
              {recipe.description}
            </p>

            {/* Start Recipe Button */}
            {recipe.steps && recipe.steps.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStepsModalOpen(true)}
                className="mt-6 text-white font-semibold px-8 py-4 rounded-2xl shadow-2xl transition-all duration-300 flex items-center gap-3 text-lg"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                }}
              >
                <IconRocket size={20} />
                <span>Start Cooking</span>
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-2 py-12 relative z-10">
        <div
          className="rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl bg-white/90 border border-white/30"
          style={{ backgroundColor: `${currentTheme.colors.surface}f5` }}
        >
          {/* Nutritional Info Cards - Total for Current Portions */}
          {scaledNutritionalInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <NutritionCard
                label="Calories"
                value={scaledNutritionalInfo.calories}
              />
              <NutritionCard
                label="Protein"
                value={scaledNutritionalInfo.protein}
                unit="g"
              />
              <NutritionCard
                label="Carbs"
                value={scaledNutritionalInfo.carbohydrates}
                unit="g"
              />
              <NutritionCard
                label="Fat"
                value={scaledNutritionalInfo.fat}
                unit="g"
              />
            </motion.div>
          )}

          {/* Compact Per-Portion Section */}
          {recipe.nutritional_info && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center gap-8 p-4 rounded-2xl backdrop-blur-lg bg-white/40 border border-white/20">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">
                    {(
                      parseFloat(recipe.nutritional_info.calories.toString()) /
                      recipe.portion
                    ).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">
                    Calories per portion
                  </div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">
                    {(
                      parseFloat(recipe.nutritional_info.protein.toString()) /
                      recipe.portion
                    ).toFixed(1)}
                    g
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">
                    Protein per portion
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Portion Control Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl mb-8 backdrop-blur-lg bg-white/60 border border-white/20"
            style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
          >
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="font-semibold flex items-center gap-2"
                style={{ color: currentTheme.colors.text }}
              >
                <IconSparkles
                  size={18}
                  style={{ color: currentTheme.colors.primary }}
                />
                Adjust Portions:
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const newValue = Math.max(1, currentPortions - 1);
                    setCurrentPortions(newValue);
                    setPortionsInput(newValue.toString());
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: `${currentTheme.colors.primary}20`,
                    color: currentTheme.colors.primary,
                  }}
                  disabled={currentPortions <= 1}
                >
                  <span className="text-lg font-bold">-</span>
                </button>
                <input
                  type="number"
                  min="1"
                  value={portionsInput}
                  onChange={(e) => setPortionsInput(e.target.value)}
                  onBlur={() => {
                    const value = parseInt(portionsInput);
                    if (value > 0) {
                      setCurrentPortions(value);
                    } else {
                      setCurrentPortions(1);
                      setPortionsInput("1");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = parseInt(portionsInput);
                      if (value > 0) {
                        setCurrentPortions(value);
                      } else {
                        setCurrentPortions(1);
                        setPortionsInput("1");
                      }
                    }
                  }}
                  className="w-16 h-10 text-center text-xl font-bold rounded-lg border-2 transition-colors focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: `${currentTheme.colors.surface}`,
                    borderColor: `${currentTheme.colors.primary}30`,
                    color: currentTheme.colors.text,
                  }}
                />
                <button
                  onClick={() => {
                    const newValue = currentPortions + 1;
                    setCurrentPortions(newValue);
                    setPortionsInput(newValue.toString());
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: `${currentTheme.colors.primary}20`,
                    color: currentTheme.colors.primary,
                  }}
                >
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Ingredients Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <h3
              className="text-2xl font-bold mb-6 flex items-center gap-3"
              style={{ color: currentTheme.colors.text }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                }}
              >
                <IconShoppingCart size={18} className="text-white" />
              </div>
              Ingredients
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipe.recipe_ingredients.map((ingredient, index) => {
                const scaledQuantity = (
                  ingredient.quantity * scalingFactor
                ).toFixed(2);
                return (
                  <IngredientItem
                    key={ingredient.ingredient_id}
                    ingredient={ingredient}
                    scaledQuantity={scaledQuantity}
                    isAvailable={
                      availableIngredients[ingredient.ingredient_id] || false
                    }
                    onToggle={() =>
                      handleIngredientToggle(ingredient.ingredient_id)
                    }
                    index={index}
                  />
                );
              })}
            </div>
          </motion.div>

          {/* Instructions Section */}
          {recipe.steps && recipe.steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-10"
            >
              <h3
                className="text-2xl font-bold mb-6 flex items-center gap-3"
                style={{ color: currentTheme.colors.text }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                  }}
                >
                  <IconListCheck size={18} className="text-white" />
                </div>
                Instructions
              </h3>
              <div className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-6 rounded-2xl backdrop-blur-lg bg-white/60 border border-white/20"
                    style={{
                      backgroundColor: `${currentTheme.colors.primary}20`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                        }}
                      >
                        {index + 1}
                      </div>
                      <p
                        className="text-base leading-relaxed"
                        style={{ color: currentTheme.colors.text }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Additional Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div
              className="p-6 rounded-2xl backdrop-blur-lg bg-white/60 border border-white/20"
              style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
            >
              <h4
                className="text-lg font-bold mb-4 flex items-center gap-2"
                style={{ color: currentTheme.colors.text }}
              >
                <IconClock
                  size={18}
                  style={{ color: currentTheme.colors.primary }}
                />
                Cooking Time
              </h4>
              <p
                className="text-2xl font-bold"
                style={{ color: currentTheme.colors.primary }}
              >
                {recipe.steps ? recipe.steps.length * 5 : 30} minutes
              </p>
            </div>

            <div
              className="p-6 rounded-2xl backdrop-blur-lg bg-white/60 border border-white/20"
              style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
            >
              <h4
                className="text-lg font-bold mb-4 flex items-center gap-2"
                style={{ color: currentTheme.colors.text }}
              >
                <IconChefHat
                  size={18}
                  style={{ color: currentTheme.colors.primary }}
                />
                Difficulty
              </h4>
              <p
                className="text-2xl font-bold"
                style={{ color: currentTheme.colors.primary }}
              >
                {recipe.steps && recipe.steps.length > 8
                  ? "Advanced"
                  : recipe.steps && recipe.steps.length > 4
                  ? "Intermediate"
                  : "Easy"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
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

      {/* Steps Modal */}
      {stepsModalOpen && recipe.steps && (
        <StepsModal
          steps={recipe.steps}
          onClose={() => setStepsModalOpen(false)}
        />
      )}

      {/* Floating Navigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
