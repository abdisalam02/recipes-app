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

  // Handler: Submit Password
  const handleLogin = async () => {
    if (!passwordInput) {
      alert("Password cannot be empty.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Invalid password");
      }
      setIsAuthenticated(true);
      alert("Access Granted: You are now logged in as Admin");
      setShowPasswordModal(false);
      setPasswordInput("");
      fetchRecipes();
    } catch (err: any) {
      alert(err.message || "Invalid password");
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
      const res = await fetch(`/api/recipes/${recipeToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete recipe");
      }
      setRecipes((prev) => prev.filter((r) => r.id !== recipeToDelete.id));
      alert("Recipe deleted");
    } catch (err: any) {
      alert(err.message || "Failed to delete recipe");
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
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center gap-4">
          <IconLock size={48} />
          <h3 className="text-3xl font-bold">Admin Access</h3>
          <p>Please enter the admin password.</p>
          <input
            type="password"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="input input-bordered w-full max-w-xs"
            required
          />
          <button onClick={handleLogin} className="btn btn-primary w-full max-w-xs">
            Submit
          </button>
        </div>
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

      {/* Edit Recipe Drawer */}
      {currentRecipe && (
        <div className="drawer drawer-end">
          <input id="edit-drawer" type="checkbox" className="drawer-toggle" checked readOnly />
          <div className="drawer-content"></div>
          <div className="drawer-side">
            <label
              htmlFor="edit-drawer"
              className="drawer-overlay"
              onClick={() => setCurrentRecipe(null)}
            ></label>
            <div className="menu p-4 w-80 bg-base-200 text-base-content">
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={currentRecipe.title}
                  onChange={(e) =>
                    setCurrentRecipe({ ...currentRecipe, title: e.target.value })
                  }
                  className="input input-bordered"
                  required
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={currentRecipe.category || ""}
                  onChange={(e) =>
                    setCurrentRecipe({ ...currentRecipe, category: e.target.value })
                  }
                  className="input input-bordered"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={currentRecipe.description}
                  onChange={(e) =>
                    setCurrentRecipe({ ...currentRecipe, description: e.target.value })
                  }
                  className="textarea textarea-bordered"
                  required
                ></textarea>
                <input
                  type="number"
                  placeholder="Portions"
                  value={currentRecipe.portion}
                  onChange={(e) =>
                    setCurrentRecipe({ ...currentRecipe, portion: Number(e.target.value) })
                  }
                  className="input input-bordered"
                  required
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={currentRecipe.image}
                  onChange={(e) =>
                    setCurrentRecipe({ ...currentRecipe, image: e.target.value })
                  }
                  className="input input-bordered"
                  required
                />
                <button onClick={handleEditSubmit} className="btn btn-success">
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
