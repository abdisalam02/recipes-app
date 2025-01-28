"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import {
  Container,
  Title,
  TextInput,
  Button,
  Paper,
  Stack,
  Text,
  LoadingOverlay,
  NumberInput,
  Group,
  Select,
  Code,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { NutritionalInfo } from '../../../lib/types'; // Adjust path as needed

export default function TestNutrition() {
  const [ingredientName, setIngredientName] = useState<string>("");
  const [unit, setUnit] = useState<string>("g");
  const [quantity, setQuantity] = useState<number>(100);
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const unitOptions = [
    { value: "g", label: "Grams (g)" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "mg", label: "Milligrams (mg)" },
    { value: "lb", label: "Pounds (lb)" },
    { value: "oz", label: "Ounces (oz)" },
    { value: "cups", label: "Cups" },
    { value: "tablespoons", label: "Tablespoons" },
    { value: "teaspoons", label: "Teaspoons" },
    // Add more units as needed
  ];

  const fetchNutrition = async (): Promise<void> => {
    if (!ingredientName.trim()) {
      notifications.show({
        title: "Error",
        message: "Please enter an ingredient name.",
        color: "red",
      });
      return;
    }

    setLoading(true);
    setNutritionalInfo(null);

    try {
      // Fetch nutritional info via API route
      const response = await fetch('/api/nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: ingredientName.trim(),
          quantity,
          unit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch nutritional data.');
      }

      const info: NutritionalInfo = await response.json();
      setNutritionalInfo(info);
      notifications.show({
        title: "Success",
        message: "Nutritional data fetched successfully!",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "An unknown error occurred.",
        color: "red",
      });
    } finally {
      setLoading(false);
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
        <Stack align="center" mb="md" gap="md">
          <Title order={2}>Test Nutrition API</Title>
          <Text color="dimmed" size="sm">
            Enter an ingredient to fetch its nutritional information
          </Text>
        </Stack>

        <form onSubmit={(e) => { e.preventDefault(); fetchNutrition(); }}>
          <Stack gap="md">
            <TextInput
              label="Ingredient Name"
              placeholder="e.g., Chicken Breast"
              required
              value={ingredientName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setIngredientName(e.target.value)
              }
              radius="xl"
              size="md"
            />

            <Group grow>
              <NumberInput
                label="Quantity"
                min={0.1}
                step={0.1}
                required
                value={quantity}
                onChange={(value: number | string) => {
                  const numberValue = typeof value === "number" ? value : 0;
                  setQuantity(numberValue);
                }}
                radius="xl"
                size="md"
                aria-label="Quantity"
              />

              <Select
                label="Unit"
                data={unitOptions}
                required
                value={unit}
                onChange={(value: string | null) =>
                  setUnit(value || "g")
                }
                radius="xl"
                size="md"
                aria-label="Unit"
              />
            </Group>

            <Button
              type="submit"
              fullWidth
              size="md"
              radius="xl"
              color="blue"
              loading={loading}
              disabled={loading}
            >
              Fetch Nutritional Data
            </Button>

            {nutritionalInfo && (
              <Paper withBorder shadow="sm" p="md" radius="md">
                <Text mb="sm">Nutritional Information:</Text>
                <Group gap="xs">
                  <Text>Calories: {nutritionalInfo.calories} kcal</Text>
                  <Text>Protein: {nutritionalInfo.protein} g</Text>
                  <Text>Fat: {nutritionalInfo.fat} g</Text>
                  <Text>Carbohydrates: {nutritionalInfo.carbohydrates} g</Text>
                  <Text>Fiber: {nutritionalInfo.fiber} g</Text>
                  <Text>Sugar: {nutritionalInfo.sugar} g</Text>
                  <Text>Sodium: {nutritionalInfo.sodium} mg</Text>
                  <Text>Cholesterol: {nutritionalInfo.cholesterol} mg</Text>
                </Group>
              </Paper>
            )}
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
