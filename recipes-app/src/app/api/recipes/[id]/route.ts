// src/app/api/recipes/[id]/route.ts
import { NextResponse } from "next/server";
import supabase from "../../../../../lib/supabaseClient";
import { NextRequest } from "next/server";

// Removed getUserId function since authentication is not required

// GET /api/recipes/:id - Fetch a specific recipe
export async function GET(
  _request: NextRequest, // Prefixed with underscore since it's unused
  { params }: { params: { id: string } }
) {
  if (!params?.id) {
    return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
  }
  const { id } = params;

  try {
    const { data: recipe, error } = await supabase
      .from("recipes")
      .select(`
        *,
        ingredients (
          id,
          quantity,
          unit,
          name
        ),
        steps (
          id,
          order,
          description
        )
      `)
      .eq("id", id)
      .single();

    if (error || !recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(recipe, { status: 200 });
  } catch (error: unknown) { // Changed 'any' to 'unknown'
    if (error instanceof Error) {
      console.error("Error fetching recipe:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch recipe. Please try again later." },
        { status: 500 }
      );
    } else {
      console.error("An unknown error occurred while fetching the recipe.");
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}

// DELETE /api/recipes/:id - Delete a specific recipe
export async function DELETE(
  _request: NextRequest, // Prefixed with underscore since it's unused
  { params }: { params: { id: string } }
) {
  if (!params?.id) {
    return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
  }
  const { id } = params;
  const recipeId = Number(id);

  if (isNaN(recipeId)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  try {
    // Delete the recipe. If foreign keys are set with ON DELETE CASCADE, related records will be deleted automatically.
    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: "Recipe deleted successfully" }, { status: 200 });
  } catch (error: unknown) { // Changed 'any' to 'unknown'
    if (error instanceof Error) {
      console.error("Error deleting recipe:", error.message);
      return NextResponse.json(
        { error: "Failed to delete recipe." },
        { status: 500 }
      );
    } else {
      console.error("An unknown error occurred while deleting the recipe.");
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}
