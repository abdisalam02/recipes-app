// src/app/api/ingredients/route.ts

import { NextResponse } from "next/server";
import supabase from "../../../../lib/supabaseClient";

/**
 * GET /api/ingredients
 * Fetches all ingredients.
 */
export async function GET() {
  try {
    const { data: ingredients, error } = await supabase
      .from("ingredients")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(ingredients, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching ingredients:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch ingredients. Please try again later." },
        { status: 500 }
      );
    } else {
      console.error("An unknown error occurred while fetching ingredients.");
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}

/**
 * POST /api/ingredients
 * Creates a new ingredient.
 */
export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing 'name' field." },
        { status: 400 }
      );
    }

    // Check if ingredient already exists (case-insensitive)
    const { data: existingIngredient, error: selectError } = await supabase
      .from("ingredients")
      .select("id")
      .ilike("name", name.trim())
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      throw new Error(selectError.message);
    }

    if (existingIngredient) {
      return NextResponse.json(existingIngredient, { status: 200 });
    }

    // Insert new ingredient
    const { data: newIngredient, error: insertError } = await supabase
      .from("ingredients")
      .insert({ name: name.trim() })
      .select("id, name")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json(newIngredient, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error creating ingredient:", error.message);
      return NextResponse.json(
        { error: "Failed to create ingredient. Please try again later." },
        { status: 500 }
      );
    } else {
      console.error("An unknown error occurred while creating an ingredient.");
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}
