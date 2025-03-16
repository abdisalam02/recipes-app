// lib/googleSearch.ts

interface GoogleSearchItem {
  link: string;
  // You can add more fields if needed based on the API response
}

const excludedDomains = [
  "nutrisystem.com",
  "leaf.nutrisystem.com",
  "edgesuite.net",
  "errors.edgesuite.net"
];

// Dictionary of fallback images for common food categories
const fallbackImages = {
  // Generic categories
  "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "pasta": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "salad": "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "cake": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "chicken": "https://images.unsplash.com/photo-1606728035253-49e8a23146de?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "soup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "dessert": "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "breakfast": "https://images.unsplash.com/photo-1533089860892-a9c9e5a22d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  
  // Common Somali dishes
  "rice": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "somali rice": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "chapati": "https://images.unsplash.com/photo-1600326145552-327f74b9c189?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  "manadazi": "https://res.cloudinary.com/dp5axzkam/image/upload/v1708964151/mandazi_uahz2p.jpg"
};

// Default image for any food
const DEFAULT_FOOD_IMAGE = "https://images.unsplash.com/photo-1606787366850-de6330128bfc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80";

function isExcluded(link: string): boolean {
  try {
    const urlObj = new URL(link);
    return excludedDomains.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch (error) {
    // If URL parsing fails, exclude the link
    return true;
  }
}

/**
 * Get a fallback image URL based on food description
 */
export function getFallbackFoodImage(description: string): string {
  try {
    // Convert to lowercase for case-insensitive matching
    const lowerDesc = description.toLowerCase();
    
    // Find a matching category
    for (const [category, imageUrl] of Object.entries(fallbackImages)) {
      if (lowerDesc.includes(category.toLowerCase())) {
        console.log(`Using fallback image for category: ${category}`);
        return imageUrl;
      }
    }
    
    // Return default food image if no specific category matched
    return DEFAULT_FOOD_IMAGE;
  } catch (error) {
    console.error("Error getting fallback image:", error);
    return DEFAULT_FOOD_IMAGE;
  }
}

export async function fetchGoogleImages(query: string, num: number = 1): Promise<string[]> {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const CX = process.env.GOOGLE_CSE_ID;

  // Add more detailed debugging
  console.log("Environment variables check:");
  console.log("- GOOGLE_API_KEY exists:", !!API_KEY);
  console.log("- GOOGLE_CSE_ID exists:", !!CX);
  
  // List all available environment variables (keys only for security)
  const envKeys = Object.keys(process.env).filter(key => 
    key.includes('GOOGLE') || key.includes('API') || key.includes('CSE')
  );
  console.log("Available environment variables:", envKeys);

  if (!API_KEY || !CX) {
    console.error("Google CSE API key or CSE ID not set in env variables.");
    
    // Return a fallback image based on the food query
    return [getFallbackFoodImage(query)];
  }

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("cx", CX);
    url.searchParams.set("q", query);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", String(num));

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error("Failed to fetch images from Google CSE:", response.statusText);
      return [getFallbackFoodImage(query)];
    }

    const data: { items?: GoogleSearchItem[] } = await response.json();
    // Data structure: data.items[i].link => image URL
    if (!data.items || data.items.length === 0) {
      console.error("No items found in Google CSE response.");
      return [getFallbackFoodImage(query)];
    }

    // Filter out unwanted domains before returning the links.
    const filteredLinks = data.items
      .map((item: GoogleSearchItem) => item.link)
      .filter((link: string) => !!link && !isExcluded(link));
      
    // If all links were filtered out, return fallback
    if (filteredLinks.length === 0) {
      return [getFallbackFoodImage(query)];
    }
    
    return filteredLinks;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error in fetchGoogleImages:", err.message);
    } else {
      console.error("Unknown error in fetchGoogleImages.");
    }
    
    // Return fallback image when API fails
    return [getFallbackFoodImage(query)];
  }
}
