// prisma/seed.ts

import prisma from "../lib/prisma";

async function main() {
  // Delete all existing data
  await prisma.step.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.recipe.deleteMany();

  // Create a sample recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: "Sample Recipe",
      category: "dessert",
      description: "This is a sample recipe for testing purposes.",
      portion: 4,
      image: "https://example.com/sample-recipe.jpg",
      ingredients: {
        create: [
          { ingredient: "2 cups flour" },
          { ingredient: "1.5 cups sugar" },
          { ingredient: "0.75 cups cocoa powder" },
          { ingredient: "2 teaspoons baking powder" },
          { ingredient: "1.5 teaspoons baking soda" },
          { ingredient: "1 teaspoon salt" },
          { ingredient: "2 eggs" },
          { ingredient: "1 cup milk" },
          { ingredient: "0.5 cup vegetable oil" },
          { ingredient: "2 teaspoons vanilla extract" },
        ],
      },
      steps: {
        create: [
          { order: 1, description: "Preheat oven to 350°F (175°C)." },
          { order: 2, description: "Grease and flour two 9-inch cake pans." },
          { order: 3, description: "In a large bowl, stir together the dry ingredients." },
          { order: 4, description: "Add eggs, milk, oil, and vanilla; beat for 2 minutes on medium speed." },
          { order: 5, description: "Pour into prepared pans." },
          { order: 6, description: "Bake for 30-35 minutes or until a toothpick comes out clean." },
          { order: 7, description: "Cool for 10 minutes; remove from pans to wire racks." },
          { order: 8, description: "Cool completely before frosting." },
        ],
      },
    },
    include: {
      ingredients: true,
      steps: true,
    },
  });

  console.log("Seeded recipe:", recipe);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
