// app/api/fetch-default-image/route.ts
import { NextResponse } from "next/server";
import { fetchGoogleImages } from "../../../../lib/googleSearch";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "food";  // Default to "food" if no query is provided

    console.log("[API][fetch-default-image] Incoming query:", query);

    // Fetch multiple images so we can pick a random one for more variety
    const count = 8;
    const images = await fetchGoogleImages(query, count);

    console.log(
      "[API][fetch-default-image] Images result length:",
      Array.isArray(images) ? images.length : "not-array"
    );

    if (!images || images.length === 0) {
      console.warn(
        "[API][fetch-default-image] No images found for query:",
        query
      );
      return NextResponse.json({ error: "No images found for the given query" }, { status: 404 });
    }

    // Pick a random image from the list to avoid always returning the same one
    const index = Math.floor(Math.random() * images.length);
    const chosen = images[index];

    console.log(
      "[API][fetch-default-image] Returning image URL (index",
      index,
      "):",
      chosen
    );
    console.log(
      "[API][fetch-default-image] Returning image URL:",
      images[0]
    );
    return NextResponse.json({ imageUrl: chosen }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching default image:", error.message);
    } else {
      console.error("Unknown error fetching default image.");
    }
    return NextResponse.json({ error: "Failed to fetch default image. Please try again later." }, { status: 500 });
  }
}
