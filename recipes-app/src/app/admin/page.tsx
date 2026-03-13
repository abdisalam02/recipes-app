"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash, IconEdit, IconLock, IconCheck } from "@tabler/icons-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-orange-400 to-red-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>

      <div className="container mx-auto py-8 relative z-10 pb-24 md:pb-8">
        {/* Tab Slider for Admin: Recipes vs AI Recipes */}
        <div className="flex justify-center mb-6 gap-4">
          <button
            className={`btn ${
              selectedTab === "recipes" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setSelectedTab("recipes")}
          >
            Recipes
          </button>
          <button
            className={`btn ${
              selectedTab === "ai-recipes" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setSelectedTab("ai-recipes")}
          >
            AI Recipes
          </button>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <button onClick={fetchRecipes} className="btn btn-primary">
            Refresh
          </button>
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="glass-panel backdrop-blur-xl bg-white/15 border border-white/30 rounded-2xl p-4 shadow-2xl hover:shadow-3xl transition-all duration-300"
            >
              <figure>
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-40 object-cover rounded-md"
                />
              </figure>
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {recipe.title}
                  </h3>
                  <span className="inline-flex items-center mt-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 border border-blue-500/30">
                  {recipe.category
                    ? recipe.category.charAt(0).toUpperCase() +
                      recipe.category.slice(1)
                    : "Uncategorized"}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  ID: {recipe.id}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                {recipe.description}
              </p>
              <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                <span>Portions: {recipe.portion}</span>
                <span>
                  Ingredients: {recipe.ingredients?.length || 0} · Steps:{" "}
                  {recipe.steps?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-end mt-3 gap-2">
                <button
                  onClick={() => handleEdit(recipe)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1"
                  title="Edit Recipe"
                  aria-label={`Edit ${recipe.title}`}
                >
                  <IconEdit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(recipe)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-600 border border-red-500/40 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                  title="Delete Recipe"
                  aria-label={`Delete ${recipe.title}`}
                >
                  <IconTrash size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Confirmation Modal for Deletion */}
        {deleteModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-md">
              <h3 className="font-bold text-xl mb-4">Confirm Deletion</h3>
              <p>
                Are you sure you want to delete the recipe "
                <b>{recipeToDelete?.title}</b>"?
              </p>
              <div className="modal-action">
                <button
                  className="btn btn-outline"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-error" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Recipe Modal */}
        <AnimatePresence>
          {currentRecipe && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={closeEditModal}
              />

              {/* Modal Container */}
              <div
                className={`relative w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.45)] overflow-hidden transition-all duration-500 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 ${
                  success ? "ring-4 ring-emerald-400/60 scale-[1.01]" : ""
                }`}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-blue-500/10 to-purple-500/20 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-50 tracking-tight">
                      {success ? (
                        <div className="flex items-center gap-2">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40"
                          >
                            <IconCheck size={16} className="text-white" />
                          </motion.div>
                          Recipe Updated Successfully!
                        </div>
                      ) : (
                        <>
                          <span className="uppercase tracking-[0.15em] text-[11px] text-emerald-300/80 block mb-0.5">
                            Edit recipe
                          </span>
                          <span className="line-clamp-1 text-sm sm:text-base text-slate-50">
                            {currentRecipe.title}
                          </span>
                        </>
                      )}
                    </h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleEditSubmit}
                        disabled={modalLoading || success}
                        className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 border border-emerald-300/70 shadow-md shadow-emerald-500/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {success ? (
                          <>
                            <IconCheck size={16} />
                            Saved
                          </>
                        ) : modalLoading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-emerald-800/40 border-t-emerald-900 rounded-full animate-spin" />
                            Saving
                          </>
                        ) : (
                          <>Save</>
                        )}
                      </button>
                      <button
                        onClick={closeEditModal}
                        className="text-slate-200/80 hover:text-white p-2 rounded-full hover:bg-slate-800/60 transition-colors border border-white/10"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
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
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 bg-slate-900/60 backdrop-blur-sm">
                  <div className="space-y-6 text-slate-100">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-700/60 pb-2 flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-emerald-400" />
                        Basic information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                            Title
                          </label>
                          <input
                            type="text"
                            value={currentRecipe.title}
                            onChange={(e) =>
                              setCurrentRecipe({
                                ...currentRecipe,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-600/70 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                            Category
                          </label>
                          <input
                            type="text"
                            value={currentRecipe.category || ""}
                            onChange={(e) =>
                              setCurrentRecipe({
                                ...currentRecipe,
                                category: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-600/70 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                          Description
                        </label>
                        <textarea
                          value={currentRecipe.description}
                          onChange={(e) =>
                            setCurrentRecipe({
                              ...currentRecipe,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-600/70 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                            Portions
                          </label>
                          <input
                            type="number"
                            value={currentRecipe.portion}
                            onChange={(e) =>
                              setCurrentRecipe({
                                ...currentRecipe,
                                portion: Number(e.target.value),
                              })
                            }
                            min="1"
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-600/70 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                            Image
                          </label>
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={currentRecipe.image}
                              onChange={(e) =>
                                setCurrentRecipe({
                                  ...currentRecipe,
                                  image: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-600/70 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                              placeholder="Image URL"
                            />
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={handleFetchNewImage}
                                disabled={imageLoading}
                                className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/40"
                              >
                                {imageLoading ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    <span>Finding image...</span>
                                  </>
                                ) : (
                                  <>Change image</>
                                )}
                              </button>
                              {imagePreview && (
                                <button
                                  type="button"
                                  onClick={handleApplyPreviewImage}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-sky-500 text-slate-900 hover:bg-sky-400 transition-colors shadow-sm shadow-sky-600/40"
                                >
                                  Use this image
                                </button>
                              )}
                            </div>
                            {imageError && (
                              <p className="text-xs text-red-400">{imageError}</p>
                            )}
                            {(imagePreview || currentRecipe.image) && (
                              <div className="mt-1">
                                <p className="text-xs text-slate-400 mb-1">
                                  Preview
                                </p>
                                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-700/70 bg-slate-900">
                                  <img
                                    src={imagePreview || currentRecipe.image}
                                    alt={currentRecipe.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src =
                                        "https://via.placeholder.com/400x300?text=No+Image";
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                            <p className="text-[11px] text-slate-400/90">
                              Tip: Use &quot;Change image&quot; to fetch a new image
                              suggestion based on the recipe, then click{" "}
                              <span className="font-semibold">Use this image</span>{" "}
                              and finally <span className="font-semibold">Save</span>{" "}
                              to persist it.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ingredients Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                          <span className="w-1.5 h-4 rounded-full bg-sky-400" />
                          Ingredients ({editingIngredients.length})
                        </h3>
                        <button
                          onClick={addIngredient}
                          className="px-3 py-1.5 bg-sky-500 text-slate-900 rounded-full hover:bg-sky-400 transition-colors text-xs font-medium shadow-sm shadow-sky-600/40"
                        >
                          + Add Ingredient
                        </button>
                      </div>

                      <div className="space-y-3">
                        {editingIngredients.map((ingredient, index) => (
                          <div
                            key={index}
                            className="flex gap-3 items-end p-4 bg-slate-900/80 rounded-xl border border-slate-700/80"
                          >
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                                Name
                              </label>
                              <input
                                type="text"
                                value={ingredient.name}
                                onChange={(e) =>
                                  updateIngredient(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="Ingredient name"
                              />
                            </div>

                            <div className="w-20">
                              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                                Qty
                              </label>
                              <input
                                type="number"
                                value={ingredient.quantity}
                                onChange={(e) =>
                                  updateIngredient(
                                    index,
                                    "quantity",
                                    Number(e.target.value)
                                  )
                                }
                                min="0.1"
                                step="0.1"
                                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              />
                            </div>

                            <div className="w-20">
                              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                                Unit
                              </label>
                              <select
                                value={ingredient.unit}
                                onChange={(e) =>
                                  updateIngredient(
                                    index,
                                    "unit",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

                            <button
                              onClick={() => removeIngredient(index)}
                              disabled={editingIngredients.length === 1}
                              className="px-3 py-2 bg-red-500/80 text-white rounded-full hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Steps Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                          <span className="w-1.5 h-4 rounded-full bg-violet-400" />
                          Steps ({editingSteps.length})
                        </h3>
                        <button
                          onClick={addStep}
                          className="px-3 py-1.5 bg-violet-500 text-slate-900 rounded-full hover:bg-violet-400 transition-colors text-xs font-medium shadow-sm shadow-violet-600/40"
                        >
                          + Add Step
                        </button>
                      </div>

                      <div className="space-y-3">
                        {editingSteps.map((step, index) => (
                          <div
                            key={index}
                            className="flex gap-3 items-start p-4 bg-slate-900/80 rounded-xl border border-slate-700/80"
                          >
                            <div className="w-16">
                              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                                Order
                              </label>
                              <input
                                type="number"
                                value={step.order}
                                onChange={(e) =>
                                  updateStep(
                                    index,
                                    "order",
                                    Number(e.target.value)
                                  )
                                }
                                min="1"
                                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              />
                            </div>

                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                                Description
                              </label>
                              <textarea
                                value={step.description}
                                onChange={(e) =>
                                  updateStep(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="Step description"
                              />
                            </div>

                            <button
                              onClick={() => removeStep(index)}
                              disabled={editingSteps.length === 1}
                              className="px-3 py-2 bg-red-500/80 text-white rounded-full hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-800 bg-slate-950/80 px-6 py-3">
                  <div className="flex justify-end">
                    <button
                      onClick={closeEditModal}
                      className="px-5 py-1.5 border border-slate-600 text-slate-200 rounded-full hover:bg-slate-800 transition-colors font-medium text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FloatingNavigation */}
      <FloatingNavigation router={router} />
    </div>
  );
}
