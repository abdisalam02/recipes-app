// lib/googleSearch.ts

/**
 * fetchGoogleImages
 * Queries the Google Custom Search API for images matching the given query.
 *
 * @param query - The search term (e.g. "pizza", "chocolate cake", etc.)
 * @param num   - Number of image results to fetch (default = 1)
 * @returns     - An array of image URLs (strings). Could be empty if none found.
 */
export async function fetchGoogleImages(query: string, num: number = 1): Promise<string[]> {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const CX = process.env.GOOGLE_CSE_ID;
  
    if (!API_KEY || !CX) {
      console.error("Google CSE API key or CSE ID not set in env variables.");
      return [];
    }
  
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("cx", CX);
    url.searchParams.set("q", query);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", String(num));
  
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error("Failed to fetch images from Google CSE:", response.statusText);
        return [];
      }
  
      const data = await response.json();
      // Data structure: data.items[i].link => image URL
      if (!data.items) {
        console.error("No items found in Google CSE response.");
        return [];
      }
  
      return data.items.map((item: any) => item.link).filter((link: string) => !!link);
    } catch (err) {
      console.error("Error in fetchGoogleImages:", err);
      return [];
    }
  }
  