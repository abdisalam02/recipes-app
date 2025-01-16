// lib/pexels.ts

export const fetchRandomImage = async (query: string = "food"): Promise<string> => {
    const API_KEY = process.env.PEXELS_API_KEY; // Ensure this is set in your .env file
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=${Math.floor(Math.random() * 100)}`, {
      headers: {
        Authorization: API_KEY || "",
      },
    });
  
    if (!response.ok) {
      console.error("Failed to fetch image from Pexels:", response.statusText);
      return "";
    }
  
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium; // Choose desired image size
    }
  
    return "";
  };
  