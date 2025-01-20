// src/app/recipes/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Container, Group, Title, Text, Image, Badge } from "@mantine/core";

interface Ingredient {
  id: number;
  quantity: number;
  unit: string;
  name: string;
  recipeId: number;
}

interface Step {
  id: number;
  order: number;
  description: string;
  recipeId: number;
}

interface RecipeDetail {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  portion: number;
  ingredients: Ingredient[];
  steps: Step[];
}

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/recipes/${id}`)
        .then((res) => {
          if (!res.ok) {
            return res.json().then((data) => {
              throw new Error(data.error || "Failed to fetch recipe");
            });
          }
          return res.json();
        })
        .then((data: RecipeDetail) => {
          setRecipe(data);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (err instanceof Error) {
            console.error("Error fetching recipe:", err.message);
            setError(err.message);
          } else {
            console.error("Unknown error fetching recipe.");
            setError("An unknown error occurred.");
          }
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Group align="center" mb="xl">
          <Title order={2}>Loading...</Title>
        </Group>
      </Container>
    );
  }

  if (error || !recipe) {
    return (
      <Container size="md" py="xl">
        <Group align="center" mb="xl">
          <Title order={2}>{error ? "Error" : "Recipe Not Found"}</Title>
        </Group>
        <Group align="center">
          <Text>{error || "The recipe you are looking for does not exist."}</Text>
        </Group>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Image
        src={recipe.image}
        height={300}
        alt={recipe.title}
        radius="md"
        mb="md"
      />
      <Group justify="apart" mb="md">
        <Title order={2}>{recipe.title}</Title>
        <Badge color="pink" variant="light">
          {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
        </Badge>
      </Group>
      <Text size="sm" color="dimmed" mb="md">
        Base Portions: {recipe.portion}
      </Text>
      <Text size="lg" mb="md">
        {recipe.description}
      </Text>
    </Container>
  );
}
