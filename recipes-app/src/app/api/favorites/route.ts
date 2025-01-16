// app/api/favorites/route.ts

import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

const userId = 1; // Fixed user ID since no authentication

// GET /api/favorites
export async function GET(request: Request) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: userId },
      include: { recipe: true },
    });

    return NextResponse.json(favorites, { status: 200 });
  } catch (error) {
    console.error("Error fetching favorites:", error);
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

    const newFavorite = await prisma.favorite.create({
      data: { userId: userId, recipeId: recipeIdNumber },
    });

    return NextResponse.json(newFavorite, { status: 201 });
  } catch (error) {
    console.error("Error adding favorite:", error);
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
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
