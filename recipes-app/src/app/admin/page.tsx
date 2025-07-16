"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash, IconEdit, IconLock } from "@tabler/icons-react";
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
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);

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
      const endpoint =
        selectedTab === "recipes" ? "/api/recipes" : "/api/ai-recipes";
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }
      const data: Recipe[] = await response.json();
      setRecipes(data);
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
    setCurrentRecipe(recipe);
  };

  // Handle Edit Submit
  const handleEditSubmit = async () => {
    if (!currentRecipe) return;
    if (
      !currentRecipe.title ||
      !currentRecipe.category ||
      !currentRecipe.description ||
      !currentRecipe.image ||
      currentRecipe.portion < 1
    ) {
      alert("Please fill out all fields correctly.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/recipes/${currentRecipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentRecipe.title,
          category: currentRecipe.category,
          description: currentRecipe.description,
          portion: currentRecipe.portion,
          image: currentRecipe.image,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update recipe");
      }
      const updatedRecipe: Recipe = await res.json();
      setRecipes((prev) =>
        prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
      );
      alert("Recipe updated");
      setCurrentRecipe(null);
    } catch (err: any) {
      alert(err.message || "Failed to update recipe");
    } finally {
      setLoading(false);
    }
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
              className="card bg-base-100 shadow-md rounded-lg p-4"
            >
              <figure>
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-40 object-cover rounded-md"
                />
              </figure>
              <div className="mt-4">
                <h3 className="text-xl font-bold">{recipe.title}</h3>
                <span className="badge badge-secondary">
                  {recipe.category
                    ? recipe.category.charAt(0).toUpperCase() +
                      recipe.category.slice(1)
                    : "Uncategorized"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                {recipe.description}
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm">Portions: {recipe.portion}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(recipe)}
                    className="btn btn-outline btn-sm"
                    title="Edit Recipe"
                    aria-label={`Edit ${recipe.title}`}
                  >
                    <IconEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(recipe)}
                    className="btn btn-outline btn-sm"
                    title="Delete Recipe"
                    aria-label={`Delete ${recipe.title}`}
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
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
        {currentRecipe && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setCurrentRecipe(null)}
            ></div>
            <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold mb-4">Edit Recipe</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="label">Title</label>
                  <input
                    type="text"
                    placeholder="Title"
                    value={currentRecipe.title}
                    onChange={(e) =>
                      setCurrentRecipe({
                        ...currentRecipe,
                        title: e.target.value,
                      })
                    }
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label">Category</label>
                  <input
                    type="text"
                    placeholder="Category"
                    value={currentRecipe.category || ""}
                    onChange={(e) =>
                      setCurrentRecipe({
                        ...currentRecipe,
                        category: e.target.value,
                      })
                    }
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    placeholder="Description"
                    value={currentRecipe.description}
                    onChange={(e) =>
                      setCurrentRecipe({
                        ...currentRecipe,
                        description: e.target.value,
                      })
                    }
                    className="textarea textarea-bordered w-full"
                    rows={4}
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="label">Portions</label>
                  <input
                    type="number"
                    placeholder="Portions"
                    value={currentRecipe.portion}
                    onChange={(e) =>
                      setCurrentRecipe({
                        ...currentRecipe,
                        portion: Number(e.target.value),
                      })
                    }
                    className="input input-bordered w-full"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="label">Image URL</label>
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={currentRecipe.image}
                    onChange={(e) =>
                      setCurrentRecipe({
                        ...currentRecipe,
                        image: e.target.value,
                      })
                    }
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setCurrentRecipe(null)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="btn btn-primary"
                  >
                    Save Changes
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
