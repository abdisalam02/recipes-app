-- Step 0: Adding new columns with default values
ALTER TABLE "Ingredient" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Unknown Ingredient';
ALTER TABLE "Ingredient" ADD COLUMN "quantity" FLOAT NOT NULL DEFAULT 1;
ALTER TABLE "Ingredient" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'units';

-- Step 1: Migrating existing data into the new structure
PRAGMA defer_foreign_keys = ON;
PRAGMA foreign_keys = OFF;

-- Create a new table with the updated schema
CREATE TABLE "new_Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL DEFAULT 'Unknown Ingredient',
    "quantity" FLOAT NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'units',
    "recipeId" INTEGER NOT NULL,
    CONSTRAINT "Ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 2: Insert existing data into the new table
-- Use default values for the new columns
INSERT INTO "new_Ingredient" ("id", "recipeId", "name", "quantity", "unit")
SELECT 
    "id", 
    "recipeId", 
    'Unknown Ingredient' AS "name", 
    1 AS "quantity", 
    'units' AS "unit"
FROM "Ingredient";

-- Step 3: Replace the old table with the new table
DROP TABLE "Ingredient";
ALTER TABLE "new_Ingredient" RENAME TO "Ingredient";

PRAGMA foreign_keys = ON;
PRAGMA defer_foreign_keys = OFF;

