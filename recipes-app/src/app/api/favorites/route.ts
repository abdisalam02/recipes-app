import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Manually Define Types for Recipe and Favorite
interface Recipe {
  id: number;
  title: string;
  category: string;
  description: string;
  image?: string | null; // Optional field
  portion: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Favorite {
  id: number;
  userId: number;
  recipeId: number;
  recipe: Recipe; // Relation with Recipe
  createdAt: Date;
}

// Extend Prisma Client
const prisma = new PrismaClient().$extends({
  result: {
    favorite: {
      computedField: {
        needs: { recipe: true }, // Ensure the `recipe` relation is included
        compute: (favorite: Favorite) => {
          return `Favorite Recipe: ${favorite.recipe.title}`;
        },
      },
    },
  },
});

// GET /api/favorites
export async function GET() {
  try {
    const favorites = await prisma.favorite.findMany({
      include: { recipe: true }, // Include related Recipe data
    });

    return NextResponse.json(favorites, { status: 200 });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

// POST /api/favorites
export async function POST(request: Request) {
  try {
    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    const newFavorite = await prisma.favorite.create({
      data: { recipeId, userId: 1 }, // Replace with authenticated user ID
      include: { recipe: true },
    });

    return NextResponse.json(newFavorite, { status: 201 });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

// DELETE /api/favorites
export async function DELETE(request: Request) {
  try {
    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: { recipeId, userId: 1 }, // Replace with authenticated user ID
    });

    return NextResponse.json({ message: "Favorite removed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
