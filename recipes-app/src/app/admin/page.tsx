"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash, IconEdit, IconLock, IconCheck, IconHome, IconChefHat, IconRobot, IconRefresh, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { MinimalistLoader } from "../components/MinimalistLoader";

// Define the Recipe Interface
interface Recipe {
  id: number;
  title: string;
  category?: string;
  image: string;
  description: string;
  portion: number;
  ingredients?: Array<{
    id?: number;
    name: string;
    quantity: number;
    unit: string;
  }>;
  steps?: Array<{
    id?: number;
    order: number;
    description: string;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication: Always require password on page load.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(true);

  // Admin Logic States
  const [selectedTab, setSelectedTab] = useState<"recipes" | "ai-recipes">(
    "recipes"
  );
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  // Edit modal states for ingredients and steps
  const [editingIngredients, setEditingIngredients] = useState<
    Array<{
      id?: number;
      name: string;
      quantity: number;
      unit: string;
    }>
  >([]);
  const [editingSteps, setEditingSteps] = useState<
    Array<{
      id?: number;
      order: number;
      description: string;
    }>
  >([]);

  // Image change / preview states inside the edit modal
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Deletion Confirmation States
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  // Add toast message state
  const [toastMessage, setToastMessage] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({
    show: false,
    type: "success",
    message: "",
  });

  // Toast component
  const Toast = ({
    type,
    message,
    onClose,
  }: {
    type: "success" | "error";
    message: string;
    onClose: () => void;
  }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        ></div>
        <div
          className={`${
            type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white px-6 py-4 rounded-lg shadow-xl max-w-md w-full mx-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="text-lg font-medium">{message}</span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
          </div>
        </div>
      </div>
    );
  };

  // Handler: Submit Password
  const handleLogin = async () => {
    if (!passwordInput) {
      setToastMessage({
        show: true,
        type: "error",
        message: "Password cannot be empty",
      });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Prevent browser's default auth popup
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ password: passwordInput }),
      });

      if (!res.ok) {
        let errorMessage;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error;
        } catch (jsonError) {
          errorMessage = `Authentication failed (${res.status})`;
        }
        throw new Error(errorMessage || "Invalid password");
      }

      setIsAuthenticated(true);
      setShowPasswordModal(false);
      setToastMessage({
        show: true,
        type: "success",
        message: "Successfully logged in",
      });
      fetchRecipes();
    } catch (err: any) {
      setToastMessage({
        show: true,
        type: "error",
        message: err.message || "Authentication failed",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Recipes (or AI recipes) based on selectedTab
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const ts = Date.now();
      const endpoint =
        selectedTab === "recipes"
          ? `/api/recipes?nocache=1&ts=${ts}`
          : `/api/ai-recipes?nocache=1&ts=${ts}`;
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }
      const data: any[] = await response.json();

      console.log("Raw API data:", data);
      console.log("First recipe sample:", data[0]);

      // Transform the API response to match our Recipe interface
      const transformedRecipes: Recipe[] = data.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        category: recipe.category,
        image: recipe.image,
        description: recipe.description,
        portion: recipe.portion,
        // Transform recipe_ingredients to ingredients array
        ingredients:
          recipe.recipe_ingredients?.map((ri: any) => ({
            id: ri.ingredient_id,
            name: ri.ingredient?.name || ri.name || "Unknown ingredient",
            quantity: ri.quantity,
            unit: ri.unit,
          })) || [],
        // Transform steps array
        steps:
          recipe.steps?.map((step: any) => ({
            id: step.id,
            order: step.order,
            description: step.description,
          })) || [],
      }));

      console.log("Transformed recipes:", transformedRecipes);
      console.log("First transformed recipe:", transformedRecipes[0]);
      console.log(
        "Ingredients count:",
        transformedRecipes[0]?.ingredients?.length
      );
      console.log("Steps count:", transformedRecipes[0]?.steps?.length);

      setRecipes(transformedRecipes);
    } catch (err: any) {
      alert(err.message || "Failed to fetch recipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecipes();
    }
  }, [isAuthenticated, selectedTab]);

  // Handle Delete
  const handleDelete = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!recipeToDelete) return;
    try {
      setLoading(true);
      // Use the correct endpoint based on the selected tab
      const endpoint =
        selectedTab === "recipes"
          ? `/api/recipes/${recipeToDelete.id}`
          : `/api/ai-recipes/${recipeToDelete.id}`;

      console.log(
        `Deleting ${selectedTab} with ID ${recipeToDelete.id} from endpoint: ${endpoint}`
      );

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        // Handle empty response or invalid JSON
        let errorMessage;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error;
        } catch (jsonError) {
          // If JSON parsing fails, use status text
          errorMessage = `Server returned ${res.status}: ${res.statusText}`;
        }
        throw new Error(
          errorMessage ||
            `Failed to delete ${
              selectedTab === "recipes" ? "recipe" : "AI recipe"
            }`
        );
      }

      // Update UI by removing the deleted recipe
      setRecipes((prev) => prev.filter((r) => r.id !== recipeToDelete.id));

      // Show success message
      setToastMessage({
        show: true,
        type: "success",
        message: `${
          selectedTab === "recipes" ? "Recipe" : "AI Recipe"
        } deleted successfully`,
      });
    } catch (err: any) {
      console.error("Delete error:", err);
      // Show error message
      setToastMessage({
        show: true,
        type: "error",
        message:
          err.message ||
          `Failed to delete ${
            selectedTab === "recipes" ? "recipe" : "AI recipe"
          }`,
      });
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setRecipeToDelete(null);
    }
  };

  // Handle Edit
  const handleEdit = (recipe: Recipe) => {
    console.log("Editing recipe:", recipe);
    console.log("Recipe ingredients:", recipe.ingredients);
    console.log("Recipe steps:", recipe.steps);

    // Reset any image preview/error when opening a new edit session
    setImagePreview(null);
    setImageError(null);
    setCurrentRecipe(recipe);

    // Ensure we have properly structured ingredients and steps
    let initialIngredients =
      recipe.ingredients && recipe.ingredients.length > 0
        ? recipe.ingredients.map((ing) => ({
            name: ing.name || "",
            quantity: ing.quantity || 1,
            unit: ing.unit || "g",
          }))
        : [{ name: "", quantity: 1, unit: "g" }];

    let initialSteps =
      recipe.steps && recipe.steps.length > 0
        ? recipe.steps.map((step) => ({
            order: step.order || 1,
            description: step.description || "",
          }))
        : [{ order: 1, description: "" }];

    console.log("Setting initial ingredients:", initialIngredients);
    console.log("Setting initial steps:", initialSteps);

    setEditingIngredients(initialIngredients);
    setEditingSteps(initialSteps);
  };

  // Handle Edit Submit
  const handleEditSubmit = async () => {
    if (!currentRecipe) return;

    // Validate ingredient fields
    for (let i = 0; i < editingIngredients.length; i++) {
      const ing = editingIngredients[i];
      if (!ing.name.trim() || ing.quantity <= 0 || !ing.unit.trim()) {
        alert(`Please fill out all fields for ingredient ${i + 1}.`);
        return;
      }
    }
    // Validate step fields
    for (let i = 0; i < editingSteps.length; i++) {
      const step = editingSteps[i];
      if (!step.description.trim()) {
        alert(`Please fill out the description for step ${i + 1}.`);
        return;
      }
    }
    try {
      setModalLoading(true);
      const res = await fetch(`/api/recipes/${currentRecipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentRecipe.title,
          category: currentRecipe.category,
          description: currentRecipe.description,
          portion: currentRecipe.portion,
          image: currentRecipe.image,
          ingredients: editingIngredients,
          steps: editingSteps,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update recipe");
      }
      const updatedRecipe: Recipe = await res.json();

      // Transform the updated recipe to ensure it has the correct structure
      const transformedRecipe: Recipe = {
        ...updatedRecipe,
        ingredients: editingIngredients, // Use the editing state which has the correct format
        steps: editingSteps, // Use the editing state which has the correct format
      };

      // Update the recipes list with the transformed data
      setRecipes((prev) =>
        prev.map((r) => (r.id === transformedRecipe.id ? transformedRecipe : r))
      );

      // Show success message
      setToastMessage({
        show: true,
        type: "success",
        message: "Recipe updated successfully!",
      });

      // Show success animation
      setSuccess(true);

      // Close modal after showing success animation
      setTimeout(() => {
        setSuccess(false);
        closeEditModal();
      }, 1500);
    } catch (err: any) {
      setToastMessage({
        show: true,
        type: "error",
        message: err.message || "Failed to update recipe",
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Helper functions for managing ingredients and steps
  const addIngredient = () => {
    setEditingIngredients([
      ...editingIngredients,
      { name: "", quantity: 1, unit: "g" },
    ]);
  };

  const removeIngredient = (index: number) => {
    setEditingIngredients(editingIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...editingIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setEditingIngredients(updated);
  };

  const addStep = () => {
    setEditingSteps([
      ...editingSteps,
      { order: editingSteps.length + 1, description: "" },
    ]);
  };

  const removeStep = (index: number) => {
    const updated = editingSteps.filter((_, i) => i !== index);
    // Reorder remaining steps
    updated.forEach((step, i) => {
      step.order = i + 1;
    });
    setEditingSteps(updated);
  };

  const updateStep = (index: number, field: string, value: string | number) => {
    const updated = [...editingSteps];
    updated[index] = { ...updated[index], [field]: value };
    setEditingSteps(updated);
  };

  // Close edit modal and clear editing states
  const closeEditModal = () => {
    setCurrentRecipe(null);
    setEditingIngredients([]);
    setEditingSteps([]);
    setSuccess(false);
    setModalLoading(false);
    setImagePreview(null);
    setImageError(null);
  };

  // Fetch a new suggested image using the existing Google image API
  const handleFetchNewImage = async () => {
    if (!currentRecipe) return;
    try {
      setImageLoading(true);
      setImageError(null);

      const query =
        currentRecipe.title?.trim() ||
        currentRecipe.category?.trim() ||
        currentRecipe.description?.slice(0, 50) ||
        "food";

      console.log(
        "[ADMIN][ChangeImage] Fetching new image with query:",
        query
      );

      const url = `/api/fetch-default-image?query=${encodeURIComponent(query)}`;
      console.log("[ADMIN][ChangeImage] Request URL:", url);

      const res = await fetch(url);

      console.log(
        "[ADMIN][ChangeImage] Response status:",
        res.status,
        res.statusText
      );

      if (!res.ok) {
        let errorMessage = `Failed to fetch a new image. (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson?.error) {
            errorMessage += ` ${errJson.error}`;
          }
          console.log("[ADMIN][ChangeImage] Error payload:", errJson);
        } catch {
          console.log(
            "[ADMIN][ChangeImage] Could not parse error JSON from response"
          );
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      console.log("[ADMIN][ChangeImage] Parsed JSON:", data);

      if (!data.imageUrl) {
        throw new Error("No image returned from the image service.");
      }

      console.log(
        "[ADMIN][ChangeImage] Setting imagePreview to:",
        data.imageUrl
      );
      setImagePreview(data.imageUrl);
    } catch (err: any) {
      console.error("Error fetching new image:", err);
      setImageError(err.message || "Could not fetch image.");
    } finally {
      setImageLoading(false);
    }
  };

  // Apply the previewed image to the current recipe (persisted when clicking Save)
  const handleApplyPreviewImage = () => {
    if (!currentRecipe || !imagePreview) return;
    setCurrentRecipe({
      ...currentRecipe,
      image: imagePreview,
    });
    // Keep preview visible so the user knows what's applied, but clear errors
    setImageError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="container mx-auto py-8 flex flex-col items-center relative z-10">
          <MinimalistLoader message="Loading..." size="lg" />
        </div>
        <FloatingNavigation router={router} />
      </div>
    );
  }

  // If not authenticated, render the password modal exclusively.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-decorative-1 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-decorative-2 opacity-20 rounded-full blur-3xl animate-pulse"></div>

        <div className="container mx-auto px-4 py-8 relative z-10 pb-24 md:pb-8">
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage.show && (
              <Toast
                type={toastMessage.type}
                message={toastMessage.message}
                onClose={() =>
                  setToastMessage({ ...toastMessage, show: false })
                }
              />
            )}
          </AnimatePresence>

          {/* Enhanced Password Modal */}
          {showPasswordModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-panel backdrop-blur-xl bg-white/90 border border-white/30 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center mb-6"
                >
                  <div className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-4 shadow-lg">
                    <IconLock size={48} className="text-primary" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Authentication
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                  Please enter the admin password to access the dashboard.
                </p>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="glass-panel backdrop-blur-xl bg-white/30 border border-white/20 rounded-xl w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogin}
                    className="glass-panel backdrop-blur-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white border border-white/30 rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 w-full"
                    disabled={loading}
                  >
                    {loading ? "Authenticating..." : "Login"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Enhanced Delete Confirmation Modal */}
          <AnimatePresence>
            {deleteModalOpen && recipeToDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="glass-panel backdrop-blur-xl bg-white/90 border border-white/30 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl"
                >
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Confirm Deletion
                  </h3>
                  <p className="mb-6 text-gray-600">
                    Are you sure you want to delete{" "}
                    <span className="font-bold text-red-600">
                      {recipeToDelete.title}
                    </span>
                    ? This action cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setDeleteModalOpen(false);
                        setRecipeToDelete(null);
                      }}
                      className="glass-panel backdrop-blur-xl bg-gray-500/20 border border-gray-400/30 text-gray-700 px-6 py-3 rounded-xl font-medium flex-1"
                      disabled={loading}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={confirmDelete}
                      className="glass-panel backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-700 px-6 py-3 rounded-xl font-medium flex-1"
                      disabled={loading}
                    >
                      {loading ? "Deleting..." : "Delete"}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {isAuthenticated && (
            <>
              {/* Enhanced Tab Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mb-8"
              >
                <div className="glass-panel backdrop-blur-xl bg-white/10 border border-white/20 p-1 rounded-2xl inline-flex shadow-lg">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                      selectedTab === "recipes"
                        ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-white/20"
                    }`}
                    onClick={() => setSelectedTab("recipes")}
                  >
                    Recipes
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                      selectedTab === "ai-recipes"
                        ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-white/20"
                    }`}
                    onClick={() => setSelectedTab("ai-recipes")}
                  >
                    AI Recipes
                  </motion.button>
                </div>
              </motion.div>

              {/* Enhanced Header with Refresh Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
              >
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchRecipes}
                  className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 text-gray-700 hover:bg-white/30 transition-all duration-300 px-6 py-3 rounded-xl font-medium shadow-lg"
                >
                  Refresh Data
                </motion.button>
              </motion.div>

              {/* Loading State */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center my-8"
                >
                  <div className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-6 rounded-2xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Recipes Grid */}
              {!loading && recipes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-12 rounded-3xl text-center max-w-md shadow-2xl">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-6xl mb-4"
                    >
                      📝
                    </motion.div>
                    <p className="text-xl text-gray-700 font-semibold">
                      No recipes found
                    </p>
                    <p className="text-gray-500 mt-2">
                      {selectedTab === "recipes"
                        ? "Try adding some recipes first"
                        : "Try generating some AI recipes first"}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {recipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500"
                    >
                      <figure className="relative h-48">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://via.placeholder.com/400x300?text=No+Image";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="badge badge-lg bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-none">
                            {recipe.category &&
                            typeof recipe.category === "string"
                              ? recipe.category.charAt(0).toUpperCase() +
                                recipe.category.slice(1)
                              : "Uncategorized"}
                          </div>
                        </div>
                      </figure>
                      <div className="p-4">
                        <h3 className="text-xl font-bold mb-2 line-clamp-1 text-gray-800">
                          {recipe.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {recipe.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Portions: {recipe.portion}
                          </span>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Ingredients: {recipe.ingredients?.length || 0}
                            </span>
                            <span>Steps: {recipe.steps?.length || 0}</span>
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(recipe)}
                              className="glass-panel backdrop-blur-xl bg-blue-500/20 border border-blue-400/30 text-blue-700 p-2 rounded-full hover:bg-blue-500/30 transition-colors"
                              title="Edit Recipe"
                              aria-label={`Edit ${recipe.title}`}
                            >
                              <IconEdit size={18} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(recipe)}
                              className="glass-panel backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-700 p-2 rounded-full hover:bg-red-500/30 transition-colors"
                              title="Delete Recipe"
                              aria-label={`Delete ${recipe.title}`}
                            >
                              <IconTrash size={18} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Enhanced Back to Home Link */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center"
              >
                <Link href="/">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 text-gray-700 hover:bg-white/30 transition-all duration-300 px-8 py-4 rounded-2xl font-medium shadow-lg inline-block"
                  >
                    Back to Home
                  </motion.div>
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* FloatingNavigation */}
        <FloatingNavigation router={router} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col md:flex-row font-sans selection:bg-primary/20 text-base-content">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-base-100 border-r border-base-300 h-screen sticky top-0 shadow-sm z-20 shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setSelectedTab("recipes")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              selectedTab === "recipes"
                ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                : "text-base-content/70 hover:bg-base-200/50 hover:text-base-content"
            }`}
          >
            <IconChefHat size={20} stroke={selectedTab === "recipes" ? 2 : 1.5} /> Core Recipes
          </button>
          <button
            onClick={() => setSelectedTab("ai-recipes")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              selectedTab === "ai-recipes"
                ? "bg-secondary/10 text-secondary shadow-sm border border-secondary/20"
                : "text-base-content/70 hover:bg-base-200/50 hover:text-base-content"
            }`}
          >
            <IconRobot size={20} stroke={selectedTab === "ai-recipes" ? 2 : 1.5} /> AI Generated
          </button>
        </nav>
        <div className="p-4 border-t border-base-300">
          <Link href="/">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/70 hover:bg-base-200/50 hover:text-base-content transition-all font-medium group cursor-pointer">
              <IconHome size={20} className="group-hover:text-primary transition-colors" /> Back to App
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 shrink flex flex-col min-w-0 min-h-screen relative pb-24 md:pb-8">
        {/* Mobile Header Menu */}
        <div className="md:hidden bg-base-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Admin</h1>
          <div className="flex gap-1.5 bg-base-200 p-1.5 rounded-xl">
            <button
              onClick={() => setSelectedTab("recipes")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                selectedTab === "recipes" ? "bg-base-100 text-primary shadow-sm" : "text-base-content/60"
              }`}
            >
              Recipes
            </button>
            <button
              onClick={() => setSelectedTab("ai-recipes")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                selectedTab === "ai-recipes" ? "bg-base-100 text-secondary shadow-sm" : "text-base-content/60"
              }`}
            >
              AI
            </button>
          </div>
        </div>

        {/* Dynamic Top Bar */}
        <div className="px-6 py-8 md:px-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-base-content tracking-tight">
              {selectedTab === "recipes" ? "Core Recipes" : "AI Generated Recipes"}
            </h2>
            <p className="text-base-content/60 mt-1 font-medium">
              Manage, edit, and curate your collection.
            </p>
          </div>
          <button
            onClick={fetchRecipes}
            disabled={loading}
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-base-100 border border-base-300 text-base-content/80 font-semibold hover:bg-base-200 shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <IconRefresh size={18} className={loading ? "animate-spin text-primary" : ""} /> Refresh Data
          </button>
        </div>

        {/* Recipes Grid Layout */}
        <div className="px-6 md:px-10 max-w-7xl mx-auto w-full flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden animate-pulse">
                   <div className="aspect-[4/3] bg-base-300 w-full" />
                   <div className="p-5 space-y-3">
                     <div className="h-6 bg-base-300 rounded-md w-3/4" />
                     <div className="h-4 bg-base-300 rounded-md w-full" />
                     <div className="h-4 bg-base-300 rounded-md w-5/6" />
                     <div className="h-10 bg-base-300 rounded-xl w-full mt-4" />
                   </div>
                 </div>
               ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-base-100 rounded-3xl border border-base-300 shadow-sm mx-auto max-w-2xl">
              <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4">
                <IconChefHat size={40} className="text-base-content/20" />
              </div>
              <h3 className="text-xl font-bold text-base-content/80">No recipes found</h3>
              <p className="text-base-content/60 mt-2">Generate or add some recipes to start managing them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="group bg-base-100 rounded-3xl border border-base-300 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden transition-all duration-300 flex flex-col relative"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-base-200">
                    <img
                      src={recipe.image || "https://via.placeholder.com/400x300?text=No+Image"}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=No+Image&bg=f1f5f9&text=Missing";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 inset-x-3 flex justify-between items-start">
                      <span className="px-3 py-1 bg-base-100/90 backdrop-blur-md text-base-content text-xs font-bold rounded-full shadow-sm">
                        {recipe.category ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) : "Uncategorized"}
                      </span>
                      <span className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white text-xs font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        #{recipe.id}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col bg-base-100 z-10">
                    <h3 className="text-lg font-bold text-base-content line-clamp-1 mb-1.5" title={recipe.title}>
                      {recipe.title}
                    </h3>
                    <p className="text-sm text-base-content/60 line-clamp-2 leading-relaxed mb-4 flex-1">
                      {recipe.description}
                    </p>
                    
                    <div className="flex items-center text-xs font-medium text-base-content/50 mb-5 gap-3">
                      <span className="flex items-center gap-1.5 bg-base-200 px-2.5 py-1 rounded-lg border border-base-300">
                        👨‍🍳 {recipe.portion} Pts
                      </span>
                      <span className="flex items-center gap-1.5 bg-base-200 px-2.5 py-1 rounded-lg border border-base-300">
                        🛒 {recipe.ingredients?.length || 0} Ingreds
                      </span>
                      <span className="flex items-center gap-1.5 bg-base-200 px-2.5 py-1 rounded-lg border border-base-300">
                        📝 {recipe.steps?.length || 0} Steps
                      </span>
                    </div>

                    <div className="flex gap-2 w-full mt-auto">
                       <button
                         onClick={() => handleEdit(recipe)}
                         className="flex-1 py-2.5 bg-base-200 text-base-content/80 text-sm font-bold rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all border border-base-300 flex items-center justify-center gap-2 group/edit"
                       >
                         <IconEdit size={16} className="text-base-content/40 group-hover/edit:text-primary" /> Edit
                       </button>
                       <button
                         onClick={() => handleDelete(recipe)}
                         className="px-3 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all flex items-center justify-center cursor-pointer border border-error/20"
                         aria-label="Delete"
                         title="Delete Recipe"
                       >
                         <IconTrash size={18} />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal for Deletion - Minimalist & Centered */}
      <AnimatePresence>
        {deleteModalOpen && recipeToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-base-300/80 backdrop-blur-md" 
              onClick={() => setDeleteModalOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-base-100 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center border border-base-300"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-5 shadow-inner">
                <IconTrash size={32} />
              </div>
              <h3 className="text-2xl font-extrabold text-base-content mb-2 tracking-tight">Delete Recipe?</h3>
              <p className="text-base-content/60 text-sm mb-8 leading-relaxed px-2">
                You're about to delete <strong className="text-base-content font-bold">"{recipeToDelete.title}"</strong>. This action is permanent and cannot be undone.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={confirmDelete} disabled={loading}
                  className="w-full py-3.5 bg-error text-error-content font-bold rounded-xl hover:bg-error/80 transition-colors shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Yes, delete recipe"}
                </button>
                <button
                  onClick={() => setDeleteModalOpen(false)} disabled={loading}
                  className="w-full py-3.5 bg-base-200 text-base-content font-bold rounded-xl hover:bg-base-300 transition-colors border border-base-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sleek Edit Drawer Modal */}
      <AnimatePresence>
        {currentRecipe && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-base-300/80 backdrop-blur-sm"
              onClick={closeEditModal}
            />

            <motion.div
              initial={{ x: "100%", boxShadow: "-30px 0 60px rgba(0,0,0,0)" }}
              animate={{ x: 0, boxShadow: "-30px 0 60px rgba(0,0,0,0.15)" }}
              exit={{ x: "100%", boxShadow: "-30px 0 60px rgba(0,0,0,0)" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-xl h-full bg-base-100 flex flex-col z-[71] border-l border-base-300"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-base-300 bg-base-100/80 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between">
                <div>
                   <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Editing Recipe</h2>
                   <h3 className="text-xl font-extrabold text-base-content line-clamp-1 pr-4">{currentRecipe.title}</h3>
                </div>
                <button
                  onClick={closeEditModal}
                  className="w-10 h-10 rounded-full bg-base-200 hover:bg-base-300 flex items-center justify-center text-base-content/60 transition-colors shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="space-y-8 max-w-full pb-8">
                  
                  {/* Basic Details Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary"><IconEdit size={14} /></div>
                      <h4 className="text-sm font-bold tracking-wide text-base-content uppercase">Basic Details</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-base-content/60 mb-1.5 ml-1">Title</label>
                          <input
                            type="text" value={currentRecipe.title}
                            onChange={(e) => setCurrentRecipe({ ...currentRecipe, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-base-200 border border-base-300 text-sm font-medium text-base-content focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-base-content/60 mb-1.5 ml-1">Category</label>
                          <input
                            type="text" value={currentRecipe.category || ""}
                            onChange={(e) => setCurrentRecipe({ ...currentRecipe, category: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-base-200 border border-base-300 text-sm font-medium text-base-content focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-base-content/60 mb-1.5 ml-1">Portions</label>
                          <input
                            type="number" value={currentRecipe.portion} min="1"
                            onChange={(e) => setCurrentRecipe({ ...currentRecipe, portion: Number(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl bg-base-200 border border-base-300 text-sm font-medium text-base-content focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary transition-all selection:bg-primary/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-base-content/60 mb-1.5 ml-1">Description</label>
                        <textarea
                          value={currentRecipe.description} rows={3}
                          onChange={(e) => setCurrentRecipe({ ...currentRecipe, description: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-base-200 border border-base-300 text-sm font-medium text-base-content focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none leading-relaxed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-base-content/60 mb-1.5 ml-1">Image Presentation</label>
                        <div className="p-4 bg-base-200 rounded-2xl border border-base-300 space-y-4">
                          <input
                            type="text" value={currentRecipe.image}
                            onChange={(e) => setCurrentRecipe({ ...currentRecipe, image: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-base-100 border border-base-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-base-content/80"
                            placeholder="https://example.com/image.jpg"
                          />
                          <div className="flex flex-wrap gap-2 items-center justify-between">
                            <button
                              type="button" onClick={handleFetchNewImage} disabled={imageLoading}
                              className="px-4 py-2 rounded-xl text-sm font-bold bg-neutral text-neutral-content hover:bg-neutral/80 disabled:opacity-60 transition-colors flex items-center gap-2"
                            >
                              {imageLoading ? <div className="w-4 h-4 rounded-full border-2 border-base-content/30 border-t-base-content animate-spin"/> : "Generate AI Image Idea"}
                            </button>
                            {imagePreview && (
                              <button
                                type="button" onClick={handleApplyPreviewImage}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-primary bg-primary/20 hover:bg-primary/30 transition-colors"
                              >
                                Replace Image
                              </button>
                            )}
                          </div>
                          {(imagePreview || currentRecipe.image) && (
                            <div className="h-40 w-full rounded-xl overflow-hidden shadow-inner border border-base-300 bg-base-200 relative">
                               {imagePreview && <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] text-white font-bold uppercase tracking-wider">Preview Generated</div>}
                               <img
                                 src={imagePreview || currentRecipe.image}
                                 className="w-full h-full object-cover"
                                 onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Preview+Error" }}
                               />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <hr className="border-slate-100" />

                  {/* Ingredients Section */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-md bg-info/20 flex items-center justify-center text-info"><IconPlus size={14} /></div>
                         <h4 className="text-sm font-bold tracking-wide text-base-content uppercase">Ingredients <span className="text-base-content/50 ml-1">({editingIngredients.length})</span></h4>
                      </div>
                      <button onClick={addIngredient} className="text-xs font-bold text-info bg-info/10 px-3 py-1.5 rounded-lg hover:bg-info/20 transition-colors">
                        Add New
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editingIngredients.map((ingredient, index) => (
                        <div key={index} className="flex gap-2 p-3 bg-base-200 border border-base-300 rounded-xl items-end relative group">
                          <button onClick={() => removeIngredient(index)} disabled={editingIngredients.length === 1} className="absolute -top-2 -right-2 bg-error/20 text-error w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden shadow-sm scale-90 hover:scale-110">
                             <IconTrash size={12}/>
                          </button>
                          
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-base-content/50 uppercase tracking-wider mb-1">Name</label>
                            <input
                              type="text" value={ingredient.name}
                              onChange={(e) => updateIngredient(index, "name", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100 text-sm focus:outline-none focus:ring-2 focus:ring-info focus:border-transparent font-medium text-base-content/80"
                            />
                          </div>

                          <div className="w-20">
                            <label className="block text-[10px] font-bold text-base-content/50 uppercase tracking-wider mb-1">Qty</label>
                            <input
                              type="number" value={ingredient.quantity} min="0.1" step="0.1"
                              onChange={(e) => updateIngredient(index, "quantity", Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100 text-sm focus:outline-none focus:ring-2 focus:ring-info font-medium text-base-content/80"
                            />
                          </div>

                          <div className="w-24">
                            <label className="block text-[10px] font-bold text-base-content/50 uppercase tracking-wider mb-1">Unit</label>
                            <select
                              value={ingredient.unit}
                              onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                              className="w-full px-2 py-2 rounded-lg border border-base-300 bg-base-100 text-sm focus:outline-none focus:ring-2 focus:ring-info font-medium text-base-content/80 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_10px_center] bg-no-repeat pr-8"
                            >
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="ml">ml</option>
                              <option value="l">l</option>
                              <option value="tsp">tsp</option>
                              <option value="tbsp">tbsp</option>
                              <option value="cup">cup</option>
                              <option value="whole">whole</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <hr className="border-slate-100" />

                  {/* Steps Section */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center text-accent"><IconRefresh size={14} /></div>
                         <h4 className="text-sm font-bold tracking-wide text-base-content uppercase">Preparation Steps <span className="text-base-content/50 ml-1">({editingSteps.length})</span></h4>
                      </div>
                      <button onClick={addStep} className="text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors">
                        Add Step
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editingSteps.map((step, index) => (
                        <div key={index} className="flex gap-3 p-4 bg-base-200 border border-base-300 rounded-xl relative group">
                          <button onClick={() => removeStep(index)} disabled={editingSteps.length === 1} className="absolute -top-2 -right-2 bg-error/20 text-error w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden shadow-sm scale-90 hover:scale-110">
                             <IconTrash size={12}/>
                          </button>
                          
                          <div className="w-10 flex flex-col justify-start pt-1">
                             <span className="w-8 h-8 rounded-full bg-base-100 border border-base-300 text-base-content/70 font-bold flex items-center justify-center text-sm shadow-sm">{step.order}</span>
                          </div>
                          
                          <div className="flex-1">
                            <textarea
                              value={step.description} rows={2}
                              onChange={(e) => updateStep(index, "description", e.target.value)}
                              className="w-full px-3 py-2.5 rounded-lg border border-base-300 bg-base-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent font-medium text-base-content/80 resize-none leading-relaxed"
                              placeholder="Describe this step..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-base-300 bg-base-100 sticky bottom-0 z-10 flex gap-3 shadow-xl">
                <button
                  onClick={closeEditModal} disabled={modalLoading || success}
                  className="flex-1 py-3.5 rounded-xl text-base-content/70 font-bold bg-base-200 border border-base-300 hover:bg-base-300 transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleEditSubmit} disabled={modalLoading || success}
                  className={`flex-[2] py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
                    success ? "bg-success shadow-success/20 text-success-content" : "bg-neutral hover:bg-neutral/80 shadow-neutral/10 text-neutral-content"
                  }`}
                >
                  {success ? (
                    <><IconCheck size={20} className="animate-bounce" /> Saved Successfully</>
                  ) : modalLoading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving changes...</>
                  ) : (
                     "Save Complete Recipe"
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FloatingNavigation router={router} />
    </div>
  );
}

