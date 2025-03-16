import { NextResponse } from 'next/server';
import { getComprehensiveNutritionalInfo, aiPreprocessFood, getNutritionForFood } from '../../../../lib/nutrition';
import supabase from '../../../../lib/supabaseClient';
import { NutritionalInfo } from '../../../../lib/types';

// Define a mapping of common phrases to structured ingredients
const FOOD_MAPPINGS: Record<string, Array<{ name: string; quantity: number; unit: string }>> = {
  'bowl of oatmeal': [
    { name: 'oats', quantity: 40, unit: 'g' },
    { name: 'milk', quantity: 150, unit: 'ml' }
  ],
  'oatmeal with banana': [
    { name: 'oats', quantity: 40, unit: 'g' },
    { name: 'milk', quantity: 150, unit: 'ml' },
    { name: 'banana', quantity: 100, unit: 'g' }
  ],
  'scrambled eggs': [
    { name: 'eggs', quantity: 2, unit: 'whole' },
    { name: 'butter', quantity: 5, unit: 'g' }
  ],
  'cup of coffee': [
    { name: 'coffee', quantity: 240, unit: 'ml' }
  ],
  'coffee with milk': [
    { name: 'coffee', quantity: 200, unit: 'ml' },
    { name: 'milk', quantity: 40, unit: 'ml' }
  ],
  'toast with butter': [
    { name: 'bread', quantity: 30, unit: 'g' },
    { name: 'butter', quantity: 5, unit: 'g' }
  ],
  'avocado toast': [
    { name: 'bread', quantity: 30, unit: 'g' },
    { name: 'avocado', quantity: 50, unit: 'g' }
  ],
  'chicken sandwich': [
    { name: 'bread', quantity: 60, unit: 'g' },
    { name: 'chicken', quantity: 80, unit: 'g' },
    { name: 'lettuce', quantity: 10, unit: 'g' },
    { name: 'mayonnaise', quantity: 10, unit: 'g' }
  ],
  'grilled chicken': [
    { name: 'chicken', quantity: 150, unit: 'g' },
    { name: 'oil', quantity: 5, unit: 'ml' }
  ],
  'salad': [
    { name: 'lettuce', quantity: 50, unit: 'g' },
    { name: 'tomato', quantity: 30, unit: 'g' },
    { name: 'cucumber', quantity: 30, unit: 'g' },
    { name: 'olive oil', quantity: 10, unit: 'ml' }
  ],
  'apple': [
    { name: 'apple', quantity: 180, unit: 'g' }
  ],
  'banana': [
    { name: 'banana', quantity: 120, unit: 'g' }
  ],
  'orange': [
    { name: 'orange', quantity: 150, unit: 'g' }
  ],
  'glass of water': [
    { name: 'water', quantity: 250, unit: 'ml' }
  ],
  'greek yogurt': [
    { name: 'greek yogurt', quantity: 150, unit: 'g' }
  ],
  'rice': [
    { name: 'rice', quantity: 150, unit: 'g' }
  ],
  'portion of rice': [
    { name: 'rice', quantity: 150, unit: 'g' }
  ],
  'white rice': [
    { name: 'white rice', quantity: 150, unit: 'g' }
  ],
  'brown rice': [
    { name: 'brown rice', quantity: 150, unit: 'g' }
  ],
  'pasta': [
    { name: 'pasta', quantity: 100, unit: 'g' }
  ],
  'spaghetti': [
    { name: 'pasta', quantity: 100, unit: 'g' }
  ],
  'chicken leg': [
    { name: 'chicken', quantity: 120, unit: 'g' },
  ],
  'somali rice': [
    { name: 'rice', quantity: 180, unit: 'g' },
    { name: 'oil', quantity: 10, unit: 'ml' },
    { name: 'onion', quantity: 20, unit: 'g' },
  ],
  'doughnut': [
    { name: 'flour', quantity: 30, unit: 'g' },
    { name: 'sugar', quantity: 15, unit: 'g' },
    { name: 'oil', quantity: 20, unit: 'ml' },
  ],
  'donut': [
    { name: 'flour', quantity: 30, unit: 'g' },
    { name: 'sugar', quantity: 15, unit: 'g' },
    { name: 'oil', quantity: 20, unit: 'ml' },
  ],
  'fries': [
    { name: 'potato', quantity: 100, unit: 'g' },
    { name: 'oil', quantity: 15, unit: 'ml' },
  ],
  'french fries': [
    { name: 'potato', quantity: 100, unit: 'g' },
    { name: 'oil', quantity: 15, unit: 'ml' },
  ]
};

