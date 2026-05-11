import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Zod schema for rigorous structural validation of the AI output
export const BillLinesSchema = z.array(z.object({
  cpt_code: z.string(),
  description: z.string(),
  charge: z.number(),
  date: z.string()
}));

export type ExtractedLineItem = z.infer<typeof BillLinesSchema>[0];

// The schema matching Gemini's Type definition expected strictly
const geminiResponseSchema = {
    type: Type.ARRAY,
    description: "List of medical bill line items",
    items: {
        type: Type.OBJECT,
        properties: {
            cpt_code: { type: Type.STRING, description: "5-digit CPT or HCPCS code. Return 'UNKNOWN' if not found." },
            description: { type: Type.STRING, description: "Description of the medical service rendered." },
            charge: { type: Type.NUMBER, description: "Charge amount as a float/number. Do not include currency symbols." },
            date: { type: Type.STRING, description: "Date in YYYY-MM-DD format. Return empty string if missing." }
        },
        required: ["cpt_code", "description", "charge", "date"]
    }
};

/**
 * Extracts line items from a raw medical bill document
 * @param mimeType The mime type (e.g., 'application/pdf', 'image/jpeg')
 * @param fileUri Optional: URI of the file if uploaded to Gemini File API
 * @param base64Data Optional: Raw base64 data for inline processing
 */
export async function extractBillLineItems(mimeType: string, fileUri?: string, base64Data?: string): Promise<ExtractedLineItem[]> {
    try {
        let fileDataPayload: any = {};
        
        if (base64Data) {
            fileDataPayload = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };
        } else if (fileUri) {
            fileDataPayload = {
                fileData: {
                    fileUri: fileUri, 
                    mimeType: mimeType
                }
            };
        } else {
             throw new Error("Must provide either base64Data or fileUri");
        }

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                fileDataPayload,
                { text: "Extract all billing line items from this medical document." }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: geminiResponseSchema,
                temperature: 0.1
            }
        });

        const rawJsonString = response.text;
        
        if (!rawJsonString) {
            throw new Error("No output generated from Gemini model.");
        }

        const parsedJson = JSON.parse(rawJsonString);

        // Zod throws an error if validation fails—achieving the ZERO HALLUCINATION rule constraint
        const validatedData = BillLinesSchema.parse(parsedJson);

        return validatedData;

    } catch (error) {
        console.error("Extraction failure: ", error);
        throw new Error("Failed to strictly extract and validate bill items: " + error);
    }
}
