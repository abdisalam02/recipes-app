// 'use client';

// import React, {
//   useState,
//   useEffect,
//   useRef,
//   ChangeEvent,
//   FormEvent,
// } from 'react';
// import { useRouter } from 'next/navigation';
// import debounce from 'lodash.debounce';
// import supabase from '../../../lib/supabaseClient';
// import {
//   NutritionalInfo,
//   RecipeInput,
//   RecipeInputFrontend, // Make sure these exist in your lib/types.ts or adjust accordingly
//   Ingredient,
//   Step,
//   Favorite,
//   JsonData,
// } from '../../../lib/types';
// import { units } from '../../../../lib/units';

// // Inline SVG icons to replace Tabler ones
// const PlusIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
//     <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );

// const MinusIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
//     <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );

// const TrashIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
//     <path d="M3 6h18M9 6V4h6v2M10 11v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );

// const ArrowDownIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current inline" viewBox="0 0 24 24">
//     <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );

// const HeartFilledIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current text-red-500" viewBox="0 0 24 24">
//     <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
//   </svg>
// );

// const HeartOutlineIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 stroke-current text-gray-500" fill="none" viewBox="0 0 24 24">
//     <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 8.5C4 5.42 6.42 3 9.5 3c1.74 0 3.41.81 4.5 2.09C15.09 3.81 16.76 3 18.5 3 21.58 3 24 5.42 24 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35l-3.45-3.31C7.4 15.36 4 12.28 4 8.5z"/>
//   </svg>
// );

// // Define Category and Region options
// const categories = [
//   'Breakfast',
//   'Lunch',
//   'Dinner',
//   'Dessert',
//   'Snack',
//   'Beverage',
//   'Appetizer',
// ].map((cat) => ({ value: cat.toLowerCase(), label: cat }));

// const regions = [
//   'Italian',
//   'American',
//   'Mexican',
//   'Mediterranean',
//   'Asian',
//   'French',
//   'Indian',
// ].map((reg) => ({ value: reg.toLowerCase(), label: reg }));

// // --- Custom Hooks ---

// // Debounce a value
// function useDebouncedValue<T>(value: T, delay: number): T {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const handler = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);
//   return debounced;
// }

// // Get window scroll position
// function useWindowScroll() {
//   const [scroll, setScroll] = useState({ y: 0 });
//   useEffect(() => {
//     const handleScroll = () => setScroll({ y: window.scrollY });
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);
//   return scroll;
// }

// export default function AddRecipePage() {
//   const router = useRouter();

//   // Tab state: "form" or "json"
//   const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
//   const [modalOpened, setModalOpened] = useState(false);
//   const [jsonData, setJsonData] = useState('');
//   const [loading, setLoading] = useState<boolean>(false);
//   const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
//   const [autoFetchImage, setAutoFetchImage] = useState<boolean>(true);

//   // Available ingredients for autocomplete
//   const [availableIngredients, setAvailableIngredients] = useState<{ value: number; label: string }[]>([]);

//   // Form state
//   const [formData, setFormData] = useState<RecipeInput>({
//     title: '',
//     category: '',
//     region: '',
//     description: '',
//     ingredients: [{ quantity: 1, unit: 'g', name: '' }],
//     steps: [{ description: '' }],
//     image: '',
//     portion: 1,
//   });

//   // Ref for nutritional info table scrolling
//   const fullNutritionalInfoRef = useRef<HTMLDivElement>(null);
//   const scroll = useWindowScroll();

//   // Fetch available ingredients on mount
//   useEffect(() => {
//     async function fetchIngredients() {
//       try {
//         const res = await fetch('/api/ingredients');
//         if (!res.ok) {
//           const errorData = await res.json();
//           throw new Error(errorData.error || 'Failed to fetch ingredients');
//         }
//         const data = await res.json();
//         const formatted = data.map((ing: any) => ({
//           value: ing.id,
//           label: ing.name,
//         }));
//         setAvailableIngredients(formatted);
//       } catch (error) {
//         console.error(error);
//         alert('Failed to load ingredients.');
//       }
//     }
//     fetchIngredients();
//   }, []);