// More accurate nutrition values for common foods (per 100g)
const ACCURATE_NUTRITIONAL_VALUES: Record<string, NutritionalInfo> = {
  'chicken leg': {
    calories: 184,
    protein: 27.3,
    fat: 8.1,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 86,
    cholesterol: 88
  },
  'doughnut': {
    calories: 412,
    protein: 4.9,
    fat: 22.7,
    carbohydrates: 47.3,
    fiber: 1.4,
    sugar: 22.0,
    sodium: 360,
    cholesterol: 18
  },
  'french fries': {
    calories: 312,
    protein: 3.4,
    fat: 15,
    carbohydrates: 41,
    fiber: 3.8,
    sugar: 0.3,
    sodium: 210,
    cholesterol: 0
  },
  'rice': {
    calories: 130,
    protein: 2.7,
    fat: 0.3,
    carbohydrates: 28.2,
    fiber: 0.4,
    sugar: 0.1,
    sodium: 1,
    cholesterol: 0
  },
  'somali rice': {
    calories: 155,
    protein: 3.0,
    fat: 3.2,
    carbohydrates: 29.5,
    fiber: 0.6,
    sugar: 0.5,
    sodium: 15,
    cholesterol: 0
  },
  'salmon': {
    calories: 208,
    protein: 20.2,
    fat: 13.4,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 59,
    cholesterol: 55
  },
  'oatmeal': {
    calories: 389,
    protein: 16.9,
    fat: 6.9,
    carbohydrates: 66.3,
    fiber: 10.6,
    sugar: 0.0,
    sodium: 2,
    cholesterol: 0
  },
  'banana': {
    calories: 89,
    protein: 1.1,
    fat: 0.3,
    carbohydrates: 22.8,
    fiber: 2.6,
    sugar: 12.2,
    sodium: 1,
    cholesterol: 0
  },
};

// Add more enhanced food analysis for Somali dishes
const SOMALI_FOOD_MAPPINGS: Record<string, Array<{ name: string; quantity: number; unit: string }>> = {
  'somali rice': [
    { name: 'rice', quantity: 200, unit: 'g' },
    { name: 'oil', quantity: 15, unit: 'ml' },
    { name: 'onion', quantity: 30, unit: 'g' },
    { name: 'garlic powder', quantity: 3, unit: 'g' },
    { name: 'turmeric', quantity: 2, unit: 'g' }
  ],
  'chicken leg': [
    { name: 'chicken', quantity: 150, unit: 'g' },
  ],
  'clubs of chicken': [
    { name: 'chicken', quantity: 30, unit: 'g' },  // Per club
  ]
};

