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

CRITICAL: Provide ALL required fields for each property. Use reasonable defaults if information is missing.

Extract these fields for each property:
- title: Brief descriptive name (REQUIRED - create from available info like "3.5 BHK Apartment in Waterlily")
- propertyType: "Apartment", "Villa", "Commercial", or "Plot" (REQUIRED)
- transactionType: "sale" or "rent" (REQUIRED)
- price: Numeric value as string (REQUIRED - extract just the number)
- rentFrequency: "monthly" or "yearly" (only if rent)
- size: Numeric area value as string (REQUIRED - use available info or "1000")
- sizeUnit: "sq.ft", "sq.m", "sq.yd", or "acre" (REQUIRED - default to "sq.ft")
- location: General area/locality (REQUIRED - use best available info)
- fullAddress: Complete address (REQUIRED - use location if not specified)
- listingType: "shared" or "exclusive" (REQUIRED - default to "shared")
- ownerName: Property owner's name (REQUIRED - use "Property Owner" if not specified)
- ownerPhone: Phone number (REQUIRED - use "9999999999" if not specified)
- commissionTerms: Commission details (REQUIRED - use "Standard terms apply" if not mentioned)
- bhk: Number of bedrooms (as integer)
- flatNumber: Unit/flat number if mentioned
- floorNumber: Floor number if mentioned
- buildingSociety: Building or society name
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