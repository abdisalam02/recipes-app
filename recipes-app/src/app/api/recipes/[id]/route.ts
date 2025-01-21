// api/recipes/[id].ts
import { NextResponse } from "next/server";
import supabase from "../../../../../lib/supabaseClient";
import { NextRequest } from "next/server";

// GET /api/recipes/:id - Fetch a specific recipe
export async function GET(
  _request: NextRequest, 
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to fetch recipe. Please try again later." },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}

// DELETE /api/recipes/:id - Delete a specific recipe
export async function DELETE(
  _request: NextRequest, 
  { params }: { params: { id: string } }
) {
  if (!params?.id) {
    return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
  }
  const { id } = params;

  try {
    const { data, error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
    }

    return NextResponse.json({ message: "Recipe deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to delete recipe. Please try again later." },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}