// Add this definition for commonFoods before approximateNutritionForFood function
// Add missing commonFoods definition that's needed by approximateNutritionForFood
const commonFoods: Record<string, NutritionalInfo> = {
  // Dairy products
  'greek yogurt': {
    calories: 59,
    protein: 10.0,
    fat: 0.4,
    carbohydrates: 3.6,
    fiber: 0,
    sugar: 3.6,
    sodium: 36,
    cholesterol: 5
  },
  'yogurt': {
    calories: 59,
    protein: 3.5,
    fat: 3.3,
    carbohydrates: 4.7,
    fiber: 0,
    sugar: 4.7,
    sodium: 45,
    cholesterol: 13
  },
  'cheese': {
    calories: 402,
    protein: 25.18,
    fat: 33.31,
    carbohydrates: 1.28,
    fiber: 0,
    sugar: 0.45,
    sodium: 621,
    cholesterol: 105
  },
  'milk': {
    calories: 42,
    protein: 3.4,
    fat: 1.0,
    carbohydrates: 5.0,
    fiber: 0,
    sugar: 5.0,
    sodium: 44,
    cholesterol: 5
  },
  'butter': {
    calories: 717,
    protein: 0.9,
    fat: 81.1,
    carbohydrates: 0.1,
    fiber: 0,
    sugar: 0.1,
    sodium: 11,
    cholesterol: 215
  },
  
  // Protein sources
  'chicken': {
    calories: 165,
    protein: 31,
    fat: 3.6,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 74,
    cholesterol: 85
  },
  'beef': {
    calories: 250,
    protein: 26,
    fat: 17,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 55,
    cholesterol: 90
  },
  'salmon': {
    calories: 208,
    protein: 20.2,
    fat: 13.4,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 59,
    cholesterol: 55
  },
  'eggs': {
    calories: 155,
    protein: 12.6,
    fat: 10.6,
    carbohydrates: 0.6,
    fiber: 0,
    sugar: 0.6,
    sodium: 124,
    cholesterol: 373
  },
  'protein powder': {
    calories: 120,
    protein: 25.0,
    fat: 2.0,
    carbohydrates: 3.0,
    fiber: 1.0,
    sugar: 1.0,
    sodium: 100,
    cholesterol: 0
  },

  // Grains
  'rice': {
    calories: 130,
    protein: 2.7,
    fat: 0.3,
    carbohydrates: 28.2,
    fiber: 0.4,
    sugar: 0.1,
    sodium: 1,
    cholesterol: 0
  },
  'bread': {
    calories: 265,
    protein: 9.0,
    fat: 3.2,
    carbohydrates: 49.0,
    fiber: 2.7,
    sugar: 5.0,
    sodium: 540,
    cholesterol: 0
  },
  'oats': {
    calories: 389,
    protein: 16.9,
    fat: 6.9,
    carbohydrates: 66.3,
    fiber: 10.6,
    sugar: 0.0,
    sodium: 2,
    cholesterol: 0
  },
  'oatmeal': {
    calories: 389,
    protein: 16.9,
    fat: 6.9,
    carbohydrates: 66.3,
    fiber: 10.6,
    sugar: 0.0,
    sodium: 2,
    cholesterol: 0
  },
  'pasta': {
    calories: 157,
    protein: 5.8,
    fat: 0.9,
    carbohydrates: 30.9,
    fiber: 1.8,
    sugar: 0.6,
    sodium: 1,
    cholesterol: 0
  },
  
  // Vegetables & Fruits
  'apple': {
    calories: 52,
    protein: 0.3,
    fat: 0.2,
    carbohydrates: 13.8,
    fiber: 2.4,
    sugar: 10.4,
    sodium: 1,
    cholesterol: 0
  },
  'banana': {
    calories: 89,
    protein: 1.1,
    fat: 0.3,
    carbohydrates: 22.8,
    fiber: 2.6,
    sugar: 12.2,
    sodium: 1,
    cholesterol: 0
  },
  'orange': {
    calories: 47,
    protein: 0.9,
    fat: 0.1,
    carbohydrates: 11.8,
    fiber: 2.4,
    sugar: 9.4,
    sodium: 0,
    cholesterol: 0
  },
  'lettuce': {
    calories: 15,
    protein: 1.4,
    fat: 0.2,
    carbohydrates: 2.9,
    fiber: 1.3,
    sugar: 0.8,
    sodium: 28,
    cholesterol: 0
  },
  'tomato': {
    calories: 18,
    protein: 0.9,
    fat: 0.2,
    carbohydrates: 3.9,
    fiber: 1.2,
    sugar: 2.6,
    sodium: 5,
    cholesterol: 0
  },
  
  // Fast food / Dishes
  'burger': {
    calories: 254,
    protein: 20,
    fat: 12,
    carbohydrates: 20,
    fiber: 1.5,
    sugar: 4,
    sodium: 378,
    cholesterol: 60
  },
  'french fries': {
    calories: 312,
    protein: 3.4,
    fat: 15,
    carbohydrates: 41,
    fiber: 3.8,
    sugar: 0.3,
    sodium: 210,
    cholesterol: 0
  },
  'pizza': {
    calories: 266,
    protein: 11,
    fat: 10,
    carbohydrates: 33,
    fiber: 2.3,
    sugar: 3.6,
    sodium: 598,
    cholesterol: 17
  },
  'sandwich': {
    calories: 290,
    protein: 15,
    fat: 11,
    carbohydrates: 34,
    fiber: 2.5,
    sugar: 4.5,
    sodium: 560,
    cholesterol: 35
  },
  'chicken sandwich': {
    calories: 283,
    protein: 18,
    fat: 13,
    carbohydrates: 24,
    fiber: 1.5,
    sugar: 3,
    sodium: 610,
    cholesterol: 45
  },
  'doughnut': {
    calories: 412,
    protein: 4.9,
    fat: 22.7,
    carbohydrates: 47.3,
    fiber: 1.4,
    sugar: 22.0,
    sodium: 360,
    cholesterol: 18
  },
  
  // Jamaican food
  'jamaican jerk chicken': {
    calories: 320,
    protein: 32,
    fat: 18,
    carbohydrates: 5,
    fiber: 1.5,
    sugar: 2,
    sodium: 520,
    cholesterol: 95
  },
  'jerk chicken': {
    calories: 320,
    protein: 32,
    fat: 18,
    carbohydrates: 5,
    fiber: 1.5,
    sugar: 2,
    sodium: 520,
    cholesterol: 95
  },
  
  // Breads and flatbreads (per piece, not per 100g)
  'chapati': {
    calories: 170,
    protein: 4.5,
    fat: 3.0,
    carbohydrates: 30.0,
    fiber: 1.5,
    sugar: 0.5,
    sodium: 180,
    cholesterol: 0
  },
  'flatbread': {
    calories: 170,
    protein: 4.5,
    fat: 3.0,
    carbohydrates: 30.0,
    fiber: 1.5,
    sugar: 0.5,
    sodium: 180,
    cholesterol: 0
  },
  'tortilla': {
    calories: 120,
    protein: 3.0,
    fat: 2.0,
    carbohydrates: 23.0,
    fiber: 1.0,
    sugar: 0.4,
    sodium: 200,
    cholesterol: 0
  },
  'naan': {
    calories: 260,
    protein: 7.0,
    fat: 4.5,
    carbohydrates: 48.0,
    fiber: 2.0,
    sugar: 1.0,
    sodium: 280,
    cholesterol: 0
  },
  
  // Specialty and Compound Foods
  'banana bread': {
    calories: 190,
    protein: 3.0,
    fat: 7.0,
    carbohydrates: 30.0,
    fiber: 1.5,
    sugar: 15.0,
    sodium: 180,
    cholesterol: 20
  },
  'mac and cheese': {
    calories: 354,
    protein: 14.0,
    fat: 16.0,
    carbohydrates: 36.0,
    fiber: 1.5,
    sugar: 6.0,
    sodium: 710,
    cholesterol: 30
  },
  'macaroni and cheese': {
    calories: 354,
    protein: 14.0,
    fat: 16.0,
    carbohydrates: 36.0,
    fiber: 1.5,
    sugar: 6.0, 
    sodium: 710,
    cholesterol: 30
  },
  'rice and beans': {
    calories: 320,
    protein: 12.0,
    fat: 3.0,
    carbohydrates: 60.0,
    fiber: 10.0,
    sugar: 1.0,
    sodium: 230,
    cholesterol: 0
  },
  
  // Default for unknown foods
  'default': {
    calories: 200,
    protein: 10,
    fat: 8,
    carbohydrates: 20,
    fiber: 2,
    sugar: 5,
    sodium: 150,
    cholesterol: 20
  }
};

