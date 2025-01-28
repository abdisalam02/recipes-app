// src/app/api/recipes/route.ts

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import supabase from '../../../../lib/supabaseClient'; // Corrected import path
import {
  RecipeInput,
  NutritionalInfo,
  RecipeDetail,
  RecipeIngredient,
} from '../../../../lib/types'; // Corrected import path
import { getNutritionalInfo } from '../../../../lib/nutrition'; // Corrected import path

/**
 * GET /api/recipes
 * Fetches all recipes, including ingredients, steps, and aggregate nutritional info.
 */
export async function GET() {
  try {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        category,
        region,
        image,
        description,
        portion,
        nutritional_info,
        recipe_ingredients (
          ingredient_id,
          quantity,
          unit,
          ingredient:ingredients (
            id,
            name
          )
        ),
        steps (
          id,
          order,
          description
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase GET recipes error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(recipes, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes
 * Creates a new recipe, associates ingredients (creating new ones if necessary),
 * inserts steps, fetches nutritional information, inserts per-ingredient nutritional info,
 * aggregates it, and updates the recipe's nutritional_info jsonb field.
 */
export async function POST(request: NextRequest) {
  try {
    const data: RecipeInput = await request.json();
    const { title, category, region, description, ingredients, steps, portion, image } = data;

    // Basic validation
    if (
      !title ||
      !category ||
      !region ||
      !description ||
      !portion ||
      !Array.isArray(ingredients) ||
      !Array.isArray(steps)
    ) {
      return NextResponse.json(
        { error: 'All fields are required and must be in the correct format.' },
        { status: 400 }
      );
    }

    // Insert recipe into Supabase
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title,
        category,
        region,
        description,
        portion,
        image: image || null,
      })
      .select('*')
      .single();

    if (recipeError) {
      console.error('Error inserting recipe:', recipeError.message);
      throw recipeError;
    }

    // Handle ingredients: get or create ingredient IDs
    const processedIngredients: { ingredient_id: number; quantity: number; unit: string }[] = [];

    for (const ing of ingredients) {
      if (!ing.name || !ing.quantity || !ing.unit) {
        console.warn('Incomplete ingredient data:', ing);
        continue; // Skip incomplete ingredients
      }

      // Standardize unit before processing
      const standardizedUnit = standardizeUnit(ing.unit.trim());

      // Convert 'whole' units to grams if necessary
      const { convertedQuantity, finalUnit } = convertToStandardUnit(
        ing.name.trim(),
        ing.quantity,
        standardizedUnit
      );

      // Get or create ingredient
      const ingredientId = await getOrCreateIngredient(ing.name.trim());

      if (!ingredientId) {
        console.error(`Failed to get or create ingredient: ${ing.name}`);
        continue; // Skip this ingredient
      }

      processedIngredients.push({
        ingredient_id: ingredientId,
        quantity: convertedQuantity,
        unit: finalUnit, // Use standardized and converted unit
      });
    }

    if (processedIngredients.length === 0) {
      console.warn('No valid ingredients to process.');
      // Optionally, decide whether to proceed without ingredients
    }

    // Insert into recipe_ingredients table
    const { data: recipeIngredientsData, error: recipeIngredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(
        processedIngredients.map((ing) => ({
          recipe_id: recipeData.id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
        }))
      )
      .select('*');

    if (recipeIngredientsError) {
      console.error('Error inserting recipe ingredients:', recipeIngredientsError.message);
      throw recipeIngredientsError;
    }

    // Insert steps
    const stepsWithRecipeId = steps.map((step, index) => ({
      recipe_id: recipeData.id,
      order: step.order || index + 1,
      description: step.description,
    }));

    const { data: stepsData, error: stepsError } = await supabase
      .from('steps')
      .insert(stepsWithRecipeId)
      .select('*');

    if (stepsError) {
      console.error('Error inserting steps:', stepsError.message);
      throw stepsError;
    }

    // Initialize total nutritional info
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

    // Insert per-ingredient nutritional info and aggregate using Promise.all for efficiency
    const nutritionalPromises = (recipeIngredientsData || []).map(async (ing) => {
      const ingredient_id = ing.ingredient_id;

      if (!ingredient_id) {
        console.error('Ingredient ID is missing for ingredient in recipe.');
        return null;
      }

      // Fetch ingredient details to get the name
      const { data: ingredientData, error: ingredientError } = await supabase
        .from('ingredients')
        .select('name')
        .eq('id', ingredient_id)
        .single();

      if (ingredientError) {
        console.error(
          `Failed to fetch ingredient name for ID ${ingredient_id}:`,
          ingredientError.message
        );
        return null;
      }

      const ingredientName = ingredientData.name;

      // Fetch nutritional info via getNutritionalInfo
      const nutritionalData = await getNutritionalInfo(
        ingredientName,
        ing.quantity,
        ing.unit
      );

      if (nutritionalData) {
        // Insert into nutritional_info table
        const { error: nutritionalError } = await supabase
          .from('nutritional_info')
          .insert([
            {
              recipe_id: recipeData.id,
              ingredient_id: ingredient_id,
              calories: nutritionalData.calories,
              protein: nutritionalData.protein,
              fat: nutritionalData.fat,
              carbohydrates: nutritionalData.carbohydrates,
              fiber: nutritionalData.fiber,
              sugar: nutritionalData.sugar,
              sodium: nutritionalData.sodium,
              cholesterol: nutritionalData.cholesterol,
            },
          ]);

        if (nutritionalError) {
          console.error('Error inserting nutritional info:', nutritionalError.message);
          // Optionally, continue or handle rollback
          return null;
        }

        // Return the nutritional data for aggregation
        return nutritionalData;
      } else {
        console.warn(`No nutritional data found for ingredient "${ingredientName}".`);
        return null;
      }
    });

    // Await all nutritional info fetches
    const nutritionalResults = await Promise.all(nutritionalPromises);

    // Aggregate nutritional information
    nutritionalResults.forEach((nutri) => {
      if (nutri) {
        totalNutritionalInfo.calories += nutri.calories;
        totalNutritionalInfo.protein += nutri.protein;
        totalNutritionalInfo.fat += nutri.fat;
        totalNutritionalInfo.carbohydrates += nutri.carbohydrates;
        totalNutritionalInfo.fiber += nutri.fiber;
        totalNutritionalInfo.sugar += nutri.sugar;
        totalNutritionalInfo.sodium += nutri.sodium;
        totalNutritionalInfo.cholesterol += nutri.cholesterol;
      }
    });

    console.log('Total Nutritional Info (All Ingredients):', totalNutritionalInfo);

    // Store total nutrients without scaling by portion
    const totalNutrients: NutritionalInfo = {
      calories: roundToOneDecimal(totalNutritionalInfo.calories),
      protein: roundToOneDecimal(totalNutritionalInfo.protein),
      fat: roundToOneDecimal(totalNutritionalInfo.fat),
      carbohydrates: roundToOneDecimal(totalNutritionalInfo.carbohydrates),
      fiber: roundToOneDecimal(totalNutritionalInfo.fiber),
      sugar: roundToOneDecimal(totalNutritionalInfo.sugar),
      sodium: roundToOneDecimal(totalNutritionalInfo.sodium),
      cholesterol: roundToOneDecimal(totalNutritionalInfo.cholesterol),
    };

    console.log('Total Nutritional Info (Total):', totalNutrients);

    // Update the recipe with total nutritional_info
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ nutritional_info: totalNutrients })
      .eq('id', recipeData.id);

    if (updateError) {
      console.error(
        'Error updating recipe with nutritional info:',
        updateError.message
      );
      return NextResponse.json(
        {
          error: 'Recipe added, but failed to update nutritional information.',
        },
        { status: 500 }
      );
    }

    console.log(`Updating recipe ID ${recipeData.id} with nutritional info:`, totalNutrients);

    return NextResponse.json(
      { message: 'Recipe added successfully.', recipe: recipeData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding recipe:', error.message);
    return NextResponse.json({ error: 'Failed to add recipe.' }, { status: 500 });
  }
}

/**
 * Helper function to get or create an ingredient.
 * @param name - The name of the ingredient.
 * @returns The ID of the existing or newly created ingredient, or null if failed.
 */
async function getOrCreateIngredient(name: string): Promise<number | null> {
  try {
    // Check if the ingredient exists (case-insensitive)
    const { data, error } = await supabase
      .from('ingredients')
      .select('id')
      .ilike('name', name)
      .single();

    if (data) {
      return data.id;
    } else if (error && error.code === 'PGRST116') { // Row not found
      // Create the ingredient
      const { data: newIngredient, error: insertError } = await supabase
        .from('ingredients')
        .insert({ name })
        .select('id')
        .single();

      if (insertError) {
        console.error(`Error creating ingredient "${name}":`, insertError.message);
        return null;
      }

      return newIngredient.id;
    } else {
      console.error(`Error fetching ingredient "${name}":`, error.message);
      return null;
    }
  } catch (error) {
    console.error(`Unhandled error in getOrCreateIngredient for "${name}":`, error);
    return null;
  }
}

/**
 * Helper function to standardize units.
 * Converts various representations to standard abbreviations.
 * @param unit - The unit string to standardize.
 * @returns The standardized unit abbreviation.
 */
function standardizeUnit(unit: string): string {
  const unitMap: { [key: string]: string } = {
    grams: 'g',
    gram: 'g',
    g: 'g',
    kilograms: 'kg',
    kilogram: 'kg',
    kg: 'kg',
    milliliters: 'ml',
    milliliter: 'ml',
    ml: 'ml',
    liters: 'l',
    liter: 'l',
    l: 'l',
    whole: 'whole',
    pieces: 'whole',
    piece: 'whole',
    tbsp: 'tbsp',
    tablespoon: 'tbsp',
    tablespoons: 'tbsp',
    teaspoons: 'tsp',
    teaspoon: 'tsp',
    cups: 'cup',
    cup: 'cup',
    // Add more mappings as needed
  };

  const standardized = unitMap[unit.toLowerCase()];
  return standardized || unit.toLowerCase(); // Return the original unit if not found in the map
}

/**
 * Helper function to convert units to standard measurements.
 * For example, converting 'whole' eggs to grams based on average weight.
 * @param name - Ingredient name.
 * @param quantity - Quantity of the ingredient.
 * @param unit - Standardized unit.
 * @returns An object containing the converted quantity and final unit.
 */
function convertToStandardUnit(
  name: string,
  quantity: number,
  unit: string
): { convertedQuantity: number; finalUnit: string } {
  const averageWeights: { [key: string]: number } = {
    egg: 50, // average weight in grams per egg
    // Add more ingredients as needed
  };

  if (unit === 'whole' && averageWeights[name.toLowerCase()]) {
    const convertedQuantity = quantity * averageWeights[name.toLowerCase()];
    return { convertedQuantity, finalUnit: 'g' };
  }

  // For units already in grams or milliliters, return as-is
  return { convertedQuantity: quantity, finalUnit: unit };
}

/**
 * Helper function to round numbers to one decimal place.
 * @param num - The number to round.
 * @returns The rounded number.
 */
function roundToOneDecimal(num: number): number {
  return Math.round(num * 10) / 10;
}
