// app/page.tsx

"use client";

import {
  Container,
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Button,
  Group,
  ActionIcon,
  Tooltip,
  Title,
} from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import Link from "next/link";

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
  const userId = 1; // Fixed user ID since no authentication

  useEffect(() => {
    // Fetch all recipes
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
        console.error("Error fetching recipes:", error);
        notifications.show({
          title: "Error",
          message: error.message || "Failed to load recipes.",
          color: "red",
        });
      }
    };

    // Fetch user's favorites
    const fetchFavorites = async () => {
      try {
        const res = await fetch(`/api/favorites`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch favorites");
        }
        const data: Favorite[] = await res.json();
        if (Array.isArray(data)) {
          setFavorites(data);
        } else {
          console.error("Favorites response is not an array:", data);
          setFavorites([]); // Ensure it's an array
        }
      } catch (error: any) {
        console.error("Error fetching favorites:", error);
        notifications.show({
          title: "Error",
          message: error.message || "Failed to load favorites.",
          color: "red",
        });
        setFavorites([]); // Set to empty array on error
      }
    };

    // Fetch both recipes and favorites
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchRecipes(), fetchFavorites()]);
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // Function to check if a recipe is favorited
  const isFavorited = (recipeId: number): boolean => {
    return favorites.some((fav) => fav.recipeId === recipeId);
  };

  // Function to handle favorite toggling
  const toggleFavorite = async (recipeId: number) => {
    try {
      if (isFavorited(recipeId)) {
        // Unfavorite
        const res = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to remove favorite");
        }

        // Update state
        setFavorites(favorites.filter((fav) => fav.recipeId !== recipeId));
        notifications.show({
          title: "Removed from Favorites",
          message: "The recipe has been unfavorited.",
          color: "gray",
        });
      } else {
        // Favorite
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
        setFavorites([...favorites, newFavorite]);
        notifications.show({
          title: "Added to Favorites",
          message: "The recipe has been favorited.",
          color: "green",
        });
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      notifications.show({
        title: "Error",
        message: error.message || "An error occurred.",
        color: "red",
      });
    }
  };

  // Function to get image or default
  const getImageUrl = (image: string): string => {
    if (image && image.trim() !== "") {
      return image;
    }
    // Return a default image from Pexels or another source
    return "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"; // Example default image
  };

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Text align="center">Loading recipes...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title align="center" mb="xl">
        Recipe Collection
      </Title>

      <SimpleGrid cols={3} spacing="lg" breakpoints={[
        { maxWidth: 980, cols: 2, spacing: 'md' },
        { maxWidth: 755, cols: 1, spacing: 'sm' },
      ]}>
        {recipes.map((recipe) => (
          <Card shadow="sm" p="lg" radius="md" withBorder key={recipe.id}>
            <Card.Section>
              <Image
                src={getImageUrl(recipe.image)}
                height={160}
                alt={recipe.title}
                fit="cover"
                withPlaceholder
                placeholder={
                  <Image
                    src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
                    height={160}
                    alt="Default Image"
                    fit="cover"
                  />
                }
              />
            </Card.Section>

            <Group position="apart" mt="md" mb="xs">
              <Text weight={500}>{recipe.title}</Text>
              <Badge color="pink" variant="light">
                {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
              </Badge>
            </Group>

            <Text size="sm" color="dimmed">
              {recipe.description.length > 100
                ? `${recipe.description.substring(0, 100)}...`
                : recipe.description}
            </Text>

            <Group position="apart" mt="md">
              <Text size="sm">Portions: {recipe.portion}</Text>
              <Tooltip label={isFavorited(recipe.id) ? "Unfavorite" : "Favorite"}>
                <ActionIcon
                  variant="transparent"
                  color={isFavorited(recipe.id) ? "red" : "gray"}
                  onClick={() => toggleFavorite(recipe.id)}
                  aria-label={isFavorited(recipe.id) ? "Unfavorite" : "Favorite"}
                >
                  {isFavorited(recipe.id) ? (
                    <IconHeartFilled size={24} />
                  ) : (
                    <IconHeart size={24} />
                  )}
                </ActionIcon>
              </Tooltip>
            </Group>

            <Button
              variant="light"
              color="blue"
              fullWidth
              mt="md"
              radius="md"
              component={Link}
              href={`/recipes/${recipe.id}`} // Use Link component correctly
            >
              View Recipe
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
