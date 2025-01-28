// src/app/recipes/[id]/page.tsx

'use client'; // Designates this component as a Client Component

import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Group,
  Title,
  Text,
  Image,
  Badge,
  Button,
  Modal,
  Stack,
  Radio,
  NumberInput,
  Accordion,
  Table,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Slider,
  Chip,
  Tooltip,
  Transition,
  Affix,
} from '@mantine/core';
import { IconInfoCircle, IconArrowDown, IconX } from '@tabler/icons-react';
import { RecipeDetail, Step, Favorite } from '../../../../lib/types'; // Adjust the import path as necessary
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useDebouncedValue, useWindowScroll, useDisclosure } from '@mantine/hooks';

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [scroll, scrollTo] = useWindowScroll();

  const [currentPortions, setCurrentPortions] = useState<number>(1);
  const [availableIngredients, setAvailableIngredients] = useState<{ [key: number]: boolean }>({});

  const fullNutritionalInfoRef = useRef<HTMLDivElement>(null); // Ref for full nutritional info section

  useEffect(() => {
    if (id) {
      fetch(`/api/recipes/${id}`)
        .then((res) => {
          if (!res.ok) {
            return res.json().then((data) => {
              throw new Error(data.error || 'Failed to fetch recipe');
            });
          }
          return res.json();
        })
        .then((data: RecipeDetail) => {
          setRecipe(data);
          setCurrentPortions(Number(data.portion)); // Ensure portion is a number
          const initialAvailability: { [key: number]: boolean } = {};
          data.recipe_ingredients.forEach((ingredient) => {
            initialAvailability[ingredient.ingredient_id] = false; // Initially mark ingredients as missing
          });
          setAvailableIngredients(initialAvailability);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('An unknown error occurred.');
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

  const handleIngredientToggle = (ingredientId: number) => {
    setAvailableIngredients((prev) => ({
      ...prev,
      [ingredientId]: !prev[ingredientId], // Toggle ingredient availability
    }));
  };

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Group align="center" mb="xl">
          <Title order={2}>Loading...</Title>
        </Group>
        <LoadingOverlay visible={loading} />
      </Container>
    );
  }

  if (error || !recipe) {
    return (
      <Container size="md" py="xl">
        <Group align="center" mb="xl">
          <Title order={2}>{error ? 'Error' : 'Recipe Not Found'}</Title>
        </Group>
        <Group align="center">
          <Text>{error || 'The recipe you are looking for does not exist.'}</Text>
        </Group>
      </Container>
    );
  }

  // Correct Scaling Factor Calculation
  const scalingFactor = currentPortions / recipe.portion;

  // Destructure nutritional_info and per_ingredient_nutritional_info
  const { nutritional_info, per_ingredient_nutritional_info } = recipe;

  // Create a scaled nutritional info object
  const scaledNutritionalInfo = nutritional_info
    ? {
        calories: (parseFloat(nutritional_info.calories.toString()) * scalingFactor).toFixed(2),
        protein: (parseFloat(nutritional_info.protein.toString()) * scalingFactor).toFixed(2),
        fat: (parseFloat(nutritional_info.fat.toString()) * scalingFactor).toFixed(2),
        carbohydrates: (parseFloat(nutritional_info.carbohydrates.toString()) * scalingFactor).toFixed(2),
        fiber: (parseFloat(nutritional_info.fiber.toString()) * scalingFactor).toFixed(2),
        sugar: (parseFloat(nutritional_info.sugar.toString()) * scalingFactor).toFixed(2),
        sodium: (parseFloat(nutritional_info.sodium.toString()) * scalingFactor).toFixed(2),
        cholesterol: (parseFloat(nutritional_info.cholesterol.toString()) * scalingFactor).toFixed(2),
      }
    : null;

  // Determine Image URL with Fallback
  const imageUrl =
    recipe.image && recipe.image.trim() !== ''
      ? recipe.image
      : '/default-image.png'; // Ensure you have a default image at /public/default-image.png

  // Function to handle smooth scrolling
  const scrollToFullInfo = () => {
    if (fullNutritionalInfoRef.current) {
      fullNutritionalInfoRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Container size="md" py="xl">
      <Paper withBorder shadow="md" p="xl" radius="md">
        {/* Loading Overlay */}
        <LoadingOverlay visible={loading}/>

        {/* Image Section */}
        <Image
          src={imageUrl}
          height={300}
          alt={recipe.title}
          radius="md"
          mb="md"
          fit="cover"
          className="recipe-image"
        />

        {/* Header Section */}
        <Group justify="space-between" mb="md" align="center" wrap="wrap">
          <Title order={2}>{recipe.title}</Title>
          <Badge color="pink" variant="light" aria-label={`Category: ${recipe.category}`}>
            {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
          </Badge>
        </Group>

        {/* Portion Control Section */}
        <Group align="center" mb="md" gap="md">
          <Text size="sm">Portions:</Text>
          <Slider
            value={currentPortions}
            onChange={(value: number) => setCurrentPortions(value)}
            min={1}
            max={20}
            step={1}
            style={{ flex: 1 }}
            aria-label="Portion Slider"
          />
          <NumberInput
            value={currentPortions}
            onChange={(value: string | number) => {
              if (typeof value === 'number') {
                setCurrentPortions(value);
              } else {
                // Handle the string case, possibly setting to a default
                setCurrentPortions(1);
              }
            }}
            min={1}
            max={20}
            step={1}
            style={{ width: 60 }}
            aria-label="Portions Number Input"
          />
        </Group>

        {/* Full Nutritional Information (Per Portion) as Responsive Cards */}
        {scaledNutritionalInfo && (
          <>
            <Title order={3} mb="sm">
              Full Nutritional Information (Per Portion)
            </Title>
            <div className="nutritional-grid mb-16">
              <div className="nutritional-card">
                <Text className="nutritional-card-title">Calories</Text>
                <Text className="nutritional-card-value">{scaledNutritionalInfo.calories} kcal</Text>
              </div>
              <div className="nutritional-card">
                <Text className="nutritional-card-title">Protein</Text>
                <Text className="nutritional-card-value">{scaledNutritionalInfo.protein} g</Text>
              </div>
              {/* <div className="nutritional-card">
                <Text className="nutritional-card-title">Fat</Text>
                <Text className="nutritional-card-value">{scaledNutritionalInfo.fat} g</Text>
              </div>
              <div className="nutritional-card">
                <Text className="nutritional-card-title">Carbohydrates</Text>
                <Text className="nutritional-card-value">{scaledNutritionalInfo.carbohydrates} g</Text>
              </div>
              <div className="nutritional-card">
                <Text className="nutritional-card-title">Fiber</Text>
                <Text className="nutritional-card-value">{scaledNutritionalInfo.fiber} g</Text>
              </div>
              <div className="nutritional-card">
                <Text className="nutritional-card-title">Sugar</Text>
                <Text className="nutritional-card-value">{scaledNutritionalInfo.sugar} g</Text>
              </div>
              <div className="nutritional-card">
                <Text className="nutritional-card-title">Sodium</Text>
                <Text className="nutritional-card-value">{scaledNutritionalInfo.sodium} mg</Text>
              </div>
              <div className="nutritional-card">
                <Text className="nutritional-card-title">Cholesterol</Text>
                <Text className="nutritional-card-value">{scaledNutritionalInfo.cholesterol} mg</Text>
              </div> */}
            </div>

            {/* Button to Scroll to Per-Ingredient Nutritional Info */}
            <Button
              variant="outline"
              color="blue"
              onClick={scrollToFullInfo}
              size="sm"
              aria-label="See Per-Ingredient Nutritional Info"
              mb="md"
            >
              <IconArrowDown size={16} style={{ marginRight: 8 }} />
              See Per-Ingredient Nutritional Info
            </Button>
          </>
        )}

        {/* Description Section */}
        <Text size="lg" mb="md">
          {recipe.description}
        </Text>

        {/* Ingredients Section */}
        <Title order={3} mb="sm">
          Ingredients
        </Title>
        <Stack mb="md">
          {recipe.recipe_ingredients.map((ingredient) => {
            const scaledQuantity = (ingredient.quantity * scalingFactor).toFixed(2);
            return (
              <Group key={ingredient.ingredient_id} align="center" mb="xs">
                <Radio
                  label={`${scaledQuantity} ${ingredient.unit} of ${ingredient.ingredient.name}`}
                  checked={availableIngredients[ingredient.ingredient_id]}
                  onChange={() => handleIngredientToggle(ingredient.ingredient_id)}
                  size="sm"
                  aria-label={`Ingredient ${ingredient.ingredient.name}`}
                />
              </Group>
            );
          })}
        </Stack>

        {/* Steps Section */}
        <Title order={3} mb="sm">
          Steps
        </Title>
        <Accordion mb="md" variant="separated">
          {recipe.steps.map((step) => (
            <Accordion.Item key={step.id} value={`step-${step.id}`}>
              <Accordion.Control>
                Step {step.order}: {step.description}
              </Accordion.Control>
              <Accordion.Panel>
                <Group align="center">
                  <Text size="sm">{step.description}</Text>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => openModal(step)}
                    aria-label={`View more details for Step ${step.order}`}
                  >
                    View More
                  </Button>
                </Group>
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
          aria-labelledby="step-details-modal"
        >
          <Text size="md">
            Here are more details for the step: <strong>{selectedStep?.description}</strong>.
          </Text>
          {/* Add more detailed information about the step if available */}
        </Modal>

        {/* Per-Ingredient Nutritional Information Table */}
        {recipe.per_ingredient_nutritional_info && recipe.per_ingredient_nutritional_info.length > 0 && (
          <>
            {/* Hidden Reference Point for Scrolling */}
            <div ref={fullNutritionalInfoRef}></div>

            <Title order={3} mt="xl" mb="sm">
              Per-Ingredient Nutritional Information
            </Title>
            <ScrollArea sx={{ maxHeight: 400 }} mb="md">
              <Table
                highlightOnHover
                striped
                horizontalSpacing="md"
                verticalSpacing="sm"
                tabularNums
                aria-label="Per-Ingredient Nutritional Information Table"
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Ingredient</Table.Th>
                    <Table.Th>Calories</Table.Th>
                    <Table.Th>Protein (g)</Table.Th>
                    <Table.Th>Fat (g)</Table.Th>
                    <Table.Th>Carbohydrates (g)</Table.Th>
                    <Table.Th>Fiber (g)</Table.Th>
                    <Table.Th>Sugar (g)</Table.Th>
                    <Table.Th>Sodium (mg)</Table.Th>
                    <Table.Th>Cholesterol (mg)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recipe.per_ingredient_nutritional_info.map((info) => {
                    const ingredient = recipe.recipe_ingredients.find(
                      (ri) => ri.ingredient_id === info.ingredient_id
                    )?.ingredient;
                    return (
                      <Table.Tr key={info.id}>
                        <Table.Td>{ingredient ? ingredient.name : 'Unknown'}</Table.Td>
                        <Table.Td>{info.calories || 0}</Table.Td>
                        <Table.Td>{info.protein || 0}</Table.Td>
                        <Table.Td>{info.fat || 0}</Table.Td>
                        <Table.Td>{info.carbohydrates || 0}</Table.Td>
                        <Table.Td>{info.fiber || 0}</Table.Td>
                        <Table.Td>{info.sugar || 0}</Table.Td>
                        <Table.Td>{info.sodium || 0}</Table.Td>
                        <Table.Td>{info.cholesterol || 0}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </>
        )}
      </Paper>
       {/* Scroll to Top Button */}
            <Affix position={{ bottom: 20, right: 20 }}>
              <Transition transition="slide-up" mounted={scroll.y > 0}>
                {(transitionStyles) => (
                  <Button
                    style={transitionStyles}
                    onClick={() => scrollTo({ y: 0 })}
                    aria-label="Scroll to top"
                  >
                    Scroll to top
                  </Button>
                )}
              </Transition>
            </Affix>
    </Container>
  );
}
