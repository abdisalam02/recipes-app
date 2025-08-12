import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lightweight ping: count head only (no row data returned)
    const { error } = await supabase
      .from('recipes')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
