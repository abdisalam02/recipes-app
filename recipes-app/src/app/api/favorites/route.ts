// src/app/api/favorites/route.ts
import { NextResponse, NextRequest } from 'next/server';
import supabase from '../../../../lib/supabaseClient';

// GET /api/favorites - Fetch all favorites
export async function GET(_request: NextRequest) {
  try {
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        id,
        recipe_id,
        recipe:recipes (
          id,
          title,
          category,
          description,
          image,
          portion,
          created_at,
          updated_at
        ),
        created_at
      `);

    if (error) {
      console.error('Supabase GET favorites error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(favorites, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites - Add a new favorite
export async function POST(request: NextRequest) {
  try {
    const { recipe_id } = await request.json();

    if (!recipe_id || typeof recipe_id !== 'number') {
      return NextResponse.json({ error: 'Valid Recipe ID is required.' }, { status: 400 });
    }

    // Check if the recipe exists
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipe_id)
      .single();

    if (recipeError) {
      console.error('Supabase recipe existence check error:', recipeError.message);
      return NextResponse.json({ error: 'Recipe does not exist.' }, { status: 404 });
    }

    // Check if the recipe is already favorited
    const { data: existing, error: existingError } = await supabase
      .from('favorites')
      .select('*')
      .eq('recipe_id', recipe_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('Supabase check existing favorite error:', existingError.message);
      throw existingError;
    }

    if (existing) {
      return NextResponse.json({ error: 'Recipe is already favorited.' }, { status: 409 });
    }

    // Insert the new favorite
    const { data: newFavorite, error } = await supabase
      .from('favorites')
      .insert([{ recipe_id }])
      .select(`
        id,
        recipe_id,
        recipe:recipes (
          id,
          title,
          category,
          description,
          image,
          portion,
          created_at,
          updated_at
        ),
        created_at
      `)
      .single();

    if (error) {
      console.error('Supabase insert favorite error:', error.message);
      throw error;
    }

    return NextResponse.json(newFavorite, { status: 201 });
  } catch (error: unknown) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const { recipe_id } = await request.json();

    if (!recipe_id || typeof recipe_id !== 'number') {
      return NextResponse.json({ error: 'Valid Recipe ID is required.' }, { status: 400 });
    }

    // Check if the favorite exists
    const { data: existing, error: existingError } = await supabase
      .from('favorites')
      .select('*')
      .eq('recipe_id', recipe_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Supabase check existing favorite error:', existingError.message);
      throw existingError;
    }

    if (!existing) {
      return NextResponse.json({ error: 'Favorite does not exist.' }, { status: 404 });
    }

    // Delete the favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('recipe_id', recipe_id);

    if (error) {
      console.error('Supabase delete favorite error:', error.message);
      throw error;
    }

    return NextResponse.json({ message: 'Favorite removed successfully.' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
