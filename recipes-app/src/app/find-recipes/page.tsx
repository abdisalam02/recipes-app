// src/app/recipes/[id]/page.tsx

'use client'; // Designates this component as a Client Component

import {
  Container,
  Group,
  Title,
  Text,
  Image,
  Badge,
  Button,
  Modal,
  Stack,
  Radio,
  NumberInput,
  Accordion,
  Table,
  LoadingOverlay,
  Paper,
  ScrollArea,
  SimpleGrid,
  Chip,
  Slider,
  Transition,
  Affix,
  Autocomplete,
  Tooltip,
  Card, // Import Card component
  ActionIcon,
} from '@mantine/core';
import {
  IconHeart,
  IconHeartFilled,
  IconArrowUp,
  IconX,
  IconSearch,
  IconReceipt,
} from '@tabler/icons-react';
import { useEffect, useState, KeyboardEvent } from 'react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useDebouncedValue, useWindowScroll, useDisclosure } from '@mantine/hooks';
import { RecipeDetail as Recipe, Favorite } from '../../../lib/types';

export default function RecipeDetailPage() { // Renamed component
  // State variables
  const [allIngredients, setAllIngredients] = useState<{ id: number; name: string }[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States for Search and Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300); // Debounced search term
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>(''); // Ingredient input

  // Drawer handling
  const [opened, { open, close }] = useDisclosure(false);

  // Window scroll state for scroll-to-top button
  const [scroll, scrollTo] = useWindowScroll();

  // Router for navigation
  const router = useRouter();

  // Fetch Recipes, Ingredients, and Favorites on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch ingredients via API
        const ingredientsRes = await fetch('/api/ingredients'); // Corrected endpoint
        if (!ingredientsRes.ok) {
          const errorData = await ingredientsRes.json();
          throw new Error(errorData.error || 'Failed to fetch ingredients');
        }
        const ingredientsData = await ingredientsRes.json();

        setAllIngredients(ingredientsData || []);
        console.log('Fetched Ingredients:', ingredientsData);

        // Fetch recipes via API
        const recipesRes = await fetch('/api/recipes');
        if (!recipesRes.ok) {
          const errorData = await recipesRes.json();
          throw new Error(errorData.error || 'Failed to fetch recipes');
        }
        const recipesData = await recipesRes.json();

        setRecipes(recipesData || []);
        setFilteredRecipes(recipesData || []);
        console.log('Fetched Recipes:', recipesData);

        // Fetch favorites via API
        const favoritesRes = await fetch('/api/favorites');
        if (!favoritesRes.ok) {
          const errorData = await favoritesRes.json();
          throw new Error(errorData.error || 'Failed to fetch favorites');
        }
        const favoritesData = await favoritesRes.json();

        setFavorites(favoritesData || []);
        console.log('Fetched Favorites:', favoritesData);
      } catch (error: any) {
        console.error('Error fetching data:', error.message);
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to fetch data. Please try again later.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Derived State: Categories and Regions
  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category)));
  const regions = Array.from(new Set(recipes.map((recipe) => recipe.region)));

  // Deduplicate ingredient names
  const uniqueIngredientNames = Array.from(new Set(allIngredients.map((ing) => ing.name)));
  console.log('Unique Ingredient Names:', uniqueIngredientNames);

  // Handle filtering recipes based on search, category, region, and selected ingredients
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    let filtered = recipes;

    // Filter by search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by selected category
    if (selectedCategory) {
      filtered = filtered.filter((recipe) => recipe.category === selectedCategory);
    }

    // Filter by selected region
    if (selectedRegion) {
      filtered = filtered.filter((recipe) => recipe.region === selectedRegion);
    }

    // Filter by selected ingredients
    if (selectedIngredients.length > 0) {
      filtered = filtered.filter((recipe) =>
        selectedIngredients.every((ing) =>
          recipe.recipe_ingredients
            .map((ri) => ri.ingredient.name.toLowerCase())
            .includes(ing.toLowerCase())
        )
      );
    }

    setFilteredRecipes(filtered);
    console.log('Filtered Recipes:', filtered);
  }, [selectedIngredients, recipes, debouncedSearchTerm, selectedCategory, selectedRegion]);

  // Determine if a recipe is favorited
  const isFavorited = (recipe_id: number): boolean => {
    return favorites.some((fav) => fav.recipe_id === recipe_id);
  };

  // Toggle Favorite Status
  const toggleFavorite = async (recipe_id: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking favorite icon
    e.stopPropagation(); // Prevent card click
    try {
      if (isFavorited(recipe_id)) {
        // DELETE => remove favorite
        const res = await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to remove favorite');
        }
        setFavorites((prev) => prev.filter((fav) => fav.recipe_id !== recipe_id));
        notifications.show({
          title: 'Removed from Favorites',
          message: 'The recipe has been unfavorited.',
          color: 'gray',
        });
      } else {
        // POST => add favorite
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to add favorite');
        }
        const newFavorite: Favorite = await res.json();
        setFavorites((prev) => [...prev, newFavorite]);
        notifications.show({
          title: 'Added to Favorites',
          message: 'The recipe has been favorited.',
          color: 'green',
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error.message);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update favorite status.',
        color: 'red',
      });
    }
  };

  // Handle ingredient submission via Enter key
  const handleIngredientKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      handleAddIngredient();
      event.preventDefault(); // Prevent form submission if inside a form
    }
  };

  // Handle adding an ingredient
  const handleAddIngredient = () => {
    const trimmedValue = inputValue.trim();
    if (
      trimmedValue !== '' &&
      uniqueIngredientNames
        .map((name) => name.toLowerCase())
        .includes(trimmedValue.toLowerCase()) &&
      !selectedIngredients
        .map((name) => name.toLowerCase())
        .includes(trimmedValue.toLowerCase())
    ) {
      setSelectedIngredients((prev) => [...prev, trimmedValue]);
      setInputValue('');
      notifications.show({
        title: 'Ingredient Added',
        message: `${trimmedValue} has been added to your list.`,
        color: 'green',
      });
      console.log('Added Ingredient:', trimmedValue);
    } else if (
      selectedIngredients
        .map((name) => name.toLowerCase())
        .includes(trimmedValue.toLowerCase())
    ) {
      notifications.show({
        title: 'Duplicate Ingredient',
        message: `${trimmedValue} is already in your list.`,
        color: 'yellow',
      });
      console.log('Duplicate Ingredient Attempted:', trimmedValue);
    } else {
      notifications.show({
        title: 'Invalid Ingredient',
        message: `${trimmedValue} is not a valid ingredient.`,
        color: 'red',
      });
      console.log('Invalid Ingredient Attempted:', trimmedValue);
    }
  };

  return (
    <Container size="xl" py="xl" style={{ position: 'relative' }}>
      {/* Loading Overlay */}
      <LoadingOverlay visible={loading} />

      <Stack gap="xl">
        {/* Header Section */}
        <Group align="center">
          <Title order={2}>
            <Group gap="sm" align="center">
              <IconReceipt size={24} />
              Recipe Details
            </Group>
          </Title>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedIngredients([]);
              notifications.show({
                title: 'Cleared',
                message: 'All selected ingredients have been cleared.',
                color: 'blue',
              });
              console.log('Cleared all ingredients');
            }}
            aria-label="Clear All Ingredients"
          >
            <IconX size={16} style={{ marginRight: 8 }} />
            Clear All
          </Button>
        </Group>

        {/* Ingredient Selection */}
        <Stack gap="sm">
          <Group>
            <Autocomplete
              label="Select Ingredients"
              placeholder="Type to add an ingredient"
              value={inputValue}
              onChange={setInputValue}
              data={uniqueIngredientNames.filter(
                (ing) =>
                  ing.toLowerCase().includes(inputValue.toLowerCase()) &&
                  !selectedIngredients
                    .map((name) => name.toLowerCase())
                    .includes(ing.toLowerCase())
              )}
              onKeyDown={handleIngredientKeyDown}
              rightSection={<IconSearch size={16} />}
              styles={{
                input: {
                  width: '100%',
                },
              }}
              aria-label="Ingredient Autocomplete"
            />
            <Button
              onClick={handleAddIngredient}
              mt="md"
              aria-label="Add Ingredient"
            >
              Add Ingredient
            </Button>
          </Group>

          {/* Display Selected Ingredients as Tags */}
          <Group gap="xs" wrap="wrap">
            {selectedIngredients.map((ing, index) => (
              <Chip
                key={`${ing}-${index}`} // Ensure uniqueness
                onClick={() =>
                  setSelectedIngredients((prev) => prev.filter((item) => item !== ing))
                }
                color="red"
                variant="filled"
                aria-label={`Remove ${ing} from filters`}
              >
                {ing}
                <IconX size={14} style={{ marginLeft: 4 }} />
              </Chip>
            ))}
          </Group>
        </Stack>

        {/* Search and Filter Options */}
        <Group gap="md" mb="xl" align="flex-end">
          {/* Search Bar */}
          <Autocomplete
            label="Search Recipes"
            placeholder="Type recipe name..."
            value={searchTerm}
            onChange={setSearchTerm}
            data={recipes.map((recipe) => recipe.title)}
            aria-label="Search Recipes"
          />

          {/* Category Chips for Filtering */}
          <Group>
            {categories.map((category, index) => (
              <Chip
                key={`${category}-${index}`} // Ensures uniqueness
                onClick={() =>
                  setSelectedCategory((prev) => (prev === category ? '' : category))
                }
                variant={selectedCategory === category ? 'filled' : 'outline'}
                aria-label={`Filter by ${category}`}
              >
                {category}
              </Chip>
            ))}
          </Group>

          {/* Region Chips for Filtering */}
          <Group>
            {regions.map((region, index) => (
              <Chip
                key={`${region}-${index}`} // Ensures uniqueness
                onClick={() =>
                  setSelectedRegion((prev) => (prev === region ? '' : region))
                }
                variant={selectedRegion === region ? 'filled' : 'outline'}
                aria-label={`Filter by ${region}`}
              >
                {region}
              </Chip>
            ))}
          </Group>
        </Group>

        {/* Display Matching Recipes */}
        <Title order={3}>
          {filteredRecipes.length} Recipe{filteredRecipes.length !== 1 && 's'} Found
        </Title>

        {filteredRecipes.length === 0 ? (
          <Text>No recipes match your selected ingredients.</Text>
        ) : (
          <SimpleGrid
            cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
            spacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
            verticalSpacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
          >
            {filteredRecipes.map((recipe) => (
              <Card
                key={recipe.id} // Ensure 'id' is unique
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                component="div" // Changed from Link to div to avoid nested <a> tags
                style={{
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  position: 'relative', // For favorite icon positioning
                }}
                onClick={() => router.push(`/recipes/${recipe.id}`)} // Navigate on card click
              >
                <Card.Section>
                  <Image
                    src={recipe.image}
                    alt={recipe.title}
                    height={160}
                    fit="cover"
                    loading="lazy"
                  />
                </Card.Section>

                <Group mt="md" mb="xs">
                  <Text>{recipe.title}</Text>
                  <Badge
                    color="pink"
                    variant="light"
                    aria-label={`Category: ${recipe.category}`}
                  >
                    {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
                  </Badge>
                </Group>

                <Text size="sm" color="dimmed" lineClamp={3}>
                  {recipe.description.length > 100
                    ? `${recipe.description.substring(0, 100)}...`
                    : recipe.description}
                </Text>

                <Group mt="md" mb="xs" align="center">
                  <Text size="sm" color="dimmed">
                    Portions: {recipe.portion}
                  </Text>
                  <Tooltip label={isFavorited(recipe.id) ? 'Unfavorite' : 'Favorite'}>
                    <ActionIcon
                      variant="transparent"
                      color={isFavorited(recipe.id) ? 'red' : 'gray'}
                      onClick={(e) => toggleFavorite(recipe.id, e)}
                      aria-label={isFavorited(recipe.id) ? 'Unfavorite' : 'Favorite'}
                    >
                      {isFavorited(recipe.id) ? (
                        <IconHeartFilled size={24} />
                      ) : (
                        <IconHeart size={24} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                </Group>

                <Button
                  variant="light"
                  color="blue"
                  fullWidth
                  radius="md"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default link behavior
                    router.push(`/recipes/${recipe.id}`); // Navigate programmatically
                  }}
                  aria-label={`View details of ${recipe.title}`}
                >
                  View Recipe
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* Scroll to Top Button */}
        <Affix position={{ bottom: 20, right: 20 }}>
          <Transition transition="slide-up" mounted={scroll.y > 0}>
            {(transitionStyles) => (
              <Button
                style={transitionStyles}
                onClick={() => scrollTo({ y: 0 })}
                aria-label="Scroll to top"
              >
                Scroll to top
              </Button>
            )}
          </Transition>
        </Affix>
      </Stack>
    </Container>
  );
}
