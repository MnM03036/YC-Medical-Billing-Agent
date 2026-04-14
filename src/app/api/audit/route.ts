import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import cmsBenchmarks from '@/data/cms_benchmarks.json';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

const auditSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    flags: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          errorType: {
             type: SchemaType.STRING,
             description: "Must be 'Upcoding', 'Unbundling', 'Duplicate', 'Phantom', or 'Other'"
          },
          explanation: {
             type: SchemaType.STRING,
             description: "Clear and concise reason for why this was flagged based on standard medical coding practices and benchmarks."
          },
          cptCode: {
             type: SchemaType.STRING,
             description: "The offending 5-digit CPT code if applicable",
          },
          billedAmount: {
             type: SchemaType.NUMBER,
             description: "Amount billed by the provider for the service"
          },
          correctAmount: {
             type: SchemaType.NUMBER,
             description: "The Medicare Benchmark expected cost, or 0 if duplicate/phantom"
          },
          potentialSavings: {
             type: SchemaType.NUMBER,
             description: "Calculated savings if flagged charge is corrected (billedAmount - correctAmount)"
          }
        },
        required: ["errorType", "explanation", "cptCode", "billedAmount", "correctAmount", "potentialSavings"]
      }
    },
    totalPotentialSavings: {
      type: SchemaType.NUMBER,
      description: "Sum of all potentialSavings from the flags"
    },
    auditSummary: {
      type: SchemaType.STRING,
      description: "A 1-2 sentence high-level summary of the audit findings"
    }
  },
  required: ["flags", "totalPotentialSavings", "auditSummary"]
};

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "API key is missing on the server" }, { status: 500 });
  }

  try {
    const { rawText, structuredData } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: auditSchema,
      }
    });

    const prompt = `
You are an expert Medical Billing Auditor with vast knowledge of US Healthcare Coding Systems (CPT), Medicare Benchmarks, and billing malpractice concepts.

Your objective is to analyze the raw OCR text of a medical bill, cross-reference it against the provided Medicare Baseline CPT Data, and identify any billing anomalies.

### RULES & ANOMALY DEFINITIONS:
1. **Upcoding**: The provider billed for a more extensive or severe service than what standard visits dictate (e.g. billing 99215 ($183) when 99213 ($92) is standard for a routine minor issue).
2. **Unbundling**: The provider billed separately for components of a procedure that should be included in a single 'bundled' code (e.g. billing routine blood draw 36415 alongside a broad lab panel 80053 incorrectly).
3. **Duplicate charges**: The same identical service code billed multiple times excessively without modifier or valid reason.
4. **Phantom billing**: Billed for services that typically don't align with the other primary procedures or appear entirely unrelated/suspicious based on the overall text context.

### INPUT DATA:
CMS Medicare Baseline Rates (JSON):
${JSON.stringify(cmsBenchmarks, null, 2)}

Pre-Parsed Entity Details:
${JSON.stringify(structuredData, null, 2)}

Raw OCR Text:
"""
${rawText}
"""

Execute a strict evaluation. Return only a JSON array of anomalies detected. Do not hallucinate. Calculate financial discrepancies carefully.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Attempt parsing directly since it's constrained by schema
    const data = JSON.parse(responseText);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Gemini Audit Error:", error);
    return NextResponse.json({ error: error.message || "Failed to run AI evaluation" }, { status: 500 });
  }
}
