// src/app/api/recipes/route.ts
import { NextResponse } from "next/server";
import supabase from "../../../../lib/supabaseClient";
import { NextRequest } from "next/server";

// GET /api/recipes - Fetch all recipes
export async function GET(_request: NextRequest) { // Prefixed with underscore since it's unused
  try {
    const { data: recipes, error } = await supabase
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
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(recipes, { status: 200 });
  } catch (error: unknown) { // Changed 'any' to 'unknown'
    if (error instanceof Error) {
      console.error("Error fetching recipes:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch recipes. Please try again later." },
        { status: 500 }
      );
    } else {
      console.error("An unknown error occurred while fetching recipes.");
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, category, region, description, ingredients, steps, portion, image } = data;

    // Basic validation
    if (!title || !category || !region || !description || !ingredients || !steps || !portion) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Insert recipe into Supabase
    // Insert recipe into Supabase
const { data: recipe, error: recipeError } = await supabase
.from("recipes")
.insert([
  {
    title,
    category,
    region, // Include region here
    description,
    image: image || null, // Handle optional image
    portion,
  },
])
.select("*")
.single();

    // Prepare ingredients and steps with recipe_id
    const ingredientsWithRecipeId = ingredients.map((ing: unknown) => {
      if (
        typeof ing === "object" &&
        ing !== null &&
        "quantity" in ing &&
        "unit" in ing &&
        "name" in ing
      ) {
        return {
          ...(ing as Record<string, unknown>),
          recipe_id: recipe.id,
        };
      } else {
        throw new Error("Invalid ingredient format");
      }
    });

    const stepsWithRecipeId = steps.map((step: unknown, index: number) => {
      if (
        typeof step === "object" &&
        step !== null &&
        "description" in step
      ) {
        return {
          ...(step as Record<string, unknown>),
          order: index + 1,
          recipe_id: recipe.id,
        };
      } else {
        throw new Error("Invalid step format");
      }
    });

    // Insert ingredients
    const { error: ingredientsError } = await supabase
      .from("ingredients")
      .insert(ingredientsWithRecipeId);

    if (ingredientsError) {
      throw new Error(`Supabase Error (ingredients): ${ingredientsError.message}`);
    }

    // Insert steps
    const { error: stepsError } = await supabase
      .from("steps")
      .insert(stepsWithRecipeId);

    if (stepsError) {
      throw new Error(`Supabase Error (steps): ${stepsError.message}`);
    }

    return NextResponse.json(recipe, { status: 201 });
  } catch (error: unknown) { // Changed 'any' to 'unknown'
    if (error instanceof Error) {
      console.error("Error creating recipe:", error.message);
      return NextResponse.json(
        { error: error.message || "Failed to create recipe." },
        { status: 500 }
      );
    } else {
      console.error("An unknown error occurred while creating the recipe.");
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
  }
}
