// app/api/auth/route.ts

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Compare to your env password
    if (!password || password !== process.env.ADMIN_PASS) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // If it matches, return success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error checking admin password:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
