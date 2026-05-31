"use client";

import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import debounce from "lodash.debounce";
import supabase from "../../../../lib/supabaseClient";
import {
  NutritionalInfo,
  RecipeInput,
  Favorite,
  IngredientInput,
} from "../../../../lib/types";
import { units } from "../../../../lib/units";
import {
  IconChefHat,
  IconPlus,
  IconMinus,
  IconTrash,
  IconArrowDown,
  IconX,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavigation } from "../../components/FloatingNavigation";
import { LoadingOverlay } from "../../components/MinimalistLoader";

// Define a local alias for JSON data
type JsonData = any;

// Define Category and Region options
const categories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Snack",
  "Beverage",
  "Appetizer",
].map((cat) => ({ value: cat.toLowerCase(), label: cat }));

const regions = [
  "Italian",
  "American",
  "Mexican",
  "Mediterranean",
  "Asian",
  "French",
  "Indian",
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
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return scroll;
}

export default function AddRecipePage() {
  const router = useRouter();

  // Tab state: "form" or "json"
  const [activeTab, setActiveTab] = useState<"form" | "json">("form");
  const [modalOpened, setModalOpened] = useState(false);
  const [jsonData, setJsonData] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [nutritionalInfo, setNutritionalInfo] =
    useState<NutritionalInfo | null>(null);
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
    title: "",
    category: "",
    region: "",
    description: "",
    ingredients: [{ quantity: 1, unit: "g", name: "" }],
    steps: [{ description: "" }],
    image: "",
    portion: 1,
  });

  // Ref for nutritional info table scrolling
  const fullNutritionalInfoRef = useRef<HTMLDivElement>(null);
  const scroll = useWindowScroll();

  // Fetch available ingredients on mount
  useEffect(() => {
    async function fetchIngredients() {
      try {
        const res = await fetch("/api/ingredients");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch ingredients");
        }
        const data = await res.json();
        const formatted = data.map((ing: any) => ({
          value: ing.id,
          label: ing.name,
        }));
        setAvailableIngredients(formatted);
      } catch (error) {
        console.error("Failed to load ingredients:", error);
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
      ingredients: [...prev.ingredients, { quantity: 1, unit: "g", name: "" }],
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
      steps: [...prev.steps, { description: "" }],
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
        throw new Error(errorData.error || "Failed to fetch default image");
      }
      const data = await res.json();
      setFormData((prev) => ({ ...prev, image: data.imageUrl }));
    } catch (error: any) {
      console.error("Failed to fetch default image:", error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch nutritional info by calling the API route.
  const handleFetchNutritionalInfo = async () => {
    try {
      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: formData.ingredients,
          portion: formData.portion,
        }),
      });
      if (response.ok) {
        const perPortion = await response.json();
        setNutritionalInfo(perPortion);
      } else {
        console.error("Failed to fetch nutritional info.");
      }
    } catch (error) {
      console.error("Error fetching nutritional info:", error);
    }
  };

  // Submit Form (via Form Input)
  const handleFormSubmit = async (): Promise<void> => {
    if (!isFormValid()) {
      console.error("Form validation failed.");
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
        image: formData.image?.trim() || "",
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

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        const recipeId = responseData.recipe.id;
        if (!payload.image) {
          await updateRecipeImage(recipeId, payload.title);
        }
        setFormData({
          title: "",
          category: "",
          region: "",
          description: "",
          ingredients: [{ quantity: 1, unit: "g", name: "" }],
          steps: [{ description: "" }],
          image: "",
          portion: 1,
        });
        setAutoFetchImage(true);
        // Fetch and display nutritional info after submission
        await handleFetchNutritionalInfo();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add recipe");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper: normalize AI-generated JSON into the expected shape
  function normalizeIncomingRecipe(raw: any) {
    // Unwrap top-level wrappers
    if (Array.isArray(raw)) raw = raw[0] || {};
    const wrappers = ["recipe", "data", "result", "payload", "item"];
    for (const key of wrappers) {
      if (raw && typeof raw[key] === "object") {
        raw = raw[key];
      }
    }

    const get = (obj: any, paths: string[]): any => {
      for (const p of paths) {
        const val = p
          .split(".")
          .reduce((o: any, k: string) => (o ? o[k] : undefined), obj);
        if (val !== undefined) return val;
      }
      return undefined;
    };

    const normalized: any = {
      title: get(raw, ["title", "name"]) || "",
      category: (
        get(raw, ["category", "type", "course", "dishType", "dish_type"]) || ""
      ).toString(),
      region: (get(raw, ["region", "cuisine", "origin"]) || "").toString(),
      description: (
        get(raw, ["description", "summary", "intro"]) || ""
      ).toString(),
      portion:
        Number(get(raw, ["portion", "servings", "serves", "yield"])) || 1,
      image:
        get(raw, [
          "image",
          "imageUrl",
          "imageURL",
          "image_url",
          "photo",
          "thumbnail",
        ]) || "",
      ingredients: get(raw, [
        "ingredients",
        "ingredient",
        "ingredients.list",
        "ingredients.items",
        "ingredients.data",
        "ingredientsArray",
        "ingredients_list",
      ]),
      steps: get(raw, [
        "steps",
        "instructions",
        "directions",
        "method",
        "procedure",
        "steps.list",
        "instructions.list",
      ]),
    };

    // Steps normalization
    if (typeof normalized.steps === "string") {
      const lines = normalized.steps
        .split(/\r?\n/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      normalized.steps = lines.map((d: string, i: number) => ({
        order: i + 1,
        description: d.replace(/^\d+[\).\s-]*/, ""),
      }));
    }
    if (
      Array.isArray(normalized.steps) &&
      normalized.steps.length &&
      typeof normalized.steps[0] === "string"
    ) {
      normalized.steps = (normalized.steps as string[]).map(
        (d: string, i: number) => ({ order: i + 1, description: d })
      );
    }

    // Ingredients normalization
    if (normalized.ingredients && !Array.isArray(normalized.ingredients)) {
      const inner = get({ ingredients: normalized.ingredients }, [
        "ingredients.list",
        "ingredients.items",
        "ingredients.data",
      ]);
      normalized.ingredients = Array.isArray(inner)
        ? inner
        : Object.values(normalized.ingredients);
    }
    if (!Array.isArray(normalized.ingredients)) normalized.ingredients = [];
    if (!Array.isArray(normalized.steps)) normalized.steps = [];
    return normalized;
  }

  // Submit JSON Form (refactored to not require an event parameter)
  const handleJsonSubmitInternal = async (): Promise<void> => {
    if (!jsonData.trim()) {
      console.error("JSON data is empty.");
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
          throw new Error(
            "Invalid format. Please provide valid JSON or properly formatted text."
          );
        }
      }

      // Normalize AI JSON that may include wrappers/synonyms
      parsedData = normalizeIncomingRecipe(parsedData);

      console.log("Parsed data:", parsedData);

      // Validate required fields with more detailed error messages
      if (!parsedData.title?.trim()) {
        throw new Error("Recipe title is required.");
      }
      if (!parsedData.category?.trim()) {
        throw new Error("Recipe category is required.");
      }
      if (!parsedData.region?.trim()) {
        throw new Error("Recipe region is required.");
      }
      if (!parsedData.description?.trim()) {
        throw new Error("Recipe description is required.");
      }
      if (!parsedData.portion || parsedData.portion < 1) {
        throw new Error("Recipe portion must be at least 1.");
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
      const synonymMap: { [key: string]: string } = {
        "all-purpose flour": "flour",
        "ap flour": "flour",
        "dry yeast": "yeast",
        "instant yeast": "yeast",
        "garlic clove": "garlic",
        "garlic cloves": "garlic",
        "red pepper": "bell pepper",
        "green pepper": "bell pepper",
        "pul biber": "chili flakes",
        "pul biber (hot chili flakes)": "chili flakes",
        "warm water": "water",
        "water (optional, if mixture too thick)": "water",
      };
      const normalizeUnit = (u: string | undefined): string => {
        if (!u) return "g";
        const unitLower = u.toLowerCase();
        if (
          [
            "medium",
            "small",
            "large",
            "bunch",
            "packet",
            "clove",
            "cloves",
          ].includes(unitLower)
        )
          return "whole";
        return unitLower;
      };
      const cleanName = (n: string | undefined): string => {
        if (!n) return "";
        let name = n.toLowerCase();
        // strip parentheses content and words like optional
        name = name
          .replace(/\([^)]*\)/g, "")
          .replace(/optional/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        if (synonymMap[name]) return synonymMap[name];
        return name;
      };
      const pickQuantity = (ing: any): number => {
        if (ing.quantity !== undefined && ing.quantity !== null) {
          const q =
            typeof ing.quantity === "number"
              ? ing.quantity
              : parseFloat(ing.quantity);
          return isNaN(q) || q <= 0 ? 1 : q;
        }
        if (ing.quantity_min !== undefined || ing.quantity_max !== undefined) {
          const min =
            typeof ing.quantity_min === "number"
              ? ing.quantity_min
              : parseFloat(ing.quantity_min);
          const max =
            typeof ing.quantity_max === "number"
              ? ing.quantity_max
              : parseFloat(ing.quantity_max);
          if (!isNaN(min) && !isNaN(max)) return (min + max) / 2;
          if (!isNaN(min)) return min;
          if (!isNaN(max)) return max;
        }
        return 1;
      };
      const sanitizedIngredients = parsedData.ingredients.map(
        (ing: any, index: number) => {
          // Handle case where ingredient might be a string
          if (typeof ing === "string") {
            // Try to parse string format like "2 cups flour"
            const match = ing.match(/^(\d+\.?\d*)\s+(\w+)\s+(.+)$/);
            if (match) {
              return {
                name: cleanName(match[3]),
                quantity: parseFloat(match[1]),
                unit: normalizeUnit(match[2]),
              };
            } else {
              // Default values if parsing fails
              return {
                name: cleanName(ing),
                quantity: 1,
                unit: "g",
              };
            }
          }

          // Build from object with potential quantity_min/max and odd units/names
          let sanitizedName = ing.name
            ? cleanName(ing.name)
            : `ingredient ${index + 1}`;
          if (sanitizedName.length > 100)
            sanitizedName = sanitizedName.substring(0, 100);
          const quantity = pickQuantity(ing);
          const unit = normalizeUnit(ing.unit);
          return {
            name: sanitizedName,
            quantity,
            unit,
          };
        }
      );

      // Fetch ingredients for mapping
      const res = await fetch("/api/ingredients");
      if (!res.ok) {
        throw new Error(
          "Failed to fetch ingredients for mapping. Server returned: " +
            res.status
        );
      }
      const ingredientsData = await res.json();
      const ingredientMap: { [key: string]: number } = {};
      ingredientsData.forEach((ing: any) => {
        ingredientMap[ing.name.toLowerCase()] = ing.id;
      });

      // Map ingredients, creating new ones if needed - with better error handling
      const mappedIngredients: any[] = [];
      const ingredientErrors: string[] = [];

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
                .from("ingredients")
                .insert({ name: ingredientName })
                .select("id")
                .single();

              if (createError) {
                console.error("Error creating ingredient:", createError);
                ingredientErrors.push(
                  `Failed to add ingredient "${ingredientName}": ${createError.message}`
                );
                continue; // Skip this ingredient but continue with others
              }

              if (!newIngredient || !newIngredient.id) {
                ingredientErrors.push(
                  `Failed to get ID for newly created ingredient "${ingredientName}"`
                );
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
              console.error("Supabase error:", err);
              ingredientErrors.push(
                `Failed to process ingredient "${ingredientName}" at index ${i}: ${err.message}`
              );
              continue; // Skip this ingredient but continue with others
            }
          }
        } catch (err: any) {
          console.error(`Error processing ingredient at index ${i}:`, err);
          ingredientErrors.push(
            `Error with ingredient at index ${i}: ${err.message}`
          );
          continue; // Skip this ingredient but continue with others
        }
      }

      // If after mapping there are no valid ingredients, stop and alert the user
      if (mappedIngredients.length === 0) {
        setPopupMessage(
          "No valid ingredients were found in the JSON. Please ensure the JSON contains an 'ingredients' array (or synonyms) with name, quantity, and unit."
        );
        setShowPopup(true);
        return;
      }

      // Process and sanitize steps
      const sanitizedSteps = parsedData.steps.map(
        (step: any, index: number) => {
          // Handle case where step might be a string
          if (typeof step === "string") {
            return {
              order: index + 1,
              description: step.trim(),
            };
          }

          // Ensure description is a string and not too long
          let description = step.description?.trim() || "";
          if (!description) {
            description = `Step ${index + 1}`;
          }

          // Use provided order or default to index + 1
          const order = step.order || index + 1;

          return {
            order,
            description,
          };
        }
      );

      // Prepare payload
      const payload: RecipeInput = {
        title: parsedData.title.trim(),
        category: parsedData.category.trim(),
        region: parsedData.region.trim(),
        description: parsedData.description.trim(),
        portion: parsedData.portion,
        image: parsedData.image?.trim() || "",
        ingredients: mappedIngredients,
        steps: sanitizedSteps,
      };

      console.log(
        "Submitting recipe payload:",
        JSON.stringify({
          title: payload.title,
          category: payload.category,
          region: payload.region,
          ingredients: payload.ingredients.length,
          steps: payload.steps.length,
        })
      );

      // Submit recipe with better error handling
      try {
        const response = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Handle response
        if (!response.ok) {
          let errorMessage = "Failed to add recipe via JSON";
          try {
            const errorText = await response.text();
            console.error("Server error response:", errorText);

            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            } catch (jsonError) {
              // If not valid JSON, use the text directly
              errorMessage =
                errorText ||
                `Server error: ${response.status} ${response.statusText}`;
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
        setJsonData("");

        // Show success message with warnings if any
        if (ingredientErrors.length > 0) {
          setPopupMessage(
            `Recipe added successfully with ${ingredientErrors.length} ingredient warnings.`
          );
        } else {
          setPopupMessage("Recipe added successfully!");
        }
        setShowPopup(true);
      } catch (fetchError: any) {
        console.error("Fetch error:", fetchError);
        throw new Error(`Error submitting recipe: ${fetchError.message}`);
      }
    } catch (error: any) {
      console.error("JSON submission error:", error);
      setPopupMessage(
        error.message || "Failed to add recipe. Please try again."
      );
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse text format recipes
  const parseTextFormat = (text: string): JsonData => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    // First line is title
    const title = lines[0];

    // Second line is category
    const category = lines[1]?.toLowerCase() || "lunch";

    // Look for "servings" to find portion
    let portion = 1;
    let portionLine = lines.find((line) =>
      line.toLowerCase().includes("serving")
    );
    if (portionLine) {
      const match = portionLine.match(/\d+/);
      if (match) {
        portion = parseInt(match[0], 10);
      }
    }

    // Find description - it's usually a longer paragraph
    let description = "";
    for (let i = 2; i < lines.length; i++) {
      if (
        lines[i].length > 30 &&
        !lines[i].match(/^\d+$/) &&
        !lines[i].toLowerCase().includes("ingredient") &&
        !lines[i].toLowerCase().includes("step")
      ) {
        description = lines[i];
        break;
      }
    }

    // Default region based on recipe title or description
    let region = "mediterranean";
    if (
      title.toLowerCase().includes("moroccan") ||
      title.toLowerCase().includes("msemen") ||
      description.toLowerCase().includes("moroccan") ||
      description.toLowerCase().includes("north african")
    ) {
      region = "mediterranean";
    } else if (
      title.toLowerCase().includes("italian") ||
      description.toLowerCase().includes("italian")
    ) {
      region = "italian";
    } else if (
      title.toLowerCase().includes("mexican") ||
      description.toLowerCase().includes("mexican")
    ) {
      region = "mexican";
    } else if (
      title.toLowerCase().includes("asian") ||
      description.toLowerCase().includes("asian")
    ) {
      region = "asian";
    } else if (
      title.toLowerCase().includes("american") ||
      description.toLowerCase().includes("american")
    ) {
      region = "american";
    } else if (
      title.toLowerCase().includes("indian") ||
      description.toLowerCase().includes("indian")
    ) {
      region = "indian";
    } else if (
      title.toLowerCase().includes("french") ||
      description.toLowerCase().includes("french")
    ) {
      region = "french";
    }

    // Find ingredients and steps
    const ingredients: any[] = [];
    const steps: any[] = [];

    let currentSection = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.toLowerCase().includes("ingredient")) {
        currentSection = "ingredients";
        continue;
      } else if (line.toLowerCase().includes("step")) {
        currentSection = "steps";
        continue;
      }

      if (currentSection === "ingredients") {
        // Skip empty lines and section headers
        if (line && !line.match(/^ingredients$/i)) {
          ingredients.push(line);
        }
      } else if (currentSection === "steps") {
        // Look for lines that start with numbers
        const stepMatch = line.match(/^(\d+)\s*(.+)$/);
        if (stepMatch) {
          steps.push({
            order: parseInt(stepMatch[1], 10),
            description: stepMatch[2].trim(),
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
        /([a-zA-Z\s]+)\s+\((\d+(?:\.\d+)?)\s*(g|kg|ml|l|cups?|tbsp|tsp)\)/g,
      ];

      // Extract ingredients from step descriptions
      const extractedIngredients = new Set<string>();

      steps.forEach((step) => {
        const description = step.description;

        // Try each pattern
        ingredientPatterns.forEach((pattern) => {
          const matches = description.matchAll(pattern);
          for (const match of matches) {
            if (pattern.source.startsWith("(\\d+")) {
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
          "chicken",
          "flour",
          "salt",
          "water",
          "oil",
          "onion",
          "garlic",
          "cheese",
          "butter",
          "sugar",
          "honey",
          "egg",
          "milk",
          "cream",
          "baking powder",
          "turmeric",
          "cayenne",
          "parsley",
        ];

        commonIngredients.forEach((ingredient) => {
          if (description.toLowerCase().includes(ingredient.toLowerCase())) {
            // If we find a common ingredient without quantity/unit info, add it with defaults
            if (
              !Array.from(extractedIngredients).some((ing) =>
                ing.toLowerCase().includes(ingredient.toLowerCase())
              )
            ) {
              extractedIngredients.add(`1 g ${ingredient}`);
            }
          }
        });
      });

      // Add extracted ingredients to the ingredients array
      Array.from(extractedIngredients).forEach((ing) => ingredients.push(ing));

      // If we still have no ingredients, add some default ones based on the recipe title
      if (ingredients.length === 0) {
        if (title.toLowerCase().includes("chicken")) {
          ingredients.push("500 g chicken");
        }
        if (
          title.toLowerCase().includes("msemen") ||
          title.toLowerCase().includes("flatbread")
        ) {
          ingredients.push("500 g flour");
          ingredients.push("300 ml water");
          ingredients.push("10 g salt");
          ingredients.push("30 ml oil");
        }
        if (title.toLowerCase().includes("cheese")) {
          ingredients.push("200 g cheese");
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
      steps,
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
        throw new Error(errorData.error || "Failed to fetch default image");
      }
      const data = await res.json();
      await updateRecipeImageAPI(recipeId, data.imageUrl);
    } catch (error: any) {
      console.error("Update recipe image error:", error);
      throw error;
    }
  };

  const updateRecipeImageAPI = async (
    recipeId: number,
    imageUrl: string
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/update-image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update recipe image.");
      }
    } catch (error: any) {
      console.error("Update recipe image API error:", error);
      throw error;
    }
  };

  // For scroll-to-top
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto py-8 px-4 pb-32 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-card p-6 sm:p-8 relative border-4"
        >
          {/* Loading Overlay */}
          {loading && <LoadingOverlay message="Loading..." />}

          {/* Enhanced Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mb-8 gap-4"
          >
            <div className="w-20 h-20 border-3 border-base-content bg-accent rounded-xl shadow-neo flex items-center justify-center">
              <IconChefHat size={48} className="text-base-content" stroke={2.5} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-base-content uppercase tracking-wider">Add Recipe</h1>
            <p className="text-lg font-bold text-base-content/70 text-center border-2 border-base-content bg-base-200 px-4 py-2 rounded-xl shadow-neo-sm mt-2">Share your culinary masterpiece</p>
          </motion.div>

          {/* Enhanced Tabs for Form vs JSON Input */}
          <div className="flex justify-center mb-10">
            <div className="bg-base-200 border-3 border-base-content p-1 rounded-xl shadow-neo-sm inline-flex">
              <button
                className={`px-8 py-3 rounded-lg font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === "form"
                    ? "bg-primary border-3 border-base-content text-base-content shadow-neo-sm"
                    : "text-base-content border-3 border-transparent hover:bg-base-300"
                }`}
                onClick={() => setActiveTab("form")}
              >
                Form Input
              </button>
              <button
                className={`px-8 py-3 rounded-lg font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === "json"
                    ? "bg-primary border-3 border-base-content text-base-content shadow-neo-sm"
                    : "text-base-content border-3 border-transparent hover:bg-base-300"
                }`}
                onClick={() => setActiveTab("json")}
              >
                JSON Input
              </button>
            </div>
          </div>

          {activeTab === "form" ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={(e) => {
                e.preventDefault();
                setModalOpened(true);
              }}
            >
              <div className="flex flex-col gap-6">
                {/* Enhanced Form Fields with glassmorphic styling */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="neo-card p-6 bg-base-200"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipe Title
                  </label>
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
                    className="neo-input w-full px-4 py-3 bg-base-100 text-lg"
                    placeholder="Enter recipe title..."
                  />
                </motion.div>

                {/* Category Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="neo-card p-6 bg-base-200"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                      })
                    }
                    className="neo-input w-full px-4 py-3 bg-base-100 text-lg"
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
                </motion.div>

                {/* Region Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="neo-card p-6 bg-base-200"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    required
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        region: e.target.value,
                      })
                    }
                    className="neo-input w-full px-4 py-3 bg-base-100 text-lg"
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
                </motion.div>

                {/* Description Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="neo-card p-6 bg-base-200"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="neo-input w-full px-4 py-3 bg-base-100 text-lg"
                    rows={3}
                    placeholder="Enter recipe description..."
                  ></textarea>
                </motion.div>

                {/* Image Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="neo-card p-6 bg-base-200"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (optional)
                  </label>
                  <div className="flex gap-4 items-end">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={formData.image || ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFormData({
                            ...formData,
                            image: e.target.value,
                          })
                        }
                        className="neo-input w-full px-4 py-3 bg-base-100 text-lg"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: "" })}
                        className="neo-button bg-error text-base-content px-4 py-3 rounded-xl flex items-center justify-center shrink-0"
                        aria-label="Clear Image URL"
                      >
                        <IconTrash size={20} stroke={2.5} />
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Auto-Fetch Image Toggle */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="neo-card p-6 bg-base-200"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Automatically fetch default image if none provided
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoFetchImage}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setAutoFetchImage(e.currentTarget.checked)
                      }
                      className="checkbox checkbox-primary"
                    />
                    <span className="text-base font-bold text-base-content">
                      Check this box to automatically fetch a default image
                    </span>
                  </div>
                </motion.div>

                {/* Portions Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="neo-card p-6 bg-base-200"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portions
                  </label>
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
                    className="neo-input w-full px-4 py-3 bg-base-100 text-lg"
                  />
                </motion.div>

                {/* Ingredients Section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="neo-card p-6 bg-base-200"
                >
                  <div className="flex items-end gap-2 mb-2">
                    <label className="label">Ingredients</label>
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="neo-button w-10 h-10 flex items-center justify-center bg-success text-base-content rounded-xl mb-1"
                      aria-label="Add Ingredient"
                    >
                      <IconPlus size={24} stroke={3} />
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
                          className="neo-input w-24 px-3 py-3 bg-base-100 text-lg font-bold"
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
                          className="neo-input w-24 px-3 py-3 bg-base-100 text-lg font-bold"
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
                            className="neo-input w-full px-4 py-3 bg-base-100 text-lg"
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
                              className="neo-button w-12 h-12 shrink-0 flex items-center justify-center bg-error text-base-content rounded-xl"
                              aria-label={`Remove Ingredient ${index + 1}`}
                            >
                              <IconMinus size={20} stroke={3} />
                            </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Steps Section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-base-200 border border-base-300 rounded-2xl p-5"
                >
                  <div className="flex items-end gap-2 mb-4">
                    <label className="text-lg font-black uppercase text-base-content">Steps</label>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="neo-button w-10 h-10 flex items-center justify-center bg-success text-base-content rounded-xl mb-1"
                      aria-label="Add Step"
                    >
                      <IconPlus size={24} stroke={3} />
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
                          className="neo-input w-16 px-3 py-3 bg-base-100 text-lg font-black text-center"
                          aria-label={`Step ${index + 1} Order`}
                        />
                        <textarea
                          required
                          value={step.description}
                          onChange={(e) =>
                            handleStepChange(index, e.target.value)
                          }
                          className="neo-input flex-1 px-4 py-3 bg-base-100 text-lg font-bold min-w-[200px]"
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
                                steps: prev.steps.filter((_, i) => i !== index),
                              }))
                            }
                            className="neo-button w-12 h-12 shrink-0 flex items-center justify-center bg-error text-base-content rounded-xl mb-auto"
                            aria-label={`Remove Step ${index + 1}`}
                          >
                            <IconMinus size={20} stroke={3} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Enhanced Submit Button */}
                <button
                  type="button"
                  className="neo-button w-full px-8 py-4 bg-primary text-base-content text-xl uppercase tracking-wider mt-6 disabled:opacity-50 disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1 cursor-pointer disabled:cursor-not-allowed"
                  disabled={!isFormValid()}
                  onClick={() => setModalOpened(true)}
                >
                  Add Recipe
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={(e) => {
                e.preventDefault();
                setModalOpened(true);
              }}
              className="flex flex-col gap-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="neo-card p-6 bg-base-200"
              >
                <label className="block text-xl font-black text-base-content uppercase tracking-wide mb-4">
                  Recipe JSON
                </label>
                {/* JSON Input Rules */}
                <div className="neo-card p-4 mb-6 bg-secondary text-base-content font-bold border-2">
                  <strong className="uppercase">JSON rules:</strong> Use an object with these fields:
                  <ul className="list-disc pl-5 mt-2 space-y-1 font-medium">
                    <li>
                      <code>title</code>, <code>category</code>,{" "}
                      <code>region</code>, <code>description</code> (strings),{" "}
                      <code>portion</code> (number)
                    </li>
                    <li>
                      <code>ingredients</code>: array of objects{" "}
                      <code>{`{"name": string, "quantity": number, "unit": string}`}</code>
                    </li>
                    <li>
                      Prefer units in <code>g</code> or <code>ml</code>.
                      Allowed: <code>tsp</code>, <code>tbsp</code>,{" "}
                      <code>cup</code>, <code>whole</code>
                    </li>
                    <li>
                      Standard names (examples): <code>flour</code>,{" "}
                      <code>yeast</code>, <code>garlic</code>,{" "}
                      <code>red bell pepper</code>,{" "}
                      <code>green bell pepper</code>, <code>chili flakes</code>,{" "}
                      <code>olive oil</code>, <code>ground beef</code>
                    </li>
                    <li>
                      <code>steps</code>: array of objects{" "}
                      <code>{`{"order": number, "description": string}`}</code>
                    </li>
                    <li>
                      No extra wrappers (e.g., avoid{" "}
                      <code>{`{recipe: {...}}`}</code>); provide a single
                      top-level object only
                    </li>
                  </ul>
                </div>
                <textarea
                  name="jsonData"
                  className="neo-input w-full px-4 py-4 bg-base-100 font-mono text-sm leading-relaxed"
                  rows={15}
                  required
                  placeholder={`{
  "title": "Chicken Msemen",
  "category": "dinner",
...
}`}
                  value={jsonData}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setJsonData(e.target.value)
                  }
                ></textarea>

                <button
                  type="submit"
                  className="neo-button w-full px-8 py-4 bg-primary text-base-content text-xl uppercase tracking-wider mt-6 disabled:opacity-50 disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1 cursor-pointer disabled:cursor-not-allowed"
                  disabled={!jsonData.trim()}
                >
                  Add Recipe via JSON
                </button>
              </motion.div>
            </motion.form>
          )}

          {/* Enhanced Confirmation Modal */}
          {modalOpened && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-panel backdrop-blur-xl bg-white/90 border border-white/30 rounded-3xl p-8 max-w-md mx-4 shadow-2xl"
              >
                <h3 className="font-bold text-xl mb-4 text-gray-800">
                  Confirm Submission
                </h3>
                <p className="py-4 text-gray-600">
                  Are you sure you want to submit this recipe?
                </p>
                <div className="flex gap-4 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-panel backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-700 px-6 py-3 rounded-xl font-medium flex-1"
                    onClick={() => setModalOpened(false)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-panel backdrop-blur-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white border border-white/30 px-6 py-3 rounded-xl font-medium flex-1"
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (isSubmitting) return;
                      setIsSubmitting(true);
                      setModalOpened(false);
                      try {
                        if (activeTab === "form") {
                          await handleFormSubmit();
                        } else {
                          await handleJsonSubmitInternal();
                        }
                        setPopupMessage("Recipe added successfully!");
                        setShowPopup(true);
                      } catch (error) {
                        setPopupMessage(
                          "Failed to add recipe. Please try again."
                        );
                        setShowPopup(true);
                      } finally {
                        setIsSubmitting(false);
                        setTimeout(() => {
                          setShowPopup(false);
                          setPopupMessage("");
                        }, 3000);
                      }
                    }}
                  >
                    Yes, Submit
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Popup Message */}
        <AnimatePresence>
          {showPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed bottom-24 left-4 right-4 z-50 md:bottom-6 md:right-6 md:left-auto md:w-96"
            >
              <div
                className={`glass-panel backdrop-blur-xl rounded-2xl p-4 shadow-2xl border ${
                  popupMessage.includes("Failed") ||
                  popupMessage.includes("Error") ||
                  popupMessage.includes("Invalid")
                    ? "bg-red-500/20 border-red-400/30"
                    : "bg-emerald-500/20 border-emerald-400/30"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">
                    {popupMessage}
                  </span>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <IconX size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Nutritional Information Display */}
        {nutritionalInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-4 mt-8 shadow-2xl"
          >
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Total Nutritional Information (Per Portion)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Calories",
                  value: `${nutritionalInfo.calories.toFixed(2)} kcal`,
                  color: "text-emerald-600",
                },
                {
                  label: "Protein",
                  value: `${nutritionalInfo.protein.toFixed(2)} g`,
                  color: "text-blue-600",
                },
                {
                  label: "Fat",
                  value: `${nutritionalInfo.fat.toFixed(2)} g`,
                  color: "text-purple-600",
                },
                {
                  label: "Carbohydrates",
                  value: `${nutritionalInfo.carbohydrates.toFixed(2)} g`,
                  color: "text-indigo-600",
                },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="glass-panel backdrop-blur-xl bg-white/10 border border-white/20 p-4 rounded-xl text-center"
                >
                  <div className={`text-lg font-bold ${item.color}`}>
                    {item.value}
                  </div>
                  <div className="text-sm text-gray-600">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Enhanced Scroll-to-Top Button */}
        {scroll.y > 100 && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="glass-panel backdrop-blur-xl bg-white/20 border border-white/30 p-3 rounded-full shadow-2xl hover:bg-white/30 transition-all duration-300 fixed bottom-24 left-4 z-40 md:bottom-6"
            aria-label="Scroll to top"
          >
            <IconArrowDown size={24} className="rotate-180 text-gray-700" />
          </motion.button>
        )}
      </div>

      {/* FloatingNavigation */}

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
