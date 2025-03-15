'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash, IconEdit, IconLock } from "@tabler/icons-react";
import Link from "next/link";

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
  const [selectedTab, setSelectedTab] = useState<"recipes" | "ai-recipes">("recipes");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);

  // Deletion Confirmation States
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  // Add toast message state
  const [toastMessage, setToastMessage] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: ''
  });

  // Toast component
  const Toast = ({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className={`${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-4 rounded-lg shadow-xl max-w-md w-full mx-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-lg font-medium">{message}</span>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
        type: 'error',
        message: 'Password cannot be empty'
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
          "X-Requested-With": "XMLHttpRequest"
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
        type: 'success',
        message: 'Successfully logged in'
      });
      fetchRecipes();
    } catch (err: any) {
      setToastMessage({
        show: true,
        type: 'error',
        message: err.message || "Authentication failed"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Recipes (or AI recipes) based on selectedTab
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const endpoint = selectedTab === "recipes" ? "/api/recipes" : "/api/ai-recipes";
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
      const endpoint = selectedTab === "recipes" 
        ? `/api/recipes/${recipeToDelete.id}` 
        : `/api/ai-recipes/${recipeToDelete.id}`;
        
      console.log(`Deleting ${selectedTab} with ID ${recipeToDelete.id} from endpoint: ${endpoint}`);
      
      const res = await fetch(endpoint, { 
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
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
        throw new Error(errorMessage || `Failed to delete ${selectedTab === "recipes" ? "recipe" : "AI recipe"}`);
      }
      
      // Update UI by removing the deleted recipe
      setRecipes((prev) => prev.filter((r) => r.id !== recipeToDelete.id));
      
      // Show success message
      setToastMessage({
        show: true,
        type: 'success',
        message: `${selectedTab === "recipes" ? "Recipe" : "AI Recipe"} deleted successfully`
      });
    } catch (err: any) {
      console.error("Delete error:", err);
      // Show error message
      setToastMessage({
        show: true,
        type: 'error',
        message: err.message || `Failed to delete ${selectedTab === "recipes" ? "recipe" : "AI recipe"}`
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
      <div className="container mx-auto py-8 flex flex-col items-center">
        <button className="btn btn-square btn-lg loading">Loading...</button>
      </div>
    );
  }

  // If not authenticated, render the password modal exclusively.
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Toast Notification */}
        {toastMessage.show && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage({ ...toastMessage, show: false })}
          />
        )}
        
        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-center mb-6">
                <IconLock size={48} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-6">Admin Authentication</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                Please enter the admin password to access the dashboard.
              </p>
              <div className="form-control">
                <input
                  type="password"
                  placeholder="Enter password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="input input-bordered w-full mb-4"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  onClick={handleLogin}
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Login"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && recipeToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
              <p className="mb-6">
                Are you sure you want to delete <span className="font-bold">{recipeToDelete.title}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setRecipeToDelete(null);
                  }}
                  className="btn btn-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn btn-error"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && (
          <>
            {/* Tab Selector */}
            <div className="flex justify-center mb-8">
              <div className="bg-base-200 p-1 rounded-full inline-flex">
                <button
                  className={`px-6 py-2 rounded-full transition-all ${
                    selectedTab === "recipes" 
                      ? "bg-primary text-white shadow-md" 
                      : "hover:bg-base-300"
                  }`}
                  onClick={() => setSelectedTab("recipes")}
                >
                  Recipes
                </button>
                <button
                  className={`px-6 py-2 rounded-full transition-all ${
                    selectedTab === "ai-recipes" 
                      ? "bg-primary text-white shadow-md" 
                      : "hover:bg-base-300"
                  }`}
                  onClick={() => setSelectedTab("ai-recipes")}
                >
                  AI Recipes
                </button>
              </div>
            </div>

            {/* Header with Refresh Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Admin Dashboard
              </h2>
              <button 
                onClick={fetchRecipes} 
                className="btn btn-primary btn-sm md:btn-md rounded-full"
              >
                Refresh Data
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Recipes Grid */}
            {!loading && recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-xl text-gray-500">No recipes found</p>
                <p className="text-gray-400 mt-2">
                  {selectedTab === "recipes" 
                    ? "Try adding some recipes first" 
                    : "Try generating some AI recipes first"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                    <figure className="relative h-48">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="badge badge-primary">
                          {recipe.category && typeof recipe.category === 'string'
                            ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)
                            : "Uncategorized"}
                        </div>
                      </div>
                    </figure>
                    <div className="p-4">
                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{recipe.title}</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{recipe.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Portions: {recipe.portion}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(recipe)}
                            className="btn btn-circle btn-sm bg-base-200 hover:bg-base-300 border-none"
                            title="Edit Recipe"
                            aria-label={`Edit ${recipe.title}`}
                          >
                            <IconEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(recipe)}
                            className="btn btn-circle btn-sm bg-red-100 hover:bg-red-200 border-none"
                            title="Delete Recipe"
                            aria-label={`Delete ${recipe.title}`}
                          >
                            <IconTrash size={18} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Back to Home Link */}
            <div className="mt-8 text-center">
              <Link href="/" className="btn btn-outline btn-wide">
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Tab Slider for Admin: Recipes vs AI Recipes */}
      <div className="flex justify-center mb-6 gap-4">
        <button
          className={`btn ${selectedTab === "recipes" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setSelectedTab("recipes")}
        >
          Recipes
        </button>
        <button
          className={`btn ${selectedTab === "ai-recipes" ? "btn-primary" : "btn-outline"}`}
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
          <div key={recipe.id} className="card bg-base-100 shadow-md rounded-lg p-4">
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
                {recipe.category ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) : "Uncategorized"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2 line-clamp-3">{recipe.description}</p>
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
              Are you sure you want to delete the recipe "<b>{recipeToDelete?.title}</b>"?
            </p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={() => setDeleteModalOpen(false)}>
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
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setCurrentRecipe(null)}></div>
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
                    setCurrentRecipe({ ...currentRecipe, title: e.target.value })
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
                    setCurrentRecipe({ ...currentRecipe, category: e.target.value })
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
                    setCurrentRecipe({ ...currentRecipe, description: e.target.value })
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
                    setCurrentRecipe({ ...currentRecipe, portion: Number(e.target.value) })
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
                    setCurrentRecipe({ ...currentRecipe, image: e.target.value })
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
  );
}
