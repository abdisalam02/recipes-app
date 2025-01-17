"use client";

import { useState } from "react";
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
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChefHat, IconPlus, IconMinus } from "@tabler/icons-react";

//
// 1. We define the Category, Ingredient, Step, FormData, and JsonData interfaces
//
const categories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Snack",
  "Beverage",
  "Appetizer",
].map((category) => ({ value: category.toLowerCase(), label: category }));

interface Ingredient {
  quantity: number;
  unit: string;
  name: string;
}

interface Step {
  order?: number;
  description: string;
}

interface FormData {
  title: string;
  category: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  image?: string; // Optional
  portion: number;
}

interface JsonData {
  title: string;
  category: string;
  description: string;
  image?: string;
  portion: number;
  ingredients: Array<{ quantity: number; unit: string; name: string }>;
  steps: Array<{ order?: number; description: string }>;
}

//
// 2. The AddRecipePage component
//
export default function AddRecipePage() {
  const [activeTab, setActiveTab] = useState<string>("form");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    description: "",
    ingredients: [{ quantity: 1, unit: "units", name: "Unknown Ingredient" }],
    steps: [{ description: "" }],
    image: "",
    portion: 1,
  });
  const [jsonData, setJsonData] = useState<string>("");
  const [loading, setLoading] = useState(false);

  //
  // 3. Utility Handlers for Ingredients
  //
  const handleAddIngredient = () => {
    // Append a new default ingredient to the array
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { quantity: 1, unit: "units", name: "" }],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    // Remove ingredient at index
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: number | string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.ingredients];
      // Ingredient at index => update field
      if (typeof value === "number" && field === "quantity") {
        updated[index].quantity = value;
      } else if (typeof value === "string") {
        // unit or name
        (updated[index] as any)[field] = value;
      }
      return { ...prev, ingredients: updated };
    });
  };

  //
  // 4. Utility Handlers for Steps
  //
  const handleAddStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { description: "" }],
    }));
  };

  const handleRemoveStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleStepChange = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.steps];
      updated[index].description = value;
      return { ...prev, steps: updated };
    });
  };

  //
  // 5. Basic Form Validation Check
  //
  const isFormValid = () => {
    if (
      !formData.title ||
      !formData.category ||
      !formData.description ||
      formData.ingredients.some(
        (ing) => ing.quantity <= 0 || !ing.unit.trim() || !ing.name.trim()
      ) ||
      formData.steps.some((step) => !step.description.trim())
    ) {
      return false;
    }
    return true;
  };

  //
  // 6. Fetch Default Image Using Recipe Title
  //
  const fetchDefaultImage = async () => {
    if (!formData.title.trim()) {
      notifications.show({
        title: "Error",
        message: "Please provide a recipe title before fetching an image.",
        color: "red",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/fetch-default-image?query=${encodeURIComponent(formData.title)}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch default image");
      }
      const data = await res.json();
      setFormData({ ...formData, image: data.imageUrl });
      notifications.show({
        title: "Image Fetched",
        message: "A default image has been fetched via Google!",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to fetch default image.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  //
  // 7. Submitting with Manual Form
  //
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        portion: formData.portion,
        ingredients: formData.ingredients,
        steps: formData.steps,
        image: formData.image || undefined,
      };

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Recipe added successfully!",
          color: "green",
        });
        // Reset form
        setFormData({
          title: "",
          category: "",
          description: "",
          ingredients: [
            { quantity: 1, unit: "units", name: "Unknown Ingredient" },
          ],
          steps: [{ description: "" }],
          image: "",
          portion: 1,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add recipe");
      }
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to add recipe. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  //
  // 8. Submitting with JSON
  //
  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedData: JsonData = JSON.parse(jsonData);

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });
      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Recipe added successfully via JSON!",
          color: "green",
        });
        setJsonData("");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add recipe via JSON");
      }
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message:
          error.message ||
          "Failed to add recipe via JSON. Please check the format.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  //
  // 9. Rendering the Component
  //
  return (
    <Container size="sm" py="xl">
      <Paper withBorder shadow="md" p={30} radius="md" className="relative">
        <LoadingOverlay
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
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
          onChange={(value: string | null) => setActiveTab(value ?? "form")}
        >
          <Tabs.List grow>
            <Tabs.Tab value="form">Form Input</Tabs.Tab>
            <Tabs.Tab value="json">JSON Input</Tabs.Tab>
          </Tabs.List>

          {/* Form Input Panel */}
          <Tabs.Panel value="form" pt="md">
            <form onSubmit={handleFormSubmit}>
              <Stack gap="md">
                {/* Title Field */}
                <TextInput
                  label="Recipe Title"
                  required
                  value={formData.title}
                  onChange={(e) =>
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
                  onChange={(value) =>
                    setFormData({ ...formData, category: value || "" })
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  radius="xl"
                  size="md"
                />

                {/* Image Field */}
                <TextInput
                  label="Image URL (optional)"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  radius="xl"
                  size="md"
                />

                {/* Fetch Default Image Button */}
                <Button
                  variant="outline"
                  color="blue"
                  onClick={fetchDefaultImage}
                  radius="xl"
                  size="md"
                >
                  Fetch Default Image (Google)
                </Button>

                {/* Portions Field */}
                <Group align="center">
                  <Text size="sm">Portions:</Text>
                  <NumberInput
  label="Portions"
  min={1}
  required
  value={formData.portion}
  onChange={(value: string | number) => {
    if (typeof value === "number") {
      setFormData({ ...formData, portion: value });
    } else {
      // Handle cases where value is a string (e.g., empty input)
      setFormData({ ...formData, portion: 1 });
    }
  }}
  radius="xl"
  size="md"
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
  onChange={(value: string | number) => {
    if (typeof value === "number") {
      handleIngredientChange(index, "quantity", value);
    } else {
      // Handle cases where value is a string (e.g., empty input)
      handleIngredientChange(index, "quantity", 0);
    }
  }}
  radius="xl"
  size="md"
/>

                      <TextInput
                        label="Unit"
                        value={ing.unit}
                        required
                        onChange={(e) =>
                          handleIngredientChange(index, "unit", e.target.value)
                        }
                        radius="xl"
                        size="md"
                      />
                      <TextInput
                        label="Ingredient"
                        value={ing.name}
                        required
                        onChange={(e) =>
                          handleIngredientChange(index, "name", e.target.value)
                        }
                        radius="xl"
                        size="md"
                      />
                      {formData.ingredients.length > 1 && (
                        <ActionIcon
                          color="red"
                          onClick={() => handleRemoveIngredient(index)}
                          radius="xl"
                          size="lg"
                          variant="filled"
                          aria-label="Remove Ingredient"
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
                      />
                      <Textarea
                        label="Description"
                        minRows={2}
                        required
                        value={step.description}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        radius="xl"
                        size="md"
                      />
                      {formData.steps.length > 1 && (
                        <ActionIcon
                          color="red"
                          onClick={() => handleRemoveStep(index)}
                          radius="xl"
                          size="lg"
                          variant="filled"
                          aria-label="Remove Step"
                        >
                          <IconMinus size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  ))}
                </Stack>

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  disabled={!isFormValid()}
                  radius="xl"
                  color="blue"
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
                  onChange={(e) => setJsonData(e.target.value)}
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
      </Paper>
    </Container>
  );
}
