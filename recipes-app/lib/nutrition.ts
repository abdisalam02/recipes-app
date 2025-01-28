// src/lib/nutrition.ts

import fetch from 'node-fetch'; // Ensure node-fetch is installed
import { EdamamNutritionResponse, NutritionalInfo } from './types'; // Correct import path

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

  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  if (!appId || !appKey) {
    console.error('Edamam API credentials are missing.');
    return null;
  }

  const ingr = `${quantity} ${unit} ${name}`;
  const url = `https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(
    ingr
  )}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Edamam API error: ${response.statusText}`);
      return null;
    }
    const data: EdamamNutritionResponse = (await response.json()) as EdamamNutritionResponse; // Type assertion

    if (data.calories === undefined) {
      console.error(`No nutritional data found for ${ingr}`);
      return null;
    }

    // Extract necessary nutrient information safely
    const nutrients = data.totalNutrients;

    return {
      calories: data.calories || 0,
      protein: nutrients['PROCNT'] ? nutrients['PROCNT'].quantity : 0,
      fat: nutrients['FAT'] ? nutrients['FAT'].quantity : 0,
      carbohydrates: nutrients['CHOCDF'] ? nutrients['CHOCDF'].quantity : 0,
      fiber: nutrients['FIBTG'] ? nutrients['FIBTG'].quantity : 0,
      sugar: nutrients['SUGAR'] ? nutrients['SUGAR'].quantity : 0,
      sodium: nutrients['NA'] ? nutrients['NA'].quantity : 0,
      cholesterol: nutrients['CHOLE'] ? nutrients['CHOLE'].quantity : 0,
    };
  } catch (error: any) {
    console.error('Error fetching nutritional info from Edamam:', error.message);
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
