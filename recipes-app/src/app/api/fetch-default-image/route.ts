import { NextResponse } from "next/server";
import { fetchGoogleImages } from "../../../../lib/googleSearch";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "food";  // Default to "food" if no query is provided

    // Fetch 1 random(ish) image matching the query
    const images = await fetchGoogleImages(query, 1);

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images found for the given query" }, { status: 404 });
    }

    // Return the first image
    return NextResponse.json({ imageUrl: images[0] }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching default image:", error.message);
    } else {
      console.error("Unknown error fetching default image.");
    }
    return NextResponse.json({ error: "Failed to fetch default image. Please try again later." }, { status: 500 });
  }
}
