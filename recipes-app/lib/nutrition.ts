import fetch from 'node-fetch';
import { NutritionalInfo } from './types';
import supabase from './supabaseClient';

// These standard values are only used as a fallback when API calls fail
const standardItemValues: { [key: string]: NutritionalInfo } = {
  'apple': {
    calories: 95,
    protein: 0.5,
    fat: 0.3,
    carbohydrates: 25,
    fiber: 4.4,
    sugar: 19,
    sodium: 2,
    cholesterol: 0
  },
  'banana': {
    calories: 105,
    protein: 1.3,
    fat: 0.4,
    carbohydrates: 27,
    fiber: 3.1,
    sugar: 14,
    sodium: 1,
    cholesterol: 0
  },
  'banana pudding': {
    calories: 350,
    protein: 8,
    fat: 9,
    carbohydrates: 55,
    fiber: 2,
    sugar: 32,
    sodium: 320,
    cholesterol: 45
  },
  'oreo shake': {
    calories: 680,
    protein: 14,
    fat: 28,
    carbohydrates: 92,
    fiber: 2,
    sugar: 78,
    sodium: 380,
    cholesterol: 95
  },
  'oatmeal': {
    calories: 150,
    protein: 5.0,
    fat: 2.5,
    carbohydrates: 27.0,
    fiber: 4.0,
    sugar: 1.0,
    sodium: 2,
    cholesterol: 0
  }
};

// Default nutrition values for fallback when both API and AI methods fail
const defaultNutritionValues: { [key: string]: NutritionalInfo } = {
  'meal': {
    calories: 500,
    protein: 20,
    fat: 15,
    carbohydrates: 60,
    fiber: 5,
    sugar: 10,
    sodium: 600,
    cholesterol: 50
  },
  'snack': {
    calories: 200,
    protein: 5,
    fat: 8,
    carbohydrates: 25,
    fiber: 2,
    sugar: 12,
    sodium: 150,
    cholesterol: 15
  },
  'default': {
    calories: 100,
    protein: 2,
    fat: 2,
    carbohydrates: 15,
    fiber: 1,
    sugar: 5,
    sodium: 50,
    cholesterol: 0
  }
};

// Define processed food type
export interface ProcessedFood {
  name: string;
  quantity: number;
  unit: string;
  components: Array<{ name: string; quantity: number; unit: string }> | null;
}

// Define common food breakdowns for composite foods
// These are used to help the AI understand complex foods by breaking them down
export const FOOD_MAPPINGS: Record<string, Array<{ name: string; quantity: number; unit: string }>> = {
  'bowl of oatmeal': [
    { name: 'oats', quantity: 40, unit: 'g' },
    { name: 'milk', quantity: 150, unit: 'ml' }
  ],
  'oatmeal with banana': [
    { name: 'oats', quantity: 40, unit: 'g' },
    { name: 'milk', quantity: 150, unit: 'ml' },
    { name: 'banana', quantity: 100, unit: 'g' }
  ],
  'salad with corn and tomatoes': [
    { name: 'lettuce', quantity: 100, unit: 'g' },
    { name: 'corn', quantity: 50, unit: 'g' },
    { name: 'tomatoes', quantity: 75, unit: 'g' },
    { name: 'dressing', quantity: 15, unit: 'ml' }
  ]
};

/**
 * Normalizes a food name for consistent lookups
 */
function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/s$|es$/, '');
}

/**
 * Get cached nutritional info from Supabase
 */
export async function getCachedNutritionalInfo(
  name: string,
  quantity: number,
  unit: string
): Promise<{ nutritionalInfo: NutritionalInfo; source: string } | null> {
  try {
    console.log(`[NUTRITION-DEBUG] Checking cache for "${name}"`);
    const normalizedName = normalizeFoodName(name);
    
    const { data, error } = await supabase
      .from('nutrition_cache')
      .select('*')
      .eq('normalized_name', normalizedName)
      .eq('unit', unit)
      .single();
      
    if (error || !data) {
      console.log(`[NUTRITION-DEBUG] No cache entry found for "${name}"`);
      return null;
    }
    
    // Adjust cached values for requested quantity
    const scaleFactor = quantity / data.quantity;
    
    const nutritionalInfo: NutritionalInfo = {
      calories: data.calories * scaleFactor,
      protein: data.protein * scaleFactor,
      fat: data.fat * scaleFactor,
      carbohydrates: data.carbohydrates * scaleFactor,
      fiber: data.fiber * scaleFactor,
      sugar: data.sugar * scaleFactor,
      sodium: data.sodium * scaleFactor,
      cholesterol: data.cholesterol * scaleFactor
    };
    
    console.log(`[NUTRITION-DEBUG] Cache hit for "${name}" (source: ${data.source})`);
    return {
      nutritionalInfo,
      source: data.source
    };
  } catch (error) {
    console.error(`[NUTRITION-DEBUG] Error checking cache: ${error}`);
    return null;
  }
}

