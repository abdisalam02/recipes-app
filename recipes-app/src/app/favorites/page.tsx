// app/favorites/page.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Text,
  Grid,
  Card,
  Image,
  Badge,
  Button,
  Group,
  Stack,
  Center,
  Paper,
  ActionIcon,
} from "@mantine/core";
import { IconHeartFilled, IconHeartOff } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import Link from "next/link";

interface Recipe {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
}

interface Favorite {
  id: number;
  recipe: Recipe;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = 1; // Fixed user ID since no authentication

  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`/api/favorites`);
      if (!response.ok) throw new Error("Failed to fetch favorites");
      const data: Favorite[] = await response.json();
      setFavorites(data);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load favorites",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const removeFavorite = async (recipeId: number) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      if (response.ok) {
        setFavorites(favorites.filter((fav) => fav.recipe.id !== recipeId));
        notifications.show({
          title: "Success",
          message: "Recipe removed from favorites",
          color: "blue",
        });
      } else {
        throw new Error("Failed to remove favorite");
      }
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: "Failed to remove from favorites",
        color: "red",
      });
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Center>
          <Text>Loading your favorites...</Text>
        </Center>
      </Container>
    );
  }

  if (favorites.length === 0) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder radius="md" shadow="sm">
          <Stack align="center" spacing="md">
            <IconHeartOff size={48} stroke={1.5} />
            <Text size="xl" fw={500}>No Favorite Recipes Yet</Text>
            <Text c="dimmed" ta="center">
              Start adding recipes to your favorites by clicking the heart icon on any recipe card.
            </Text>
            <Button component={Link} href="/" variant="light">
              Browse Recipes
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Text size="xl" fw={700} ta="center">
          Your Favorite Recipes
        </Text>

        <Grid gutter="xl">
          {favorites.map((favorite) => (
            <Grid.Col key={favorite.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Card.Section style={{ position: 'relative' }}>
                  <Image
                    src={favorite.recipe.image}
                    alt={favorite.recipe.title}
                    height={160}
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
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="lg"
                    style={{ position: 'absolute', top: 10, right: 10 }}
                    onClick={() => removeFavorite(favorite.recipe.id)}
                    aria-label="Remove from Favorites"
                  >
                    <IconHeartFilled size={20} />
                  </ActionIcon>
                </Card.Section>
                <div style={{ padding: '16px' }}>
                  <Group justify="space-between" mb="xs">
                    <Text fw={500} size="lg">
                      {favorite.recipe.title}
                    </Text>
                    <Badge color="blue" variant="light">
                      {favorite.recipe.category.charAt(0).toUpperCase() + favorite.recipe.category.slice(1)}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed" mb="lg">
                    {favorite.recipe.description}
                  </Text>
                  <Button
                    color="blue"
                    fullWidth
                    component={Link}
                    href={`/recipes/${favorite.recipe.id}`}
                  >
                    View Recipe
                  </Button>
                </div>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}
