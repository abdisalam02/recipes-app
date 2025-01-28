// src/app/api/fetch-default-image/route.ts
// Ensure this file is correctly placed and implemented as per your project structure.

'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import {
  Container,
  Title,
  TextInput,
  Textarea,
  Button,
  Paper,
  Select,
  Stack,
  Text,
  LoadingOverlay,
  Tabs,
  Code,
  NumberInput,
  Group,
  ActionIcon,
  Modal,
  Autocomplete,
  Checkbox,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconChefHat, IconPlus, IconMinus, IconTrash } from '@tabler/icons-react';
import debounce from 'lodash.debounce';
import supabase from '../../../../lib/supabaseClient'; // Correctly importing Supabase
import { NutritionalInfo, RecipeInput } from '../../../../lib/types'; // Ensure correct import
import { units } from '../../../../lib/units'; // Import standardized units

// Define the Category and Region options
const categories = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Snack',
  'Beverage',
  'Appetizer',
].map((category) => ({ value: category.toLowerCase(), label: category }));

const regions = [
  'Italian',
  'American',
  'Mexican',
  'Mediterranean',
  'Asian',
  'French',
  'Indian',
].map((region) => ({ value: region.toLowerCase(), label: region }));

// Define interfaces
interface Ingredient {
  ingredient_id?: number; // Optional, present if selected from existing ingredients
  quantity: number;
  unit: string;
  name: string; // Always required
}

interface Step {
  order?: number;
  description: string;
}

// Ensure the 'image' field is required by removing the '?'
interface FormData {
  title: string;
  category: string;
  region: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  image: string; // Made required
  portion: number;
}


interface JsonData {
  title: string;
  category: string;
  region: string; // Add region field
  description: string;
  image?: string;
  portion: number;
  ingredients: Array<{ quantity: number; unit: string; name: string }>;
  steps: Array<{ order?: number; description: string }>;
}

interface RecipeInputFrontend {
  title: string;
  category: string;
  region: string; // Add region field
  description: string;
  image?: string;
  portion: number;
  ingredients: Ingredient[];
  steps: Step[];
}

