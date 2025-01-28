// backfillNutritionalInfo.ts

import axios from 'axios';
import dotenv from 'dotenv';
import supabase from './lib/supabaseClient';
import { Database } from './lib/database';

// Load environment variables
dotenv.config();

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID!;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY!;

interface Recipe {
  id: number;
  title: string;
  portion: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
}

interface NutritionalInfo {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

// Helper function to convert units to grams (if necessary)
const unitConversion: { [key: string]: number } = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  mg: 0.001,
  milligram: 0.001,
  milligrams: 0.001,
  lb: 453.592,
  pound: 453.592,
  pounds: 453.592,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  // Add more conversions as needed
};

function convertToGrams(quantity: number, unit: string): number {
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit in unitConversion) {
    return quantity * unitConversion[lowerUnit];
  }
  // If unit is not recognized, assume it's already in grams
  return quantity;
}

async function fetchNutritionalData(name: string, quantity: number, unit: string): Promise<NutritionalInfo | null> {
  try {
    const convertedQuantity = convertToGrams(quantity, unit);

    const response = await axios.get('https://api.edamam.com/api/nutrition-data', {
      params: {
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        ingr: `${convertedQuantity} g ${name}`,
      },
    });

    const data = response.data;

    if (data.calories === 0) {
      console.warn(`No nutritional data found for ingredient: ${name}`);
      return null;
    }

    const nutritionalInfo: NutritionalInfo = {
      calories: data.calories || 0,
      protein: data.totalNutrients.PROCNT?.quantity || 0,
      fat: data.totalNutrients.FAT?.quantity || 0,
      carbohydrates: data.totalNutrients.CHOCDF?.quantity || 0,
      fiber: data.totalNutrients.FIBTG?.quantity || 0,
      sugar: data.totalNutrients.SUGAR?.quantity || 0,
      sodium: data.totalNutrients.NA?.quantity || 0,
      cholesterol: data.totalNutrients.CHOLE?.quantity || 0,
    };

    return nutritionalInfo;
  } catch (error) {
    console.error(`Error fetching data for ingredient: ${name}`, error);
    return null;
  }
}

async function backfillNutritionalInfo() {
  try {
    console.log('Fetching recipes without nutritional info...');

    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .is('nutritional_info', null); // Select recipes where nutritional_info is null

    if (error) {
      throw error;
    }

    if (!recipes || recipes.length === 0) {
      console.log('No recipes found that need nutritional information.');
      return;
    }

    console.log(`Found ${recipes.length} recipes to update.`);

    for (const recipe of recipes as Recipe[]) {
      console.log(`Processing Recipe ID: ${recipe.id} - ${recipe.title}`);

      let totalNutritionalInfo: NutritionalInfo = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
      };

      for (const ingredient of recipe.ingredients) {
        const nutritionalData = await fetchNutritionalData(ingredient.name, ingredient.quantity, ingredient.unit);
        if (nutritionalData) {
          totalNutritionalInfo.calories += nutritionalData.calories;
          totalNutritionalInfo.protein += nutritionalData.protein;
          totalNutritionalInfo.fat += nutritionalData.fat;
          totalNutritionalInfo.carbohydrates += nutritionalData.carbohydrates;
          totalNutritionalInfo.fiber += nutritionalData.fiber;
          totalNutritionalInfo.sugar += nutritionalData.sugar;
          totalNutritionalInfo.sodium += nutritionalData.sodium;
          totalNutritionalInfo.cholesterol += nutritionalData.cholesterol;
        }
      }

      // Optionally, round the values for better readability
      totalNutritionalInfo = {
        calories: Math.round(totalNutritionalInfo.calories),
        protein: Math.round(totalNutritionalInfo.protein * 10) / 10,
        fat: Math.round(totalNutritionalInfo.fat * 10) / 10,
        carbohydrates: Math.round(totalNutritionalInfo.carbohydrates * 10) / 10,
        fiber: Math.round(totalNutritionalInfo.fiber * 10) / 10,
        sugar: Math.round(totalNutritionalInfo.sugar * 10) / 10,
        sodium: Math.round(totalNutritionalInfo.sodium * 10) / 10,
        cholesterol: Math.round(totalNutritionalInfo.cholesterol * 10) / 10,
      };

      // Update the recipe with nutritional info
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ nutritional_info: totalNutritionalInfo })
        .eq('id', recipe.id);

      if (updateError) {
        console.error(`Failed to update recipe ID: ${recipe.id}`, updateError);
      } else {
        console.log(`Successfully updated Recipe ID: ${recipe.id}`);
      }

      // Optional: Pause between requests to respect API rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
    }

    console.log('Nutritional information backfilling completed.');
  } catch (error: any) {
    console.error('An error occurred during backfilling:', error.message);
  }
}

// Execute the backfilling process
backfillNutritionalInfo();