//   // Debounce title for auto-fetching image
//   const debouncedTitle = useDebouncedValue(formData.title, 500);
//   useEffect(() => {
//     if (autoFetchImage && !formData.image.trim()) {
//       fetchDefaultImage();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [debouncedTitle, autoFetchImage]);

//   // Handlers for ingredients
//   const handleAddIngredient = () => {
//     setFormData((prev) => ({
//       ...prev,
//       ingredients: [...prev.ingredients, { quantity: 1, unit: 'g', name: '' }],
//     }));
//   };

//   const handleRemoveIngredient = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       ingredients: prev.ingredients.filter((_, i) => i !== index),
//     }));
//   };

//   const handleIngredientChange = (
//     index: number,
//     field: keyof Ingredient,
//     value: number | string | undefined
//   ) => {
//     setFormData((prev) => {
//       const updated = [...prev.ingredients];
//       updated[index] = { ...updated[index], [field]: value };
//       return { ...prev, ingredients: updated };
//     });
//   };

//   // Handlers for steps
//   const handleAddStep = () => {
//     setFormData((prev) => ({
//       ...prev,
//       steps: [...prev.steps, { description: '' }],
//     }));
//   };

//   const handleRemoveStep = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       steps: prev.steps.filter((_, i) => i !== index),
//     }));
//   };

//   const handleStepChange = (index: number, value: string) => {
//     setFormData((prev) => {
//       const updated = [...prev.steps];
//       updated[index] = { ...updated[index], description: value };
//       return { ...prev, steps: updated };
//     });
//   };

//   const isFormValid = (): boolean => {
//     if (
//       !formData.title.trim() ||
//       !formData.category.trim() ||
//       !formData.region.trim() ||
//       !formData.description.trim() ||
//       formData.portion < 1 ||
//       formData.ingredients.some(
//         (ing) => ing.quantity <= 0 || !ing.unit.trim() || !ing.name.trim()
//       ) ||
//       formData.steps.some((step) => !step.description.trim())
//     ) {
//       return false;
//     }
//     return true;
//   };

//   // Fetch default image using recipe title
//   const fetchDefaultImage = async (): Promise<void> => {
//     if (!formData.title.trim()) {
//       // Do nothing if the title is empty—avoid showing the alert repeatedly.
//       return;
//     }
//     try {
//       setLoading(true);
//       const res = await fetch(
//         `/api/fetch-default-image?query=${encodeURIComponent(formData.title)}`
//       );
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to fetch default image');
//       }
//       const data = await res.json();
//       setFormData((prev) => ({ ...prev, image: data.imageUrl }));
//       alert('A default image has been fetched!');
//     } catch (error: any) {
//       alert(error.message || 'Failed to fetch default image.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Submit Form (via Form Input)
//   const handleFormSubmit = async (): Promise<void> => {
//     if (!isFormValid()) {
//       alert('Please fill out all required fields correctly.');
//       return;
//     }
//     setLoading(true);
//     try {
//       // Note: If your types do not export RecipeInputFrontend, update this accordingly.
//       const payload: RecipeInputFrontend = {
//         title: formData.title.trim(),
//         category: formData.category.trim(),
//         region: formData.region.trim(),
//         description: formData.description.trim(),
//         portion: formData.portion,
//         image: formData.image.trim() || undefined,
//         ingredients: formData.ingredients.map((ing) => ({
//           ingredient_id: ing.ingredient_id,
//           quantity: ing.quantity,
//           unit: ing.unit.trim(),
//           name: ing.name.trim(),
//         })),
//         steps: formData.steps.map((step, index) => ({
//           order: index + 1,
//           description: step.description.trim(),
//         })),
//       };

