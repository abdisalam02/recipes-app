"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
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
} from "@tabler/icons-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { RecipeDetail, Step } from "../../../../lib/types";
import Image from "next/image";
import { FloatingNavigation } from "../../components/FloatingNavigation";
import { MinimalistLoader } from "../../components/MinimalistLoader";

// Scroll animation hook for mobile optimizations
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "0px 0px -30px 0px", // More aggressive trigger for faster content appearance
  });

  useEffect(() => {
    if (isInView) {
      setIsVisible(true);
    }
  }, [isInView]);

  return { ref, isVisible };
}

// Custom hook to get window scroll position with parallax support.
function useWindowScroll() {
  const [scroll, setScroll] = useState({ y: 0 });
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScroll({ y: window.scrollY });
      setShowScrollButton(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate blur amount based on scroll position
  const calculateBlur = (maxBlur = 20) => {
    const scrollThreshold = 400; // Amount to scroll before max blur
    const blurAmount = Math.min(
      (scroll.y / scrollThreshold) * maxBlur,
      maxBlur
    );
    return blurAmount;
  };

  // Calculate opacity based on scroll position
  const calculateOpacity = (minOpacity = 0.3) => {
    const scrollThreshold = 300;
    const opacity = Math.max(1 - scroll.y / scrollThreshold, minOpacity);
    return opacity;
  };

  return {
    scroll,
    showScrollButton,
    scrollToTop,
    calculateBlur,
    calculateOpacity,
  };
}

// Enhanced animated component wrapper for mobile scroll effects
const AnimatedSection = ({
  children,
  delay = 0,
  className = "",
  animationType = "slideUp",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  animationType?: "slideUp" | "slideLeft" | "slideRight" | "fadeIn" | "scale";
}) => {
  const { ref, isVisible } = useScrollAnimation();

  const getAnimationVariants = () => {
    switch (animationType) {
      case "slideLeft":
        return {
          hidden: { opacity: 0, x: -50 },
          visible: { opacity: 1, x: 0 },
        };
      case "slideRight":
        return {
          hidden: { opacity: 0, x: 50 },
          visible: { opacity: 1, x: 0 },
        };
      case "fadeIn":
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
      case "scale":
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
        };
      default: // slideUp
        return {
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={getAnimationVariants()}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

//
// Enhanced StepsModal Component with modern glassmorphism design
//
interface StepsModalProps {
  steps: Step[];
  onClose: () => void;
}

const StepsModal: React.FC<StepsModalProps> = ({ steps, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = steps.length;

  // Define an array of modern gradient backgrounds for steps
  const bgGradients = [
    "from-royal-orange to-sunset-pink",
    "from-emerald-fresh to-ocean-blue",
    "from-sunset-pink to-cosmic-purple",
    "from-cosmic-purple to-ocean-blue",
    "from-ocean-blue to-emerald-fresh",
  ];

  // Get current gradient based on step index
  const currentGradient = bgGradients[currentStep % bgGradients.length];

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
        {/* Enhanced blurred backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md"
          onClick={onClose}
        ></div>

        <motion.div
          className={`relative max-w-md w-full mx-4 rounded-3xl overflow-hidden shadow-elevation-high`}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          style={{ maxHeight: "calc(100vh - 40px)" }}
        >
          {/* Enhanced progress bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 z-10">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: `${(currentStep / totalSteps) * 100}%` }}
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Enhanced content with glassmorphism */}
          <div
            className={`bg-gradient-to-br ${currentGradient} p-6 sm:p-8 pt-8 overflow-y-auto`}
            style={{ maxHeight: "calc(100vh - 40px)" }}
          >
            {/* Enhanced close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 glass-panel p-2 rounded-full hover:bg-white/20 transition-colors z-10"
              aria-label="Close modal"
            >
              <IconX size={20} className="text-white" />
            </button>

            {/* Enhanced step counter */}
            <div className="text-white/90 text-sm font-semibold mb-6 text-center">
              Step {currentStep + 1} of {totalSteps}
            </div>

            {/* Enhanced step content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-white text-center"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center text-white text-3xl font-bold shadow-elevation-medium">
                  {currentStep + 1}
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold mb-6 leading-tight">
                {steps[currentStep].description}
              </h3>

              <p className="text-white/90 text-base leading-relaxed mb-8">
                Follow this step carefully before moving to the next one.
              </p>
            </motion.div>

            {/* Enhanced navigation buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className={`px-6 py-3 rounded-2xl text-base font-semibold transition-all ${
                  currentStep === 0
                    ? "glass-panel text-white/50 cursor-not-allowed"
                    : "glass-panel text-white hover:bg-white/20"
                }`}
                disabled={currentStep === 0}
              >
                Previous
              </button>

              <button
                onClick={nextStep}
                className="px-6 py-3 rounded-2xl bg-white text-gray-900 font-semibold hover:bg-white/90 transition-colors text-base shadow-elevation-medium"
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

//
// Enhanced RecipeDetailPage Component
//
export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const {
    scroll,
    showScrollButton,
    scrollToTop,
    calculateBlur,
    calculateOpacity,
  } = useWindowScroll();
  const fullNutritionalInfoRef = useRef<HTMLDivElement>(null);

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [currentPortions, setCurrentPortions] = useState<number>(1);
  const [availableIngredients, setAvailableIngredients] = useState<{
    [key: number]: boolean;
  }>({});
  // State for the Steps modal (Start Recipe feature)
  const [stepsModalOpen, setStepsModalOpen] = useState(false);

  // Fetch recipe details on mount.
  useEffect(() => {
    if (id) {
      fetch(`/api/recipes/${id}`)
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
      fullNutritionalInfoRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="container mx-auto px-4 py-8 relative z-10 flex items-center justify-center min-h-screen">
          <MinimalistLoader message="Loading Recipe..." size="lg" />
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="container mx-auto px-4 py-8 relative z-10 flex items-center justify-center min-h-screen">
          <div className="glass-panel backdrop-blur-xl border border-white/30 p-12 rounded-3xl text-center max-w-md shadow-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <IconX size={48} className="text-white" />
            </motion.div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              {error ? "Error" : "Recipe Not Found"}
            </h2>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              {error || "The recipe you are looking for does not exist."}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300"
            >
              Back to Home
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate scaling factor for portions.
  const scalingFactor = currentPortions / recipe.portion;

  // Destructure nutritional info from recipe.
  const { nutritional_info, per_ingredient_nutritional_info } = recipe;
  const scaledNutritionalInfo = nutritional_info
    ? {
        calories: (
          parseFloat(nutritional_info.calories.toString()) * scalingFactor
        ).toFixed(2),
        protein: (
          parseFloat(nutritional_info.protein.toString()) * scalingFactor
        ).toFixed(2),
        fat: (
          parseFloat(nutritional_info.fat.toString()) * scalingFactor
        ).toFixed(2),
        carbohydrates: (
          parseFloat(nutritional_info.carbohydrates.toString()) * scalingFactor
        ).toFixed(2),
        fiber: (
          parseFloat(nutritional_info.fiber.toString()) * scalingFactor
        ).toFixed(2),
        sugar: (
          parseFloat(nutritional_info.sugar.toString()) * scalingFactor
        ).toFixed(2),
        sodium: (
          parseFloat(nutritional_info.sodium.toString()) * scalingFactor
        ).toFixed(2),
        cholesterol: (
          parseFloat(nutritional_info.cholesterol.toString()) * scalingFactor
        ).toFixed(2),
      }
    : null;

  const imageUrl =
    recipe.image && recipe.image.trim() !== ""
      ? recipe.image
      : "/default-image.png";

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      {/* Fixed Background Image with Parallax Effect */}
      <div className="fixed inset-0 z-0">
        <Image
          src={imageUrl}
          alt={recipe.title}
          fill
          className="object-cover transition-all duration-300"
          style={{
            filter: `blur(${calculateBlur()}px)`,
            opacity: calculateOpacity(),
            transform: `scale(${1 + scroll.y * 0.0005})`,
          }}
          sizes="100vw"
          priority
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/default-image.png";
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-300"
          style={{
            opacity: Math.max(0.6, 1 - scroll.y * 0.001),
          }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 h-screen flex items-end">
        <div className="container mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="glass-panel backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full text-white text-sm font-bold uppercase tracking-wide">
                {recipe.category.charAt(0).toUpperCase() +
                  recipe.category.slice(1)}
              </span>
              <span className="text-white/90 text-sm bg-white/20 px-3 py-1 rounded-full">
                {recipe.portion.toString()}{" "}
                {parseInt(recipe.portion.toString()) === 1
                  ? "serving"
                  : "servings"}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight text-white text-shadow">
              {recipe.title}
            </h1>
            <p className="text-xl text-white/90 leading-relaxed mb-8 max-w-2xl">
              {recipe.description}
            </p>

            {/* Start Recipe Button */}
            {recipe.steps && recipe.steps.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStepsModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 flex items-center gap-3 text-lg"
              >
                <IconRocket size={20} />
                <span>Start Cooking</span>
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative z-20 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          {/* Back to top button */}
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={scrollToTop}
              className="fixed bottom-24 left-4 z-40 glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-4 rounded-full hover:scale-110 transition-all duration-300 group shadow-2xl md:bottom-6 md:left-6"
              aria-label="Back to top"
            >
              <IconArrowDown
                size={20}
                className="rotate-180 text-orange-600 group-hover:text-pink-600 transition-colors"
              />
            </motion.button>
          )}

          <div className="glass-panel backdrop-blur-xl bg-white/40 border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl">
            {/* Enhanced Nutritional Info Cards */}
            {scaledNutritionalInfo && (
              <AnimatedSection animationType="fadeIn" delay={0.1}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="nutrition-item">
                    <div className="nutrition-value">
                      {scaledNutritionalInfo.calories}
                    </div>
                    <div className="nutrition-label">Calories</div>
                  </div>
                  <div className="nutrition-item">
                    <div className="nutrition-value">
                      {scaledNutritionalInfo.protein}g
                    </div>
                    <div className="nutrition-label">Protein</div>
                  </div>
                  <div className="nutrition-item">
                    <div className="nutrition-value">
                      {scaledNutritionalInfo.carbohydrates}g
                    </div>
                    <div className="nutrition-label">Carbs</div>
                  </div>
                  <div className="nutrition-item">
                    <div className="nutrition-value">
                      {scaledNutritionalInfo.fat}g
                    </div>
                    <div className="nutrition-label">Fat</div>
                  </div>
                </div>
              </AnimatedSection>
            )}

            {/* Enhanced Portion Control Section */}
            <AnimatedSection animationType="slideLeft" delay={0.2}>
              <div className="glass-panel backdrop-blur-xl bg-white/30 border border-white/20 p-6 rounded-2xl mb-8">
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    className="font-semibold flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <IconSparkles size={18} className="text-royal-orange" />
                    Adjust Portions:
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setCurrentPortions(Math.max(1, currentPortions - 1))
                      }
                      className="glass-panel w-10 h-10 rounded-full flex items-center justify-center hover:bg-royal-orange/20 transition-colors"
                      disabled={currentPortions <= 1}
                    >
                      <span className="text-lg font-bold text-royal-orange">
                        -
                      </span>
                    </button>
                    <span
                      className="text-xl font-bold min-w-[3rem] text-center"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {currentPortions}
                    </span>
                    <button
                      onClick={() => setCurrentPortions(currentPortions + 1)}
                      className="glass-panel w-10 h-10 rounded-full flex items-center justify-center hover:bg-royal-orange/20 transition-colors"
                    >
                      <span className="text-lg font-bold text-royal-orange">
                        +
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Enhanced Ingredients Section */}
            <AnimatedSection animationType="slideUp" delay={0.3}>
              <div className="mb-10">
                <h3
                  className="text-2xl font-bold mb-6 flex items-center gap-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  <div className="w-8 h-8 bg-gradient-emerald rounded-full flex items-center justify-center">
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
                      <AnimatedSection
                        key={ingredient.ingredient_id}
                        animationType="slideLeft"
                        delay={0.1 * index}
                      >
                        <div className="glass-panel p-4 rounded-2xl hover:bg-white/60 transition-colors">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={
                                availableIngredients[
                                  ingredient.ingredient_id
                                ] || false
                              }
                              onChange={() =>
                                handleIngredientToggle(ingredient.ingredient_id)
                              }
                              className="w-5 h-5 text-emerald-fresh bg-gray-100 border-gray-300 rounded focus:ring-emerald-fresh"
                            />
                            <span
                              className={`${
                                availableIngredients[ingredient.ingredient_id]
                                  ? "line-through opacity-60"
                                  : ""
                              } text-base`}
                            >
                              <span className="font-semibold text-emerald-fresh">
                                {scaledQuantity} {ingredient.unit}
                              </span>{" "}
                              {ingredient.ingredient.name}
                            </span>
                          </div>
                        </div>
                      </AnimatedSection>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>

            {/* Enhanced Steps Section with Compact Design */}
            <AnimatedSection animationType="slideUp" delay={0.4}>
              <div className="mb-10">
                <h3
                  className="text-2xl font-bold mb-6 flex items-center gap-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  <div className="w-8 h-8 bg-gradient-cosmic rounded-full flex items-center justify-center">
                    <IconListCheck size={18} className="text-white" />
                  </div>
                  Instructions
                </h3>
                <div className="space-y-4">
                  {recipe.steps.map((step, index) => (
                    <AnimatedSection
                      key={step.id}
                      animationType="slideRight"
                      delay={0.1 * index}
                    >
                      <div className="glass-panel p-4 rounded-2xl hover:bg-white/60 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Compact step number */}
                          <div className="w-8 h-8 bg-gradient-cosmic rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-white font-bold text-sm">
                              {step.order}
                            </span>
                          </div>
                          <div className="flex-1">
                            {/* Improved text spacing and sizing */}
                            <p
                              className="text-sm md:text-base leading-relaxed font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            {/* Enhanced Full Nutritional Info Section */}
            {recipe.per_ingredient_nutritional_info &&
              recipe.per_ingredient_nutritional_info.length > 0 && (
                <AnimatedSection animationType="fadeIn" delay={0.5}>
                  <div
                    ref={fullNutritionalInfoRef}
                    className="glass-panel p-6 rounded-2xl"
                  >
                    <h3
                      className="text-2xl font-bold mb-6 flex items-center gap-3"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <div className="w-8 h-8 bg-gradient-aurora rounded-full flex items-center justify-center">
                        <IconClipboardList size={18} className="text-white" />
                      </div>
                      Per-Ingredient Nutrition
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th
                              className="text-left py-3 px-4 font-semibold"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Ingredient
                            </th>
                            <th
                              className="text-left py-3 px-4 font-semibold"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Calories
                            </th>
                            <th
                              className="text-left py-3 px-4 font-semibold"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Protein (g)
                            </th>
                            <th
                              className="text-left py-3 px-4 font-semibold"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Fat (g)
                            </th>
                            <th
                              className="text-left py-3 px-4 font-semibold"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Carbs (g)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipe.per_ingredient_nutritional_info.map(
                            (info) => {
                              const ingredient = recipe.recipe_ingredients.find(
                                (ri) => ri.ingredient_id === info.ingredient_id
                              )?.ingredient;
                              return (
                                <tr
                                  key={info.id}
                                  className="border-b border-gray-100 hover:bg-gray-50/50"
                                >
                                  <td
                                    className="py-3 px-4 font-medium"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {ingredient ? ingredient.name : "Unknown"}
                                  </td>
                                  <td
                                    className="py-3 px-4"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {info.calories || 0}
                                  </td>
                                  <td
                                    className="py-3 px-4"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {info.protein || 0}
                                  </td>
                                  <td
                                    className="py-3 px-4"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {info.fat || 0}
                                  </td>
                                  <td
                                    className="py-3 px-4"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {info.carbohydrates || 0}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </AnimatedSection>
              )}
          </div>
        </div>

        {/* Enhanced Steps Modal for "Start Recipe" Feature */}
        {stepsModalOpen && recipe.steps && (
          <StepsModal
            steps={recipe.steps}
            onClose={() => setStepsModalOpen(false)}
          />
        )}
      </div>

      {/* Floating Navigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
