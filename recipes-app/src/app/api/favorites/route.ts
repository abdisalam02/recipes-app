// src/app/api/favorites/route.ts
import { NextResponse, NextRequest } from "next/server";
import supabase from "../../../../lib/supabaseClient";

// GET /api/favorites - Fetch all favorites
export async function GET(request: NextRequest) {
  try {
    const { data: favorites, error } = await supabase
      .from("favorites")
      .select(`
        id,
        recipe_id,
        recipe (
          id,
          title,
          category,
          description,
          image,
          portion,
          created_at,
          updated_at
        ),
        created_at
      `);

    if (error) {
      throw error;
    }

    return NextResponse.json(favorites, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching favorites:", error.message);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

// POST /api/favorites - Add a new favorite
export async function POST(request: NextRequest) {
  try {
    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    // Check if the recipe is already favorited
    const { data: existing, error: existingError } = await supabase
      .from("favorites")
      .select("*")
      .eq("recipe_id", recipeId)
      .single();

    if (existingError && existingError.code !== "PGRST116") { // PGRST116: No rows found
      throw existingError;
    }

    if (existing) {
      return NextResponse.json({ error: "Recipe is already favorited" }, { status: 409 }); // Conflict
    }

    // Insert the new favorite
    const { data: newFavorite, error } = await supabase
      .from("favorites")
      .insert([{ recipe_id: recipeId }])
      .select(`
        id,
        recipe_id,
        recipe (
          id,
          title,
          category,
          description,
          image,
          portion,
          created_at,
          updated_at
        ),
        created_at
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(newFavorite, { status: 201 });
  } catch (error: any) {
    console.error("Error adding favorite:", error.message);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("recipe_id", recipeId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "Favorite removed successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error removing favorite:", error.message);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