//       const response = await fetch('/api/recipes', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       if (response.ok) {
//         const responseData = await response.json();
//         const recipeId = responseData.recipe.id;
//         if (!payload.image) {
//           await updateRecipeImage(recipeId, payload.title);
//         }
//         const recipeResponse = await fetch(`/api/recipes/${recipeId}`);
//         if (!recipeResponse.ok) {
//           throw new Error('Failed to fetch recipe details.');
//         }
//         const recipeDetails = await recipeResponse.json();
//         alert('Recipe added successfully!');
//         // Reset form
//         setFormData({
//           title: '',
//           category: '',
//           region: '',
//           description: '',
//           ingredients: [{ quantity: 1, unit: 'g', name: '' }],
//           steps: [{ description: '' }],
//           image: '',
//           portion: 1,
//         });
//         setAutoFetchImage(true);
//       } else {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to add recipe');
//       }
//     } catch (error: any) {
//       alert(error.message || 'Failed to add recipe.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Submit JSON Form
//   const handleJsonSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
//     e.preventDefault();
//     if (!jsonData.trim()) {
//       alert('Please provide valid JSON data.');
//       return;
//     }
//     setLoading(true);
//     try {
//       const parsedData: JsonData = JSON.parse(jsonData);
//       // Basic validation – adjust as needed
//       if (
//         !parsedData.title?.trim() ||
//         !parsedData.category?.trim() ||
//         !parsedData.region?.trim() ||
//         !parsedData.description?.trim() ||
//         parsedData.portion < 1 ||
//         !Array.isArray(parsedData.ingredients) ||
//         !Array.isArray(parsedData.steps)
//       ) {
//         throw new Error('JSON data is missing required fields or has invalid formats.');
//       }
//       const res = await fetch('/api/ingredients');
//       if (!res.ok) {
//         throw new Error('Failed to fetch ingredients for mapping.');
//       }
//       const ingredientsData = await res.json();
//       const ingredientMap: { [key: string]: number } = {};
//       ingredientsData.forEach((ing: any) => {
//         ingredientMap[ing.name.toLowerCase()] = ing.id;
//       });
//       const mappedIngredients: Ingredient[] = await Promise.all(
//         parsedData.ingredients.map(async (ing: any) => {
//           const ingredientName = ing.name.trim();
//           const ingredient_id = ingredientMap[ingredientName.toLowerCase()];
//           if (ingredient_id) {
//             return {
//               ingredient_id,
//               quantity: ing.quantity,
//               unit: ing.unit.trim(),
//               name: ingredientName,
//             };
//           } else {
//             const { data: newIngredient, error: createError } = await supabase
//               .from('ingredients')
//               .insert({ name: ingredientName })
//               .select('id')
//               .single();
//             if (createError) {
//               throw new Error(`Failed to add ingredient "${ingredientName}".`);
//             }
//             return {
//               ingredient_id: newIngredient.id,
//               quantity: ing.quantity,
//               unit: ing.unit.trim(),
//               name: ingredientName,
//             };
//           }
//         })
//       );
//       const payload: RecipeInputFrontend = {
//         title: parsedData.title.trim(),
//         category: parsedData.category.trim(),
//         region: parsedData.region.trim(),
//         description: parsedData.description.trim(),
//         portion: parsedData.portion,
//         image: parsedData.image?.trim() || undefined,
//         ingredients: mappedIngredients,
//         steps: parsedData.steps.map((step: any, index: number) => ({
//           order: step.order || index + 1,
//           description: step.description.trim(),
//         })),
//       };
//       const response = await fetch('/api/recipes', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
//       if (response.ok) {
//         const responseData = await response.json();
//         const recipeId = responseData.recipe.id;
//         if (!payload.image) {
//           await updateRecipeImage(recipeId, payload.title);
//         }
//         const recipeResponse = await fetch(`/api/recipes/${recipeId}`);
//         if (!recipeResponse.ok) {
//           throw new Error('Failed to fetch recipe details.');
//         }
//         const recipeDetails = await recipeResponse.json();
//         alert('Recipe added successfully via JSON!');
//         setJsonData('');
//       } else {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to add recipe via JSON');
//       }
//     } catch (error: any) {
//       if (error instanceof SyntaxError) {
//         alert('Please ensure the JSON is correctly formatted.');
//       } else {
//         alert(error.message || 'Failed to add recipe via JSON.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Update recipe image using API
//   const updateRecipeImage = async (recipeId: number, title: string): Promise<void> => {
//     try {
//       const res = await fetch(`/api/fetch-default-image?query=${encodeURIComponent(title)}`);
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to fetch default image');
//       }
//       const data = await res.json();
//       await updateRecipeImageAPI(recipeId, data.imageUrl);
//     } catch (error: any) {
//       alert(error.message || 'Failed to fetch and update recipe image.');
//     }
//   };

