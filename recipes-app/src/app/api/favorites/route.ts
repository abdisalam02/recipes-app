// app/api/favorites/route.ts

import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

const userId = 1; // Fixed user ID since no authentication

// Define Types for Favorite and Recipe
interface Recipe {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  portion: number;
}

interface Favorite {
  id: number;
  userId: number;
  recipeId: number;
  recipe: Recipe;
}

// GET /api/favorites
export async function GET() { // Removed 'request: Request'
  try {
    const favorites: Favorite[] = await prisma.favorite.findMany({
      where: { userId: userId },
      include: { recipe: true },
    });

    return NextResponse.json(favorites, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching favorites:", error.message);
    } else {
      console.error("Unknown error fetching favorites.");
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/favorites
export async function POST(request: Request) {
  try {
    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    const recipeIdNumber = parseInt(recipeId, 10);
    if (isNaN(recipeIdNumber)) {
      return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    const existingFavorite = await prisma.favorite.findFirst({
      where: { userId: userId, recipeId: recipeIdNumber },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { message: "Recipe is already in favorites" },
        { status: 200 }
      );
    }

    const newFavorite: Favorite = await prisma.favorite.create({
      data: { userId: userId, recipeId: recipeIdNumber },
      include: { recipe: true }, // Ensure recipe is included
    });

    return NextResponse.json(newFavorite, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error adding favorite:", error.message);
    } else {
      console.error("Unknown error adding favorite.");
    }
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites
export async function DELETE(request: Request) {
  try {
    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    const recipeIdNumber = parseInt(recipeId, 10);
    if (isNaN(recipeIdNumber)) {
      return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: { userId: userId, recipeId: recipeIdNumber },
    });

    return NextResponse.json({ message: "Favorite removed successfully" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error removing favorite:", error.message);
    } else {
      console.error("Unknown error removing favorite.");
    }
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
