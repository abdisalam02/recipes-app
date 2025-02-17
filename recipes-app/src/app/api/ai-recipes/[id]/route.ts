import { NextResponse } from 'next/server';
import supabase from '../../../../../lib/supabaseClient';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { data, error } = await supabase
      .from('ai_recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching AI recipe:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Internal server error in AI recipe GET:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
