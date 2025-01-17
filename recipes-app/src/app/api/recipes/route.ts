// app/api/recipes/route.ts

import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { fetchGoogleImages } from "../../../../lib/googleSearch";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, category, description, ingredients, steps, portion, image } = data;

    if (!title || !category || !description || !ingredients || !steps) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // If user provided an image, use it. Otherwise fetch from Google using the title
    let imageUrl = image;
    if (!imageUrl || imageUrl.trim() === "") {
      const images = await fetchGoogleImages(title, 1); // search by title
      imageUrl = images && images.length > 0 ? images[0] : "";
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        category,
        description,
        image: imageUrl || undefined,
        portion: portion || 1,
        ingredients: {
          create: ingredients.map((ing: any) => ({
            quantity: ing.quantity,
            unit: ing.unit,
            name: ing.name,
          })),
        },
        steps: {
          create: steps.map((step: any, index: number) => ({
            order: step.order || index + 1,
            description: step.description,
          })),
        },
      },
      include: {
        ingredients: true,
        steps: true,
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error: any) {
    console.error("Error creating recipe:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create recipe." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true,
        steps: true,
      },
    });
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes. Please try again later." },
      { status: 500 }
    );
  }
}
