// app/api/fetch-default-image/route.ts

import { NextResponse } from "next/server";
import { fetchGoogleImages } from "../../../../lib/googleSearch";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "food";

    // Fetch 1 random(ish) image matching the category
    const images = await fetchGoogleImages(category, 1);

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    // Return the first image
    return NextResponse.json({ imageUrl: images[0] }, { status: 200 });
  } catch (error: unknown) { // Changed 'any' to 'unknown'
    if (error instanceof Error) {
      console.error("Error fetching default image:", error.message);
    } else {
      console.error("Unknown error fetching default image.");
    }
    return NextResponse.json({ error: "Failed to fetch default image" }, { status: 500 });
  }
}
