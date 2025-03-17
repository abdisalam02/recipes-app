import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabaseClient';
import { fetchGoogleImages } from '../../../../lib/googleSearch';

// Helper to fetch random recipes from Spoonacular
async function fetchRandomRecipes() {
  const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
  
  if (!SPOONACULAR_API_KEY) {
    throw new Error('SPOONACULAR_API_KEY not configured in environment variables');
  }
  
  try {
    const response = await fetch(
      `https://api.spoonacular.com/recipes/random?number=3&apiKey=${SPOONACULAR_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process each recipe to match our format
    return Promise.all(data.recipes.map(async (recipe) => {
      // Fetch image from Google if not provided
      let imageUrl = recipe.image;
      if (!imageUrl) {
        try {
          const images = await fetchGoogleImages(recipe.title, 1);
          imageUrl = images.length > 0 ? images[0] : '/default-image.png';
        } catch (error) {
          console.error(`Failed to fetch image for ${recipe.title}:`, error);
          imageUrl = '/default-image.png';
        }
      }
      
      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.summary ? recipe.summary.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
        image: imageUrl,
        source: 'api',
        sourceUrl: recipe.sourceUrl,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        category: recipe.dishTypes?.[0] || 'main course',
        instructions: recipe.instructions,
        ingredients: recipe.extendedIngredients?.map(ing => ({
          name: ing.name,
          quantity: ing.amount,
          unit: ing.unit
        })) || []
      };
    }));
  } catch (error) {
    console.error('Error fetching random recipes:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have recipes for today
    const { data: existingData, error: fetchError } = await supabase
      .from('daily_recipes')
      .select('*')
      .eq('date', today)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching daily recipes:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch daily recipes' },
        { status: 500 }
      );
    }
    
    // If we have recipes for today, return them
    if (existingData) {
      return NextResponse.json([
        existingData.recipe_1_data,
        existingData.recipe_2_data,
        existingData.recipe_3_data
      ]);
    }
    
    // Otherwise, fetch new recipes
    const recipes = await fetchRandomRecipes();
    
    // Store in the database
    const { error: insertError } = await supabase
      .from('daily_recipes')
      .insert({
        date: today,
        recipe_1_source: 'api',
        recipe_1_data: recipes[0],
        recipe_2_source: 'api',
        recipe_2_data: recipes[1],
        recipe_3_source: 'api',
        recipe_3_data: recipes[2]
      });
    
    if (insertError) {
      console.error('Error inserting daily recipes:', insertError);
      return NextResponse.json(
        { error: 'Failed to store daily recipes' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error in daily recipes API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 