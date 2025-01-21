'use client';

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Container, Group, Title, Text, Image, Badge, Button, Modal, Accordion, Box } from "@mantine/core";
import { IconInfoCircle } from '@tabler/icons-react';

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
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

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
            setError(err.message);
          } else {
            setError("An unknown error occurred.");
          }
          setLoading(false);
        });
    }
  }, [id]);

  const openModal = (step: Step) => {
    setSelectedStep(step);
    setModalOpened(true);
  };

  const closeModal = () => {
    setSelectedStep(null);
    setModalOpened(false);
  };

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

      <Title order={3}>Ingredients</Title>
      <Accordion mb="md">
        {recipe.ingredients.map((ingredient) => (
          <Accordion.Item key={ingredient.id} value={`ingredient-${ingredient.id}`}>
            <Accordion.Control>{ingredient.quantity} {ingredient.unit} of {ingredient.name}</Accordion.Control>
            <Accordion.Panel>
              <Text size="sm">Details about {ingredient.name}...</Text>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      <Title order={3}>Steps</Title>
      <Accordion mb="md">
        {recipe.steps.map((step) => (
          <Accordion.Item key={step.id} value={`step-${step.id}`}>
            <Accordion.Control>
              Step {step.order}: {step.description}
            </Accordion.Control>
            <Accordion.Panel>
              <Text size="sm">{step.description}</Text>
              <Button variant="subtle" size="xs" onClick={() => openModal(step)}>
  <Group gap={8}>
    <IconInfoCircle size={16} />
    View More
  </Group>
</Button>

            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      {/* Modal for Step Details */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={selectedStep?.description}
        centered
      >
        <Text size="md">
          Here are more details for the step: <strong>{selectedStep?.description}</strong>.
        </Text>
        {/* Add any additional information about the step here */}
      </Modal>
    </Container>
  );
}