/**
 * Cache nutritional info in Supabase
 */
export async function cacheNutritionalInfo(
  name: string,
  quantity: number,
  unit: string,
  nutritionalInfo: NutritionalInfo,
  source: string
): Promise<void> {
  try {
    console.log(`[NUTRITION-DEBUG] Caching nutritional info for "${name}"`);
    const normalizedName = normalizeFoodName(name);
    
    const { error } = await supabase
      .from('nutrition_cache')
      .upsert({
        name,
        normalized_name: normalizedName,
        quantity,
        unit,
        calories: nutritionalInfo.calories,
        protein: nutritionalInfo.protein,
        fat: nutritionalInfo.fat,
        carbohydrates: nutritionalInfo.carbohydrates,
        fiber: nutritionalInfo.fiber,
        sugar: nutritionalInfo.sugar,
        sodium: nutritionalInfo.sodium,
        cholesterol: nutritionalInfo.cholesterol,
        source,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error(`[NUTRITION-DEBUG] Error caching nutritional info: ${error}`);
    } else {
      console.log(`[NUTRITION-DEBUG] Successfully cached nutritional info for "${name}"`);
    }
  } catch (error) {
    console.error(`[NUTRITION-DEBUG] Error in cacheNutritionalInfo: ${error}`);
  }
}

/**
 * Use Spoonacular API to fetch nutritional information
 */
export async function fetchNutritionFromSpoonacular(
  name: string,
  quantity: number,
  unit: string
): Promise<NutritionalInfo | null> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  
  if (!apiKey) {
    console.log('[NUTRITION-DEBUG] Missing Spoonacular API key');
    return null;
  }

  try {
    console.log(`[NUTRITION-DEBUG] Fetching from Spoonacular API: "${quantity} ${unit} ${name}"`);
    const ingredientString = `${quantity} ${unit} ${name}`;
    const url = `https://api.spoonacular.com/recipes/parseIngredients`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": apiKey,
      },
      body: new URLSearchParams({
        ingredientList: ingredientString,
        servings: "1",
        includeNutrition: "true",
        language: "en"
      }).toString()
    });

    if (!response.ok) {
      console.log(`[NUTRITION-DEBUG] Spoonacular API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as any;
    const nutrients = data[0]?.nutrition?.nutrients;
    
    if (!nutrients || !nutrients.length) {
      console.log('[NUTRITION-DEBUG] No nutrition data returned from Spoonacular');
      return null;
    }

    // Convert to our nutrition info format
    const result: NutritionalInfo = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };
    
    nutrients.forEach((nutrient: any) => {
      const nutrientName = nutrient.name.toLowerCase();
      switch (nutrientName) {
        case 'calories':
          result.calories = nutrient.amount;
          break;
        case 'protein':
          result.protein = nutrient.amount;
          break;
        case 'fat':
          result.fat = nutrient.amount;
          break;
        case 'carbohydrates':
          result.carbohydrates = nutrient.amount;
          break;
        case 'fiber':
          result.fiber = nutrient.amount;
          break;
        case 'sugar':
          result.sugar = nutrient.amount;
          break;
        case 'sodium':
          result.sodium = nutrient.amount;
          break;
        case 'cholesterol':
          result.cholesterol = nutrient.amount;
          break;
      }
    });
    
    console.log(`[NUTRITION-DEBUG] Successfully retrieved from Spoonacular: ${result.calories} calories`);
    return result;
  } catch (error) {
    console.error(`[NUTRITION-DEBUG] Error fetching from Spoonacular API: ${error}`);
    return null;
  }
}

/**
 * Use Nutritionix API to fetch nutritional information
 */
export async function fetchNutritionFromNutritionix(
  name: string,
  quantity: number,
  unit: string
): Promise<NutritionalInfo | null> {
  const appId = process.env.NUTRITIONIX_APP_ID;
  const appKey = process.env.NUTRITIONIX_API_KEY;
  
  if (!appId || !appKey) {
    console.log('[NUTRITION-DEBUG] Missing Nutritionix API credentials');
    return null;
  }
  
  try {
    console.log(`[NUTRITION-DEBUG] Fetching from Nutritionix API: "${quantity} ${unit} ${name}"`);
    const query = `${quantity} ${unit} ${name}`;
    
    const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': appId,
        'x-app-key': appKey
      },
      body: JSON.stringify({
        query: query
      })
    });
    
    if (!response.ok) {
      console.log(`[NUTRITION-DEBUG] Nutritionix API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as any;
    const foods = data.foods;
    
    if (!foods || !foods.length) {
      console.log('[NUTRITION-DEBUG] No foods returned from Nutritionix');
      return null;
    }

    // If multiple foods returned, use the first one
    const food = foods[0];
    
    const result: NutritionalInfo = {
      calories: food.nf_calories || 0,
      protein: food.nf_protein || 0,
      fat: food.nf_total_fat || 0,
      carbohydrates: food.nf_total_carbohydrate || 0,
      fiber: food.nf_dietary_fiber || 0,
      sugar: food.nf_sugars || 0,
      sodium: food.nf_sodium || 0,
      cholesterol: food.nf_cholesterol || 0
    };
    
    console.log(`[NUTRITION-DEBUG] Successfully retrieved from Nutritionix: ${result.calories} calories`);
    return result;
  } catch (error) {
    console.error(`[NUTRITION-DEBUG] Error fetching from Nutritionix API: ${error}`);
    return null;
  }
}

