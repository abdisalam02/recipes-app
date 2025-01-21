'use client';

import { useEffect, useState } from "react";
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
  Paper,
  Stack,
} from "@mantine/core";
import {  IconHeartOff } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import Link from "next/link";

// Recipe Interface
interface Recipe {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  portion: number;
}

// Favorite Interface
interface Favorite {
  id: number;
  recipe_id: number;
  recipe: Recipe;
  created_at: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch favorites");
      }
      const data: Favorite[] = await response.json();
      setFavorites(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to load favorites.",
          color: "red",
        });
        setError(error.message);
      } else {
        notifications.show({
          title: "Error",
          message: "An unknown error occurred while fetching favorites.",
          color: "red",
        });
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (recipe_id: number) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id }),
      });
      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.recipe_id !== recipe_id));
        notifications.show({
          title: "Success",
          message: "Recipe removed from favorites",
          color: "blue",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove favorite");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to remove from favorites",
          color: "red",
        });
        setError(error.message);
      } else {
        notifications.show({
          title: "Error",
          message: "An unknown error occurred while removing favorite.",
          color: "red",
        });
        setError("An unknown error occurred.");
      }
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Group align="center">
          <Text>Loading your favorites...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder radius="md" shadow="sm">
          <Stack align="center" gap="md">
            <IconHeartOff size={48} stroke={1.5} />
            <Text size="xl" >
              No Favorite Recipes Yet
            </Text>
            <Text color="dimmed" >
              Start adding recipes to your favorites by clicking the heart icon on any recipe card.
            </Text>
            <Button component={Link} href="/" variant="light" color="blue">
              Browse Recipes
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (favorites.length === 0) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder radius="md" shadow="sm">
          <Stack align="center" gap="md">
            <IconHeartOff size={48} stroke={1.5} />
            <Text size="xl" >
              No Favorite Recipes Yet
            </Text>
            <Text color="dimmed" >
              Start adding recipes to your favorites by clicking the heart icon on any recipe card.
            </Text>
            <Button component={Link} href="/" variant="light" color="blue">
              Browse Recipes
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1} >Your Favorite Recipes</Title>

        {/* Favorite Recipes Grid */}
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3, lg: 4 }}  // Adjust the columns based on viewport
          spacing={{ base: 'sm', sm: 'md', lg: 'lg' }}  // Adjust spacing based on viewport
          verticalSpacing={{ base: 'sm', sm: 'md', lg: 'lg' }}  // Adjust vertical spacing based on viewport
        >
          {favorites.map((fav) => (
            <Card key={fav.id} shadow="sm" p="lg" radius="md" withBorder>
              <Card.Section style={{ position: "relative" }}>
                <Image
                  src={fav.recipe.image}
                  alt={fav.recipe.title}
                  height={160}
                  fit="cover"
                />
                <Tooltip label="Remove from Favorites">
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="lg"
                    style={{ position: "absolute", top: 10, right: 10 }}
                    onClick={() => removeFavorite(fav.recipe_id)} // Use 'recipe_id'
                    aria-label="Remove from favorites"
                  >
                    <IconHeartOff size={20} />
                  </ActionIcon>
                </Tooltip>
              </Card.Section>
              <Group mt="md" mb="xs" align="center" gap="xs">
                <Text  size="lg">
                  {fav.recipe.title}
                </Text>
                <Badge color="blue" variant="light">
                  {fav.recipe.category.charAt(0).toUpperCase() +
                    fav.recipe.category.slice(1)}
                </Badge>
              </Group>
              <Text size="sm" color="dimmed" mb="lg" lineClamp={3}>
                {fav.recipe.description}
              </Text>
              <Button
                color="blue"
                fullWidth
                component={Link}
                href={`/recipes/${fav.recipe.id}`}
              >
                View Recipe
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
