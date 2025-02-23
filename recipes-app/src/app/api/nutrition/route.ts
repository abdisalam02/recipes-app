// app/api/nutrition/route.ts
import { NextResponse } from "next/server";
import fetch from "node-fetch";
import { NutritionalInfo } from "../../../../lib/types";

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
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Spoonacular API key is missing." },
      { status: 500 }
    );
  }

  try {
    const { ingredients, portion } = await request.json();
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { message: "Invalid ingredients data" },
        { status: 400 }
      );
    }

    // Process each ingredient
    const nutritionPromises = ingredients.map(async (ing: { name: string; quantity: number; unit: string; }) => {
      // Convert whole units to grams if needed
      const { quantity, unit } = convertWholeUnit(ing.name, ing.quantity, ing.unit);
      const ingredientString = `${quantity} ${unit} ${ing.name}`;
      const url = `https://api.spoonacular.com/recipes/parseIngredients`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-api-key": apiKey,
        },
        body: new URLSearchParams({
          ingredientList: ingredientString,
          servings: "1",
          includeNutrition: "true",
          language: "en"
        }).toString()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch nutrition for ${ing.name}`);
      }

      const data = await response.json();
      return data[0]?.nutrition?.nutrients || null;
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

    nutritionResults.forEach(nutrients => {
      if (!nutrients) return;
      nutrients.forEach((nutrient: any) => {
        const nutrientName = nutrient.name.toLowerCase();
        switch (nutrientName) {
          case 'calories':
            totalNutrition.calories += nutrient.amount;
            break;
          case 'protein':
            totalNutrition.protein += nutrient.amount;
            break;
          case 'fat':
            totalNutrition.fat += nutrient.amount;
            break;
          case 'carbohydrates':
            totalNutrition.carbohydrates += nutrient.amount;
            break;
          case 'fiber':
            totalNutrition.fiber += nutrient.amount;
            break;
          case 'sugar':
            totalNutrition.sugar += nutrient.amount;
            break;
          case 'sodium':
            totalNutrition.sodium += nutrient.amount;
            break;
          case 'cholesterol':
            totalNutrition.cholesterol += nutrient.amount;
            break;
        }
      });
    });

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
