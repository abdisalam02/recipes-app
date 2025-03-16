// @ts-nocheck

// app/api/nutrition/route.ts
import { NextResponse } from "next/server";
import { NutritionalInfo } from "../../../../lib/types";
import { getComprehensiveNutritionalInfo, approximateNutritionForFood } from "../../../../lib/nutrition";

// Define the timeout for API requests
const TIMEOUT_MS = 8000; // 8 seconds timeout

// Create a promise that rejects after a set time
function timeoutPromise(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
}

// Helper to convert "whole" units to grams
function convertWholeUnit(name: string, quantity: number, unit: string): { quantity: number; unit: string } {
  if (unit.toLowerCase() === "whole") {
    // Define average weights (in grams) for known ingredients.
    const averageWeights: { [key: string]: number } = {
      apple: 182, // average weight of an apple in grams
      egg: 50,    // average weight of an egg in grams
      // add more as needed...
    };
    const avgWeight = averageWeights[name.toLowerCase()];
    if (avgWeight) {
      return { quantity: quantity * avgWeight, unit: "g" };
    }
  }
  return { quantity, unit };
}

export async function POST(request: Request) {
  try {
    const { ingredients, portion } = await request.json();
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { message: "Invalid ingredients data" },
        { status: 400 }
      );
    }

    console.log(`Processing nutritional information for ${ingredients.length} ingredients`);

    // Process each ingredient with improved multi-API nutrition system
    const nutritionPromises = ingredients.map(async (ing: { name: string; quantity: number; unit: string; }) => {
      // Convert whole units to grams if needed
      const { quantity, unit } = convertWholeUnit(ing.name, ing.quantity, ing.unit);
      
      // Use Promise.race to implement a timeout
      try {
        console.log(`Fetching nutrition for: ${quantity} ${unit} ${ing.name}`);
        
        const result = await Promise.race([
          getComprehensiveNutritionalInfo(ing.name, quantity, unit),
          timeoutPromise(TIMEOUT_MS)
        ]);
        
        if (result && result.nutritionalInfo) {
          console.log(`Successfully retrieved nutrition for ${ing.name} from ${result.source}`);
          return {
            data: result.nutritionalInfo,
            source: result.source
          };
        } else {
          console.log(`No nutrition data found for ${ing.name}, using approximation`);
          // Fallback to approximation
          const approxNutrition = approximateNutritionForFood(ing.name, quantity, unit);
          return {
            data: approxNutrition,
            source: "Approximation"
          };
        }
      } catch (error) {
        console.error(`Error fetching nutrition for ${ing.name}:`, error);
        // If timeout or other error, use approximation
        console.log(`Using approximation for ${ing.name} due to error: ${error.message}`);
        const approxNutrition = approximateNutritionForFood(ing.name, quantity, unit);
        return {
          data: approxNutrition,
          source: error.message.includes("timed out") ? "Timeout Fallback" : "Error Fallback" 
        };
      }
    });

    const nutritionResults = await Promise.all(nutritionPromises);

    // Sum up the nutritional info from all ingredients
    let totalNutrition: NutritionalInfo = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };

    // Track data sources for debugging
    const dataSources: Record<string, number> = {};
    
    // Count number of ingredients with nutrition data
    let ingredientsWithData = 0;

    nutritionResults.forEach(result => {
      if (!result || !result.data) return;
      
      ingredientsWithData++;
      
      // Track data source
      if (result.source) {
        dataSources[result.source] = (dataSources[result.source] || 0) + 1;
      }
      
      const nutritionalInfo = result.data;
      
      // Add to total
      totalNutrition.calories += nutritionalInfo.calories;
      totalNutrition.protein += nutritionalInfo.protein;
      totalNutrition.fat += nutritionalInfo.fat;
      totalNutrition.carbohydrates += nutritionalInfo.carbohydrates;
      totalNutrition.fiber += nutritionalInfo.fiber;
      totalNutrition.sugar += nutritionalInfo.sugar;
      totalNutrition.sodium += nutritionalInfo.sodium;
      totalNutrition.cholesterol += nutritionalInfo.cholesterol;
    });

    console.log(`Found nutrition data for ${ingredientsWithData} out of ${ingredients.length} ingredients`);
    console.log(`Data sources: ${JSON.stringify(dataSources)}`);

    // Calculate per portion nutritional info
    const perPortion: NutritionalInfo = {
      calories: totalNutrition.calories / portion,
      protein: totalNutrition.protein / portion,
      fat: totalNutrition.fat / portion,
      carbohydrates: totalNutrition.carbohydrates / portion,
      fiber: totalNutrition.fiber / portion,
      sugar: totalNutrition.sugar / portion,
      sodium: totalNutrition.sodium / portion,
      cholesterol: totalNutrition.cholesterol / portion,
    };

    return NextResponse.json(perPortion);
  } catch (error: any) {
    console.error("Error processing nutritional information:", error);
    return NextResponse.json(
      { message: "Failed to process nutritional information", error: error.message },
      { status: 500 }
    );
  }
}
