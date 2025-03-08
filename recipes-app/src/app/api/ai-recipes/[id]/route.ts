import { NextRequest, NextResponse } from 'next/server';
import supabase from '../../../../../lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { data, error } = await supabase
      .from('ai_recipes')
      .select('*')  // Select all columns; no join needed
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching AI recipe:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI recipe' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Delete the AI recipe from the database
    const { error } = await supabase
      .from('ai_recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting AI recipe:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Return a success response
    return NextResponse.json({ success: true, message: 'AI recipe deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI recipe' },
      { status: 500 }
    );
  }
}
