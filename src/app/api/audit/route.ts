import { NextRequest, NextResponse } from 'next/server';
import { extractBillLineItems } from '@/services/geminiExtractionService';
import { auditLineItemsAgainstCMS } from '@/services/cmsRuleEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileUri, mimeType, base64 } = body;

    if (!mimeType) {
        return NextResponse.json({ error: "Missing mimeType in request body." }, { status: 400 });
    }

    // Phase 1: Extract Line Items using Gemini Multimodal directly on the file inline content
    const extractedData = await extractBillLineItems(mimeType, fileUri, base64);

    // Phase 2: Audit against CMS tables via Rule Engine
    const auditedData = await auditLineItemsAgainstCMS(extractedData);

    // Calculate aggregated metrics for the UI
    const totalBilled = auditedData.reduce((acc, item) => acc + item.charge, 0);
    const flags = auditedData.filter(item => item.is_flagged);
    
    // Total potential savings is charge - (medicare_benchmark * 2)? Or just total overcharge difference. Let's calculate standard metric:
    const totalPotentialSavings = flags.reduce((acc, item) => {
        if (item.medicare_benchmark) {
            return acc + (item.charge - (item.medicare_benchmark * 1.5)); // typical benchmark saving estimate
        }
        return acc;
    }, 0);

    return NextResponse.json({
        success: true,
        summary: {
           totalItems: auditedData.length,
           totalBilled,
           flaggedItemsCount: flags.length,
           totalPotentialSavings
        },
        lineItems: auditedData
    });

  } catch (error: any) {
    console.error("Gemini Audit Error:", error);
    return NextResponse.json({ error: error.message || "Failed to run AI evaluation" }, { status: 500 });
  }
}
