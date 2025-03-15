'use client';

import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import debounce from 'lodash.debounce';
import supabase from '../../../../lib/supabaseClient';
import {
  NutritionalInfo,
  RecipeInput,
  Favorite,
  IngredientInput,
} from '../../../../lib/types';
import { units } from '../../../../lib/units';
import {
  IconChefHat,
  IconPlus,
  IconMinus,
  IconTrash,
  IconArrowDown,
  IconX,
} from '@tabler/icons-react';

// Define a local alias for JSON data
type JsonData = any;

// Define Category and Region options
const categories = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Snack',
  'Beverage',
  'Appetizer',
].map((cat) => ({ value: cat.toLowerCase(), label: cat }));

const regions = [
  'Italian',
  'American',
  'Mexican',
  'Mediterranean',
  'Asian',
  'French',
  'Indian',
].map((reg) => ({ value: reg.toLowerCase(), label: reg }));

// --- Custom Hooks ---

// Debounce a value
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Get window scroll position
function useWindowScroll() {
  const [scroll, setScroll] = useState({ y: 0 });
  useEffect(() => {
    const handleScroll = () => setScroll({ y: window.scrollY });
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return scroll;
}

export default function AddRecipePage() {
  const router = useRouter();

  // Tab state: "form" or "json"
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [modalOpened, setModalOpened] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [autoFetchImage, setAutoFetchImage] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // Available ingredients for autocomplete
  const [availableIngredients, setAvailableIngredients] = useState<
    { value: number; label: string }[]
  >([]);

  // Form state (using RecipeInput)
  const [formData, setFormData] = useState<RecipeInput>({
    title: '',
    category: '',
    region: '',
    description: '',
    ingredients: [{ quantity: 1, unit: 'g', name: '' }],
    steps: [{ description: '' }],
    image: '',
    portion: 1,
  });

  // Ref for nutritional info table scrolling
  const fullNutritionalInfoRef = useRef<HTMLDivElement>(null);
  const scroll = useWindowScroll();

  // Fetch available ingredients on mount
  useEffect(() => {
    async function fetchIngredients() {
      try {
        const res = await fetch('/api/ingredients');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch ingredients');
        }
        const data = await res.json();
        const formatted = data.map((ing: any) => ({
          value: ing.id,
          label: ing.name,
        }));
        setAvailableIngredients(formatted);
      } catch (error) {
        console.error('Failed to load ingredients:', error);
      }
    }
    fetchIngredients();
  }, []);

  // Debounce title for auto-fetching image
  const debouncedTitle = useDebouncedValue(formData.title, 500);
  useEffect(() => {
    if (autoFetchImage && !formData.image?.trim()) {
      fetchDefaultImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, autoFetchImage]);

  // Handlers for ingredients
  const handleAddIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { quantity: 1, unit: 'g', name: '' }],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof IngredientInput,
    value: number | string | undefined
  ) => {
    setFormData((prev) => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredients: updated };
    });
  };

  // Handlers for steps
  const handleAddStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { description: '' }],
    }));
  };

  const handleRemoveStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleStepChange = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.steps];
      updated[index] = { ...updated[index], description: value };
      return { ...prev, steps: updated };
    });
  };

  const isFormValid = (): boolean => {
    if (
      !formData.title.trim() ||
      !formData.category.trim() ||
      !formData.region.trim() ||
      !formData.description.trim() ||
      formData.portion < 1 ||
      formData.ingredients.some(
        (ing) => ing.quantity <= 0 || !ing.unit.trim() || !ing.name.trim()
      ) ||
      formData.steps.some((step) => !step.description.trim())
    ) {
      return false;
    }
    return true;
  };

  // Fetch default image using recipe title
  const fetchDefaultImage = async (): Promise<void> => {
    if (!formData.title.trim()) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `/api/fetch-default-image?query=${encodeURIComponent(formData.title)}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch default image');
      }
      const data = await res.json();
      setFormData((prev) => ({ ...prev, image: data.imageUrl }));
    } catch (error: any) {
      console.error('Failed to fetch default image:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch nutritional info by calling the API route.
  const handleFetchNutritionalInfo = async () => {
    try {
      const response = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: formData.ingredients,
          portion: formData.portion,
        }),
      });
      if (response.ok) {
        const perPortion = await response.json();
        setNutritionalInfo(perPortion);
      } else {
        console.error('Failed to fetch nutritional info.');
      }
    } catch (error) {
      console.error('Error fetching nutritional info:', error);
    }
  };

  // Submit Form (via Form Input)
  const handleFormSubmit = async (): Promise<void> => {
    if (!isFormValid()) {
      console.error('Form validation failed.');
      return;
    }
    setLoading(true);
    try {
      const payload: RecipeInput = {
        title: formData.title.trim(),
        category: formData.category.trim(),
        region: formData.region.trim(),
        description: formData.description.trim(),
        portion: formData.portion,
        image: formData.image?.trim() || '',
        ingredients: formData.ingredients.map((ing) => ({
          ingredient_id: (ing as any).ingredient_id,
          name: ing.name.trim(),
          quantity: ing.quantity,
          unit: ing.unit.trim(),
        })),
        steps: formData.steps.map((step, index) => ({
          order: index + 1,
          description: step.description.trim(),
        })),
      };

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        const recipeId = responseData.recipe.id;
        if (!payload.image) {
          await updateRecipeImage(recipeId, payload.title);
        }
        setFormData({
          title: '',
          category: '',
          region: '',
          description: '',
          ingredients: [{ quantity: 1, unit: 'g', name: '' }],
          steps: [{ description: '' }],
          image: '',
          portion: 1,
        });
        setAutoFetchImage(true);
        // Fetch and display nutritional info after submission
        await handleFetchNutritionalInfo();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add recipe');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Submit JSON Form (refactored to not require an event parameter)
  const handleJsonSubmitInternal = async (): Promise<void> => {
    if (!jsonData.trim()) {
      console.error('JSON data is empty.');
      setPopupMessage("JSON data is empty. Please provide recipe data.");
      setShowPopup(true);
      return;
    }
    setLoading(true);
    try {
      // Parse JSON data
      let parsedData: JsonData;
      try {
        // First try to parse as JSON
        parsedData = JSON.parse(jsonData);
      } catch (parseError) {
        // If JSON parsing fails, try to parse as text format
        try {
          console.log("JSON parsing failed, trying to parse as text format");
          parsedData = parseTextFormat(jsonData);
        } catch (textParseError) {
          throw new Error('Invalid format. Please provide valid JSON or properly formatted text.');
        }
      }

      console.log("Parsed data:", parsedData);

      // Validate required fields with more detailed error messages
      if (!parsedData.title?.trim()) {
        throw new Error('Recipe title is required.');
      }
      if (!parsedData.category?.trim()) {
        throw new Error('Recipe category is required.');
      }
      if (!parsedData.region?.trim()) {
        throw new Error('Recipe region is required.');
      }
      if (!parsedData.description?.trim()) {
        throw new Error('Recipe description is required.');
      }
      if (!parsedData.portion || parsedData.portion < 1) {
        throw new Error('Recipe portion must be at least 1.');
      }
      
      // Ensure ingredients array exists
      if (!parsedData.ingredients) {
        parsedData.ingredients = [];
      } else if (!Array.isArray(parsedData.ingredients)) {
        // If ingredients is not an array, try to convert it
        try {
          parsedData.ingredients = [parsedData.ingredients];
        } catch (e) {
          parsedData.ingredients = [];
        }
      }
      
      // Ensure steps array exists
      if (!parsedData.steps) {
        parsedData.steps = [];
      } else if (!Array.isArray(parsedData.steps)) {
        // If steps is not an array, try to convert it
        try {
          parsedData.steps = [parsedData.steps];
        } catch (e) {
          parsedData.steps = [];
        }
      }

      // Process and sanitize ingredients
      const sanitizedIngredients = parsedData.ingredients.map((ing: any, index: number) => {
        // Handle case where ingredient might be a string
        if (typeof ing === 'string') {
          // Try to parse string format like "2 cups flour"
          const match = ing.match(/^(\d+\.?\d*)\s+(\w+)\s+(.+)$/);
          if (match) {
            return {
              name: match[3].trim(),
              quantity: parseFloat(match[1]),
              unit: match[2].trim()
            };
          } else {
            // Default values if parsing fails
            return {
              name: ing.trim(),
              quantity: 1,
              unit: 'g'
            };
          }
        }
        
        // Sanitize ingredient name - remove special characters and limit length
        let sanitizedName = ing.name ? ing.name.trim() : `Ingredient ${index + 1}`;
        
        // Limit name length to 100 characters
        if (sanitizedName.length > 100) {
          sanitizedName = sanitizedName.substring(0, 100);
        }
        
        // Ensure quantity is a valid number
        let quantity = 1;
        if (ing.quantity) {
          quantity = typeof ing.quantity === 'number' ? ing.quantity : parseFloat(ing.quantity);
          if (isNaN(quantity) || quantity <= 0) {
            console.warn(`Invalid quantity for ingredient "${sanitizedName}". Using default value 1.`);
            quantity = 1;
          }
        }
        
        // Ensure unit is a string
        const unit = ing.unit?.trim() || 'g';
        
        return {
          name: sanitizedName,
          quantity,
          unit
        };
      });

      // Fetch ingredients for mapping
      const res = await fetch('/api/ingredients');
      if (!res.ok) {
        throw new Error('Failed to fetch ingredients for mapping. Server returned: ' + res.status);
      }
      const ingredientsData = await res.json();
      const ingredientMap: { [key: string]: number } = {};
      ingredientsData.forEach((ing: any) => {
        ingredientMap[ing.name.toLowerCase()] = ing.id;
      });

      // Map ingredients, creating new ones if needed - with better error handling
      const mappedIngredients = [];
      const ingredientErrors = [];
      
      // Process ingredients one by one instead of using Promise.all
      for (let i = 0; i < sanitizedIngredients.length; i++) {
        const ing = sanitizedIngredients[i];
        try {
          const ingredientName = ing.name;
          const ingredientLower = ingredientName.toLowerCase();
          const ingredient_id = ingredientMap[ingredientLower];
          
          if (ingredient_id) {
            // Use existing ingredient
            mappedIngredients.push({
              ingredient_id,
              quantity: ing.quantity,
              unit: ing.unit,
              name: ingredientName,
            });
          } else {
            // Create new ingredient
            try {
              console.log(`Creating new ingredient: ${ingredientName}`);
              const { data: newIngredient, error: createError } = await supabase
                .from('ingredients')
                .insert({ name: ingredientName })
                .select('id')
                .single();
                
              if (createError) {
                console.error('Error creating ingredient:', createError);
                ingredientErrors.push(`Failed to add ingredient "${ingredientName}": ${createError.message}`);
                continue; // Skip this ingredient but continue with others
              }
              
              if (!newIngredient || !newIngredient.id) {
                ingredientErrors.push(`Failed to get ID for newly created ingredient "${ingredientName}"`);
                continue; // Skip this ingredient but continue with others
              }
              
              mappedIngredients.push({
                ingredient_id: newIngredient.id,
                quantity: ing.quantity,
                unit: ing.unit,
                name: ingredientName,
              });
              
              // Update the ingredient map with the new ingredient
              ingredientMap[ingredientLower] = newIngredient.id;
            } catch (err: any) {
              console.error('Supabase error:', err);
              ingredientErrors.push(`Failed to process ingredient "${ingredientName}" at index ${i}: ${err.message}`);
              continue; // Skip this ingredient but continue with others
            }
          }
        } catch (err: any) {
          console.error(`Error processing ingredient at index ${i}:`, err);
          ingredientErrors.push(`Error with ingredient at index ${i}: ${err.message}`);
          continue; // Skip this ingredient but continue with others
        }
      }

      // Process and sanitize steps
      const sanitizedSteps = parsedData.steps.map((step: any, index: number) => {
        // Handle case where step might be a string
        if (typeof step === 'string') {
          return {
            order: index + 1,
            description: step.trim()
          };
        }
        
        // Ensure description is a string and not too long
        let description = step.description?.trim() || '';
        if (!description) {
          description = `Step ${index + 1}`;
        }
        
        // Use provided order or default to index + 1
        const order = step.order || index + 1;
        
        return {
          order,
          description
        };
      });

      // Prepare payload
      const payload: RecipeInput = {
        title: parsedData.title.trim(),
        category: parsedData.category.trim(),
        region: parsedData.region.trim(),
        description: parsedData.description.trim(),
        portion: parsedData.portion,
        image: parsedData.image?.trim() || '',
        ingredients: mappedIngredients,
        steps: sanitizedSteps,
      };

      console.log('Submitting recipe payload:', JSON.stringify({
        title: payload.title,
        category: payload.category,
        region: payload.region,
        ingredients: payload.ingredients.length,
        steps: payload.steps.length
      }));

      // Submit recipe with better error handling
      try {
        const response = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // Handle response
        if (!response.ok) {
          let errorMessage = 'Failed to add recipe via JSON';
          try {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            } catch (jsonError) {
              // If not valid JSON, use the text directly
              errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
            }
          } catch (e) {
            // If response is not JSON, use status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        // Process successful response
        const responseData = await response.json();
        const recipeId = responseData.recipe.id;
        
        // Update image if needed
        if (!payload.image) {
          await updateRecipeImage(recipeId, payload.title);
        }
        
        // Clear form
        setJsonData('');
        
        // Show success message with warnings if any
        if (ingredientErrors.length > 0) {
          setPopupMessage(`Recipe added successfully with ${ingredientErrors.length} ingredient warnings.`);
        } else {
          setPopupMessage("Recipe added successfully!");
        }
        setShowPopup(true);
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Error submitting recipe: ${fetchError.message}`);
      }
    } catch (error: any) {
      console.error('JSON submission error:', error);
      setPopupMessage(error.message || "Failed to add recipe. Please try again.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse text format recipes
  const parseTextFormat = (text: string): JsonData => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // First line is title
    const title = lines[0];
    
    // Second line is category
    const category = lines[1]?.toLowerCase() || 'lunch';
    
    // Look for "servings" to find portion
    let portion = 1;
    let portionLine = lines.find(line => line.toLowerCase().includes('serving'));
    if (portionLine) {
      const match = portionLine.match(/\d+/);
      if (match) {
        portion = parseInt(match[0], 10);
      }
    }
    
    // Find description - it's usually a longer paragraph
    let description = '';
    for (let i = 2; i < lines.length; i++) {
      if (lines[i].length > 30 && !lines[i].match(/^\d+$/) && !lines[i].toLowerCase().includes('ingredient') && !lines[i].toLowerCase().includes('step')) {
        description = lines[i];
        break;
      }
    }
    
    // Default region based on recipe title or description
    let region = 'mediterranean';
    if (title.toLowerCase().includes('moroccan') || 
        title.toLowerCase().includes('msemen') || 
        description.toLowerCase().includes('moroccan') ||
        description.toLowerCase().includes('north african')) {
      region = 'mediterranean';
    } else if (title.toLowerCase().includes('italian') || description.toLowerCase().includes('italian')) {
      region = 'italian';
    } else if (title.toLowerCase().includes('mexican') || description.toLowerCase().includes('mexican')) {
      region = 'mexican';
    } else if (title.toLowerCase().includes('asian') || description.toLowerCase().includes('asian')) {
      region = 'asian';
    } else if (title.toLowerCase().includes('american') || description.toLowerCase().includes('american')) {
      region = 'american';
    } else if (title.toLowerCase().includes('indian') || description.toLowerCase().includes('indian')) {
      region = 'indian';
    } else if (title.toLowerCase().includes('french') || description.toLowerCase().includes('french')) {
      region = 'french';
    }
    
    // Find ingredients and steps
    const ingredients: any[] = [];
    const steps: any[] = [];
    
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.toLowerCase().includes('ingredient')) {
        currentSection = 'ingredients';
        continue;
      } else if (line.toLowerCase().includes('step')) {
        currentSection = 'steps';
        continue;
      }
      
      if (currentSection === 'ingredients') {
        // Skip empty lines and section headers
        if (line && !line.match(/^ingredients$/i)) {
          ingredients.push(line);
        }
      } else if (currentSection === 'steps') {
        // Look for lines that start with numbers
        const stepMatch = line.match(/^(\d+)\s*(.+)$/);
        if (stepMatch) {
          steps.push({
            order: parseInt(stepMatch[1], 10),
            description: stepMatch[2].trim()
          });
        }
      }
    }
    
    // If no ingredients were found but we have steps, try to extract ingredients from steps
    if (ingredients.length === 0 && steps.length > 0) {
      console.log("No ingredients section found, extracting from steps");
      
      // Common ingredient patterns in steps
      const ingredientPatterns = [
        /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cups?|tbsp|tsp|teaspoons?|tablespoons?)\s+(?:of\s+)?([a-zA-Z\s]+)/g,
        /([a-zA-Z\s]+)\s+\((\d+(?:\.\d+)?)\s*(g|kg|ml|l|cups?|tbsp|tsp)\)/g
      ];
      
      // Extract ingredients from step descriptions
      const extractedIngredients = new Set<string>();
      
      steps.forEach(step => {
        const description = step.description;
        
        // Try each pattern
        ingredientPatterns.forEach(pattern => {
          const matches = description.matchAll(pattern);
          for (const match of matches) {
            if (pattern.source.startsWith('(\\d+')) {
              // First pattern: quantity unit name
              const quantity = match[1];
              const unit = match[2];
              const name = match[3].trim();
              extractedIngredients.add(`${quantity} ${unit} ${name}`);
            } else {
              // Second pattern: name (quantity unit)
              const name = match[1].trim();
              const quantity = match[2];
              const unit = match[3];
              extractedIngredients.add(`${quantity} ${unit} ${name}`);
            }
          }
        });
        
        // Look for specific ingredients mentioned in the steps
        const commonIngredients = [
          'chicken', 'flour', 'salt', 'water', 'oil', 'onion', 'garlic', 
          'cheese', 'butter', 'sugar', 'honey', 'egg', 'milk', 'cream',
          'baking powder', 'turmeric', 'cayenne', 'parsley'
        ];
        
        commonIngredients.forEach(ingredient => {
          if (description.toLowerCase().includes(ingredient.toLowerCase())) {
            // If we find a common ingredient without quantity/unit info, add it with defaults
            if (!Array.from(extractedIngredients).some(ing => ing.toLowerCase().includes(ingredient.toLowerCase()))) {
              extractedIngredients.add(`1 g ${ingredient}`);
            }
          }
        });
      });
      
      // Add extracted ingredients to the ingredients array
      Array.from(extractedIngredients).forEach(ing => ingredients.push(ing));
      
      // If we still have no ingredients, add some default ones based on the recipe title
      if (ingredients.length === 0) {
        if (title.toLowerCase().includes('chicken')) {
          ingredients.push('500 g chicken');
        }
        if (title.toLowerCase().includes('msemen') || title.toLowerCase().includes('flatbread')) {
          ingredients.push('500 g flour');
          ingredients.push('300 ml water');
          ingredients.push('10 g salt');
          ingredients.push('30 ml oil');
        }
        if (title.toLowerCase().includes('cheese')) {
          ingredients.push('200 g cheese');
        }
      }
    }
    
    return {
      title,
      category,
      region,
      description,
      portion,
      ingredients,
      steps
    };
  };

  const updateRecipeImage = async (
    recipeId: number,
    title: string
  ): Promise<void> => {
    try {
      const res = await fetch(
        `/api/fetch-default-image?query=${encodeURIComponent(title)}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || 'Failed to fetch default image'
        );
      }
      const data = await res.json();
      await updateRecipeImageAPI(recipeId, data.imageUrl);
    } catch (error: any) {
      console.error('Update recipe image error:', error);
      throw error;
    }
  };

  const updateRecipeImageAPI = async (
    recipeId: number,
    imageUrl: string
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/update-image`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || 'Failed to update recipe image.'
        );
      }
    } catch (error: any) {
      console.error('Update recipe image API error:', error);
      throw error;
    }
  };

  // For scroll-to-top
  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4">
      <div className="card shadow-lg rounded-lg p-4 sm:p-8 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-base-200/70 z-10">
            <button className="btn btn-square btn-lg loading">
              Loading
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col items-center mb-6 gap-4">
          <IconChefHat size={48} className="stroke-current" />
          <h1 className="text-2xl sm:text-3xl font-bold">
            Add New Recipe
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            Share your culinary masterpiece with the world
          </p>
        </div>

        {/* If image is provided, show Start Recipe Preview button */}
        {formData.image && (
          <div className="flex justify-center mb-4">
            <button
              className="btn btn-secondary"
              onClick={() => {
                /* Add preview functionality if desired */
              }}
            >
              Start Recipe Preview
            </button>
          </div>
        )}

        {/* Tabs for Form vs JSON Input */}
        <div className="tabs tabs-boxed mb-6">
          <a
            className={`tab ${activeTab === 'form' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Form Input
          </a>
          <a
            className={`tab ${activeTab === 'json' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            JSON Input
          </a>
        </div>

        {activeTab === 'form' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setModalOpened(true);
            }}
          >
            <div className="flex flex-col gap-4">
              {/* Title Field */}
              <div>
                <label className="label">Recipe Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                />
              </div>

              {/* Category Field */}
              <div>
                <label className="label">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option disabled value="">
                    Select Category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Field */}
              <div>
                <label className="label">Region</label>
                <select
                  required
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      region: e.target.value,
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option disabled value="">
                    Select Region
                  </option>
                  {regions.map((reg) => (
                    <option key={reg.value} value={reg.value}>
                      {reg.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description Field */}
              <div>
                <label className="label">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="textarea textarea-bordered w-full"
                  rows={3}
                ></textarea>
              </div>

              {/* Image Field */}
              <div className="flex gap-4 items-end">
                <div className="flex-grow">
                  <label className="label">Image URL (optional)</label>
                  <input
                    type="text"
                    value={formData.image || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        image: e.target.value,
                      })
                    }
                    className="input input-bordered w-full"
                    placeholder="https://example.com/image.jpg"
                    aria-label="Image URL"
                  />
                </div>
                {formData.image && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, image: '' })
                    }
                    className="btn btn-square btn-error"
                    aria-label="Clear Image URL"
                  >
                    <IconTrash size={16} />
                  </button>
                )}
              </div>

              {/* Auto-Fetch Image Toggle */}
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">
                    Automatically fetch default image if none provided
                  </span>
                  <input
                    type="checkbox"
                    checked={autoFetchImage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setAutoFetchImage(e.currentTarget.checked)
                    }
                    className="checkbox checkbox-primary"
                  />
                </label>
              </div>

              {/* Portions Field */}
              <div className="flex items-center gap-4">
                <label className="label">Portions:</label>
                <input
                  type="number"
                  required
                  value={formData.portion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      portion: Number(e.target.value),
                    })
                  }
                  min="1"
                  max="20"
                  className="input input-bordered w-16"
                />
              </div>

              {/* Ingredients Section */}
              <div>
                <div className="flex items-end gap-2 mb-2">
                  <label className="label">Ingredients</label>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="btn btn-circle btn-success"
                    aria-label="Add Ingredient"
                  >
                    <IconPlus size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {formData.ingredients.map((ing, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap gap-2 items-end"
                    >
                      <input
                        type="number"
                        required
                        value={ing.quantity}
                        onChange={(e) =>
                          setFormData((prev) => {
                            const updated = [...prev.ingredients];
                            updated[index] = {
                              ...updated[index],
                              quantity: Number(e.target.value),
                            };
                            return { ...prev, ingredients: updated };
                          })
                        }
                        min={0.1}
                        step={0.1}
                        className="input input-bordered w-24"
                        placeholder="Quantity"
                        aria-label={`Ingredient ${index + 1} Quantity`}
                      />
                      <select
                        required
                        value={ing.unit}
                        onChange={(e) =>
                          setFormData((prev) => {
                            const updated = [...prev.ingredients];
                            updated[index] = {
                              ...updated[index],
                              unit: e.target.value,
                            };
                            return { ...prev, ingredients: updated };
                          })
                        }
                        className="select select-bordered w-24"
                        aria-label={`Ingredient ${index + 1} Unit`}
                      >
                        {units.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex-grow relative">
                        <label className="label">Ingredient</label>
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const updated = [...prev.ingredients];
                              updated[index] = {
                                ...updated[index],
                                name: e.target.value,
                              };
                              return { ...prev, ingredients: updated };
                            })
                          }
                          className="input input-bordered w-full"
                          placeholder="Type or select ingredient"
                          list={`ingredients-list-${index}`}
                          aria-label={`Ingredient ${index + 1} Name`}
                          required
                        />
                        <datalist id={`ingredients-list-${index}`}>
                          {availableIngredients.map((item) => (
                            <option key={item.value} value={item.label} />
                          ))}
                        </datalist>
                      </div>
                      {formData.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              ingredients: prev.ingredients.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                          className="btn btn-circle btn-error"
                          aria-label={`Remove Ingredient ${index + 1}`}
                        >
                          <IconMinus size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps Section */}
              <div>
                <div className="flex items-end gap-2 mb-2">
                  <label className="label">Steps</label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="btn btn-circle btn-success"
                    aria-label="Add Step"
                  >
                    <IconPlus size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {formData.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap gap-2 items-end"
                    >
                      <input
                        type="number"
                        value={step.order || index + 1}
                        readOnly
                        className="input input-bordered w-16"
                        aria-label={`Step ${index + 1} Order`}
                      />
                      <textarea
                        required
                        value={step.description}
                        onChange={(e) =>
                          handleStepChange(index, e.target.value)
                        }
                        className="textarea textarea-bordered w-full"
                        rows={2}
                        placeholder="Step description"
                        aria-label={`Step ${index + 1} Description`}
                      ></textarea>
                      {formData.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              steps: prev.steps.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                          className="btn btn-circle btn-error"
                          aria-label={`Remove Step ${index + 1}`}
                        >
                          <IconMinus size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                className="btn btn-primary w-full mt-4"
                disabled={!isFormValid()}
                onClick={() => setModalOpened(true)}
              >
                Add Recipe
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setModalOpened(true);
            }}
            className="flex flex-col gap-4"
          >
            <label className="label">Recipe JSON</label>
            <textarea
              name="jsonData"
              className="textarea textarea-bordered w-full"
              rows={10}
              required
              placeholder={`{
  "title": "Chicken Msemen",
  "category": "dinner",
  "region": "mediterranean",
  "description": "Delicious Moroccan square pancakes filled with seasoned chicken, onions, and aromatic spices. This traditional North African dish combines flaky, layered bread with flavorful chicken filling.",
  "portion": 4,
  "ingredients": [
    { "name": "flour", "quantity": 500, "unit": "g" },
    { "name": "water", "quantity": 250, "unit": "ml" },
    { "name": "salt", "quantity": 5, "unit": "g" },
    { "name": "oil", "quantity": 60, "unit": "ml" },
    { "name": "chicken", "quantity": 400, "unit": "g" },
    { "name": "onion", "quantity": 150, "unit": "g" },
    { "name": "garlic powder", "quantity": 5, "unit": "g" },
    { "name": "turmeric", "quantity": 5, "unit": "g" },
    { "name": "cayenne", "quantity": 3, "unit": "g" },
    { "name": "parsley", "quantity": 20, "unit": "g" }
  ],
  "steps": [
    { "order": 1, "description": "In a large bowl, mix the flour and salt. Gradually add water while kneading until you form a smooth, elastic dough." },
    { "order": 2, "description": "Cover the dough with a damp cloth and let it rest for 30 minutes." },
    { "order": 3, "description": "Meanwhile, cook the chicken with diced onions, garlic powder, turmeric, and cayenne until fully cooked." },
    { "order": 4, "description": "Shred the chicken and mix with chopped parsley. Set aside." },
    { "order": 5, "description": "Divide the dough into golf ball-sized pieces. On an oiled surface, flatten each piece into a thin rectangle." },
    { "order": 6, "description": "Place a spoonful of the chicken mixture in the center of each rectangle." },
    { "order": 7, "description": "Fold the edges over the filling to create a square packet, sealing the edges well." },
    { "order": 8, "description": "Heat a tablespoon of oil in a pan over medium heat. Cook each msemen for 3-4 minutes on each side until golden brown and crispy." },
    { "order": 9, "description": "Serve hot with a side of honey or mint tea." }
  ]
}`}
              value={jsonData}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setJsonData(e.target.value)
              }
            ></textarea>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!jsonData.trim()}
            >
              Add Recipe via JSON
            </button>

            <pre className="border p-2 rounded bg-gray-100 whitespace-pre-wrap">
{`{
  "title": "Chocolate Cake",
  "category": "dessert",
  "region": "american",
  "description": "A rich and moist chocolate cake that's perfect for any occasion. This classic dessert is easy to make and always a crowd-pleaser.",
  "portion": 8,
  "ingredients": [
    { "name": "flour", "quantity": 250, "unit": "g" },
    { "name": "sugar", "quantity": 200, "unit": "g" },
    { "name": "cocoa powder", "quantity": 75, "unit": "g" },
    { "name": "baking powder", "quantity": 10, "unit": "g" },
    { "name": "salt", "quantity": 2, "unit": "g" },
    { "name": "eggs", "quantity": 2, "unit": "whole" },
    { "name": "milk", "quantity": 240, "unit": "ml" },
    { "name": "oil", "quantity": 120, "unit": "ml" },
    { "name": "vanilla extract", "quantity": 5, "unit": "ml" }
  ],
  "steps": [
    { "order": 1, "description": "Preheat oven to 350°F (175°C) and grease a 9-inch round cake pan." },
    { "order": 2, "description": "In a large bowl, mix flour, sugar, cocoa powder, baking powder, and salt." },
    { "order": 3, "description": "Add eggs, milk, oil, and vanilla extract. Mix until smooth." },
    { "order": 4, "description": "Pour batter into the prepared pan and bake for 30-35 minutes." },
    { "order": 5, "description": "Let cool completely before serving." }
  ]
}`}
            </pre>
          </form>
        )}

        {/* Confirmation Modal */}
        {modalOpened && (
          <>
            <div className="modal modal-open">
              <div className="modal-box max-w-md">
                <h3 className="font-bold text-xl mb-4">
                  Confirm Submission
                </h3>
                <p className="py-4">
                  Are you sure you want to submit this recipe?
                </p>
                <div className="modal-action">
                  <button
                    className="btn btn-error"
                    onClick={() => setModalOpened(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-success"
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (isSubmitting) return;
                      setIsSubmitting(true);
                      setModalOpened(false); // Immediately hide the modal
                      try {
                        if (activeTab === 'form') {
                          await handleFormSubmit();
                        } else {
                          await handleJsonSubmitInternal();
                        }
                        setPopupMessage("Recipe added successfully!");
                        setShowPopup(true);
                      } catch (error) {
                        setPopupMessage("Failed to add recipe. Please try again.");
                        setShowPopup(true);
                      } finally {
                        setIsSubmitting(false);
                        // Auto-hide popup after 3 seconds
                        setTimeout(() => {
                          setShowPopup(false);
                          setPopupMessage("");
                        }, 3000);
                      }
                    }}
                  >
                    Yes, Submit
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-backdrop bg-black opacity-50"></div>
          </>
        )}
      </div>

      {/* Popup Message */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPopup(false)}></div>
          <div
            className={`alert shadow-xl max-w-md w-full mx-4 p-4 ${
              popupMessage.includes("Failed") || popupMessage.includes("Error") || popupMessage.includes("Invalid")
                ? "alert-error"
                : "alert-success"
            }`}
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center">
                {popupMessage.includes("Failed") || popupMessage.includes("Error") || popupMessage.includes("Invalid") ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-bold text-lg">{popupMessage}</span>
              </div>
              <button 
                onClick={() => setShowPopup(false)}
                className="btn btn-circle btn-sm"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nutritional Information Display */}
      {nutritionalInfo && (
        <div className="card bg-base-100 shadow-sm rounded-lg p-4 mt-8">
          <h3 className="text-xl sm:text-2xl font-semibold">
            Total Nutritional Information (Per Portion)
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-2">
            <p className="text-xs sm:text-sm">
              Calories: {nutritionalInfo.calories.toFixed(2)} kcal
            </p>
            <p className="text-xs sm:text-sm">
              Protein: {nutritionalInfo.protein.toFixed(2)} g
            </p>
            <p className="text-xs sm:text-sm">
              Fat: {nutritionalInfo.fat.toFixed(2)} g
            </p>
            <p className="text-xs sm:text-sm">
              Carbohydrates: {nutritionalInfo.carbohydrates.toFixed(2)} g
            </p>
            <p className="text-xs sm:text-sm">
              Fiber: {nutritionalInfo.fiber.toFixed(2)} g
            </p>
            <p className="text-xs sm:text-sm">
              Sugar: {nutritionalInfo.sugar.toFixed(2)} g
            </p>
            <p className="text-xs sm:text-sm">
              Sodium: {nutritionalInfo.sodium.toFixed(2)} mg
            </p>
            <p className="text-xs sm:text-sm">
              Cholesterol: {nutritionalInfo.cholesterol.toFixed(2)} mg
            </p>
          </div>
        </div>
      )}

      {/* Scroll-to-Top Button */}
      {scroll.y > 100 && (
        <button
          onClick={scrollToTop}
          className="btn btn-circle fixed bottom-6 right-6 transition-transform hover:scale-110"
          aria-label="Scroll to top"
        >
          <IconArrowDown size={24} className="rotate-180" />
        </button>
      )}
    </div>
  );
}

// Dummy helper functions for favorites – replace these with your actual implementations.
function isFavorited(recipe_id: number): boolean {
  return false;
}

async function toggleFavorite(recipe_id: number): Promise<void> {
  console.log(`Toggling favorite for recipe ${recipe_id}`);
}
