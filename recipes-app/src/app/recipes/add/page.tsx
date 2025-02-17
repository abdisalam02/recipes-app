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
      return;
    }
    setLoading(true);
    try {
      const parsedData: JsonData = JSON.parse(jsonData);
      if (
        !parsedData.title?.trim() ||
        !parsedData.category?.trim() ||
        !parsedData.region?.trim() ||
        !parsedData.description?.trim() ||
        parsedData.portion < 1 ||
        !Array.isArray(parsedData.ingredients) ||
        !Array.isArray(parsedData.steps)
      ) {
        throw new Error(
          'JSON data is missing required fields or has invalid formats.'
        );
      }
      const res = await fetch('/api/ingredients');
      if (!res.ok) {
        throw new Error('Failed to fetch ingredients for mapping.');
      }
      const ingredientsData = await res.json();
      const ingredientMap: { [key: string]: number } = {};
      ingredientsData.forEach((ing: any) => {
        ingredientMap[ing.name.toLowerCase()] = ing.id;
      });
      const mappedIngredients = await Promise.all(
        parsedData.ingredients.map(async (ing: any) => {
          const ingredientName = ing.name.trim();
          const ingredient_id = ingredientMap[ingredientName.toLowerCase()];
          if (ingredient_id) {
            return {
              ingredient_id,
              quantity: ing.quantity,
              unit: ing.unit.trim(),
              name: ingredientName,
            };
          } else {
            const { data: newIngredient, error: createError } = await supabase
              .from('ingredients')
              .insert({ name: ingredientName })
              .select('id')
              .single();
            if (createError) {
              throw new Error(
                `Failed to add ingredient "${ingredientName}".`
              );
            }
            return {
              ingredient_id: newIngredient.id,
              quantity: ing.quantity,
              unit: ing.unit.trim(),
              name: ingredientName,
            };
          }
        })
      );
      const payload: RecipeInput = {
        title: parsedData.title.trim(),
        category: parsedData.category.trim(),
        region: parsedData.region.trim(),
        description: parsedData.description.trim(),
        portion: parsedData.portion,
        image: parsedData.image?.trim() || '',
        ingredients: mappedIngredients,
        steps: parsedData.steps.map((step: any, index: number) => ({
          order: step.order || index + 1,
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
        setJsonData('');
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to add recipe via JSON'
        );
      }
    } catch (error: any) {
      console.error('JSON submission error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
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
  "title": "Chocolate Cake",
  "category": "dessert",
  "region": "italian",
  "description": "A rich and moist chocolate cake.",
  "image": "https://example.com/chocolate-cake.jpg",
  "portion": 8,
  "ingredients": [
    { "quantity": 2, "unit": "cups", "name": "flour" },
    { "quantity": 1.5, "unit": "cups", "name": "sugar" }
  ],
  "steps": [
    { "order": 1, "description": "Preheat oven to 350°F (175°C)." },
    { "order": 2, "description": "Mix all dry ingredients." }
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
  "region": "italian",
  "description": "A rich and moist chocolate cake.",
  "image": "https://example.com/chocolate-cake.jpg",
  "portion": 8,
  "ingredients": [
    { "quantity": 2, "unit": "cups", "name": "flour" },
    { "quantity": 1.5, "unit": "cups", "name": "sugar" }
  ],
  "steps": [
    { "order": 1, "description": "Preheat oven to 350°F (175°C)." },
    { "order": 2, "description": "Mix all dry ingredients." }
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
        <div className="fixed top-4 right-4 z-50 transition-opacity duration-300">
          <div
            className={`alert shadow-lg ${
              popupMessage.includes("Failed")
                ? "alert-error"
                : "alert-success"
            }`}
          >
            <div>
              <span className="font-bold">{popupMessage}</span>
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