//   const updateRecipeImageAPI = async (recipeId: number, imageUrl: string): Promise<void> => {
//     try {
//       const res = await fetch(`/api/recipes/${recipeId}/update-image`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ imageUrl }),
//       });
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to update recipe image.');
//       }
//     } catch (error: any) {
//       alert(error.message || 'Failed to update recipe image.');
//       throw error;
//     }
//   };

//   return (
//     <div className="container mx-auto py-8 px-2 sm:px-4">
//       <div className="card shadow-lg rounded-lg p-4 sm:p-8 relative bg-base-100">
//         {/* Loading Overlay */}
//         {loading && (
//           <div className="absolute inset-0 flex justify-center items-center bg-base-200/70 z-10">
//             <button className="btn btn-square btn-lg loading">Loading</button>
//           </div>
//         )}

//         {/* Header Section */}
//         <div className="flex flex-col items-center mb-6 gap-4">
//           <div className="w-12 h-12">
//             {/* Use a simple inline SVG for a chef hat (or any other icon) */}
//             <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full fill-current text-primary" viewBox="0 0 24 24">
//               <path d="M2 12h20v2H2z" />
//             </svg>
//           </div>
//           <h1 className="text-2xl sm:text-3xl font-bold">Add New Recipe</h1>
//           <p className="text-xs sm:text-sm text-gray-500 text-center">
//             Share your culinary masterpiece with the world
//           </p>
//         </div>

//         {/* Tabs for Form vs JSON Input */}
//         <div className="tabs tabs-boxed mb-6 justify-center">
//           <a
//             className={`tab ${activeTab === 'form' ? 'tab-active' : ''}`}
//             onClick={() => setActiveTab('form')}
//           >
//             Form Input
//           </a>
//           <a
//             className={`tab ${activeTab === 'json' ? 'tab-active' : ''}`}
//             onClick={() => setActiveTab('json')}
//           >
//             JSON Input
//           </a>
//         </div>

//         {activeTab === 'form' && (
//           <form onSubmit={(e) => { e.preventDefault(); setModalOpened(true); }}>
//             <div className="flex flex-col gap-4">
//               {/* Title Field */}
//               <div>
//                 <label className="label">Recipe Title</label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.title}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     setFormData({ ...formData, title: e.target.value })
//                   }
//                   className="input input-bordered w-full"
//                 />
//               </div>

