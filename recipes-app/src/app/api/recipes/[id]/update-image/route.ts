// src/app/api/recipes/[id]/update-image/route.ts

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import supabase from "../../../../../../lib/supabaseClient";

/**
 * PATCH /api/recipes/[id]/update-image
 * Updates the image URL of an existing recipe by its ID.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { imageUrl } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Recipe ID is required." }, { status: 400 });
  }

  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: "Valid imageUrl is required." }, { status: 400 });
  }

  try {
    // Update the image URL in the recipes table
    const { data: updatedRecipe, error } = await supabase
      .from("recipes")
      .update({ image: imageUrl })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating recipe image:", error.message);
      return NextResponse.json({ error: "Failed to update recipe image." }, { status: 500 });
    }

    return NextResponse.json(updatedRecipe, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error updating recipe image with ID ${id}:`, error.message);
      return NextResponse.json(
        { error: "Failed to update recipe image. Please try again later." },
        { status: 500 }
      );
    } else {
      console.error(`An unknown error occurred while updating recipe image with ID ${id}.`);
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}
