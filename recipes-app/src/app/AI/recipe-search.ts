// Simple recipe search function that only searches by title
export function searchRecipes(recipes: any[], searchQuery: string): any[] {
  if (!searchQuery.trim()) {
    return recipes;
  }
  
  const query = searchQuery.toLowerCase();
  return recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(query)
  );
} 