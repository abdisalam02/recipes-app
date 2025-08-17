// src/app/api/recipes/[id]/route.ts

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import supabase from "../../../../../lib/supabaseClient"; // Corrected import path
import { RecipeInput } from "../../../../../lib/types"; // Ensure this is correctly imported

export const revalidate = 300; // 5 minutes for item pages

/**
 * GET /api/recipes/[id]
 * Fetches a single recipe by its ID, including ingredients, steps, and per-ingredient nutritional info.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Recipe ID is required." }, { status: 400 });
  }

  try {
    const { data: recipe, error } = await supabase
      .from("recipes")
      .select(`
        id,
        title,
        category,
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
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
    }

    const { data: perIngredientNutritionalInfo } = await supabase
      .from("nutritional_info")
      .select("*")
      .eq("recipe_id", id);

    const detailedRecipe = {
      ...recipe,
      per_ingredient_nutritional_info: perIngredientNutritionalInfo || [],
    };

    return new NextResponse(JSON.stringify(detailedRecipe), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recipe." }, { status: 500 });
  }
}

/**
 * PUT /api/recipes/[id]
 * Updates an existing recipe by its ID.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { title, category, description, portion, image, ingredients, steps }: RecipeInput & {
    ingredients?: Array<{ id?: number; name: string; quantity: number; unit: string }>;
    steps?: Array<{ id?: number; order: number; description: string }>;
  } = await request.json();

  if (!id || !title || !category || !description || !portion || portion < 1) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  // Validate ingredients and steps if provided
  if (ingredients && (!Array.isArray(ingredients) || ingredients.length === 0)) {
    return NextResponse.json({ error: "At least one ingredient is required." }, { status: 400 });
  }
  if (steps && (!Array.isArray(steps) || steps.length === 0)) {
    return NextResponse.json({ error: "At least one step is required." }, { status: 400 });
  }

  try {
    // Start a transaction by updating the main recipe first
    const { data: updatedRecipe, error } = await supabase
      .from("recipes")
      .update({
        title,
        category,
        description,
        portion,
        image,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update recipe." }, { status: 500 });
    }

    // Update ingredients if provided
    if (ingredients) {
      // First, delete existing ingredients for this recipe
      const { error: deleteIngredientsError } = await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", id);

      if (deleteIngredientsError) {
        console.error("Error deleting existing ingredients:", deleteIngredientsError);
        return NextResponse.json({ error: "Failed to update ingredients." }, { status: 500 });
      }

      // Process each ingredient
      for (const ing of ingredients) {
        let ingredientId = ing.id;

        // If no ingredient_id but we have a name, try to find or create the ingredient
        if (!ingredientId && ing.name) {
          // First try to find existing ingredient by name
          const { data: existingIngredient } = await supabase
            .from("ingredients")
            .select("id")
            .eq("name", ing.name.trim().toLowerCase())
            .single();

          if (existingIngredient) {
            ingredientId = existingIngredient.id;
          } else {
            // Create new ingredient
            const { data: newIngredient, error: createError } = await supabase
              .from("ingredients")
              .insert({ name: ing.name.trim().toLowerCase() })
              .select("id")
              .single();

            if (createError) {
              console.error("Error creating new ingredient:", createError);
              continue; // Skip this ingredient if we can't create it
            }
            ingredientId = newIngredient.id;
          }
        }

        // Insert the recipe-ingredient relationship
        if (ingredientId) {
          const { error: insertError } = await supabase
            .from("recipe_ingredients")
            .insert({
              recipe_id: id,
              ingredient_id: ingredientId,
              quantity: ing.quantity,
              unit: ing.unit,
            });

          if (insertError) {
            console.error("Error inserting recipe ingredient:", insertError);
          }
        }
      }
    }

    // Update steps if provided
    if (steps) {
      // First, delete existing steps for this recipe
      const { error: deleteStepsError } = await supabase
        .from("steps")
        .delete()
        .eq("recipe_id", id);

      if (deleteStepsError) {
        console.error("Error deleting existing steps:", deleteStepsError);
        return NextResponse.json({ error: "Failed to update steps." }, { status: 500 });
      }

      // Insert new steps
      const stepsToInsert = steps.map((step) => ({
        recipe_id: id,
        order: step.order,
        description: step.description,
      }));

      const { error: insertStepsError } = await supabase
        .from("steps")
        .insert(stepsToInsert);

      if (insertStepsError) {
        console.error("Error inserting new steps:", insertStepsError);
        return NextResponse.json({ error: "Failed to update steps." }, { status: 500 });
      }
    }

    // Fetch the updated recipe with all related data
    const { data: finalRecipe, error: fetchError } = await supabase
      .from("recipes")
      .select(`
        id,
        title,
        category,
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
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching updated recipe:", fetchError);
      return NextResponse.json({ error: "Failed to fetch updated recipe." }, { status: 500 });
    }

    return NextResponse.json(finalRecipe, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/recipes/[id]:", error);
    return NextResponse.json({ error: "Failed to update recipe." }, { status: 500 });
  }
}

/**
 * DELETE /api/recipes/[id]
 * Deletes an existing recipe by its ID.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Recipe ID is required." }, { status: 400 });
  }

  try {
    // Delete recipe and associated nutritional info
    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete recipe." }, { status: 500 });
    }

    // Optionally, delete associated data (e.g., nutritional info, ingredients)
    await supabase.from("nutritional_info").delete().eq("recipe_id", id);

    return NextResponse.json({ message: "Recipe deleted successfully." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete recipe." }, { status: 500 });
  }
}
