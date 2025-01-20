// src/app/api/test-connection/route.ts
import { NextResponse } from "next/server";
import supabase from "../../../../lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("recipes").select("*").limit(1);
  if (error) {
    console.error("Supabase Connection Error:", error.message);
    return NextResponse.json({ error: "Supabase connection failed." }, { status: 500 });
  }
  return NextResponse.json(data, { status: 200 });
}