//               {/* Category Field */}
//               <div>
//                 <label className="label">Category</label>
//                 <select
//                   required
//                   value={formData.category}
//                   onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//                   className="select select-bordered w-full"
//                 >
//                   <option disabled value="">
//                     Select Category
//                   </option>
//                   {categories.map((cat) => (
//                     <option key={cat.value} value={cat.value}>
//                       {cat.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Region Field */}
//               <div>
//                 <label className="label">Region</label>
//                 <select
//                   required
//                   value={formData.region}
//                   onChange={(e) => setFormData({ ...formData, region: e.target.value })}
//                   className="select select-bordered w-full"
//                 >
//                   <option disabled value="">
//                     Select Region
//                   </option>
//                   {regions.map((reg) => (
//                     <option key={reg.value} value={reg.value}>
//                       {reg.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Description Field */}
//               <div>
//                 <label className="label">Description</label>
//                 <textarea
//                   required
//                   value={formData.description}
//                   onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
//                     setFormData({ ...formData, description: e.target.value })
//                   }
//                   className="textarea textarea-bordered w-full"
//                   rows={3}
//                 ></textarea>
//               </div>

//               {/* Image Field */}
//               <div className="flex gap-4 items-end">
//                 <div className="flex-grow">
//                   <label className="label">Image URL (optional)</label>
//                   <input
//                     type="text"
//                     value={formData.image}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       setFormData({ ...formData, image: e.target.value })
//                     }
//                     className="input input-bordered w-full"
//                     placeholder="https://example.com/image.jpg"
//                     aria-label="Image URL"
//                   />
//                 </div>
//                 {formData.image && (
//                   <button
//                     type="button"
//                     onClick={() => setFormData({ ...formData, image: '' })}
//                     className="btn btn-square btn-error"
//                     aria-label="Clear Image URL"
//                   >
//                     <TrashIcon />
//                   </button>
//                 )}
//               </div>

//               {/* Auto-Fetch Image Toggle */}
//               <div className="form-control">
//                 <label className="cursor-pointer label">
//                   <span className="label-text">
//                     Automatically fetch default image if none provided
//                   </span>
//                   <input
//                     type="checkbox"
//                     checked={autoFetchImage}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       setAutoFetchImage(e.currentTarget.checked)
//                     }
//                     className="checkbox checkbox-primary"
//                   />
//                 </label>
//               </div>

//               {/* Portions Field */}
//               <div className="flex items-center gap-4">
//                 <label className="label">Portions:</label>
//                 <input
//                   type="number"
//                   required
//                   value={formData.portion}
//                   onChange={(e) =>
//                     setFormData({ ...formData, portion: Number(e.target.value) })
//                   }
//                   min={1}
//                   max={20}
//                   className="input input-bordered w-16"
//                 />
//               </div>

