// app/api/test-key/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY is not configured.');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Test the API key by calling the OpenAI models endpoint
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${openaiApiKey}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Error testing API key' },
        { status: response.status }
      );
    }

    const data = await response.json();
    // We return valid: true along with a list of models
    return NextResponse.json({ valid: true, models: data.data }, { status: 200 });
  } catch (error: any) {
    console.error('Internal error testing API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