export default function AddRecipePage() {
  // Initialize State Variables
  const [activeTab, setActiveTab] = useState<string>('form');
  const [modalOpened, setModalOpened] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<{ value: number; label: string }[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '',
    region: '',
    description: '',
    ingredients: [{ quantity: 1, unit: 'g', name: '' }], // Start with default unit as grams
    steps: [{ description: '' }],
    image: '', // Initialized as an empty string
    portion: 1,
  });
  
  const [jsonData, setJsonData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null); // State to hold nutritional info
  const [autoFetchImage, setAutoFetchImage] = useState<boolean>(true); // Toggle for auto-fetching image

  // Fetch ingredients on component mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        console.log('Fetching ingredients from /api/ingredients');
        const res = await fetch('/api/ingredients'); // Corrected endpoint
        console.log('Response status:', res.status);
        if (!res.ok) {
          const errorData = await res.json();
          console.error('Failed to fetch ingredients:', errorData);
          throw new Error('Failed to fetch ingredients.');
        }
        const data = await res.json();
        console.log('Fetched ingredients:', data);
        const formattedIngredients = data.map((ing: any) => ({
          value: ing.id,
          label: ing.name,
        }));
        setAvailableIngredients(formattedIngredients);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load ingredients.',
          color: 'red',
        });
      }
    };

    fetchIngredients();
  }, []);

  // Debounced function to fetch default image
  const debouncedFetchDefaultImage = debounce(() => {
    if (autoFetchImage && !formData.image.trim()) {
      fetchDefaultImage();
    }
  }, 500); // 500 milliseconds debounce
  

  // Update useEffect to use the debounced function
  useEffect(() => {
    debouncedFetchDefaultImage();

    // Cleanup the debounce on unmount
    return () => {
      debouncedFetchDefaultImage.cancel();
    };
  }, [formData.title, autoFetchImage]);

  // Utility Handlers for Ingredients
  const handleAddIngredient = (): void => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { quantity: 1, unit: 'g', name: '' }], // Start with default unit as grams
    }));
  };

  const handleRemoveIngredient = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: number | string | undefined
  ): void => {
    console.log(`Changing ingredient at index ${index}: setting ${field} to ${value}`);
    setFormData((prev) => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value,
      };
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  // Utility Handlers for Steps
  const handleAddStep = (): void => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { description: '' }],
    }));
  };

  const handleRemoveStep = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleStepChange = (index: number, value: string): void => {
    setFormData((prev) => {
      const updatedSteps = [...prev.steps];
      updatedSteps[index] = { ...updatedSteps[index], description: value };
      return { ...prev, steps: updatedSteps };
    });
  };

  // Basic Form Validation Check
  const isFormValid = (): boolean => {
    if (
      !formData.title.trim() ||
      !formData.category.trim() ||
      !formData.region.trim() ||
      !formData.description.trim() ||
      formData.portion < 1 ||
      formData.ingredients.some(
        (ing) => ing.quantity <= 0 || !ing.unit.trim() || !ing.name.trim() // Ensure name is present
      ) ||
      formData.steps.some((step) => !step.description.trim())
    ) {
      return false;
    }
    return true;
  };

  // Fetch Default Image Using Recipe Title
  const fetchDefaultImage = async (): Promise<void> => {
    if (!formData.title.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please provide a recipe title before fetching an image.',
        color: 'red',
      });
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching default image for query: ${formData.title}`);
      const res = await fetch(
        `/api/fetch-default-image?query=${encodeURIComponent(formData.title)}`
      );
      console.log('Image fetch response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to fetch default image:', errorData);
        throw new Error(errorData.error || 'Failed to fetch default image');
      }
      const data = await res.json();
      console.log('Fetched image URL:', data.imageUrl);
      setFormData((prev) => ({ ...prev, image: data.imageUrl }));
      notifications.show({
        title: 'Image Fetched',
        message: 'A default image has been fetched via Google!',
        color: 'green',
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to fetch default image.',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: 'An unknown error occurred.',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Submitting with Manual Form
  const handleFormSubmit = async (): Promise<void> => {
    if (!isFormValid()) {
      notifications.show({
        title: 'Invalid Form',
        message: 'Please fill out all required fields correctly.',
        color: 'red',
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare payload
      const payload: RecipeInputFrontend = {
        title: formData.title.trim(),
        category: formData.category.trim(),
        region: formData.region.trim(),
        description: formData.description.trim(),
        portion: formData.portion,
        ingredients: formData.ingredients.map((ing) => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit.trim(),
          name: ing.name.trim(),
        })),
        steps: formData.steps.map((step, index) => ({
          order: index + 1,
          description: step.description.trim(),
        })),
        image: formData.image?.trim() || undefined,
      };

      console.log('Submitting recipe payload:', payload);

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('POST /api/recipes response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        const recipeId = responseData.recipe.id;
        console.log('Recipe added with ID:', recipeId);

        // Fetch the complete recipe details including nutritional_info
        console.log(`Fetching recipe details for ID: ${recipeId}`);
        const recipeResponse = await fetch(`/api/recipes/${recipeId}`);
        console.log('GET /api/recipes/[id] response status:', recipeResponse.status);
        if (!recipeResponse.ok) {
          const errorData = await recipeResponse.json();
          console.error('Failed to fetch recipe details:', errorData);
          throw new Error('Failed to fetch recipe details.');
        }
        const recipeDetails = await recipeResponse.json();
        console.log('Fetched recipe details:', recipeDetails);

        // Set the nutritional info state
        setNutritionalInfo(recipeDetails.nutritional_info || null);

        notifications.show({
          title: 'Success',
          message: 'Recipe added successfully!',
          color: 'green',
        });
        // Reset form
        setFormData({
          title: '',
          category: '',
          region: '',
          description: '',
          ingredients: [{ quantity: 1, unit: 'g', name: '' }], // Reset to default unit
          steps: [{ description: '' }],
          image: '',
          portion: 1,
        });
        setAutoFetchImage(true); // Re-enable auto-fetching
      } else {
        const errorData = await response.json();
        console.error('Failed to add recipe:', errorData);
        throw new Error(errorData.error || 'Failed to add recipe');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to add recipe. Please try again.',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: 'An unknown error occurred.',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Submitting with JSON
  const handleJsonSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!jsonData.trim()) {
      notifications.show({
        title: 'Invalid JSON',
        message: 'Please provide valid JSON data.',
        color: 'red',
      });
      return;
    }

    setLoading(true);

    try {
      const parsedData: JsonData = JSON.parse(jsonData);
      console.log('Parsed JSON data:', parsedData);

      // Basic validation for parsed JSON
      if (
        !parsedData.title?.trim() ||
        !parsedData.category?.trim() ||
        !parsedData.region?.trim() ||
        !parsedData.description?.trim() ||
        parsedData.portion < 1 ||
        !Array.isArray(parsedData.ingredients) ||
        !Array.isArray(parsedData.steps)
      ) {
        throw new Error('JSON data is missing required fields or has invalid formats.');
      }

      // Fetch all ingredients to map names to IDs
      console.log('Fetching ingredients for JSON mapping...');
      const res = await fetch('/api/ingredients'); // Corrected endpoint
      console.log('GET /api/ingredients response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to fetch ingredients for mapping:', errorData);
        throw new Error('Failed to fetch ingredients for mapping.');
      }
      const ingredientsData = await res.json();
      console.log('Fetched ingredients for mapping:', ingredientsData);

      // Create a map of ingredient names to IDs (case-insensitive)
      const ingredientMap: { [key: string]: number } = {};
      ingredientsData.forEach((ing: any) => {
        ingredientMap[ing.name.toLowerCase()] = ing.id;
      });
      console.log('Ingredient map:', ingredientMap);

      // Map JSON ingredients to include `ingredient_id` and `name`
      const mappedIngredients: Ingredient[] = await Promise.all(
        parsedData.ingredients.map(async (ing) => {
          const ingredientName = ing.name.trim();
          const ingredient_id = ingredientMap[ingredientName.toLowerCase()];

          if (ingredient_id) {
            return {
              ingredient_id,
              quantity: ing.quantity,
              unit: ing.unit.trim(),
              name: ingredientName,
            };
          } else {
            // Ingredient not found, attempt to create it
            console.log(`Ingredient "${ingredientName}" not found. Creating new ingredient.`);
            const { data: newIngredient, error: createError } = await supabase
              .from('ingredients')
              .insert({ name: ingredientName })
              .select('id')
              .single();

            if (createError) {
              console.error(`Failed to add ingredient "${ingredientName}":`, createError);
              notifications.show({
                title: 'Error',
                message: `Failed to add ingredient "${ingredientName}".`,
                color: 'red',
              });
              throw new Error(`Failed to add ingredient "${ingredientName}".`);
            }

            console.log(`Created new ingredient "${ingredientName}" with ID:`, newIngredient.id);

            return {
              ingredient_id: newIngredient.id,
              quantity: ing.quantity,
              unit: ing.unit.trim(),
              name: ingredientName,
            };
          }
        })
      );

      console.log('Mapped ingredients:', mappedIngredients);

      // Prepare the payload
      const payload: RecipeInputFrontend = {
        title: parsedData.title.trim(),
        category: parsedData.category.trim(),
        region: parsedData.region.trim(),
        description: parsedData.description.trim(),
        portion: parsedData.portion,
        image: parsedData.image?.trim() || undefined,
        ingredients: mappedIngredients,
        steps: parsedData.steps.map((step, index) => ({
          order: step.order || index + 1,
          description: step.description.trim(),
        })),
      };

      console.log('Submitting recipe via JSON payload:', payload);

      // Submit the payload
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('POST /api/recipes (JSON) response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        const recipeId = responseData.recipe.id;
        console.log('Recipe added via JSON with ID:', recipeId);

        // If image is missing, fetch and update it
        if (!payload.image) {
          console.log('Image is missing. Fetching default image.');
          await updateRecipeImage(recipeId, payload.title); // Fetch and update image based on title
        }

        // Fetch the complete recipe details including nutritional_info
        console.log(`Fetching recipe details for ID: ${recipeId}`);
        const recipeResponse = await fetch(`/api/recipes/${recipeId}`);
        console.log('GET /api/recipes/[id] response status:', recipeResponse.status);
        if (!recipeResponse.ok) {
          const errorData = await recipeResponse.json();
          console.error('Failed to fetch recipe details:', errorData);
          throw new Error('Failed to fetch recipe details.');
        }
        const recipeDetails = await recipeResponse.json();
        console.log('Fetched recipe details:', recipeDetails);

        // Set the nutritional info state
        setNutritionalInfo(recipeDetails.nutritional_info || null);

        notifications.show({
          title: 'Success',
          message: 'Recipe added successfully via JSON!',
          color: 'green',
        });
        setJsonData('');
      } else {
        const errorData = await response.json();
        console.error('Failed to add recipe via JSON:', errorData);
        throw new Error(errorData.error || 'Failed to add recipe via JSON');
      }
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        notifications.show({
          title: 'JSON Syntax Error',
          message: 'Please ensure the JSON is correctly formatted.',
          color: 'red',
        });
      } else if (error instanceof Error) {
        notifications.show({
          title: 'Error',
          message:
            error.message ||
            'Failed to add recipe via JSON. Please check the format.',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: 'An unknown error occurred.',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch and update recipe image based on title
  const updateRecipeImage = async (recipeId: number, title: string): Promise<void> => {
    try {
      console.log(`Fetching default image for recipe ID: ${recipeId} with title: ${title}`);
      const res = await fetch(`/api/fetch-default-image?query=${encodeURIComponent(title)}`);
      console.log('Image fetch response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to fetch default image:', errorData);
        throw new Error(errorData.error || 'Failed to fetch default image');
      }
      const data = await res.json();
      console.log('Fetched image URL:', data.imageUrl);

      // Update the recipe with the fetched image
      await updateRecipeImageAPI(recipeId, data.imageUrl);
    } catch (error: any) {
      console.error('Error updating recipe image:', error.message);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to fetch and update recipe image.',
        color: 'red',
      });
      // Decide whether to throw the error or not based on your application flow
    }
  };

  // Helper function to call the update image API
  const updateRecipeImageAPI = async (recipeId: number, imageUrl: string): Promise<void> => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/update-image`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to update recipe image:', errorData);
        throw new Error(errorData.error || 'Failed to update recipe image.');
      }

      const updatedRecipe = await res.json();
      console.log('Recipe image updated:', updatedRecipe);
    } catch (error: any) {
      console.error('Error in updateRecipeImageAPI:', error.message);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update recipe image.',
        color: 'red',
      });
      throw error; // Re-throw to handle upstream if needed
    }
  };

  return (
    <Container size="sm" py="xl">
      <Paper withBorder shadow="md" p={30} radius="md" className="relative">
        <LoadingOverlay
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
        <Stack align="center" mb="md" gap="md">
          <IconChefHat size={48} stroke={1.5} />
          <Title order={2}>Add New Recipe</Title>
          <Text color="dimmed" size="sm">
            Share your culinary masterpiece with the world
          </Text>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(value: string | null) => setActiveTab(value || 'form')}
          variant="outline"
          color="blue"
        >
          <Tabs.List grow>
            <Tabs.Tab value="form">Form Input</Tabs.Tab>
            <Tabs.Tab value="json">JSON Input</Tabs.Tab>
          </Tabs.List>

          {/* Form Input Panel */}
          <Tabs.Panel value="form" pt="md">
            <form onSubmit={(e) => { e.preventDefault(); setModalOpened(true); }}>
              <Stack gap="md">
                {/* Title Field */}
                <TextInput
                  label="Recipe Title"
                  required
                  value={formData.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  radius="xl"
                  size="md"
                />

                {/* Category Field */}
                <Select
                  label="Category"
                  data={categories}
                  required
                  value={formData.category}
                  onChange={(value: string | null) =>
                    setFormData({ ...formData, category: value || '' })
                  }
                  radius="xl"
                  size="md"
                />
                {/* Region Field */}
                <Select
                  label="Region"
                  data={regions}
                  required
                  value={formData.region}
                  onChange={(value: string | null) =>
                    setFormData({ ...formData, region: value || '' })
                  }
                  radius="xl"
                  size="md"
                />

                {/* Description Field */}
                <Textarea
                  label="Description"
                  required
                  minRows={3}
                  value={formData.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  radius="xl"
                  size="md"
                />

                {/* Image Field */}
                <Group grow align="flex-end">
                  <TextInput
                    label="Image URL (optional)"
                    value={formData.image}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    radius="xl"
                    size="md"
                    aria-label="Image URL"
                  />
                  {/* Clear Image Button */}
                  {formData.image && (
                    <ActionIcon
                      color="red"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      radius="xl"
                      size="lg"
                      variant="filled"
                      aria-label="Clear Image URL"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>

                {/* Checkbox to Toggle Auto Fetch Image */}
                <Checkbox
                  label="Automatically fetch default image if none provided"
                  checked={autoFetchImage}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setAutoFetchImage(e.currentTarget.checked)
                  }
                  mb="sm"
                  aria-label="Toggle Automatic Image Fetching"
                />

                {/* Portions Field */}
                <Group align="center">
                  <Text size="sm">Portions:</Text>
                  <NumberInput
                    label="Portions"
                    min={1}
                    required
                    value={formData.portion}
                    onChange={(value: number | string) => {
                      const numberValue =
                        typeof value === 'number' && value >= 1 ? value : 1;
                      setFormData({
                        ...formData,
                        portion: numberValue,
                      });
                    }}
                    radius="xl"
                    size="md"
                    aria-label="Portions"
                  />
                </Group>

                {/* Ingredients Section */}
                <Stack gap="sm">
                  <Group align="flex-end">
                    <Text size="sm">Ingredients</Text>
                    <ActionIcon
                      color="green"
                      onClick={handleAddIngredient}
                      radius="xl"
                      size="lg"
                      variant="filled"
                      aria-label="Add Ingredient"
                    >
                      <IconPlus size={16} />
                    </ActionIcon>
                  </Group>

                  {formData.ingredients.map((ing, index) => (
                    <Group key={index} grow>
                      <NumberInput
                        label="Quantity"
                        value={ing.quantity}
                        min={0.1}
                        step={0.1}
                        required
                        onChange={(value: number | string) => {
                          const quantity = typeof value === 'number' ? value : 0;
                          handleIngredientChange(index, 'quantity', quantity);
                        }}
                        radius="xl"
                        size="md"
                        aria-label={`Ingredient ${index + 1} Quantity`}
                      />

                      <Select
                        label="Unit"
                        data={units.map((unit) => ({ label: unit.label, value: unit.value }))}
                        required
                        value={ing.unit}
                        onChange={(value: string | null) =>
                          handleIngredientChange(index, 'unit', value || '')
                        }
                        radius="xl"
                        size="md"
                        aria-label={`Ingredient ${index + 1} Unit`}
                      />

                      <Autocomplete
                        label="Ingredient"
                        placeholder="Type or select ingredient"
                        data={availableIngredients.map((ing) => ing.label)}
                        value={
                          ing.ingredient_id
                            ? availableIngredients.find((item) => item.value === ing.ingredient_id)?.label || ing.name
                            : ing.name
                        }
                        onChange={(value: string) => {
                          const selectedIngredient = availableIngredients.find(
                            (item) => item.label.toLowerCase() === value.toLowerCase()
                          );
                          if (selectedIngredient) {
                            console.log(
                              `Selected existing ingredient: ${selectedIngredient.label} (ID: ${selectedIngredient.value})`
                            );
                            handleIngredientChange(index, 'ingredient_id', selectedIngredient.value);
                            handleIngredientChange(index, 'name', selectedIngredient.label);
                          } else {
                            console.log(`Typed new ingredient: ${value}`);
                            handleIngredientChange(index, 'ingredient_id', undefined);
                            handleIngredientChange(index, 'name', value);
                          }
                        }}
                        radius="xl"
                        size="md"
                        aria-label={`Ingredient ${index + 1} Name`}
                      />

                      {formData.ingredients.length > 1 && (
                        <ActionIcon
                          color="red"
                          onClick={() => handleRemoveIngredient(index)}
                          radius="xl"
                          size="lg"
                          variant="filled"
                          aria-label={`Remove Ingredient ${index + 1}`}
                        >
                          <IconMinus size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  ))}
                </Stack>

                {/* Steps Section */}
                <Stack gap="sm">
                  <Group align="flex-end">
                    <Text size="sm">Steps</Text>
                    <ActionIcon
                      color="green"
                      onClick={handleAddStep}
                      radius="xl"
                      size="lg"
                      variant="filled"
                      aria-label="Add Step"
                    >
                      <IconPlus size={16} />
                    </ActionIcon>
                  </Group>

                  {formData.steps.map((step, index) => (
                    <Group key={index} grow align="flex-end">
                      <NumberInput
                        label="Order"
                        value={step.order || index + 1}
                        readOnly
                        radius="xl"
                        size="md"
                        aria-label={`Step ${index + 1} Order`}
                      />

                      <Textarea
                        label="Description"
                        minRows={2}
                        required
                        value={step.description}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          handleStepChange(index, e.target.value)
                        }
                        radius="xl"
                        size="md"
                        aria-label={`Step ${index + 1} Description`}
                      />

                      {formData.steps.length > 1 && (
                        <ActionIcon
                          color="red"
                          onClick={() => handleRemoveStep(index)}
                          radius="xl"
                          size="lg"
                          variant="filled"
                          aria-label={`Remove Step ${index + 1}`}
                        >
                          <IconMinus size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  ))}
                </Stack>

                {/* Submit Button */}
                <Button
                  type="button" // Open modal to confirm submission
                  fullWidth
                  size="md"
                  disabled={!isFormValid()}
                  radius="xl"
                  color="blue"
                  onClick={() => setModalOpened(true)} // Open the modal for confirmation
                >
                  Add Recipe
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          {/* JSON Panel */}
          <Tabs.Panel value="json" pt="md">
            <form onSubmit={handleJsonSubmit}>
              <Stack gap="md">
                <Textarea
                  name="jsonData"
                  label="Recipe JSON"
                  placeholder={`{
    "title": "Chocolate Cake",
    "category": "dessert",
    "region": "italian",
    "description": "A rich and moist chocolate cake.",
    "image": "https://example.com/chocolate-cake.jpg",
    "portion": 8,
    "ingredients": [
      { "quantity": 2, "unit": "cups", "name": "flour" },
      { "quantity": 1.5, "unit": "cups", "name": "sugar" }
    ],
    "steps": [
      { "order": 1, "description": "Preheat oven to 350°F (175°C)." },
      { "order": 2, "description": "Mix all dry ingredients." }
    ]
  }`}
                  minRows={10}
                  required
                  value={jsonData}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setJsonData(e.target.value)
                  }
                  radius="xl"
                  size="md"
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  disabled={!jsonData.trim()}
                  radius="xl"
                  color="blue"
                >
                  Add Recipe via JSON
                </Button>

                <Code block>
{`{
  "title": "Chocolate Cake",
  "category": "dessert",
  "region": "italian",
  "description": "A rich and moist chocolate cake.",
  "image": "https://example.com/chocolate-cake.jpg",
  "portion": 8,
  "ingredients": [
    { "quantity": 2, "unit": "cups", "name": "flour" },
    { "quantity": 1.5, "unit": "cups", "name": "sugar" }
  ],
  "steps": [
    { "order": 1, "description": "Preheat oven to 350°F (175°C)." },
    { "order": 2, "description": "Mix all dry ingredients." }
  ]
}`}
                </Code>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>

        {/* Confirmation Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Confirm Submission"
          centered
          aria-labelledby="confirmation-modal"
        >
          <Text>Are you sure you want to submit this recipe?</Text>
          <Group mt="md">
            <Button color="red" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button
              color="green"
              onClick={async () => {
                if (activeTab === 'form') {
                  await handleFormSubmit(); // Submit via form
                } else if (activeTab === 'json') {
                  // Manually trigger form submission for JSON
                  const jsonForm = document.querySelector('form[onSubmit*="handleJsonSubmit"]') as HTMLFormElement;
                  if (jsonForm) {
                    jsonForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }
                }
                setModalOpened(false); // Close the modal after submission
              }}
            >
              Yes, Submit
            </Button>
          </Group>
        </Modal>

       {/* Nutritional Information Display */}
{nutritionalInfo && (
  <Paper withBorder shadow="sm" p="md" radius="md" mt="xl">
    <Title order={3}>Total Nutritional Information (Per Portion)</Title>
    <Group gap="xs" mt="sm">
      <Text>Calories: {nutritionalInfo.calories.toFixed(2)} kcal</Text>
      <Text>Protein: {nutritionalInfo.protein.toFixed(2)} g</Text>
      <Text>Fat: {nutritionalInfo.fat.toFixed(2)} g</Text>
      <Text>Carbohydrates: {nutritionalInfo.carbohydrates.toFixed(2)} g</Text>
      <Text>Fiber: {nutritionalInfo.fiber.toFixed(2)} g</Text>
      <Text>Sugar: {nutritionalInfo.sugar.toFixed(2)} g</Text>
      <Text>Sodium: {nutritionalInfo.sodium.toFixed(2)} mg</Text>
      <Text>Cholesterol: {nutritionalInfo.cholesterol.toFixed(2)} mg</Text>
    </Group>
  </Paper>
)}

      </Paper>
    </Container>
  );
}