/**
 * Approximates nutritional info for a food based on common values or calculations
 * @param food The food description
 * @param quantity The quantity (default 1)
 * @param unit The unit (default 'serving')
 * @returns Approximate nutritional information
 */
export function approximateNutritionForFood(
  food: string,
  quantity: number = 1,
  unit: string = 'serving'
): NutritionalInfo {
  // Normalize the food name
  const normalizedFood = food.toLowerCase().trim();
  
  // Check for exact matches or partial matches in our common food database
  for (const [foodName, nutritionValues] of Object.entries(commonFoods)) {
    if (normalizedFood === foodName || normalizedFood.includes(foodName)) {
      // Scale the values based on quantity
      const scaleFactor = calculateScaleFactor(foodName, quantity, unit);
      
      return {
        calories: nutritionValues.calories * scaleFactor,
        protein: nutritionValues.protein * scaleFactor,
        fat: nutritionValues.fat * scaleFactor,
        carbohydrates: nutritionValues.carbohydrates * scaleFactor,
        fiber: nutritionValues.fiber * scaleFactor,
        sugar: nutritionValues.sugar * scaleFactor,
        sodium: nutritionValues.sodium * scaleFactor,
        cholesterol: nutritionValues.cholesterol * scaleFactor
      };
    }
  }
  
  // For foods not in our database, return a basic estimate
  // These values would be per 100g/ml of an average food
  const baseCalories = normalizedFood.includes('fruit') || normalizedFood.includes('vegetable') ? 50 : 200;
  const baseProtein = normalizedFood.includes('meat') || normalizedFood.includes('fish') ? 20 : 5;
  const baseFat = normalizedFood.includes('oil') || normalizedFood.includes('butter') ? 80 : 10;
  const baseCarbs = normalizedFood.includes('bread') || normalizedFood.includes('pasta') || normalizedFood.includes('rice') ? 40 : 15;
  
  // Apply scaling based on quantity and unit
  const scaleFactor = (unit === 'g' || unit === 'ml') ? quantity / 100 : quantity;
  
  return {
    calories: baseCalories * scaleFactor,
    protein: baseProtein * scaleFactor,
    fat: baseFat * scaleFactor,
    carbohydrates: baseCarbs * scaleFactor,
    fiber: (baseCarbs * 0.1) * scaleFactor,  // 10% of carbs
    sugar: (baseCarbs * 0.2) * scaleFactor,  // 20% of carbs
    sodium: 50 * scaleFactor,
    cholesterol: (baseFat * 5) * scaleFactor // 5mg per gram of fat
  };
}

