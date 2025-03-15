-- Create a new table for caching nutritional information
CREATE TABLE food_nutrition_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  quantity FLOAT NOT NULL,
  unit TEXT NOT NULL,
  nutritional_info JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT NOT NULL,
  
  -- Create an index on normalized_name for faster lookups
  CONSTRAINT unique_food_entry UNIQUE(normalized_name, quantity, unit)
);

-- Add a function to normalize food names for consistent lookups
CREATE OR REPLACE FUNCTION normalize_food_name(input_name TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, remove extra spaces, and standardize common terms
  RETURN REGEXP_REPLACE(
    REGEXP_REPLACE(
      LOWER(TRIM(input_name)),
      '\s+', ' ', 'g'
    ),
    '(s|es)$', '', 'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create an index for fuzzy text search
CREATE INDEX food_nutrition_cache_name_idx ON food_nutrition_cache USING gin(normalized_name gin_trgm_ops);

-- Add RLS policies
ALTER TABLE food_nutrition_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to food_nutrition_cache"
  ON food_nutrition_cache
  FOR SELECT
  USING (true);

-- Allow authenticated insert
CREATE POLICY "Allow authenticated insert to food_nutrition_cache"
  ON food_nutrition_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true); 