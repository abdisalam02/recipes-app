import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabaseClient';
import { fetchGoogleImages } from '../../../../lib/googleSearch';
import { getNutritionalInfo } from '../../../../lib/nutrition';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('Missing OpenAI API key.');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const systemInstruction =
      `You are a recipe generator. Your output must be exactly one valid JSON object and nothing else.
Do not include markdown or extra commentary.
The JSON object must have exactly these keys: "title" (string), "description" (string), "image" (string), "portion" (number), "ingredients" (an array of objects with keys "name" (string), "quantity" (number), "unit" (string)), and "steps" (an array of objects with keys "order" (number) and "description" (string)).
For example:
{"title": "Grilled Chicken Salad", "description": "A healthy, low-carb salad with grilled chicken and mixed greens.", "image": "", "portion": 2, "ingredients": [{"name": "Chicken", "quantity": 1, "unit": "lb"}, {"name": "Mixed Greens", "quantity": 1, "unit": "bag"}], "steps": [{"order": 1, "description": "Grill the chicken until cooked through."}, {"order": 2, "description": "Toss the chicken with the mixed greens and serve."}]}`;

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ];

    const schema = {
      name: "recipe_schema",
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          image: { type: "string" },
          portion: { type: "number" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" }
              },
              required: ["name", "quantity", "unit"],
              additionalProperties: false
            }
          },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                order: { type: "number" },
                description: { type: "string" }
              },
              required: ["order", "description"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "description", "image", "portion", "ingredients", "steps"],
        additionalProperties: false
      },
      strict: true
    };

    const requestBody = {
      model: "gpt-4o-mini-2024-07-18",
      messages,
      temperature: 0.0,
      max_tokens: 500,
      response_format: {
        type: "json_schema",
        json_schema: schema
      }
    };

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenAI response status:', openaiRes.status);
    const openaiData = await openaiRes.json();
    console.log('OpenAI raw response:', openaiData);

    if (!openaiRes.ok) {
      return NextResponse.json(
        { error: openaiData.error?.message || 'OpenAI API error' },
        { status: 500 }
      );
    }

    const rawContent = openaiData.choices?.[0]?.message?.content;
    if (!rawContent) {
      console.error('No message content returned:', openaiData);
      return NextResponse.json({ error: 'No message content returned from AI' }, { status: 500 });
    }
    const trimmedContent = rawContent.trim();
    console.log('Trimmed AI response:', trimmedContent);

    let recipe;
    try {
      recipe = JSON.parse(trimmedContent);
    } catch (parseError) {
      console.error('Direct JSON.parse failed:', parseError);
      // Use regex to extract JSON block
      const jsonMatch = trimmedContent.match(/{[\s\S]*}/);
      if (jsonMatch) {
        try {
          recipe = JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('Failed to parse JSON from regex extraction:', innerError, 'Extracted:', jsonMatch[0]);
          return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 });
      }
    }

    // If the image is a placeholder (contains "example.com" or is empty), fetch a proper image.
    if (!recipe.image || recipe.image.trim() === '' || recipe.image.includes("example.com")) {
      const images = await fetchGoogleImages(recipe.title, 1);
      recipe.image = images.length > 0 ? images[0] : '/default-image.png';
    }

    // Calculate total nutritional info.
    let totalNutrition = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };

    for (const ing of recipe.ingredients) {
      const nutri = await getNutritionalInfo(ing.name, ing.quantity, ing.unit);
      if (nutri) {
        totalNutrition.calories += nutri.calories;
        totalNutrition.protein += nutri.protein;
        totalNutrition.fat += nutri.fat;
        totalNutrition.carbohydrates += nutri.carbohydrates;
        totalNutrition.fiber += nutri.fiber;
        totalNutrition.sugar += nutri.sugar;
        totalNutrition.sodium += nutri.sodium;
        totalNutrition.cholesterol += nutri.cholesterol;
      }
    }
    recipe.nutritional_info = totalNutrition;

    // Insert the generated recipe into ai_recipes table.
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
    console.error('Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
