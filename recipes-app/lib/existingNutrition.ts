import fetch from 'node-fetch';
import { NutritionalInfo } from './types';

// Re-export the original getNutritionalInfo function for compatibility
export async function getNutritionalInfo(
  name: string,
  quantity: number,
  unit: string
): Promise<NutritionalInfo | null> {
  try {
    const lowerName = name.toLowerCase();
    
    // Special handling for standard items that should be counted as whole pieces
    if (unit === 'piece' || unit === 'whole') {
      // Import standardItemValues from the main file to avoid circular dependencies
      const { standardItemValues } = await import('./nutrition');
      
      const standardItemMatch = Object.keys(standardItemValues).find(key => 
        lowerName === key || lowerName.includes(key)
      );
      
      if (standardItemMatch) {
        console.log(`Using standard values for "${name}" as a whole item (${quantity} pieces)`);
        
        const baseValues = standardItemValues[standardItemMatch];
        return {
          calories: baseValues.calories * quantity,
          protein: baseValues.protein * quantity,
          fat: baseValues.fat * quantity,
          carbohydrates: baseValues.carbohydrates * quantity,
          fiber: baseValues.fiber * quantity,
          sugar: baseValues.sugar * quantity,
          sodium: baseValues.sodium * quantity,
          cholesterol: baseValues.cholesterol * quantity,
        };
      }
    }
    
    // Try the comprehensive approach (with caching)
    const { getComprehensiveNutritionalInfo } = await import('./nutrition');
    const result = await getComprehensiveNutritionalInfo(name, quantity, unit);
    
    if (result) {
      return result.nutritionalInfo;
    }
    
    return null;
  } catch (error: any) {
    console.error(`Error in legacy getNutritionalInfo for ${name}:`, error.message);
    return null;
  }
} 