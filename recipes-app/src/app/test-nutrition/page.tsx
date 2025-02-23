// // app/test-nutrition/page.tsx
// 'use client';

// import { useState } from 'react';
// import { NutritionalInfo } from '@/types';

// export default function TestNutrition() {
//   const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
//   const [error, setError] = useState<string>('');
//   const [loading, setLoading] = useState<boolean>(false);

//   // Test with sample data
//   const testIngredients = [
//     { name: 'apple', quantity: 1, unit: 'whole' },
//     { name: 'sugar', quantity: 10, unit: 'g' },
//     // Add more test ingredients as needed
//   ];

//   const handleTestNutrition = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const response = await fetch('/api/nutrition', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           ingredients: testIngredients,
//           portion: 1,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch nutritional info');
//       }

//       const data = await response.json();
//       setNutritionalInfo(data);
//     } catch (error) {
//       console.error('Error testing nutrition API:', error);
//       setError('Failed to get nutritional information');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Test Nutrition API</h1>

//       <div className="mb-4">
//         <h2 className="text-lg font-semibold mb-2">Test Ingredients:</h2>
//         <pre className="bg-gray-100 p-4 rounded">
//           {JSON.stringify(testIngredients, null, 2)}
//         </pre>
//       </div>

//       <button
//         onClick={handleTestNutrition}
//         disabled={loading}
//         className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
//       >
//         {loading ? 'Testing...' : 'Test Nutrition API'}
//       </button>

//       {error && (
//         <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
//           {error}
//         </div>
//       )}

//       {nutritionalInfo && (
//         <div className="mt-4">
//           <h2 className="text-lg font-semibold mb-2">Nutritional Information:</h2>
//           <div className="bg-white p-4 rounded shadow">
//             <dl className="grid grid-cols-2 gap-4">
//               <div>
//                 <dt className="text-gray-600">Calories</dt>
//                 <dd className="text-xl font-semibold">{nutritionalInfo.calories.toFixed(1)} kcal</dd>
//               </div>
//               <div>
//                 <dt className="text-gray-600">Protein</dt>
//                 <dd className="text-xl font-semibold">{nutritionalInfo.protein.toFixed(1)}g</dd>
//               </div>
//               <div>
//                 <dt className="text-gray-600">Fat</dt>
//                 <dd className="text-xl font-semibold">{nutritionalInfo.fat.toFixed(1)}g</dd>
//               </div>
//               <div>
//                 <dt className="text-gray-600">Carbohydrates</dt>
//                 <dd className="text-xl font-semibold">{nutritionalInfo.carbohydrates.toFixed(1)}g</dd>
//               </div>
//               <div>
//                 <dt className="text-gray-600">Fiber</dt>
//                 <dd className="text-xl font-semibold">{nutritionalInfo.fiber.toFixed(1)}g</dd>
//               </div>
//               <div>
//                 <dt className="text-gray-600">Sugar</dt>
//                 <dd className="text-xl font-semibold">{nutritionalInfo.sugar.toFixed(1)}g</dd>
//               </div>
//               <div>
//                 <dt className="text-gray-600">Sodium</dt>
//                 <dd className="text-xl font-semibold">{nutritionalInfo.sodium.toFixed(1)}mg</dd>
//               </div>
//               <div>
//                 <dt className="text-gray-600">Cholesterol</dt>
//                 <dd className="text-xl font-semibold">{nutritionalInfo.cholesterol.toFixed(1)}mg</dd>
//               </div>
//             </dl>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }