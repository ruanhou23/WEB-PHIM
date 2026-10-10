/**
 * Example usage of the ophim1.com API
 * 
 * This file demonstrates how to use the API functions in different scenarios
 */

import { getHomeData, fetchHomeDataClient } from "./ophim";
import { transformOPhimMoviesToMovies } from "../utils/transform";

/**
 * Example 1: Server-side fetch (Next.js Server Component)
 * Use this in async Server Components or API routes
 */
export async function exampleServerSideFetch() {
  try {
    const homeData = await getHomeData();
    
    const featuredMovies = homeData.data.items || [];
    const transformedMovies = transformOPhimMoviesToMovies(featuredMovies);
    
    return {
      featured: transformedMovies,
    };
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return {
      featured: [],
    };
  }
}

/**
 * Example 2: Get specific section
 */
export async function exampleGetSection() {
  try {
    const homeData = await getHomeData();
    const movies = homeData.data.items || [];
    return transformOPhimMoviesToMovies(movies);
  } catch (error) {
    console.error("Failed to fetch section:", error);
    return [];
  }
}

/**
 * Example 3: Client-side fetch (React Client Component)
 * Use this with useEffect or React Query
 */
export async function exampleClientSideFetch() {
  try {
    const homeData = await fetchHomeDataClient();
    const movies = homeData.data.items || [];
    return transformOPhimMoviesToMovies(movies);
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return [];
  }
}

/**
 * Example 4: With error handling and fallback
 */
export async function exampleWithErrorHandling() {
  try {
    const homeData = await getHomeData();
    
    if (!homeData.status) {
      throw new Error(homeData.message || "API request failed");
    }
    
    const movies = homeData.data.items || [];
    
    if (movies.length === 0) {
      console.warn("No movies found in API response");
      return [];
    }
    
    return transformOPhimMoviesToMovies(movies);
  } catch (error) {
    // Log error for debugging
    console.error("Error in exampleWithErrorHandling:", error);
    
    // Return empty array as fallback
    return [];
  }
}