/**
 * Use Edamam API to fetch nutritional information
 */
export async function fetchNutritionFromEdamam(
  name: string,
  quantity: number,
  unit: string
): Promise<NutritionalInfo | null> {
  // First try direct Edamam credentials
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_API_KEY;
  const rapidApiKey = process.env.RAPID_API_KEY;
  
  // Check if we have either direct credentials or RapidAPI key
  if ((!appId || !appKey) && !rapidApiKey) {
    console.log('[NUTRITION-DEBUG] Missing both Edamam credentials and RapidAPI key');
    return null;
  }
  
  try {
    const ingredientString = `${quantity} ${unit} ${name}`;
    console.log(`[NUTRITION-DEBUG] Fetching from Edamam API: "${ingredientString}"`);
    
    // If we have direct Edamam credentials, use them
    if (appId && appKey) {
      const url = new URL('https://api.edamam.com/api/nutrition-data');
      url.searchParams.append('app_id', appId);
      url.searchParams.append('app_key', appKey);
      url.searchParams.append('ingr', ingredientString);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        console.log(`[NUTRITION-DEBUG] Edamam direct API error: ${response.status}`);
        // Fall back to RapidAPI if direct call fails
        if (!rapidApiKey) return null;
      } else {
        const data = await response.json() as any;
        
        if (!data || !data.calories) {
          console.log('[NUTRITION-DEBUG] No valid data returned from Edamam direct API');
          if (!rapidApiKey) return null;
        } else {
          return processEdamamResponse(data);
        }
      }
    }
    
    // If we get here, either we don't have direct credentials or the direct call failed
    // Try using RapidAPI
    if (rapidApiKey) {
      console.log('[NUTRITION-DEBUG] Trying Edamam via RapidAPI');
      
      const response = await fetch('https://edamam-food-and-grocery-database.p.rapidapi.com/api/food-database/v2/parser', {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'edamam-food-and-grocery-database.p.rapidapi.com'
        },
        // @ts-ignore - URLSearchParams is available
        body: new URLSearchParams({
          ingr: ingredientString
        }).toString()
      });
      
      if (!response.ok) {
        console.log(`[NUTRITION-DEBUG] Edamam RapidAPI error: ${response.status}`);
        return null;
      }
      
      const data = await response.json() as any;
      
      if (!data || !data.hints || data.hints.length === 0) {
        console.log('[NUTRITION-DEBUG] No valid data returned from Edamam RapidAPI');
        return null;
      }
      
      // Extract nutrition info from the first hint
      const foodItem = data.hints[0].food;
      const nutrients = foodItem.nutrients;
      
      if (!nutrients) {
        console.log('[NUTRITION-DEBUG] No nutrients data in Edamam RapidAPI response');
        return null;
      }
      
      const result: NutritionalInfo = {
        calories: nutrients.ENERC_KCAL || 0,
        protein: nutrients.PROCNT || 0,
        fat: nutrients.FAT || 0,
        carbohydrates: nutrients.CHOCDF || 0,
        fiber: nutrients.FIBTG || 0,
        sugar: nutrients.SUGAR || 0,
        sodium: nutrients.NA || 0,
        cholesterol: nutrients.CHOLE || 0
      };
      
      // Scale for quantity
      const scaleFactor = quantity;
      result.calories *= scaleFactor;
      result.protein *= scaleFactor;
      result.fat *= scaleFactor;
      result.carbohydrates *= scaleFactor;
      result.fiber *= scaleFactor;
      result.sugar *= scaleFactor;
      result.sodium *= scaleFactor;
      result.cholesterol *= scaleFactor;
      
      console.log(`[NUTRITION-DEBUG] Successfully retrieved from Edamam RapidAPI: ${result.calories} calories`);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error(`[NUTRITION-DEBUG] Error fetching from Edamam API: ${error}`);
    return null;
  }
}

