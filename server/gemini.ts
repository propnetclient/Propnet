import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ExtractedProperty {
  title?: string;
  propertyType?: string;
  transactionType?: string;
  price?: string;
  rentFrequency?: string;
  size?: string;
  sizeUnit?: string;
  location?: string;
  fullAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  commissionTerms?: string;
  bhk?: number;
  flatNumber?: string;
  floorNumber?: string;
  buildingSociety?: string;
  description?: string;
  confidence?: number;
}

export async function extractPropertiesFromText(text: string): Promise<ExtractedProperty[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a real estate data extraction expert. Analyze the following text and extract individual property listings. Each property should be returned as a separate object with structured data.

CRITICAL: Only extract information that is explicitly mentioned in the text. DO NOT generate fake or placeholder data for missing fields.

Extract these fields for each property:
- title: Brief descriptive name (only if clear from context)
- propertyType: "Apartment", "Villa", "Commercial", or "Plot" (only if mentioned)
- transactionType: "sale" or "rent" (only if mentioned)
- price: Numeric value as string (only if mentioned - extract just the number)
- rentFrequency: "monthly" or "yearly" (only if rent and frequency is mentioned)
- size: Numeric area value as string (only if mentioned)
- sizeUnit: "sq.ft", "sq.m", "sq.yd", or "acre" (only if mentioned)
- location: General area/locality (only if mentioned)
- fullAddress: Complete address (only if mentioned)
- listingType: "shared" or "exclusive" (only if mentioned)
- bhk: Number of bedrooms (as integer - required field)
- flatNumber: Unit/flat number (required field - extract if mentioned)
- buildingSociety: Building or society name (required field - extract if mentioned)
- floorNumber: Floor number if mentioned
- ownerName: Property owner's name (only if explicitly mentioned)
- ownerPhone: Phone number (only if explicitly mentioned)
- commissionTerms: Commission details (only if mentioned)
- description: Any additional details
- confidence: Rate your confidence in the extraction (0-1)

Return ONLY a valid JSON array of objects. Ensure EVERY property has ALL required fields populated.

Text to analyze:
${text}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const extractedText = response.text();

    // Parse the JSON response
    try {
      const jsonMatch = extractedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const properties = JSON.parse(jsonMatch[0]);
        return Array.isArray(properties) ? properties : [properties];
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
    }

    return [];
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to extract properties from text");
  }
}

export async function enhancePropertyDescription(property: ExtractedProperty): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Create a professional property description based on the following details:
- Type: ${property.propertyType}
- BHK: ${property.bhk}
- Size: ${property.size} ${property.sizeUnit}
- Location: ${property.location}
- Transaction: ${property.transactionType}
- Price: ${property.price}
- Existing description: ${property.description || 'None'}

Write a 2-3 sentence professional description that highlights key features and location benefits. Keep it concise and appealing to potential buyers/renters.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Description enhancement error:", error);
    return property.description || "";
  }
}