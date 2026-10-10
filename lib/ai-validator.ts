import { z } from "zod";

// Define schemas that mirror the OPhim types
export const MovieSchema = z.object({
    _id: z.string(),
    name: z.string().min(1, "Name is required"),
    slug: z.string(),
    origin_name: z.string(),
    type: z.string(), // Relaxed from enum to handle all API types
    thumb_url: z.string(), // Removed .url() as these are often relative paths
    poster_url: z.string(), // Removed .url() for relative paths
    year: z.coerce.number().int().min(1900).max(2100), // Added z.coerce to handle string years
    category: z.array(z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string()
    })).min(1, "At least one category is required"),
    country: z.array(z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string()
    })).min(1, "At least one country is required")
});

export type ValidMovie = z.infer<typeof MovieSchema>;

/**
 * Validates data against a schema with a retry mechanism.
 * If validation fails, it attempts to "fix" common issues before retrying.
 */
export async function validateWithRetry<T>(
    initialData: any,
    schema: z.ZodSchema<T>,
    maxRetries: number = 3
): Promise<{ success: boolean; data?: T; attempts: number; errors?: string[] }> {
    let attempts = 0;
    let currentData = { ...initialData };
    let lastErrors: string[] = [];

    while (attempts < maxRetries) {
        attempts++;
        const result = schema.safeParse(currentData);

        if (result.success) {
            return { success: true, data: result.data, attempts };
        } else {
            lastErrors = result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`);

            if (attempts < maxRetries) {
                console.warn(`[AI-Validator] Attempt ${attempts} failed. Retrying with corrections...`, lastErrors);

                // Example "Self-Correction" logic: 
                // In a real agentic flow, this would be where the 'Critic' or 'System' 
                // prompts the LLM to fix specifically the 'lastErrors'.
                // For simulation, we fix common missing fields or type mismatches.

                if (lastErrors.some(e => e.includes('thumb_url'))) {
                    currentData.thumb_url = currentData.thumb_url || "/placeholder-thumb.jpg";
                }
                if (lastErrors.some(e => e.includes('poster_url'))) {
                    currentData.poster_url = currentData.poster_url || "/placeholder-poster.jpg";
                }
                if (lastErrors.some(e => e.includes('type'))) {
                    currentData.type = currentData.type || "single";
                }
            }
        }
    }

    return { success: false, attempts, errors: lastErrors };
}
