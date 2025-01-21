// components/AdminDashboardPage.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  LoadingOverlay,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Drawer,
  Flex,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconTrash, IconEdit, IconLock } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";

// 1. Define the Recipe Interface
interface Recipe {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  portion: number;
}

// 2. Define the AdminDashboard Page
export default function AdminDashboardPage() {
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false);

  // A. Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");

  // B. Admin Logic States
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [editModalOpen, editModalHandlers] = useDisclosure(false);
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
        if (error instanceof Error) {
          console.error("Error checking authentication:", error.message);
        } else {
          console.error("Unknown error checking authentication.");
        }
      } finally {
        setLoading(false); // Ensure loading is turned off after auth check
      }
    };

    checkAuth();
  }, []);

  // 4. Handler: Submit Password
  const handleLogin = async () => {
    if (!passwordInput) {
      notifications.show({
        title: "Error",
        message: "Password cannot be empty.",
        color: "red",
      });
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

      // If success
      setIsAuthenticated(true);
      localStorage.setItem("admin-auth", "true");
      notifications.show({
        title: "Access Granted",
        message: "You are now logged in as Admin",
        color: "green",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        notifications.show({
          title: "Error",
          message: err.message || "Invalid password",
          color: "red",
        });
      } else {
        notifications.show({
          title: "Error",
          message: "An unknown error occurred.",
          color: "red",
        });
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
        notifications.show({
          title: "Error",
          message: err.message || "Failed to fetch recipes",
          color: "red",
        });
      } else {
        notifications.show({
          title: "Error",
          message: "An unknown error occurred while fetching recipes.",
          color: "red",
        });
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
      notifications.show({
        title: "Success",
        message: "Recipe deleted",
        color: "green",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        notifications.show({
          title: "Error",
          message: err.message || "Failed to delete recipe",
          color: "red",
        });
      } else {
        notifications.show({
          title: "Error",
          message: "An unknown error occurred while deleting the recipe.",
          color: "red",
        });
      }
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setRecipeToDelete(null);
    }
  };

  // 8. Handle Edit
  const handleEdit = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    editModalHandlers.open();
    setEditDrawerOpen(true);

  };
   
  

  const handleEditSubmit = async () => {
    if (!currentRecipe) return;
  
    // Validate inputs
    if (
      !currentRecipe.title ||
      !currentRecipe.category ||
      !currentRecipe.description ||
      !currentRecipe.image ||
      currentRecipe.portion < 1
    ) {
      notifications.show({
        title: "Error",
        message: "Please fill out all fields correctly.",
        color: "red",
      });
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
      notifications.show({
        title: "Success",
        message: "Recipe updated",
        color: "green",
      });
      setEditDrawerOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        notifications.show({
          title: "Error",
          message: err.message || "Failed to update recipe",
          color: "red",
        });
      } else {
        notifications.show({
          title: "Error",
          message: "An unknown error occurred while updating the recipe.",
          color: "red",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  

  // 9. If NOT authenticated, show the password form
  if (!isAuthenticated) {
    return (
      <Container size="xs" py="xl">
        {/* Ensure the Container has relative positioning for the LoadingOverlay */}
        <div style={{ position: "relative" }}>
          <LoadingOverlay
            visible={loading}
            overlayProps={{ blur: 2 }}
            zIndex={1000}
          />
          <Stack gap="md" align="center">
            <IconLock size={48} />
            <Title order={3}>Admin Access</Title>
            <Text>Please enter the admin password to continue.</Text>
            <TextInput
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
            />
            <Button onClick={handleLogin} color="blue" fullWidth>
              Submit
            </Button>
          </Stack>
        </div>
      </Container>
    );
  }

  // 10. If authenticated, show the actual Admin Dashboard
  return (
    <Container size="lg" py="xl">
      <LoadingOverlay
        visible={loading}
        overlayProps={{ blur: 2 }}
        zIndex={1000}
      />
      <Stack gap="xl">
        <Group>
          <Title order={2}>Admin Dashboard</Title>
          <Button onClick={fetchRecipes} loading={loading}>
            Refresh
          </Button>
        </Group>
        {/* Edit Recipe Drawer */}
<Drawer
  opened={editDrawerOpen}
  onClose={() => setEditDrawerOpen(false)}
  title="Edit Recipe"
  padding="lg"
  size="lg"
>
  {currentRecipe && (
    <Stack gap="sm">
      <TextInput
        label="Title"
        value={currentRecipe.title}
        onChange={(e) =>
          setCurrentRecipe({ ...currentRecipe, title: e.target.value })
        }
        required
      />
      <TextInput
        label="Category"
        value={currentRecipe.category}
        onChange={(e) =>
          setCurrentRecipe({ ...currentRecipe, category: e.target.value })
        }
        required
      />
      <Textarea
        label="Description"
        minRows={3}
        value={currentRecipe.description}
        onChange={(e) =>
          setCurrentRecipe({
            ...currentRecipe,
            description: e.target.value,
          })
        }
        required
      />
      <NumberInput
        label="Portions"
        min={1}
        value={currentRecipe.portion}
        onChange={(val: number | string) => {
          if (typeof val === "number") {
            setCurrentRecipe({
              ...currentRecipe,
              portion: val,
            });
          }
        }}
        required
      />
      <TextInput
        label="Image URL"
        value={currentRecipe.image}
        onChange={(e) =>
          setCurrentRecipe({ ...currentRecipe, image: e.target.value })
        }
        required
      />

      <Button
        color="green"
        onClick={handleEditSubmit}
        loading={loading}
      >
        Save Changes
      </Button>
    </Stack>
  )}
</Drawer>

<SimpleGrid
  cols={{ base: 1, sm: 2, md: 3 }} // Responsive columns
  spacing="lg"
>
  {recipes.map((recipe) => (
    <Card key={recipe.id} shadow="sm" p="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={recipe.image}
          height={160}
          alt={recipe.title}
          fit="cover"
        />
      </Card.Section>

      <Group mt="md" mb="xs">
        <Text>{recipe.title}</Text>
        <Badge color="pink" variant="light">
          {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
        </Badge>
      </Group>

      <Text size="sm" color="dimmed">
        {recipe.description.length > 100
          ? `${recipe.description.substring(0, 100)}...`
          : recipe.description}
      </Text>

      <Group mt="md"align="center">
        <Text size="sm">Portions: {recipe.portion}</Text>

        {/* Icons with Custom CSS */}
        <div className="icon-container">
          <ActionIcon
            variant="outline"
            color="blue"
            onClick={() => handleEdit(recipe)}
            title="Edit Recipe"
            aria-label={`Edit ${recipe.title}`}
          >
            <IconEdit size={18} />
          </ActionIcon>

          <ActionIcon
            variant="outline"
            color="red"
            onClick={() => handleDelete(recipe)}
            title="Delete Recipe"
            aria-label={`Delete ${recipe.title}`}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </div>
      </Group>
    </Card>
  ))}
</SimpleGrid>


      </Stack>

      {/* Confirmation Modal for Deletion */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
        centered
      >
        <Text>
          Are you sure you want to delete the recipe &quot;{recipeToDelete?.title}&quot;?
        </Text>
        <Group mt="md">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>

      {/* Edit Recipe Modal */}
      <Modal
        opened={editModalOpen}
        onClose={editModalHandlers.close}
        title="Edit Recipe"
        centered
      >
        {currentRecipe && (
          <Stack gap="sm">
            <TextInput
              label="Title"
              value={currentRecipe.title}
              onChange={(e) =>
                setCurrentRecipe({ ...currentRecipe, title: e.target.value })
              }
              required
            />
            <TextInput
              label="Category"
              value={currentRecipe.category}
              onChange={(e) =>
                setCurrentRecipe({ ...currentRecipe, category: e.target.value })
              }
              required
            />
            <Textarea
              label="Description"
              minRows={3}
              value={currentRecipe.description}
              onChange={(e) =>
                setCurrentRecipe({
                  ...currentRecipe,
                  description: e.target.value,
                })
              }
              required
            />
            <NumberInput
              label="Portions"
              min={1}
              value={currentRecipe.portion}
              onChange={(val: number | string) => {
                if (typeof val === "number") {
                  setCurrentRecipe({
                    ...currentRecipe,
                    portion: val,
                  });
                } else {
                  // Handle the case where val is a string (e.g., empty input)
                  setCurrentRecipe({
                    ...currentRecipe,
                    portion: 1, // Default to 1 if input is invalid or empty
                  });
                }
              }}
              required
              radius="xl"
              size="md"
              aria-label="Portions"
            />

            <TextInput
              label="Image URL"
              value={currentRecipe.image}
              onChange={(e) =>
                setCurrentRecipe({ ...currentRecipe, image: e.target.value })
              }
              required
            />

            <Button
              color="green"
              onClick={handleEditSubmit}
              loading={loading}
            >
              Save Changes
            </Button>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
