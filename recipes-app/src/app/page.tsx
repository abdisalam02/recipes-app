"use client";
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
  TextInput,
  Select,
  Loader,
  Stack,
  Chip,
  Autocomplete,
  Drawer,
  Affix,
  Transition,
} from '@mantine/core';
import { IconHeart, IconHeartFilled, IconArrowUp } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useDebouncedValue, useWindowScroll, useDisclosure } from '@mantine/hooks';

// Recipe Interface
interface Recipe {
  id: number;
  title: string;
  category: string;
  region: string;
  image: string;
  description: string;
  portion: number;
  created_at: string;
  updated_at: string;
}

// Favorite Interface
interface Favorite {
  id: number;
  recipe_id: number;
  created_at: string;
  updated_at: string;
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States for Search and Category Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300); // Debounced search term
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Drawer handling
  const [opened, { open, close }] = useDisclosure(false);

  // Window scroll state for scroll-to-top button
  const [scroll, scrollTo] = useWindowScroll();

  // Fetch Recipes and Favorites on Mount
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch('/api/recipes');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch recipes');
        }
        const data: Recipe[] = await res.json();
        setRecipes(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to load recipes.',
            color: 'red',
          });
        }
      }
    };

    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/favorites');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch favorites');
        }
        const data: Favorite[] = await res.json();
        setFavorites(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to load favorites.',
            color: 'red',
          });
        }
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchRecipes(), fetchFavorites()]);
      setLoading(false);
    };

    fetchData();
  }, []);

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

  // Get Unique Categories from Recipes
  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category)));
  const regions = Array.from(new Set(recipes.map((recipe) => recipe.region)));

  // Filter Recipes based on Search Term, Selected Category, and Region
  const filteredRecipes = recipes.filter((recipe) => {
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
      />

      {/* Button to open Drawer for filters on mobile */}
      <Button variant="outline" color="blue" onClick={open} mb="xl">
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
          {categories.map((category) => (
            <Chip
              key={category}
              onClick={() =>
                setSelectedCategory((prev) => (prev === category ? '' : category))
              }
              variant={selectedCategory === category ? 'filled' : 'outline'}
            >
              {category}
            </Chip>
          ))}
        </Group>

        {/* Region Chips for Filtering */}
        <Group mb="xl" >
          {regions.map((region) => (
            <Chip
              key={region}
              onClick={() =>
                setSelectedRegion((prev) => (prev === region ? '' : region))
              }
              variant={selectedRegion === region ? 'filled' : 'outline'}
            >
              {region}
            </Chip>
          ))}
        </Group>
      </Drawer>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <Group align="center">
          <Text color="dimmed">No recipes found.</Text>
        </Group>
      ) : (
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
          spacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
          verticalSpacing={{ base: 'sm', sm: 'md', lg: 'lg' }}
        >
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id}>
              <Card.Section>
                <Image
                  src={getImageUrl(recipe.image)}
                  alt={recipe.title}
                  className="recipe-image"
                  loading="lazy"
                />
              </Card.Section>

              <Group mt="md" mb="xs">
                <Text size="lg">{recipe.title}</Text>
                <Badge color="pink" variant="light" size="sm">
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
                    onClick={() => toggleFavorite(recipe.id)}
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
                component={Link}
                href={`/recipes/${recipe.id}`}
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
              leftSection={<IconArrowUp size={16} />}
              style={transitionStyles}
              onClick={() => scrollTo({ y: 0 })}
            >
              Scroll to top
            </Button>
          )}
        </Transition>
      </Affix>
    </Container>
  );
}
