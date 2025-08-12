// src/app/api/recipes/route.ts

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import supabase from '../../../../lib/supabaseClient'; // Corrected import path
import {
  RecipeInput,
  NutritionalInfo,
  RecipeDetail,
  RecipeIngredient,
  Recipe,
  RecipeWithIngredients,
} from '../../../../lib/types'; // Corrected import path
import { getNutritionalInfo } from '../../../../lib/existingNutrition'; // Corrected import path

export const revalidate = 300; // 5 minutes ISR for read requests

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

    // Cache-Control to enable edge caching
    return new NextResponse(JSON.stringify(recipes ?? []), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400'
      }
    });
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
    const { title, category, region, description, ingredients = [], steps = [], portion, image } = data;

    console.log('Received recipe submission:', {
      title,
      category,
      region,
      ingredientsCount: ingredients?.length || 0,
      stepsCount: steps?.length || 0,
      portion
    });

    // Enhanced validation with specific error messages
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Recipe title is required and must be a non-empty string.' },
        { status: 400 }
      );
    }
    
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json(
        { error: 'Recipe category is required and must be a non-empty string.' },
        { status: 400 }
      );
    }
    
    if (!region || typeof region !== 'string' || region.trim() === '') {
      return NextResponse.json(
        { error: 'Recipe region is required and must be a non-empty string.' },
        { status: 400 }
      );
    }
    
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Recipe description is required and must be a non-empty string.' },
        { status: 400 }
      );
    }
    
    if (!portion || typeof portion !== 'number' || portion < 1) {
      return NextResponse.json(
        { error: 'Recipe portion is required and must be a positive number.' },
        { status: 400 }
      );
    }
    
    // Allow empty ingredients and steps arrays - we'll create a recipe without them
    // This is a change from the previous validation that required at least one ingredient and step
    
    // Sanitize and validate inputs before database insertion
    const sanitizedTitle = title.trim().substring(0, 255); // Limit title length
    const sanitizedCategory = category.trim().substring(0, 100);
    const sanitizedRegion = region.trim().substring(0, 100);
    const sanitizedDescription = description.trim().substring(0, 1000); // Limit description length
    const sanitizedImage = image ? image.trim() : null;

    // Insert recipe into Supabase
    try {
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          title: sanitizedTitle,
          category: sanitizedCategory,
          region: sanitizedRegion,
          description: sanitizedDescription,
          portion,
          image: sanitizedImage,
        })
        .select('*')
        .single();

      if (recipeError) {
        console.error('Error inserting recipe:', recipeError.message);
        return NextResponse.json(
          { error: `Failed to insert recipe: ${recipeError.message}` },
          { status: 500 }
        );
      }

      // Handle ingredients: get or create ingredient IDs
      const processedIngredients: { ingredient_id: number; quantity: number; unit: string }[] = [];
      const ingredientErrors: string[] = [];

      for (const ing of ingredients) {
        try {
          if (!ing.name || !ing.quantity || !ing.unit) {
            console.warn('Incomplete ingredient data:', ing);
            ingredientErrors.push(`Incomplete data for ingredient: ${ing.name || 'unnamed'}`);
            continue; // Skip incomplete ingredients
          }

          // Sanitize ingredient name
          const sanitizedName = ing.name.trim().substring(0, 100); // Limit name length
          
          if (sanitizedName === '') {
            ingredientErrors.push('Ingredient name cannot be empty');
            continue;
          }

          // Standardize unit before processing
          const standardizedUnit = standardizeUnit(ing.unit.trim());

          // Convert 'whole' units to grams if necessary
          const { convertedQuantity, finalUnit } = convertToStandardUnit(
            sanitizedName,
            ing.quantity,
            standardizedUnit
          );

          // Get or create ingredient with better error handling
          try {
            const ingredientId = await getOrCreateIngredient(sanitizedName);

            if (!ingredientId) {
              console.error(`Failed to get or create ingredient: ${sanitizedName}`);
              ingredientErrors.push(`Failed to process ingredient: ${sanitizedName}`);
              continue; // Skip this ingredient
            }

            processedIngredients.push({
              ingredient_id: ingredientId,
              quantity: convertedQuantity,
              unit: finalUnit, // Use standardized and converted unit
            });
          } catch (ingredientError: any) {
            console.error(`Error processing ingredient ${sanitizedName}:`, ingredientError);
            ingredientErrors.push(`Error with ingredient ${sanitizedName}: ${ingredientError.message}`);
            continue;
          }
        } catch (ingError: any) {
          console.error('Error processing ingredient:', ingError);
          ingredientErrors.push(`Error processing ingredient: ${ingError.message}`);
          continue;
        }
      }

      if (processedIngredients.length === 0) {
        console.warn('No valid ingredients to process.');
        // Don't return an error if there are no ingredients - just continue with an empty array
        // This allows recipes to be created without ingredients initially
      }

      // Insert into recipe_ingredients table
      let recipeIngredientsData = [];
      if (processedIngredients.length > 0) {
        try {
          const { data: insertedIngredients, error: recipeIngredientsError } = await supabase
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
            // Continue with steps even if ingredients fail
          } else if (insertedIngredients) {
            recipeIngredientsData = insertedIngredients;
            console.log(`Successfully inserted ${insertedIngredients.length} ingredients`);
          }
        } catch (recipeIngError: any) {
          console.error('Error inserting recipe ingredients:', recipeIngError);
          // Continue with steps even if ingredients fail
        }
      } else {
        console.warn('No ingredients to insert for recipe:', recipeData.id);
      }

      // Process and sanitize steps
      const sanitizedSteps = steps.map((step, index) => {
        const description = step.description?.trim() || '';
        if (description === '') {
          console.warn(`Empty description for step ${index + 1}`);
        }
        return {
          recipe_id: recipeData.id,
          order: step.order || index + 1,
          description: description.substring(0, 1000), // Limit description length
        };
      }).filter(step => step.description !== '');

      // Insert steps
      if (sanitizedSteps.length > 0) {
        try {
          const { data: stepsData, error: stepsError } = await supabase
            .from('steps')
            .insert(sanitizedSteps)
            .select('*');

          if (stepsError) {
            console.error('Error inserting steps:', stepsError.message);
            // Continue even if steps fail
          }
        } catch (stepsInsertError: any) {
          console.error('Error inserting steps:', stepsInsertError);
          // Continue even if steps fail
        }
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
      const nutritionalPromises = recipeIngredientsData.map(async (ing) => {
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

        try {
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
            
            // Create default nutritional info for ingredients without data
            const defaultNutritionalData = {
              calories: 0,
              protein: 0,
              fat: 0,
              carbohydrates: 0,
              fiber: 0,
              sugar: 0,
              sodium: 0,
              cholesterol: 0,
            };
            
            // Insert default nutritional info to ensure the ingredient is associated with the recipe
            const { error: defaultNutritionalError } = await supabase
              .from('nutritional_info')
              .insert([
                {
                  recipe_id: recipeData.id,
                  ingredient_id: ingredient_id,
                  ...defaultNutritionalData
                },
              ]);
              
            if (defaultNutritionalError) {
              console.error('Error inserting default nutritional info:', defaultNutritionalError.message);
            } else {
              console.log(`Inserted default nutritional info for "${ingredientName}"`);
            }
            
            return null;
          }
        } catch (nutritionError: any) {
          console.error(`Error fetching nutritional info for "${ingredientName}":`, nutritionError.message);
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
        { 
          message: 'Recipe added successfully.', 
          recipe: recipeData,
          warnings: ingredientErrors.length > 0 ? ingredientErrors : undefined
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error adding recipe:', error.message);
    return NextResponse.json(
      { error: `Failed to add recipe: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get or create an ingredient.
 * @param name - The name of the ingredient.
 * @returns The ID of the existing or newly created ingredient, or null if failed.
 */
async function getOrCreateIngredient(name: string): Promise<number | null> {
  // Sanitize the ingredient name
  const sanitizedName = name.trim().substring(0, 100); // Limit to 100 chars
  
  if (sanitizedName === '') {
    console.error('Empty ingredient name provided');
    return null;
  }
  
  // Try up to 3 times to get or create the ingredient
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Attempt ${attempt} to get or create ingredient: "${sanitizedName}"`);
      
      // Check if the ingredient exists (case-insensitive)
      const { data, error } = await supabase
        .from('ingredients')
        .select('id')
        .ilike('name', sanitizedName)
        .single();

      if (data) {
        console.log(`Found existing ingredient "${sanitizedName}" with ID ${data.id}`);
        return data.id;
      } else if (error && error.code === 'PGRST116') { // Row not found
        console.log(`Ingredient "${sanitizedName}" not found, creating new one`);
        
        // Create the ingredient
        try {
          const { data: newIngredient, error: insertError } = await supabase
            .from('ingredients')
            .insert({ name: sanitizedName })
            .select('id')
            .single();

          if (insertError) {
            console.error(`Error creating ingredient "${sanitizedName}":`, insertError.message);
            
            // If it's a unique constraint violation, try to fetch it again
            if (insertError.code === '23505') { // Unique violation
              console.log(`Unique violation for "${sanitizedName}", trying to fetch again`);
              const { data: existingData, error: fetchError } = await supabase
                .from('ingredients')
                .select('id')
                .ilike('name', sanitizedName)
                .single();
                
              if (!fetchError && existingData) {
                console.log(`Found ingredient "${sanitizedName}" after unique violation with ID ${existingData.id}`);
                return existingData.id;
              }
            }
            
            if (attempt < 3) {
              console.log(`Retrying after error (attempt ${attempt}/3)`);
              continue; // Try again
            }
            return null;
          }

          if (!newIngredient || !newIngredient.id) {
            console.error(`Failed to get ID for newly created ingredient "${sanitizedName}"`);
            if (attempt < 3) {
              console.log(`Retrying after missing ID (attempt ${attempt}/3)`);
              continue; // Try again
            }
            return null;
          }

          console.log(`Created new ingredient "${sanitizedName}" with ID ${newIngredient.id}`);
          return newIngredient.id;
        } catch (err: any) {
          console.error(`Error in supabase operation for "${sanitizedName}":`, err.message);
          if (attempt < 3) {
            console.log(`Retrying after exception (attempt ${attempt}/3)`);
            continue; // Try again
          }
          return null;
        }
      } else if (error) {
        console.error(`Error checking for existing ingredient "${sanitizedName}":`, error.message);
        if (attempt < 3) {
          console.log(`Retrying after query error (attempt ${attempt}/3)`);
          continue; // Try again
        }
        return null;
      }
    } catch (err: any) {
      console.error(`Unexpected error for ingredient "${sanitizedName}":`, err.message);
      if (attempt < 3) {
        console.log(`Retrying after unexpected error (attempt ${attempt}/3)`);
        continue; // Try again
      }
      return null;
    }
  }
  
  console.error(`All attempts failed for ingredient "${sanitizedName}"`);
  return null;
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
