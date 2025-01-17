"use client";

import {
  Container,
  Title,
  Image, // Mantine Image
  Text,
  Badge,
  Group,
  Stack,
  List,
  ThemeIcon,
  Skeleton,
  NumberInput,
  ActionIcon,
  Button,
} from "@mantine/core";
import { IconCheck, IconPlus, IconMinus } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
        .catch((err: any) => {
          console.error("Error fetching recipe:", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [id]);

  const calculateScaledQuantity = (quantity: number): number => {
    if (!recipe) return quantity;
    const scale = currentPortion / recipe.portion;
    return quantity * scale;
  };

  const formatQuantity = (quantity: number): string => {
    return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
  };

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Group align="center" mb="xl">
          <Title order={2}>Loading...</Title>
        </Group>
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

   
      <Group gap="xs" align="center" mb="md">
        <Text size="sm">Adjust Portions:</Text>
        <NumberInput
          value={currentPortion}
          onChange={(value) => {
            if (typeof value === "number") {
              setCurrentPortion(value);
            } else {
              setCurrentPortion(1);
            }
          }}
          min={1}
          step={1}
          hideControls
          styles={{ input: { width: 60, textAlign: "center" } }}
        />
        {/* Optional: Uncomment below to add +/- buttons for adjusting portions */}
        {/* 
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
          onClick={() => setCurrentPortion((prev) => (prev > 1 ? prev - 1 : 1))}
          aria-label="Decrease Portions"
        >
          <IconMinus size={16} />
        </ActionIcon>
        */}
      </Group>

      <Text size="lg" mb="md">
        {recipe.description}
      </Text>

      <Stack gap="sm" mb="md">
        <Group align="center" mb="sm">
          <Title order={4}>Ingredients</Title>
        </Group>
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
              {formatQuantity(calculateScaledQuantity(ing.quantity))} {ing.unit} {ing.name}
            </List.Item>
          ))}
        </List>
      </Stack>

      <Stack gap="sm">
        <Group align="center" mb="sm">
          <Title order={4}>Steps</Title>
        </Group>
        <List
          spacing="xs"
          size="sm"
          icon={
            <ThemeIcon color="blue" size={20} radius="xl">
              <IconCheck size={12} />
            </ThemeIcon>
          }
        >
          {[...recipe.steps]
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
