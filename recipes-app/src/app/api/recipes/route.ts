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

    // Local helpers to avoid runtime reference issues
    function standardizeUnit(u: string): string {
      const unitMap: { [key: string]: string } = {
        grams: 'g', gram: 'g', g: 'g',
        kilograms: 'kg', kilogram: 'kg', kg: 'kg',
        milliliters: 'ml', milliliter: 'ml', ml: 'ml',
        liters: 'l', liter: 'l', l: 'l',
        whole: 'whole', piece: 'whole', pieces: 'whole', clove: 'whole', cloves: 'whole', bunch: 'whole', packet: 'whole',
        tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
        tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
        cup: 'cup', cups: 'cup'
      };
      return unitMap[u.toLowerCase()] || u.toLowerCase();
    }
    function convertToStandardUnit(name: string, quantity: number, unit: string): { convertedQuantity: number; finalUnit: string } {
      const averageWeights: { [key: string]: number } = { egg: 50 };
      if (unit === 'whole' && averageWeights[name.toLowerCase()]) {
        return { convertedQuantity: quantity * averageWeights[name.toLowerCase()], finalUnit: 'g' };
      }
      return { convertedQuantity: quantity, finalUnit: unit };
    }
    function roundToOneDecimal(num: number): number {
      return Math.round(num * 10) / 10;
    }

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
		const processedIngredients: { ingredient_id: number; quantity: number; unit: string; name: string }[] = [];
		const ingredientErrors: string[] = [];

		for (const ing of ingredients) {
			try {
				// Accept provided ingredient_id if present; otherwise require name
				const providedId = (ing as any).ingredient_id as number | undefined;
				const hasId = typeof providedId === 'number' && providedId > 0;
				const hasName = typeof ing.name === 'string' && ing.name.trim() !== '';
				const hasQty = typeof ing.quantity === 'number' && ing.quantity > 0;
				const hasUnit = typeof ing.unit === 'string' && ing.unit.trim() !== '';

				if ((!hasId && !hasName) || !hasQty || !hasUnit) {
					console.warn('Incomplete ingredient data:', ing);
					ingredientErrors.push(`Incomplete data for ingredient: ${ing.name || 'unnamed'}`);
					continue; // Skip incomplete ingredients
				}

				// Sanitize ingredient name if present
				const sanitizedName = hasName ? ing.name!.trim().substring(0, 100) : '';

				// Standardize unit before processing
				const standardizedUnit = standardizeUnit(ing.unit.trim());

				// Convert certain 'whole' units if we have mappings (eggs, etc.)
				const { convertedQuantity, finalUnit } = convertToStandardUnit(
					hasName ? sanitizedName : '',
					ing.quantity,
					standardizedUnit
				);

				let ingredientId: number | null = null;
				if (hasId) {
					ingredientId = providedId!;
				} else {
					// Get or create ingredient by name
					try {
						ingredientId = await getOrCreateIngredient(sanitizedName);
						if (!ingredientId) {
							console.error(`Failed to get or create ingredient: ${sanitizedName}`);
							ingredientErrors.push(`Failed to process ingredient: ${sanitizedName}`);
							continue; // Skip this ingredient
						}
					} catch (ingredientError: any) {
						console.error(`Error processing ingredient ${sanitizedName}:`, ingredientError);
						ingredientErrors.push(`Error with ingredient ${sanitizedName}: ${ingredientError.message}`);
						continue;
					}
				}

				processedIngredients.push({
					ingredient_id: ingredientId!,
					quantity: convertedQuantity,
					unit: finalUnit,
					name: hasName ? sanitizedName : ''
				});
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

		// Aggregate duplicates by ingredient_id into canonical units to satisfy unique constraint
		const liquidSet = new Set<string>(['water', 'olive oil', 'vegetable oil', 'sesame oil', 'soy sauce', 'milk']);
		function toCanonical(name: string, qty: number, unit: string): { quantity: number; unit: string } {
			const canonicalUnit = liquidSet.has(name.toLowerCase()) ? 'ml' : 'g';
			let quantity = qty;
			let from = unit;
			// Normalize basics
			if (from === 'kg' && canonicalUnit === 'g') { quantity = qty * 1000; from = 'g'; }
			if (from === 'l' && canonicalUnit === 'ml') { quantity = qty * 1000; from = 'ml'; }
			if (from === 'tbsp') { quantity = canonicalUnit === 'ml' ? qty * 15 : qty * 12; from = canonicalUnit; }
			if (from === 'tsp') { quantity = canonicalUnit === 'ml' ? qty * 5 : qty * 4; from = canonicalUnit; }
			if (from === 'cup') { quantity = canonicalUnit === 'ml' ? qty * 240 : qty * 120; from = canonicalUnit; }
			if (from === 'whole') {
				const avg: Record<string, number> = { egg: 50, onion: 150, tomato: 120, garlic: 3, 'bell pepper': 120, pepper: 120 };
				const key = Object.keys(avg).find(k => name.toLowerCase().includes(k));
				if (key && canonicalUnit === 'g') { quantity = qty * avg[key]; from = 'g'; }
			}
			// If still not canonical, and from matches canonical, done
			return { quantity, unit: canonicalUnit };
		}

		const aggregatedMap = new Map<number, { quantity: number; unit: string; name: string }>();
		for (const item of processedIngredients) {
			const { quantity, unit } = toCanonical(item.name || '', item.quantity, item.unit);
			const existing = aggregatedMap.get(item.ingredient_id);
			if (existing) {
				existing.quantity += quantity;
				aggregatedMap.set(item.ingredient_id, existing);
			} else {
				aggregatedMap.set(item.ingredient_id, { quantity, unit, name: item.name || '' });
			}
		}
		const aggregatedIngredients = Array.from(aggregatedMap.entries()).map(([ingredient_id, v]) => ({ ingredient_id, quantity: v.quantity, unit: v.unit }));

      // Insert into recipe_ingredients table
		let recipeIngredientsData = [];
		if (aggregatedIngredients.length > 0) {
			try {
				const { data: insertedIngredients, error: recipeIngredientsError } = await supabase
					.from('recipe_ingredients')
					.insert(
						aggregatedIngredients.map((ing) => ({
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
					recipeIngredientsData = insertedIngredients as any;
					console.log(`Successfully inserted ${insertedIngredients.length} ingredients`);
				}
			} catch (recipeIngError: any) {
				console.error('Error inserting recipe ingredients:', recipeIngError);
				// Continue with steps even if ingredients fail
			}
		} else {
			console.warn('No ingredients to insert for recipe:', recipeData.id);
		}

		// Build ingredientId -> name map (bulk fetch) for nutrition
		const ingredientIds = aggregatedIngredients.map(i => i.ingredient_id);
		let idToName = new Map<number, string>();
		if (ingredientIds.length > 0) {
			const { data: ingredientRows, error: ingredientFetchError } = await supabase
				.from('ingredients')
				.select('id,name')
				.in('id', ingredientIds);
			if (ingredientFetchError) {
				console.error('Failed to fetch ingredient names for nutrition:', ingredientFetchError.message);
			} else if (ingredientRows) {
				for (const row of ingredientRows as any[]) {
					idToName.set(row.id, row.name);
				}
			}
		}

		// Insert per-ingredient nutritional info and aggregate using Promise.all for efficiency
		const nutritionalPromises = aggregatedIngredients.map(async (ing) => {
			const ingredient_id = ing.ingredient_id;
			const name = idToName.get(ingredient_id) || '';
			if (!name) {
				console.warn(`Missing ingredient name for ID ${ingredient_id}`);
				return null;
			}
			try {
				const nutritionalData = await getNutritionalInfo(name, ing.quantity, ing.unit);
				if (nutritionalData) {
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
						return null;
					}
					return nutritionalData;
				} else {
					console.warn(`No nutritional data found for ingredient "${name}".`);
					const defaultNutritionalData = { calories: 0, protein: 0, fat: 0, carbohydrates: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 };
					const { error: defaultNutritionalError } = await supabase
						.from('nutritional_info')
						.insert([{ recipe_id: recipeData.id, ingredient_id, ...defaultNutritionalData }]);
					if (defaultNutritionalError) {
						console.error('Error inserting default nutritional info:', defaultNutritionalError.message);
					}
					return null;
				}
			} catch (nutritionError: any) {
				console.error(`Error fetching nutritional info for "${name}":`, nutritionError.message);
				return null;
			}
		});

      // Await all nutritional info fetches
      const nutritionalResults = await Promise.all(nutritionalPromises);

      // Aggregate nutritional information
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

		console.log(`Prepared ${sanitizedSteps.length} steps for recipe ${recipeData.id}`);
		if (sanitizedSteps.length > 0) {
			console.log('First step preview:', sanitizedSteps[0]);
		}

		if (sanitizedSteps.length > 0) {
			try {
				const { data: stepsData, error: stepsError } = await supabase
					.from('steps')
					.insert(sanitizedSteps)
					.select('*');

				if (stepsError) {
					console.error('Error inserting steps:', stepsError.message, stepsError);
					// Continue even if steps fail
				}
				if (stepsData && Array.isArray(stepsData)) {
					console.log(`Successfully inserted ${stepsData.length} steps for recipe ${recipeData.id}`);
				}
			} catch (stepsInsertError: any) {
				console.error('Error inserting steps:', stepsInsertError);
				// Continue even if steps fail
			}
		}

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