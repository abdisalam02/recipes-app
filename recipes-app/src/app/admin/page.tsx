'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconTrash, IconEdit, IconLock } from "@tabler/icons-react";
// We'll use useState and useEffect for logic
// DaisyUI provides CSS classes so we don't need component imports

// Define the Recipe Interface
interface Recipe {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  portion: number;
}

// AdminDashboardPage Component
export default function AdminDashboardPage() {
  // State for controlling the Edit Drawer
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false);

  // A. Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");

  // B. Admin Logic States
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);

  // C. Deletion Confirmation States
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  // 3. Check Authentication Status on Mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localAuth = localStorage.getItem("admin-auth");
        if (localAuth === "true") {
          setIsAuthenticated(true);
        }
      } catch (error: unknown) {
        console.error("Error checking authentication:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 4. Handler: Submit Password
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
      localStorage.setItem("admin-auth", "true");
      alert("Access Granted: You are now logged in as Admin");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Invalid password");
      } else {
        alert("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 5. Fetch Recipes
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/recipes");
      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }
      const data: Recipe[] = await response.json();
      setRecipes(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Failed to fetch recipes");
      } else {
        alert("An unknown error occurred while fetching recipes.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch Recipes When Authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecipes();
    }
  }, [isAuthenticated]);

  // 6. Handle Delete (Triggers Confirmation Modal)
  const handleDelete = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setDeleteModalOpen(true);
  };

  // 7. Confirm Delete (Performs Deletion)
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Failed to delete recipe");
      } else {
        alert("An unknown error occurred while deleting the recipe.");
      }
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setRecipeToDelete(null);
    }
  };

  // 8. Handle Edit: Open the Edit Drawer with the current recipe
  const handleEdit = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setEditDrawerOpen(true);
  };

  // 9. Handle Edit Submit: Save changes
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
      setEditDrawerOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Failed to update recipe");
      } else {
        alert("An unknown error occurred while updating the recipe.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 10. If NOT authenticated, show the password form
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <div className="relative">
          <div className="flex flex-col items-center gap-4">
            <IconLock size={48} />
            <h3 className="text-3xl">Admin Access</h3>
            <p>Please enter the admin password to continue.</p>
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
          {loading && (
            <div className="absolute inset-0 flex justify-center items-center">
              <button className="btn btn-square btn-lg loading">Loading</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 11. If authenticated, show the Admin Dashboard
  return (
    <div className="container mx-auto py-8">
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center">
          <button className="btn btn-square btn-lg loading">Loading</button>
        </div>
      )}
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <button onClick={fetchRecipes} className="btn btn-primary">
            Refresh
          </button>
        </div>

        {/* Edit Recipe Drawer */}
        <input id="edit-drawer" type="checkbox" className="drawer-toggle" checked={editDrawerOpen} readOnly />
        <div className="drawer drawer-end">
          <div className="drawer-content"></div>
          <div className="drawer-side">
            <label
              htmlFor="edit-drawer"
              className="drawer-overlay"
              onClick={() => setEditDrawerOpen(false)}
            ></label>
            <div className="menu p-4 w-80 bg-base-200 text-base-content">
              {currentRecipe && (
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
                    value={currentRecipe.category}
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
              )}
            </div>
          </div>
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
                  {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
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
      </div>

      {/* Confirmation Modal for Deletion */}
      {deleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-xl mb-4">
              Confirm Deletion
            </h3>
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
    </div>
  );
}
