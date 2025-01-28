// src/lib/types.ts
// src/lib/types.ts

export interface EdamamNutritionResponse {
  calories: number;
  totalWeight: number;
  totalTime: number;
  totalNutrients: {
    [key: string]: {
      label: string;
      quantity: number;
      unit: string;
    };
  };
  totalDaily: {
    [key: string]: {
      label: string;
      quantity: number;
      unit: string;
    };
  };
  dietLabels: string[];
  healthLabels: string[];
  cautions: string[];
  totalNutrientsKCal: {
    [key: string]: {
      label: string;
      quantity: number;
      unit: string;
    };
  };
  uri: string;
}

// ... existing interfaces ...

export type Recipe = RecipeDetail;


export interface RecipeInput {
  title: string;
  category: string;
  region: string;
  description: string;
  portion: number;
  image?: string;
  ingredients: IngredientInput[];
  steps: StepInput[];
}

export interface IngredientInput {
  ingredient_id?: number; // Existing ingredient ID
  name: string;            // New or existing ingredient name
  quantity: number;
  unit: string;
}

export interface StepInput {
  order?: number;
  description: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

export interface RecipeDetail {
  id: number;
  title: string;
  category: string;
  region: string;
  image: string;
  description: string;
  portion: number;
  nutritional_info: NutritionalInfo;
  recipe_ingredients: RecipeIngredient[];
  steps: Step[];
  per_ingredient_nutritional_info: PerIngredientNutritionalInfo[];
}

export interface RecipeIngredient {
  ingredient_id: number;
  quantity: number;
  unit: string;
  ingredient: {
    id: number;
    name: string;
  };
}

export interface PerIngredientNutritionalInfo {
  id: string;
  recipe_id: number;
  ingredient_id: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbohydrates?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  created_at?: string;
}

export interface Step {
  id: number;
  order: number;
  description: string;
}

export interface Favorite {
  id: number;
  recipe_id: number;
  created_at: string;
}


