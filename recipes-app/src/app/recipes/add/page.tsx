// app/recipes/add/page.tsx

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
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChefHat, IconPlus, IconMinus } from "@tabler/icons-react";

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
  portion: number; // New field
}

interface JsonData {
  title: string;
  category: string;
  description: string;
  image?: string;
  portion: number; // New field
  ingredients: Array<{ quantity: number; unit: string; name: string }>;
  steps: Array<{ order?: number; description: string }>;
}

export default function AddRecipePage() {
  const [activeTab, setActiveTab] = useState<string>("form");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    description: "",
    ingredients: [{ quantity: 1, unit: "units", name: "Unknown Ingredient" }], // Valid defaults
    steps: [{ description: "" }],
    image: "",
    portion: 1,
  });
  const [jsonData, setJsonData] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Handlers for dynamic ingredients and steps
  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { quantity: 1, unit: "units", name: "" }],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    console.log(`Updating ingredient ${index} - ${field}:`, value);
    const updatedIngredients = formData.ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    );
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { description: "" }],
    });
  };

  const handleRemoveStep = (index: number) => {
    const updatedSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: updatedSteps });
  };

  const handleStepChange = (index: number, value: string) => {
    const updatedSteps = formData.steps.map((step, i) =>
      i === index ? { ...step, description: value } : step
    );
    setFormData({ ...formData, steps: updatedSteps });
  };

  // Helper function to check form validity
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Form Data Before Validation:", formData);

      // Validate ingredients
      for (const [index, ing] of formData.ingredients.entries()) {
        if (ing.quantity <= 0) {
          throw new Error(`Ingredient ${index + 1}: Quantity must be greater than zero.`);
        }
        if (!ing.unit.trim()) {
          throw new Error(`Ingredient ${index + 1}: Unit is required.`);
        }
        if (!ing.name.trim()) {
          throw new Error(`Ingredient ${index + 1}: Name is required.`);
        }
      }

      // Validate steps
      for (const [index, step] of formData.steps.entries()) {
        if (!step.description.trim()) {
          throw new Error(`Step ${index + 1}: Description is required.`);
        }
      }

      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        portion: formData.portion,
        ingredients: formData.ingredients,
        steps: formData.steps,
        image: formData.image || undefined,
      };

      console.log("Sending data:", payload); // Debugging

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
          ingredients: [{ quantity: 1, unit: "units", name: "Unknown Ingredient" }],
          steps: [{ description: "" }],
          image: "",
          portion: 1,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add recipe");
      }
    } catch (error: any) {
      console.error("Error adding recipe:", error);
      notifications.show({
        title: "Error",
        message: error.message || "Failed to add recipe. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedData: JsonData = JSON.parse(jsonData);

      // Basic validation
      const { title, category, description, ingredients, steps, image, portion } = parsedData;
      if (
        !title ||
        !category ||
        !description ||
        !ingredients ||
        !steps ||
        !Array.isArray(ingredients) ||
        !Array.isArray(steps)
      ) {
        throw new Error("Invalid JSON format. Please check your data.");
      }

      // Assign order to steps if not present
      const formattedSteps = steps.map((step, index) => ({
        order: step.order || index + 1,
        description: step.description,
      }));

      // Validate ingredients
      for (const ing of ingredients) {
        if (ing.quantity <= 0 || !ing.unit.trim() || !ing.name.trim()) {
          throw new Error("Please provide valid ingredient details in JSON.");
        }
      }

      // Validate steps
      for (const step of formattedSteps) {
        if (!step.description.trim()) {
          throw new Error("Please provide descriptions for all steps in JSON.");
        }
      }

      const payload = {
        title,
        category,
        description,
        portion: portion || 1,
        ingredients,
        steps: formattedSteps,
        image: image || undefined,
      };

      console.log("Sending JSON data:", payload); // Debugging

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      console.error("Error adding recipe via JSON:", error);
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

  const fetchDefaultImage = async () => {
    try {
      const res = await fetch(`/api/fetch-default-image?category=${encodeURIComponent(formData.category)}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch default image");
      }
      const data = await res.json();
      setFormData({ ...formData, image: data.imageUrl });
      notifications.show({
        title: "Image Fetched",
        message: "A default image has been fetched for your recipe.",
        color: "green",
      });
    } catch (error: any) {
      console.error("Error fetching default image:", error);
      notifications.show({
        title: "Error",
        message: error.message || "Failed to fetch default image.",
        color: "red",
      });
    }
  };

  return (
    <Container size="sm" py="xl">
      <Paper withBorder shadow="md" p={30} radius="md" className="relative">
        <LoadingOverlay
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
        />

        <Stack align="center" mb="md">
          <IconChefHat size={48} stroke={1.5} />
          <Title order={2}>Add New Recipe</Title>
          <Text color="dimmed" size="sm">
            Share your culinary masterpiece with the world
          </Text>
        </Stack>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab value="form">Form Input</Tabs.Tab>
            <Tabs.Tab value="json">JSON Input</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="form" pt="md">
            <form onSubmit={handleFormSubmit}>
              <Stack gap="md">
                <TextInput
                  name="title"
                  label="Recipe Title"
                  placeholder="Enter recipe title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />

                <Select
                  name="category"
                  label="Category"
                  placeholder="Select a category"
                  data={categories}
                  required
                  value={formData.category}
                  onChange={(value) =>
                    setFormData({ ...formData, category: value || "" })
                  }
                />

                <Textarea
                  name="description"
                  label="Description"
                  placeholder="Describe your recipe"
                  minRows={3}
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />

                <TextInput
                  name="image"
                  label="Image URL (optional)"
                  placeholder="Enter image URL"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                />

                <Button variant="outline" color="blue" onClick={fetchDefaultImage}>
                  Fetch Default Image
                </Button>

                <NumberInput
                  name="portion"
                  label="Portions"
                  placeholder="Enter number of portions"
                  min={1}
                  required
                  value={formData.portion}
                  onChange={(value) =>
                    setFormData({ ...formData, portion: value || 1 })
                  }
                />

                {/* Ingredients Section */}
                <Stack spacing="sm">
                  <Group position="apart" align="flex-end">
                    <Text size="sm" weight={500}>
                      Ingredients
                    </Text>
                    <ActionIcon color="green" onClick={handleAddIngredient}>
                      <IconPlus size={16} />
                    </ActionIcon>
                  </Group>
                  {formData.ingredients.map((ing, index) => (
                    <Group key={index} grow>
                      <NumberInput
                        label="Quantity"
                        placeholder="e.g., 2"
                        value={ing.quantity}
                        onChange={(value) =>
                          handleIngredientChange(index, "quantity", value || 0)
                        }
                        min={0.1} // Prevent zero or negative values
                        step={0.1}
                        required
                      />
                      <TextInput
                        label="Unit"
                        placeholder="e.g., cups, grams"
                        value={ing.unit}
                        onChange={(e) =>
                          handleIngredientChange(index, "unit", e.target.value)
                        }
                        required
                      />
                      <TextInput
                        label="Ingredient"
                        placeholder="e.g., flour, sugar"
                        value={ing.name}
                        onChange={(e) =>
                          handleIngredientChange(index, "name", e.target.value)
                        }
                        required
                      />
                      {formData.ingredients.length > 1 && (
                        <ActionIcon
                          color="red"
                          onClick={() => handleRemoveIngredient(index)}
                        >
                          <IconMinus size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  ))}
                </Stack>

                {/* Steps Section */}
                <Stack spacing="sm">
                  <Group position="apart" align="flex-end">
                    <Text size="sm" weight={500}>
                      Steps
                    </Text>
                    <ActionIcon color="green" onClick={handleAddStep}>
                      <IconPlus size={16} />
                    </ActionIcon>
                  </Group>
                  {formData.steps.map((step, index) => (
                    <Group key={index} grow align="flex-end">
                      <NumberInput
                        label="Order"
                        placeholder="e.g., 1"
                        value={step.order || index + 1}
                        readOnly
                      />
                      <Textarea
                        label="Description"
                        placeholder="Describe this step"
                        minRows={2}
                        value={step.description}
                        onChange={(e) =>
                          handleStepChange(index, e.target.value)
                        }
                        required
                      />
                      {formData.steps.length > 1 && (
                        <ActionIcon
                          color="red"
                          onClick={() => handleRemoveStep(index)}
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
                  disabled={!isFormValid()} // Disable if form is invalid
                >
                  Add Recipe
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="json" pt="md">
            <form onSubmit={handleJsonSubmit}>
              <Stack gap="md">
                <Textarea
                  name="jsonData"
                  label="Recipe JSON"
                  description={
                    <Text size="sm" color="dimmed" component="span">
                      Paste your recipe in JSON format. Ensure it follows the structure shown in the example below.
                    </Text>
                  }
                  placeholder={`{
  "title": "Chocolate Cake",
  "category": "dessert",
  "description": "A rich and moist chocolate cake.",
  "image": "https://example.com/chocolate-cake.jpg",
  "portion": 8,
  "ingredients": [
    { "quantity": 2, "unit": "cups", "name": "flour" },
    { "quantity": 1.5, "unit": "cups", "name": "sugar" },
    { "quantity": 0.75, "unit": "cups", "name": "cocoa powder" },
    { "quantity": 2, "unit": "teaspoons", "name": "baking powder" },
    { "quantity": 1.5, "unit": "teaspoons", "name": "baking soda" },
    { "quantity": 1, "unit": "teaspoon", "name": "salt" },
    { "quantity": 2, "unit": "units", "name": "eggs" },
    { "quantity": 1, "unit": "cup", "name": "milk" },
    { "quantity": 0.5, "unit": "cup", "name": "vegetable oil" },
    { "quantity": 2, "unit": "teaspoons", "name": "vanilla extract" }
  ],
  "steps": [
    { "order": 1, "description": "Preheat oven to 350°F (175°C)." },
    { "order": 2, "description": "Grease and flour two 9-inch cake pans." },
    { "order": 3, "description": "In a large bowl, stir together the dry ingredients." },
    { "order": 4, "description": "Add eggs, milk, oil, and vanilla; beat for 2 minutes on medium speed." },
    { "order": 5, "description": "Pour into prepared pans." },
    { "order": 6, "description": "Bake for 30-35 minutes or until a toothpick comes out clean." },
    { "order": 7, "description": "Cool for 10 minutes; remove from pans to wire racks." },
    { "order": 8, "description": "Cool completely before frosting." }
  ]
}`}
                  minRows={10}
                  required
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  disabled={!jsonData.trim()} // Disable if JSON is empty
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
    { "quantity": 1.5, "unit": "cups", "name": "sugar" },
    { "quantity": 0.75, "unit": "cups", "name": "cocoa powder" },
    { "quantity": 2, "unit": "teaspoons", "name": "baking powder" },
    { "quantity": 1.5, "unit": "teaspoons", "name": "baking soda" },
    { "quantity": 1, "unit": "teaspoon", "name": "salt" },
    { "quantity": 2, "unit": "units", "name": "eggs" },
    { "quantity": 1, "unit": "cup", "name": "milk" },
    { "quantity": 0.5, "unit": "cup", "name": "vegetable oil" },
    { "quantity": 2, "unit": "teaspoons", "name": "vanilla extract" }
  ],
  "steps": [
    { "order": 1, "description": "Preheat oven to 350°F (175°C)." },
    { "order": 2, "description": "Grease and flour two 9-inch cake pans." },
    { "order": 3, "description": "In a large bowl, stir together the dry ingredients." },
    { "order": 4, "description": "Add eggs, milk, oil, and vanilla; beat for 2 minutes on medium speed." },
    { "order": 5, "description": "Pour into prepared pans." },
    { "order": 6, "description": "Bake for 30-35 minutes or until a toothpick comes out clean." },
    { "order": 7, "description": "Cool for 10 minutes; remove from pans to wire racks." },
    { "order": 8, "description": "Cool completely before frosting." }
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
