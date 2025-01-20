// src/app/api/recipes/[id]/route.ts
import { NextResponse } from "next/server";
import supabase from "../../../../../lib/supabaseClient";
import { NextRequest } from "next/server";

// Function to retrieve user ID from the request (optional, for authenticated routes)
const getUserId = async (request: NextRequest): Promise<string | null> => {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split("Bearer ")[1];
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user.id; // Supabase user ID is a string (UUID)
};

// GET /api/recipes/:id - Fetch a specific recipe
export async function GET(
  request: NextRequest,
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
  } catch (error: any) {
    console.error("Error fetching recipe:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch recipe. Please try again later." },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/:id - Delete a specific recipe
export async function DELETE(
  request: NextRequest,
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
  } catch (error: any) {
    console.error("Error deleting recipe:", error.message);
    return NextResponse.json(
      { error: "Failed to delete recipe." },
      { status: 500 }
    );
  }
}
