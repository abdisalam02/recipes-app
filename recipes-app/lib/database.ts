// src/lib/database.ts
export interface Database {
    public: {
      Tables: {
        recipes: {
          Row: {
            id: number;
            title: string;
            portion: number;
            description: string;
            category: string;
            image: string;
            nutritional_info: {
              calories: number;
              protein: number;
              fat: number;
              carbohydrates: number;
              fiber: number;
              sugar: number;
              sodium: number;
              cholesterol: number;
            } | null;
          };
          Insert: {
            title: string;
            portion: number;
            description: string;
            category: string;
            image?: string | null;
          };
          Update: {
            title?: string;
            portion?: number;
            description?: string;
            category?: string;
            image?: string | null;
            nutritional_info?: {
              calories?: number;
              protein?: number;
              fat?: number;
              carbohydrates?: number;
              fiber?: number;
              sugar?: number;
              sodium?: number;
              cholesterol?: number;
            } | null;
          };
        };
        // Define other tables as needed
      };
    };
  }
  