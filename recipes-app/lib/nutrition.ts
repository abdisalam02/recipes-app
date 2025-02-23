import fetch from 'node-fetch';
import { NutritionalInfo } from './types';

export async function getNutritionalInfo(
  name: string,
  quantity: number,
  unit: string
): Promise<NutritionalInfo | null> {
  console.log(`Fetching nutritional info for: ${quantity} ${unit} ${name}`);

  // Convert 'whole' units to grams if necessary
  if (unit.toLowerCase() === 'whole') {
    const averageWeight = getAverageWeight(name);
    if (averageWeight) {
      quantity = quantity * averageWeight;
      unit = 'g';
      console.log(`Converted ${quantity} whole ${name} to ${quantity}g based on average weight.`);
    } else {
      console.warn(`No average weight found for ingredient: ${name}. Using quantity as is.`);
    }
  }

  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    console.error('Spoonacular API key is missing.');
    return null;
  }

  // Construct the ingredient string (e.g., "100 g apple")
  const ingr = `${quantity} ${unit} ${name}`;
  const url = `https://api.spoonacular.com/recipes/parseIngredients?apiKey=${apiKey}&includeNutrition=true`;

  try {
    // Use URL-encoded form data instead of JSON
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        ingredientList: ingr,
        servings: "1"
      }).toString()
    });

    if (!response.ok) {
      console.error(`Spoonacular API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.error(`No nutritional data found for ${ingr}`);
      return null;
    }

    // Spoonacular returns an array; we take the first element
    const ingredientData = data[0];
    if (!ingredientData.nutrition || !ingredientData.nutrition.nutrients) {
      console.error(`No nutrition info in the response for ${ingr}`);
      return null;
    }

    const nutrients = ingredientData.nutrition.nutrients;
    // Helper to extract nutrient amount by name (case-insensitive)
    const getNutrient = (nutrientName: string): number => {
      const nutrient = nutrients.find((n: any) => n.name.toLowerCase() === nutrientName.toLowerCase());
      return nutrient ? nutrient.amount : 0;
    };

    return {
      calories: getNutrient('Calories'),
      protein: getNutrient('Protein'),
      fat: getNutrient('Fat'),
      carbohydrates: getNutrient('Carbohydrates'),
      fiber: getNutrient('Fiber'),
      sugar: getNutrient('Sugar'),
      sodium: getNutrient('Sodium'),
      cholesterol: getNutrient('Cholesterol')
    };
  } catch (error: any) {
    console.error('Error fetching nutritional info from Spoonacular:', error.message);
    return null;
  }
}

function getAverageWeight(name: string): number | null {
  const averageWeights: { [key: string]: number } = {
    egg: 50, // grams per egg
    // Add more ingredients as needed
  };
  return averageWeights[name.toLowerCase()] || null;
}