//               {/* Ingredients Section */}
//               <div>
//                 <div className="flex items-end gap-2 mb-2">
//                   <label className="label">Ingredients</label>
//                   <button
//                     type="button"
//                     onClick={handleAddIngredient}
//                     className="btn btn-circle btn-success"
//                     aria-label="Add Ingredient"
//                   >
//                     <PlusIcon />
//                   </button>
//                 </div>
//                 <div className="flex flex-col gap-4">
//                   {formData.ingredients.map((ing, index) => (
//                     <div key={index} className="flex flex-wrap gap-2 items-end">
//                       <input
//                         type="number"
//                         required
//                         value={ing.quantity}
//                         onChange={(e) =>
//                           handleIngredientChange(index, 'quantity', Number(e.target.value))
//                         }
//                         min={0.1}
//                         step={0.1}
//                         className="input input-bordered w-24"
//                         placeholder="Quantity"
//                         aria-label={`Ingredient ${index + 1} Quantity`}
//                       />
//                       <select
//                         required
//                         value={ing.unit}
//                         onChange={(e) =>
//                           handleIngredientChange(index, 'unit', e.target.value)
//                         }
//                         className="select select-bordered w-24"
//                         aria-label={`Ingredient ${index + 1} Unit`}
//                       >
//                         {units.map((unit) => (
//                           <option key={unit.value} value={unit.value}>
//                             {unit.label}
//                           </option>
//                         ))}
//                       </select>
//                       <div className="flex-grow relative">
//                         <label className="label">Ingredient</label>
//                         <input
//                           type="text"
//                           value={ing.name}
//                           onChange={(e) =>
//                             handleIngredientChange(index, 'name', e.target.value)
//                           }
//                           className="input input-bordered w-full"
//                           placeholder="Type or select ingredient"
//                           list={`ingredients-list-${index}`}
//                           aria-label={`Ingredient ${index + 1} Name`}
//                         />
//                         <datalist id={`ingredients-list-${index}`}>
//                           {availableIngredients.map((item) => (
//                             <option key={item.value} value={item.label} />
//                           ))}
//                         </datalist>
//                       </div>
//                       {formData.ingredients.length > 1 && (
//                         <button
//                           type="button"
//                           onClick={() => handleRemoveIngredient(index)}
//                           className="btn btn-circle btn-error"
//                           aria-label={`Remove Ingredient ${index + 1}`}
//                         >
//                           <MinusIcon />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Steps Section */}
//               <div>
//                 <div className="flex items-end gap-2 mb-2">
//                   <label className="label">Steps</label>
//                   <button
//                     type="button"
//                     onClick={handleAddStep}
//                     className="btn btn-circle btn-success"
//                     aria-label="Add Step"
//                   >
//                     <PlusIcon />
//                   </button>
//                 </div>
//                 <div className="flex flex-col gap-4">
//                   {formData.steps.map((step, index) => (
//                     <div key={index} className="flex flex-wrap gap-2 items-end">
//                       <input
//                         type="number"
//                         value={step.order || index + 1}
//                         readOnly
//                         className="input input-bordered w-16"
//                         aria-label={`Step ${index + 1} Order`}
//                       />
//                       <textarea
//                         required
//                         value={step.description}
//                         onChange={(e) => handleStepChange(index, e.target.value)}
//                         className="textarea textarea-bordered w-full"
//                         rows={2}
//                         placeholder="Step description"
//                         aria-label={`Step ${index + 1} Description`}
//                       ></textarea>
//                       {formData.steps.length > 1 && (
//                         <button
//                           type="button"
//                           onClick={() => handleRemoveStep(index)}
//                           className="btn btn-circle btn-error"
//                           aria-label={`Remove Step ${index + 1}`}
//                         >
//                           <MinusIcon />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="button"
//                 className="btn btn-primary w-full"
//                 disabled={!isFormValid()}
//                 onClick={() => setModalOpened(true)}
//               >
//                 Add Recipe
//               </button>
//             </div>
//           </form>
//         )}

//         {activeTab === 'json' && (
//           <form onSubmit={handleJsonSubmit}>
//             <div className="flex flex-col gap-4">
//               <label className="label">Recipe JSON</label>
//               <textarea
//                 name="jsonData"
//                 className="textarea textarea-bordered w-full"
//                 rows={10}
//                 required
//                 placeholder={`{
//   "title": "Chocolate Cake",
//   "category": "dessert",
//   "region": "italian",
//   "description": "A rich and moist chocolate cake.",
//   "image": "https://example.com/chocolate-cake.jpg",
//   "portion": 8,
//   "ingredients": [
//     { "quantity": 2, "unit": "cups", "name": "flour" },
//     { "quantity": 1.5, "unit": "cups", "name": "sugar" }
//   ],
//   "steps": [
//     { "order": 1, "description": "Preheat oven to 350°F (175°C)." },
//     { "order": 2, "description": "Mix all dry ingredients." }
//   ]
// }`}
//                 value={jsonData}
//                 onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJsonData(e.target.value)}
//               ></textarea>

//               <button
//                 type="submit"
//                 className="btn btn-primary w-full"
//                 disabled={!jsonData.trim()}
//               >
//                 Add Recipe via JSON
//               </button>

