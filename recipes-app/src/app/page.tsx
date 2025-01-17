// src/pages/index.tsx or app/page.tsx
"use client";

import {
  Container,
  SimpleGrid,
  Card,
  Image, // Mantine Image component
  Text,
  Badge,
  Button,
  Group,
  ActionIcon,
  Tooltip,
  Title,
  TextInput,
  Select,
  Loader,
  Box,
} from "@mantine/core";
// Removed the incorrect import of EmotionSx
// import type { EmotionSx as sx } from '@mantine/emotion';
import { IconHeart, IconHeartFilled, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useDebouncedValue } from "@mantine/hooks"; // Added for debounced search

// Recipe Interface
interface Recipe {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  portion: number;
  ingredients: Array<{
    id: number;
    quantity: number;
    unit: string;
    name: string;
    recipeId: number;
  }>;
  steps: Array<{
    id: number;
    order: number;
    description: string;
    recipeId: number;
  }>;
}

// Favorite Interface
interface Favorite {
  id: number;
  userId: number;
  recipeId: number;
  recipe: Recipe;
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States for Search and Category Filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300); // Debounced search term
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Fetch Recipes and Favorites on Mount
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch("/api/recipes");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch recipes");
        }
        const data: Recipe[] = await res.json();
        setRecipes(data);
      } catch (error: any) {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to load recipes.",
          color: "red",
        });
      }
    };

    const fetchFavorites = async () => {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch favorites");
        }
        const data: Favorite[] = await res.json();
        setFavorites(data);
      } catch (error: any) {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to load favorites.",
          color: "red",
        });
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchRecipes(), fetchFavorites()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Determine if a recipe is favorited
  const isFavorited = (recipeId: number): boolean => {
    return favorites.some((fav) => fav.recipeId === recipeId);
  };

  // Toggle Favorite Status
  const toggleFavorite = async (recipeId: number) => {
    try {
      if (isFavorited(recipeId)) {
        // DELETE => remove favorite
        const res = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to remove favorite");
        }
        setFavorites((prev) => prev.filter((fav) => fav.recipeId !== recipeId));
        notifications.show({
          title: "Removed from Favorites",
          message: "The recipe has been unfavorited.",
          color: "gray",
        });
      } else {
        // POST => add favorite
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to add favorite");
        }
        const newFavorite: Favorite = await res.json();
        setFavorites((prev) => [...prev, newFavorite]);
        notifications.show({
          title: "Added to Favorites",
          message: "The recipe has been favorited.",
          color: "green",
        });
      }
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "An error occurred.",
        color: "red",
      });
    }
  };

  // Loading State
  if (loading) {
    return (
      <Container size="md" py="xl">
        <Group align="center">
          <Loader size="xl" color="blue" variant="dots" /> {/* Replaced static text with Loader */}
        </Group>
      </Container>
    );
  }

  // Function to get Image URL or fallback
  const getImageUrl = (image: string): string => {
    if (image && image.trim() !== "") return image;
    return "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg";
  };

  // Get Unique Categories from Recipes
  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category)));

  // Filter Recipes based on Search Term and Selected Category
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? recipe.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <Container size="lg" py="xl">
      {/* Wrap Title in a Box with textAlign */}
      <Group align="center">
      <Box mb="xl">
        <Title>
          Recipe Collection
        </Title>
      </Box>
      </Group>

      {/* Search and Filter Section */}
      <Group mb="xl">
        {/* Search Bar */}
        <TextInput
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          radius="xl"
          size="md"
          // Removed icon prop
          rightSection={
            searchTerm ? (
              <ActionIcon
                color="gray"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <IconX size={18} />
              </ActionIcon>
            ) : null
          }
          styles={{
            root: { flex: 1 },
          }}
        />

        {/* Category Filter */}
        <Select
          data={[
            { value: "", label: "All Categories" },
            ...categories.map((category) => ({
              value: category,
              label: category.charAt(0).toUpperCase() + category.slice(1),
            })),
          ]}
          placeholder="Filter by Category"
          value={selectedCategory}
          onChange={(value) => setSelectedCategory(value || "")}
          radius="xl"
          size="md"
          styles={{
            root: { flex: 1, maxWidth: 250 },
          }}
        />
      </Group>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <Group align="center">
          <Box >
          <Text color="dimmed">
            No recipes found.
          </Text>
        </Box>

        </Group>
      ) : (
        <SimpleGrid
          cols={3}
          spacing="lg"
         
        >
          {filteredRecipes.map((recipe) => (
            <Card
              shadow="md"
              p="lg"
              radius="md"
              withBorder
              key={recipe.id}
              sx={{ // Corrected from 'Sx' to 'sx'
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                },
              }}
            >
              <Card.Section>
                <Image
                  src={getImageUrl(recipe.image)}
                  height={160}
                  alt={recipe.title}
                  fit="cover"
                />
              </Card.Section>

              <Group mt="md" mb="xs">
                <Text size="lg">
                  {recipe.title}
                </Text>
                <Badge color="pink" variant="light" size="sm">
                  {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
                </Badge>
              </Group>

              <Text size="sm" color="dimmed" lineClamp={3}>
                {recipe.description.length > 100
                  ? `${recipe.description.substring(0, 100)}...`
                  : recipe.description}
              </Text>

              <Group mt="md" mb="xs">
                <Text size="sm" color="dimmed">
                  Portions: {recipe.portion}
                </Text>
                <Tooltip label={isFavorited(recipe.id) ? "Unfavorite" : "Favorite"}>
                  <ActionIcon
                    variant="transparent"
                    color={isFavorited(recipe.id) ? "red" : "gray"}
                    onClick={() => toggleFavorite(recipe.id)}
                    aria-label={isFavorited(recipe.id) ? "Unfavorite" : "Favorite"}
                  >
                    {isFavorited(recipe.id) ? <IconHeartFilled size={24} /> : <IconHeart size={24} />}
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Button
                variant="light"
                color="blue"
                fullWidth
                radius="md"
                component={Link}
                href={`/recipes/${recipe.id}`} // Navigates to single recipe detail
                sx={{ // Correct prop name
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#e3f2fd",
                  },
                }}
              >
                View Recipe
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
