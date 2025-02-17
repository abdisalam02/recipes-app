import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabaseClient';

// GET /api/ai-recipes
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ai_recipes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching AI recipes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Internal server error in ai-recipes GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ai-recipes (for inserting a new AI recipe)
export async function POST(request: Request) {
  try {
    const recipe = await request.json();
    
    const { data, error } = await supabase
      .from('ai_recipes')
      .insert([recipe])
      .select();
    
    if (error) {
      console.error('Error inserting AI recipe:', error);
      return NextResponse.json({ error: error.message || 'Failed to insert recipe.' }, { status: 500 });
    }
    
    return NextResponse.json({ recipe: data[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Internal server error in ai-recipes POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
