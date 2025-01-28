// src/app/api/recipes/[id]/route.ts

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import supabase from "../../../../../lib/supabaseClient"; // Corrected import path
import { RecipeInput } from "../../../../../lib/types"; // Ensure this is correctly imported

/**
 * GET /api/recipes/[id]
 * Fetches a single recipe by its ID, including ingredients, steps, and per-ingredient nutritional info.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

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

    return NextResponse.json(detailedRecipe, { status: 200 });
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
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { title, category, description, portion, image }: RecipeInput = await request.json();

  if (!id || !title || !category || !description || !portion || portion < 1) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  try {
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

    return NextResponse.json(updatedRecipe, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update recipe." }, { status: 500 });
  }
}

/**
 * DELETE /api/recipes/[id]
 * Deletes an existing recipe by its ID.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

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