/**
 * Calculates a scale factor for nutritional values based on quantity and unit
 * @param foodName The name of the food
 * @param quantity The quantity
 * @param unit The unit
 * @returns The scale factor to apply to nutrient values
 */
function calculateScaleFactor(foodName: string, quantity: number, unit: string): number {
  // Handle different units
  if (unit === 'g' || unit === 'ml') {
    // For weight or volume, scale based on a standard portion
    const standardPortions: Record<string, number> = {
      'banana': 120,  // 120g per banana
      'apple': 180,   // 180g per apple
      'egg': 50,      // 50g per egg
      'bread': 30,    // 30g per slice of bread
      'rice': 150,    // 150g per portion
      'pasta': 150,   // 150g per portion
      'milk': 240,    // 240ml per cup
      'coffee': 240,  // 240ml per cup
    };
    
    // Find a matching standard portion
    const standardPortion = Object.entries(standardPortions).find(([key]) => 
      foodName.includes(key)
    );
    
    if (standardPortion) {
      return quantity / standardPortion[1];
    }
    
    // Default to per 100g/ml
    return quantity / 100;
  } 
  else if (unit === 'piece' || unit === 'slice' || unit === 'whole') {
    // For countable items, multiply by the quantity
    return quantity;
  }
  else if (unit === 'serving' || unit === 'portion') {
    // For servings, multiply by the quantity
    return quantity;
  }
  else {
    // Default: just use the quantity
    return quantity;
  }
}

/**
 * Fetches nutritional information for a food
 * @param food The food description
 * @param quantity The quantity (optional)
 * @param unit The unit (optional)
 * @returns Nutritional information with source
 */
/* Commenting out duplicate function - using imported version instead
export async function getNutritionForFood(
  food: string,
  quantity: number = 1,
  unit: string = 'serving'
): Promise<{ nutritionalInfo: NutritionalInfo; source: string }> {
  console.log(`Getting nutrition for food: "${food}" (${quantity} ${unit})`);
  
  try {
    // Use the comprehensive nutrition info function that tries multiple APIs and caching
    const result = await getComprehensiveNutritionalInfo(food, quantity, unit);
    console.log(`Retrieved nutritional info for "${food}" from ${result.source}`);
    return result;
  } catch (error) {
    console.error(`Error fetching nutrition for "${food}":`, error);
    
    // Fall back to approximation if all else fails
    console.log(`Falling back to approximation for "${food}"`);
    return {
      nutritionalInfo: approximateNutritionForFood(food, quantity, unit),
      source: "Approximation"
    };
  }
}
*/

// Set a timeout for API requests
const TIMEOUT_MS = 8000; // 8 seconds timeout

function timeoutPromise(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
}

export async function POST(request: Request) {
  try {
    const { foodDescription } = await request.json();
    
    if (!foodDescription) {
      return NextResponse.json(
        { error: "Food description is required" },
        { status: 400 }
      );
    }

    console.log(`Analyzing food: "${foodDescription}"`);
    
    // Use Promise.race to implement timeout
    const nutritionData = await Promise.race([
      getNutritionForFood(foodDescription),
      timeoutPromise(TIMEOUT_MS)
    ]);

    return NextResponse.json(nutritionData);
  } catch (error: any) {
    console.error("Error analyzing food:", error.message || error);
    
    // Check if it's a timeout error
    if (error.message && error.message.includes("timed out")) {
      // Attempt to get approximate values instead
      try {
        const preprocessedFood = aiPreprocessFood(foodDescription);
        const fallbackData = approximateNutritionForFood(preprocessedFood);
        
        return NextResponse.json({
          nutritionalInfo: fallbackData,
          source: "Timeout Fallback (Approximated)",
          food: foodDescription,
          message: "API request timed out. Using approximated values."
        });
      } catch (fallbackError) {
        // If even the fallback fails, return a generic response
        return NextResponse.json({
          nutritionalInfo: {
            calories: 250,
            protein: 5,
            fat: 10,
            carbohydrates: 30,
            fiber: 2,
            sugar: 15,
            sodium: 200,
            cholesterol: 25
          },
          source: "Generic Fallback",
          food: foodDescription,
          message: "API request timed out and fallback approximation failed."
        });
      }
    }
    
    return NextResponse.json(
      { error: "Failed to analyze food", message: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}