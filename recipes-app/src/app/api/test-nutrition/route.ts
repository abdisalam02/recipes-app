// app/api/test-nutrition/route.ts
import { NextResponse } from "next/server";
import fetch from "node-fetch";

export async function POST(request: Request) {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { message: "Spoonacular API key is missing." },
      { status: 500 }
    );
  }

  try {
    const { ingredient } = await request.json();
    
    if (!ingredient || !ingredient.name || !ingredient.quantity || !ingredient.unit) {
      return NextResponse.json(
        { message: "Invalid ingredient data" },
        { status: 400 }
      );
    }

    const ingredientString = `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`;
    const url = `https://api.spoonacular.com/recipes/parseIngredients`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": apiKey,
      },
      body: new URLSearchParams({
        ingredientList: ingredientString,
        servings: "1",
        includeNutrition: "true",
        language: "en"
      }).toString()
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch nutrition data", success: false },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data[0]?.nutrition?.nutrients) {
      return NextResponse.json({
        message: "No nutritional data found for this ingredient",
        success: false
      });
    }

    return NextResponse.json({
      message: "Successfully fetched nutrition data",
      success: true,
      data: data[0].nutrition.nutrients
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        message: "Error testing nutritional info",
        error: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}