'use client';
import { useRouter } from 'next/navigation';
import {
  Container,
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Button,
  Group,
  ActionIcon,
  Tooltip,
  Title,
  Autocomplete,
  Drawer,
  Chip,
  Affix,
  Transition,
  Loader,
} from '@mantine/core';
import { IconHeart, IconHeartFilled, IconArrowUp } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useDebouncedValue, useWindowScroll, useDisclosure } from '@mantine/hooks';
import { Recipe, Favorite } from '../../lib/types'; // Ensure these interfaces are correctly defined

export default function FindRecipesPage() {
  const router = useRouter();
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
  const [inputValue, setInputValue] = useState<string>(''); // Declare inputValue only once

  // Drawer handling
  const [opened, { open, close }] = useDisclosure(false);

  // Window scroll state for scroll-to-top button
  const [scroll, scrollTo] = useWindowScroll();

  // Fetch Recipes, Ingredients, and Favorites on Mount
  useEffect(() => {
/*************  ✨ Codeium Command ⭐  *************/
/**
 * Asynchronously fetches and updates the state for ingredients, recipes, and favorites data from their respective APIs.
 * Sets a loading state while fetching data.
 * On success, updates the component state with the fetched data.
 * Handles errors by logging them and displaying notification messages.
 * Ensures the loading state is reset upon completion.
 * 
 * @throws Will throw an error if any API request fails.
 */

/******  5da2e1a6-32f8-4208-b5c9-7ec4dc9682bf  *******/

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
            .map((ri) => ri.ingredient.name.toLowerCase()) // Corrected 'ingredients' to 'ingredient'
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
  const toggleFavorite = async (recipe_id: number) => {
    try {
      if (isFavorited(recipe_id)) {
        // DELETE => remove favorite
        const res = await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id }), // Use 'recipe_id'
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
          body: JSON.stringify({ recipe_id }), // Use 'recipe_id'
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        notifications.show({
          title: 'Error',
          message: error.message || 'An error occurred.',
          color: 'red',
        });
      }
    }
  };

  // Loading State
  if (loading) {
    return (
      <Container size="md" py="xl">
        <Group align="center">
          <Loader size="xl" color="blue" variant="dots" />
        </Group>
      </Container>
    );
  }

  // Function to get Image URL or fallback
  const getImageUrl = (image: string): string => {
    if (image && image.trim() !== '') return image;
    return 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
  };

  // Get Unique Categories and Regions from Recipes
  const uniqueCategories = Array.from(new Set(recipes.map((recipe) => recipe.category)));
  const uniqueRegions = Array.from(new Set(recipes.map((recipe) => recipe.region)));

  // Filter Recipes based on Search Term, Selected Category, and Region
  const filteredRecipeList = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? recipe.category === selectedCategory : true;
    const matchesRegion = selectedRegion ? recipe.region === selectedRegion : true;
    return matchesSearch && matchesCategory && matchesRegion;
  });

  return (
    <Container size="lg" py="xl">
      {/* Title */}
      <Group align="center" mb="md">
        <Title order={1}>Recipe Collection</Title>
      </Group>

      {/* Autocomplete for Search */}
      <Autocomplete
        label="Search Recipes"
        placeholder="Type recipe name..."
        value={searchTerm}
        onChange={setSearchTerm}
        data={recipes.map((recipe) => recipe.title)}
        mb="xl"
        aria-label="Search Recipes"
      />

      {/* Button to open Drawer for filters on mobile */}
      <Button variant="outline" color="blue" onClick={open} mb="xl" aria-label="Open Filters">
        Filter Recipes
      </Button>

      {/* Drawer for filters on mobile */}
      <Drawer
        opened={opened}
        onClose={close}
        title="Filter Recipes"
        position="right"
        size="xs"
        withCloseButton={false}
      >
        {/* Category Chips for Filtering */}
        <Group mb="xl">
          {uniqueCategories.map((category) => (
            <Chip
              key={category}
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
        <Group mb="xl">
          {uniqueRegions.map((region) => (
            <Chip
              key={region}
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
      </Drawer>

      {/* Recipes Grid */}
      {filteredRecipeList.length === 0 ? (
        <Group align="center">
          <Text color="dimmed">No recipes found.</Text>
        </Group>
      ) : (
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
          spacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
          verticalSpacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
        >
          {filteredRecipeList.map((recipe) => (
            <Card
              key={recipe.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              component={Link}
              href={`/recipes/${recipe.id}`}
              style={{
                transition: 'transform 0.2s, box-shadow 0.2s',
                textDecoration: 'none', // Remove underline from link
                color: 'inherit', // Inherit text color
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
              }}
            >
              <Card.Section>
                <Image
                  src={getImageUrl(recipe.image)}
                  alt={recipe.title}
                  height={160}
                  fit="cover"
                  loading="lazy"
                />
              </Card.Section>

              <Group mt="md" mb="xs">
                <Text> {recipe.title}</Text>
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
                    onClick={(e) => {
                      e.preventDefault(); // Prevent navigation
                      toggleFavorite(recipe.id);
                    }}
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
    </Container>
  );
}
