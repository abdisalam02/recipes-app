// app/recipes/[id]/page.tsx

"use client";

import {
  Container,
  Title,
  Image,
  Text,
  Badge,
  Group,
  Stack,
  List,
  ThemeIcon,
  Skeleton,
  NumberInput,
} from "@mantine/core";
import { IconCheck, IconPlus, IconMinus } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";

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
  const [currentPortion, setCurrentPortion] = useState<number>(1);

  useEffect(() => {
    if (id) {
      // Fetch recipe details
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
          setCurrentPortion(data.portion);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching recipe:", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [id]);

  // Function to calculate scaled quantity
  const calculateScaledQuantity = (quantity: number): number => {
    if (!recipe) return quantity;
    const scale = currentPortion / recipe.portion;
    return quantity * scale;
  };

  // Function to format quantity
  const formatQuantity = (quantity: number): string => {
    return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
  };

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Title align="center" mb="xl">
          Loading...
        </Title>
        <Skeleton height={300} radius="md" mb="md" />
        <Skeleton height={40} radius="md" mb="md" />
        <Skeleton height={20} mb="sm" />
        <Skeleton height={20} width="60%" mb="lg" />
        <Skeleton height={30} width="40%" />
      </Container>
    );
  }

  if (error || !recipe) {
    return (
      <Container size="md" py="xl">
        <Title align="center" mb="xl">
          {error ? "Error" : "Recipe Not Found"}
        </Title>
        <Text align="center">
          {error || "The recipe you are looking for does not exist."}
        </Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Image src={recipe.image} height={300} alt={recipe.title} radius="md" />

      <Group position="apart" style={{ marginTop: 20 }}>
        <Title order={2}>{recipe.title}</Title>
        <Badge color="pink" variant="light">
          {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
        </Badge>
      </Group>

      <Text size="sm" color="dimmed" mt="sm">
        Base Portions: {recipe.portion}
      </Text>

      {/* Portion Adjustment */}
      <Group spacing="xs" align="center" mt="md">
        <Text size="sm" weight={500}>
          Adjust Portions:
        </Text>
        <NumberInput
          value={currentPortion}
          onChange={(value) => setCurrentPortion(value || 1)}
          min={1}
          step={1}
          hideControls
          styles={(theme) => ({
            input: { width: 60, textAlign: "center" },
          })}
        />
        <ActionIcon
          variant="light"
          color="blue"
          onClick={() => setCurrentPortion((prev) => prev + 1)}
          aria-label="Increase Portions"
        >
          <IconPlus size={16} />
        </ActionIcon>
        <ActionIcon
          variant="light"
          color="blue"
          onClick={() =>
            setCurrentPortion((prev) => (prev > 1 ? prev - 1 : 1))
          }
          aria-label="Decrease Portions"
        >
          <IconMinus size={16} />
        </ActionIcon>
      </Group>

      <Text size="lg" mt="md">
        {recipe.description}
      </Text>

      <Stack spacing="sm" mt="md">
        <Title order={4}>Ingredients</Title>
        <List
          spacing="xs"
          size="sm"
          icon={
            <ThemeIcon color="teal" size={20} radius="xl">
              <IconCheck size={12} />
            </ThemeIcon>
          }
        >
          {recipe.ingredients.map((ing) => (
            <List.Item key={ing.id}>
              {formatQuantity(calculateScaledQuantity(ing.quantity))} {ing.unit}{" "}
              {ing.name}
            </List.Item>
          ))}
        </List>
      </Stack>

      <Stack spacing="sm" mt="md">
        <Title order={4}>Steps</Title>
        <List
          spacing="xs"
          size="sm"
          icon={
            <ThemeIcon color="blue" size={20} radius="xl">
              <IconCheck size={12} />
            </ThemeIcon>
          }
        >
          {recipe.steps
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <List.Item key={step.id}>
                <strong>Step {step.order}:</strong> {step.description}
              </List.Item>
            ))}
        </List>
      </Stack>
    </Container>
  );
}
