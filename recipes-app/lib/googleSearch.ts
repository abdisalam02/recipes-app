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

export async function fetchGoogleImages(query: string, num: number = 1): Promise<string[]> {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const CX = process.env.GOOGLE_CSE_ID;

  // Detailed environment variable logging
  console.log("Environment variables check:");
  console.log("- GOOGLE_API_KEY exists:", !!API_KEY);
  console.log("- GOOGLE_CSE_ID exists:", !!CX);
  
  // Log all environment variable names that might be related to Google search
  const envKeys = Object.keys(process.env).filter(key => 
    key.includes('GOOGLE') || key.includes('API') || key.includes('CSE')
  );
  console.log("Found environment variables:", envKeys);

  if (!API_KEY || !CX) {
    console.error("Google CSE API key or CSE ID not set in env variables. Please check your .env.local file and Vercel environment variables.");
    return [];
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
      console.error("Failed to fetch images from Google CSE:", response.status, response.statusText);
      
      // Log more details about the error
      try {
        const errorText = await response.text();
        console.error("Google CSE error response:", errorText);
      } catch (e) {
        console.error("Could not read error response", e);
      }
      
      return [];
    }

    const data: { items?: GoogleSearchItem[] } = await response.json();
    // Data structure: data.items[i].link => image URL
    if (!data.items || data.items.length === 0) {
      console.error("No items found in Google CSE response.");
      return [];
    }

    // Filter out unwanted domains before returning the links.
    return data.items
      .map((item: GoogleSearchItem) => item.link)
      .filter((link: string) => !!link && !isExcluded(link));
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error in fetchGoogleImages:", err.message);
    } else {
      console.error("Unknown error in fetchGoogleImages.");
    }
    return [];
  }
}
