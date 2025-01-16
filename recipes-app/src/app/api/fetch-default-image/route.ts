// app/api/fetch-default-image/route.ts

import { NextResponse } from "next/server";
import { fetchRandomImage } from "../../../../lib/pexels";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "food";

    const imageUrl = await fetchRandomImage(category);

    if (!imageUrl) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching default image:", error);
    return NextResponse.json({ error: "Failed to fetch default image" }, { status: 500 });
  }
}
