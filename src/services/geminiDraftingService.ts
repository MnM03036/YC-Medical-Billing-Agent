import { GoogleGenAI, Type } from "@google/genai";
import { ApplicableLaw } from "@/lib/legalRules";
import { supabaseAdmin } from "@/lib/supabaseClient";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export enum DenialCategory {
    OON = "OUT_OF_NETWORK",
    CODING_ERROR = "CODING_ERROR",
    MEDICAL_NECESSITY = "MEDICAL_NECESSITY"
}

/**
 * Classifies the type of denial using Gemini 1.5 Flash.
 */
export async function classifyDenial(denialText: string): Promise<DenialCategory> {
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
            { text: `Classify the following medical denial text into exactly one of these three categories: OUT_OF_NETWORK, CODING_ERROR, or MEDICAL_NECESSITY.\n\nDenial Text: ${denialText}` }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    category: {
                        type: Type.STRING,
                        enum: ["OUT_OF_NETWORK", "CODING_ERROR", "MEDICAL_NECESSITY"]
                    }
                },
                required: ["category"]
            }
        }
    });

    const data = JSON.parse(response.text || "{}");
    return data.category as DenialCategory || DenialCategory.CODING_ERROR;
}

/**
 * Drafts the legal appeal using Gemini 1.5 Pro and Google Search tool for verification.
 * Strict Constraint: Must cite real laws using the search tool, never inventing statutes.
 */
export async function draftAppealLetter(
    billId: string, 
    law: ApplicableLaw, 
    classification: DenialCategory,
    patientInfo: { state: string; name: string; insurer: string }
): Promise<string> {
    
    // Fetch line items flagged for context
    const { data: flaggedItems } = await supabaseAdmin
        .from('line_items')
        .select('*')
        .eq('bill_id', billId)
        .eq('is_flagged', true);

    const flaggedContext = flaggedItems ? JSON.stringify(flaggedItems) : "No specific flagged items available.";

    const promptText = `
### Task
Draft a formal medical billing appeal letter for the patient.

### Context
Patient Name: ${patientInfo.name}
Patient State: ${patientInfo.state}
Insurer: ${patientInfo.insurer}
Denial Category: ${classification}
Applicable Legal Framework: ${law}

### Flagged Billing Errors / Items to Contest:
${flaggedContext}

### Goal
Write a legally-grounded, professional appeal letter in Markdown. Address the insurer directly. Clearly state the reasons why the charges are invalid based on the flagged errors and the applicable law.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: promptText,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: "You are a legal medical billing advocate. You must cite real laws and regulations. Use the Google Search tool to verify state-specific statutes and timelines based on the Applicable Legal Framework provided. Never invent statutes or case law. If unsure, stick to general contract and medical necessity principles without citing specific fake codes."
        }
    });

    return response.text || "Drafting failed.";
}
