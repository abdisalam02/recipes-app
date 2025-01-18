import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import prisma from "../../../../../lib/prisma";

type Context = {
  params: { id: string };
};

// 1) GET: Fetch a single recipe by ID
export async function GET(
  request: NextRequest,
  context: Promise<Context>
) {
  const { id } = await context.then(ctx => ctx.params);

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
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching recipe:", error.message);
    } else {
      console.error("Unknown error fetching recipe.");
    }
    return NextResponse.json(
      { error: "Failed to fetch recipe. Please try again later." },
      { status: 500 }
    );
  }
}

// 2) PUT: Update a single recipe by ID
export async function PUT(
  request: NextRequest,
  context: Promise<Context>
) {
  const { id } = await context.then(ctx => ctx.params);
  const recipeId = Number(id);

  if (isNaN(recipeId)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  try {
    const data = await request.json();

    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        title: data.title,
        category: data.category,
        description: data.description,
        image: data.image,
        portion: data.portion,
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
export async function DELETE(
  request: NextRequest,
  context: Promise<Context>
) {
  const { id } = await context.then(ctx => ctx.params);
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