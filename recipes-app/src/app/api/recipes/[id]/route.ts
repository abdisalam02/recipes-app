// app/api/recipes/[id]/route.ts

import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

// 1) GET: Fetch a single recipe by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: Number(id) },
      include: {
        ingredients: true,
        steps: true,
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(recipe, { status: 200 });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe. Please try again later." },
      { status: 500 }
    );
  }
}

// 2) PUT: Update a single recipe by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const recipeId = Number(id);

  if (isNaN(recipeId)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  try {
    const data = await request.json();

    // For partial updates, include only the fields you allow users to change:
    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        title: data.title,
        category: data.category,
        description: data.description,
        image: data.image,
        portion: data.portion,
        // If you want to allow editing of ingredients/steps, you'd do that here,
        // but partial nested updates can get tricky with Prisma. 
        // e.g. data.ingredients, data.steps, etc. if needed.
      },
    });

    return NextResponse.json(updatedRecipe, { status: 200 });
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json(
      { error: "Failed to update recipe." },
      { status: 500 }
    );
  }
}

// 3) DELETE: Remove a single recipe by ID
// app/api/recipes/[id]/route.ts

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const recipeId = Number(id);

  if (isNaN(recipeId)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  try {
    // 1. Delete child references (if you have them)
    await prisma.ingredient.deleteMany({
      where: { recipeId },
    });
    await prisma.step.deleteMany({
      where: { recipeId },
    });
    await prisma.favorite.deleteMany({
      where: { recipeId },
    });
    // 2. Now delete the recipe
    await prisma.recipe.delete({
      where: { id: recipeId },
    });

    return NextResponse.json({ message: "Recipe deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe." },
      { status: 500 }
    );
  }
}