// Helper function to process Edamam direct API response
function processEdamamResponse(data: any): NutritionalInfo | null {
  if (!data || !data.calories) {
    return null;
  }
  
  const nutrients = data.totalNutrients as any;
  
  const result: NutritionalInfo = {
    calories: data.calories || 0,
    protein: nutrients.PROCNT?.quantity || 0,
    fat: nutrients.FAT?.quantity || 0,
    carbohydrates: nutrients.CHOCDF?.quantity || 0,
    fiber: nutrients.FIBTG?.quantity || 0,
    sugar: nutrients.SUGAR?.quantity || 0,
    sodium: nutrients.NA?.quantity || 0,
    cholesterol: nutrients.CHOLE?.quantity || 0
  };
  
  console.log(`[NUTRITION-DEBUG] Successfully processed Edamam response: ${result.calories} calories`);
  return result;
}

/**
 * Preprocess food descriptions into structured data
 */
export async function aiPreprocessFood(foodDescription: string): Promise<ProcessedFood | null> {
  console.log(`[NUTRITION-DEBUG] Starting preprocessing for: "${foodDescription}"`);
  
  try {
    // Normalize the food description
    const normalizedDescription = foodDescription.toLowerCase().trim();
    
    // Check for standard mappings
    const knownCompositeFoods = Object.keys(FOOD_MAPPINGS);
    for (const compositeFood of knownCompositeFoods) {
      if (normalizedDescription === compositeFood || 
          normalizedDescription.includes(compositeFood)) {
        console.log(`[NUTRITION-DEBUG] Found mapping for "${compositeFood}"`);
        const components = FOOD_MAPPINGS[compositeFood];
        return {
          name: compositeFood,
          quantity: 1,
          unit: 'serving',
          components
        };
      }
    }
    
    // Try to determine if food can be broken down and processed with AI
    try {
      // Try to use OpenAI to break down the food into components, if API key is available
      const openAiKey = process.env.OPENAI_API_KEY;
      if (openAiKey) {
        console.log(`[NUTRITION-DEBUG] Attempting AI preprocessing with OpenAI`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a nutrition analysis assistant. Break down food items into their components with quantities. 
                Return your response as a JSON object with the following structure:
                {
                  "name": "food name",
                  "quantity": number,
                  "unit": "serving or appropriate unit",
                  "components": [
                    { "name": "component1", "quantity": number, "unit": "g or appropriate unit" },
                    { "name": "component2", "quantity": number, "unit": "g or appropriate unit" }
                  ]
                }
                
                If the food is simple and can't be broken down, return components as null.
                Use common units like g, ml, serving, piece, etc.
                Use common food components, not detailed chemical compositions.`
              },
              {
                role: 'user',
                content: `Analyze this food item: ${foodDescription}`
              }
            ],
            temperature: 0.2,
            max_tokens: 400,
            response_format: { type: 'json_object' }
          })
        });
        
        if (!response.ok) {
          console.log(`[NUTRITION-DEBUG] OpenAI API error: ${response.status}`);
          throw new Error('OpenAI API error');
        }
        
        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
          try {
            const result = JSON.parse(content);
            console.log(`[NUTRITION-DEBUG] AI preprocessing result:`, result);
            
            // Validate the AI output
            if (result.name && typeof result.quantity === 'number' && result.unit) {
              if (result.components && Array.isArray(result.components) && result.components.length > 0) {
                // Check if all components have the required properties
                const validComponents = result.components.every((c: any) => 
                  c.name && typeof c.quantity === 'number' && c.unit
                );
                
                if (validComponents) {
                  console.log(`[NUTRITION-DEBUG] AI successfully broke down "${foodDescription}" into ${result.components.length} components`);
                  return result;
                }
              } else if (result.components === null) {
                console.log(`[NUTRITION-DEBUG] AI determined "${foodDescription}" is a simple food`);
                return result;
              }
            }
          } catch (parseError) {
            console.error(`[NUTRITION-DEBUG] Error parsing AI response: ${parseError}`);
          }
        }
      }
    } catch (aiError) {
      console.error(`[NUTRITION-DEBUG] Error using AI preprocessing: ${aiError}`);
    }
    
    // If no mapping found and AI fails, use basic processing
    // Attempt to extract quantity and unit if present
    const quantityMatch = normalizedDescription.match(/^(\d+)\s+([a-z]+)\s+(.+)$/);
    if (quantityMatch) {
      const [_, quantityStr, unit, name] = quantityMatch;
      return {
        name: name.trim(),
        quantity: parseInt(quantityStr),
        unit: unit.trim(),
        components: null
      };
    }
    
    // Default fallback for simple foods
    return {
      name: foodDescription,
      quantity: 1,
      unit: 'serving',
      components: null
    };
  } catch (error) {
    console.error(`[NUTRITION-DEBUG] Error in preprocessing: ${error}`);
    return {
      name: foodDescription,
      quantity: 1,
      unit: 'serving',
      components: null
    };
  }
}

/**
 * Get comprehensive nutritional info from various sources
 */
export async function getComprehensiveNutritionalInfo(
  name: string,
  quantity: number,
  unit: string
): Promise<{ nutritionalInfo: NutritionalInfo; source: string }> {
  console.log(`[NUTRITION-DEBUG] Starting comprehensive nutrition lookup for "${name}" (${quantity} ${unit})`);
  
  // Step 1: Check the cache first
  console.log(`[NUTRITION-DEBUG] Checking cache...`);
  const cachedResult = await getCachedNutritionalInfo(name, quantity, unit);
  if (cachedResult) {
    console.log(`[NUTRITION-DEBUG] Cache hit! Using cached data from ${cachedResult.source}`);
    return cachedResult;
  }
  console.log(`[NUTRITION-DEBUG] No cache hit found`);
  
  // Step 2: Try to get data from various nutrition APIs
  console.log(`[NUTRITION-DEBUG] Attempting to fetch from nutrition APIs...`);
  
  // First try Spoonacular
  let apiNutrition = await fetchNutritionFromSpoonacular(name, quantity, unit);
  let apiSource = "Spoonacular API";
  
  // If Spoonacular fails, try Nutritionix
  if (!apiNutrition) {
    apiNutrition = await fetchNutritionFromNutritionix(name, quantity, unit);
    apiSource = "Nutritionix API";
  }
  
  // If Nutritionix fails, try Edamam
  if (!apiNutrition) {
    apiNutrition = await fetchNutritionFromEdamam(name, quantity, unit);
    apiSource = "Edamam API";
  }
  
  // If we got data from any API, cache it and return
  if (apiNutrition) {
    console.log(`[NUTRITION-DEBUG] Successfully fetched nutrition data from ${apiSource}`);
    
    // Verify the values are reasonable
    if (apiNutrition.calories > 2000) {
      console.warn(`[NUTRITION-DEBUG] WARNING: High calorie value (${apiNutrition.calories}) for "${name}". Capping at 1000.`);
      apiNutrition.calories = Math.min(apiNutrition.calories, 1000);
    }
    
    // Cache the result
    await cacheNutritionalInfo(name, quantity, unit, apiNutrition, apiSource);
    
    return {
      nutritionalInfo: apiNutrition,
      source: apiSource
    };
  }
  
  // Step 3: If all APIs fail, try to break the food down with AI preprocessing
  console.log(`[NUTRITION-DEBUG] APIs failed, trying AI preprocessing...`);
  const processedFood = await aiPreprocessFood(name);
  
  if (processedFood && processedFood.components && processedFood.components.length > 0) {
    console.log(`[NUTRITION-DEBUG] "${name}" identified as composite food with ${processedFood.components.length} components`);
    
    // Get nutritional info for each component and combine
    const combinedInfo: NutritionalInfo = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0
    };
    
    // For debugging: log each component individually
    console.log(`[NUTRITION-DEBUG] Processing components for "${name}":`);
    processedFood.components.forEach((comp, index) => {
      console.log(`Component ${index+1}: ${comp.quantity} ${comp.unit} of ${comp.name}`);
    });
    
    for (const component of processedFood.components) {
      console.log(`[NUTRITION-DEBUG] Processing component: ${component.name} (${component.quantity} ${component.unit})`);
      
      try {
        // Handle each component individually by recursive call
        const componentInfo = await getComprehensiveNutritionalInfo(
          component.name,
          component.quantity,
          component.unit
        );
        
        // Log the nutrition values for this component
        console.log(`[NUTRITION-DEBUG] Component "${component.name}" nutrition:`, 
          JSON.stringify(componentInfo.nutritionalInfo));
        
        // Add component values to combined total
        combinedInfo.calories += componentInfo.nutritionalInfo.calories;
        combinedInfo.protein += componentInfo.nutritionalInfo.protein;
        combinedInfo.fat += componentInfo.nutritionalInfo.fat;
        combinedInfo.carbohydrates += componentInfo.nutritionalInfo.carbohydrates;
        combinedInfo.fiber += componentInfo.nutritionalInfo.fiber;
        combinedInfo.sugar += componentInfo.nutritionalInfo.sugar;
        combinedInfo.sodium += componentInfo.nutritionalInfo.sodium;
        combinedInfo.cholesterol += componentInfo.nutritionalInfo.cholesterol;
        
        // For debug, log running total
        console.log(`[NUTRITION-DEBUG] Running total after adding ${component.name}:`, 
          JSON.stringify(combinedInfo));
      } catch (err) {
        console.error(`[NUTRITION-DEBUG] Error processing component "${component.name}": ${err}`);
        // Continue with other components even if one fails
      }
    }
    
    // Adjust for the requested quantity (only if different from 1)
    if (quantity !== 1 && processedFood.quantity !== quantity) {
      const scaleFactor = quantity / processedFood.quantity;
      console.log(`[NUTRITION-DEBUG] Scaling combined nutrition by factor ${scaleFactor}`);
      
      combinedInfo.calories *= scaleFactor;
      combinedInfo.protein *= scaleFactor;
      combinedInfo.fat *= scaleFactor;
      combinedInfo.carbohydrates *= scaleFactor;
      combinedInfo.fiber *= scaleFactor;
      combinedInfo.sugar *= scaleFactor;
      combinedInfo.sodium *= scaleFactor;
      combinedInfo.cholesterol *= scaleFactor;
    }
    
    // Verify the values are reasonable
    if (combinedInfo.calories > 2000) {
      console.warn(`[NUTRITION-DEBUG] WARNING: Unrealistically high calorie value (${combinedInfo.calories}) for "${name}". Capping at 1000.`);
      combinedInfo.calories = Math.min(combinedInfo.calories, 1000);
    }
    
    // Cache the combined result
    await cacheNutritionalInfo(name, quantity, unit, combinedInfo, "AI Component Analysis");
    
    return {
      nutritionalInfo: combinedInfo,
      source: "AI Component Analysis"
    };
  }
  
  // Step 4: Check if this is a known food with standard values
  console.log(`[NUTRITION-DEBUG] Checking standard values...`);
  const normalizedName = normalizeFoodName(name);
  for (const [itemName, nutritionValues] of Object.entries(standardItemValues)) {
    if (normalizedName === normalizeFoodName(itemName) || normalizedName.includes(normalizeFoodName(itemName))) {
      console.log(`[NUTRITION-DEBUG] Found standard values match for "${normalizedName}" => "${itemName}"`);
      
      // Scale values based on quantity and unit
      let scaleFactor = 1;
      
      if (unit === 'serving' || unit === 'portion') {
        scaleFactor = quantity;
      } else if (unit === 'piece' || unit === 'whole') {
        scaleFactor = quantity;
      }
      
      console.log(`[NUTRITION-DEBUG] Applying scale factor ${scaleFactor} to standard values for ${itemName}`);
      
      const scaledInfo = {
        calories: nutritionValues.calories * scaleFactor,
        protein: nutritionValues.protein * scaleFactor,
        fat: nutritionValues.fat * scaleFactor,
        carbohydrates: nutritionValues.carbohydrates * scaleFactor,
        fiber: nutritionValues.fiber * scaleFactor,
        sugar: nutritionValues.sugar * scaleFactor,
        sodium: nutritionValues.sodium * scaleFactor,
        cholesterol: nutritionValues.cholesterol * scaleFactor
      };
      
      // Cache the result
      await cacheNutritionalInfo(name, quantity, unit, scaledInfo, "Standard Values");
      
      return {
        nutritionalInfo: scaledInfo,
        source: "Standard Values"
      };
    }
  }
  
  // Step 5: If everything else fails, use generic category-based fallback values
  console.log(`[NUTRITION-DEBUG] All methods failed. Using fallback values.`);
  
  // Determine appropriate fallback category
  let category = 'default';
  
  // Scale based on quantity
  let scaleFactor = 1;
  if (unit === 'serving' || unit === 'portion') {
    scaleFactor = quantity;
  }
  
  const fallbackValues = defaultNutritionValues[category];
  const scaledFallbackInfo = {
    calories: fallbackValues.calories * scaleFactor,
    protein: fallbackValues.protein * scaleFactor,
    fat: fallbackValues.fat * scaleFactor,
    carbohydrates: fallbackValues.carbohydrates * scaleFactor,
    fiber: fallbackValues.fiber * scaleFactor,
    sugar: fallbackValues.sugar * scaleFactor,
    sodium: fallbackValues.sodium * scaleFactor,
    cholesterol: fallbackValues.cholesterol * scaleFactor
  };
  
  // Cache the fallback result
  await cacheNutritionalInfo(name, quantity, unit, scaledFallbackInfo, "Fallback Values");
  
  return {
    nutritionalInfo: scaledFallbackInfo,
    source: "Fallback Values"
  };
}

/**
 * Main function to get nutritional info for any food
 */
export async function getNutritionForFood(
  name: string,
  quantity: number = 1,
  unit: string = 'serving'
): Promise<{ nutritionalInfo: NutritionalInfo; source: string }> {
  console.log(`Getting nutrition for: ${name} (${quantity} ${unit})`);
  
  try {
    // Try to get comprehensive nutritional info
    const result = await getComprehensiveNutritionalInfo(name, quantity, unit);
    
    // Sanity check - fix unrealistically high values that sometimes come from APIs or component calculations
    const maxReasonableCalories = 1000; // Cap at 1000 calories per item
    
    if (result.nutritionalInfo.calories > maxReasonableCalories) {
      console.warn(`[NUTRITION-WARNING] Capping unrealistically high calorie count for ${name}: ${result.nutritionalInfo.calories} -> ${maxReasonableCalories}`);
      result.nutritionalInfo.calories = maxReasonableCalories;
      
      // Adjust other nutrients proportionally
      const scaleFactor = maxReasonableCalories / result.nutritionalInfo.calories;
      result.nutritionalInfo.protein *= scaleFactor;
      result.nutritionalInfo.fat *= scaleFactor;
      result.nutritionalInfo.carbohydrates *= scaleFactor;
      result.nutritionalInfo.fiber *= scaleFactor;
      result.nutritionalInfo.sugar *= scaleFactor;
      result.nutritionalInfo.sodium *= scaleFactor;
      result.nutritionalInfo.cholesterol *= scaleFactor;
      
      // Mark the source as adjusted
      result.source += " (Adjusted)";
    }
    
    return result;
  } catch (error) {
    console.error(`Error in getNutritionForFood: ${error}`);
    
    // If everything fails, return some default values to avoid breaking the app
    return {
      nutritionalInfo: defaultNutritionValues.default,
      source: "Fallback (error recovery)"
    };
  }
}