//               <pre className="border p-2 rounded bg-gray-100 whitespace-pre-wrap">
// {`{
//   "title": "Chocolate Cake",
//   "category": "dessert",
//   "region": "italian",
//   "description": "A rich and moist chocolate cake.",
//   "image": "https://example.com/chocolate-cake.jpg",
//   "portion": 8,
//   "ingredients": [
//     { "quantity": 2, "unit": "cups", "name": "flour" },
//     { "quantity": 1.5, "unit": "cups", "name": "sugar" }
//   ],
//   "steps": [
//     { "order": 1, "description": "Preheat oven to 350°F (175°C)." },
//     { "order": 2, "description": "Mix all dry ingredients." }
//   ]
// }`}
//               </pre>
//             </div>
//           </form>
//         )}

//         {/* Confirmation Modal */}
//         {modalOpened && (
//           <>
//             <div className="modal modal-open">
//               <div className="modal-box max-w-md bg-base-200 shadow-xl border-2 border-primary">
//                 <h3 className="font-bold text-xl mb-4">Confirm Submission</h3>
//                 <p className="py-4">Are you sure you want to submit this recipe?</p>
//                 <div className="modal-action">
//                   <button className="btn btn-error" onClick={() => setModalOpened(false)}>
//                     Cancel
//                   </button>
//                   <button
//                     className="btn btn-success"
//                     onClick={async () => {
//                       if (activeTab === 'form') {
//                         await handleFormSubmit();
//                       } else {
//                         // Trigger JSON form submission
//                         const jsonForm = document.querySelector(
//                           'form[onSubmit*="handleJsonSubmit"]'
//                         ) as HTMLFormElement;
//                         if (jsonForm) {
//                           jsonForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
//                         }
//                       }
//                       setModalOpened(false);
//                     }}
//                   >
//                     Yes, Submit
//                   </button>
//                 </div>
//               </div>
//             </div>
//             <div className="modal-backdrop bg-black opacity-50"></div>
//           </>
//         )}
//       </div>

//       {/* Nutritional Information Display */}
//       {nutritionalInfo && (
//         <div className="card bg-base-100 shadow-sm rounded-lg p-4 mt-8">
//           <h3 className="text-xl sm:text-2xl font-semibold">Total Nutritional Information (Per Portion)</h3>
//           <div className="flex flex-wrap gap-2 sm:gap-4 mt-2">
//             <p className="text-xs sm:text-sm">Calories: {nutritionalInfo.calories.toFixed(2)} kcal</p>
//             <p className="text-xs sm:text-sm">Protein: {nutritionalInfo.protein.toFixed(2)} g</p>
//             <p className="text-xs sm:text-sm">Fat: {nutritionalInfo.fat.toFixed(2)} g</p>
//             <p className="text-xs sm:text-sm">Carbohydrates: {nutritionalInfo.carbohydrates.toFixed(2)} g</p>
//             <p className="text-xs sm:text-sm">Fiber: {nutritionalInfo.fiber.toFixed(2)} g</p>
//             <p className="text-xs sm:text-sm">Sugar: {nutritionalInfo.sugar.toFixed(2)} g</p>
//             <p className="text-xs sm:text-sm">Sodium: {nutritionalInfo.sodium.toFixed(2)} mg</p>
//             <p className="text-xs sm:text-sm">Cholesterol: {nutritionalInfo.cholesterol.toFixed(2)} mg</p>
//           </div>
//         </div>
//       )}

//       {/* Scroll-to-Top Button */}
//       <div className="fixed bottom-6 right-6">
//         <button
//           onClick={scrollToTop}
//           className="btn btn-circle transition-transform hover:scale-110"
//           aria-label="Scroll to top"
//         >
//           <ArrowUpIcon />
//         </button>
//       </div>
//     </div>
//   );
// }

// // Dummy helper functions for favorites – replace with actual implementations.
// function isFavorited(recipe_id: number): boolean {
//   return false;
// }

// async function toggleFavorite(recipe_id: number, e: React.MouseEvent): Promise<void> {
//   console.log(`Toggling favorite for recipe ${recipe_id}`);
// }
