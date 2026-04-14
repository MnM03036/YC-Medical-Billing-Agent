import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: NextRequest) {
  try {
    const { appealId } = await req.json();

    if (!appealId) return NextResponse.json({ error: "Missing appealId" }, { status: 400 });

    // 1. Fetch Appeal
    const { data: appeal, error: appealError } = await supabaseAdmin
      .from('appeals')
      .select('*')
      .eq('id', appealId)
      .single();

    if (appealError || !appeal) throw new Error("Appeal not found");

    // PHASE 2.2: Deterministic Legal Mapping Logic
    const { data: framework, error: frameworkError } = await supabaseAdmin
      .from('legal_frameworks')
      .select('*')
      .eq('state', appeal.patient_state)
      .eq('plan_type', appeal.insurance_plan_type)
      .single();

    if (frameworkError || !framework) {
      throw new Error(`Jurisdiction logic failed. No mapping for State: ${appeal.patient_state}, Plan: ${appeal.insurance_plan_type}`);
    }

    // Update appeal with framework mapped deadline
    const denialDate = new Date(appeal.denial_date);
    const deadlineDate = new Date(denialDate.setDate(denialDate.getDate() + framework.statutory_deadline_days));

    await supabaseAdmin.from('appeals').update({ 
      legal_framework_id: framework.id,
      deadline_date: deadlineDate.toISOString().split('T')[0]
    }).eq('id', appealId);


    // PHASE 3: AI Denial Reason Classifier (Temperature 0.0)
    const classifierModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
             classified_reason: {
               type: SchemaType.STRING,
               description: "Must be EXACTLY one of: MEDICAL_NECESSITY, OUT_OF_NETWORK, CODING_ERROR, PRIOR_AUTH_MISSING, UNKNOWN"
             },
             confidence_score: { type: SchemaType.NUMBER, description: "Between 0 and 1" },
             ai_rationale: { type: SchemaType.STRING }
          },
          required: ["classified_reason", "confidence_score", "ai_rationale"]
        }
      }
    });

    const classifyPrompt = `
      You are a Medical Billing Claims Classifier.
      Read the following Raw Denial Text:
      """${appeal.raw_denial_text}"""
      
      Determine the categorization. If you are not confident, output UNKNOWN. Do not guess.
    `;

    const classificationRes = await classifierModel.generateContent(classifyPrompt);
    const classification = JSON.parse(classificationRes.response.text());

    // Fallback if AI guessed incorrectly against constraints
    const allowedReasons = ["MEDICAL_NECESSITY", "OUT_OF_NETWORK", "CODING_ERROR", "PRIOR_AUTH_MISSING", "UNKNOWN"];
    if (!allowedReasons.includes(classification.classified_reason) || classification.confidence_score < 0.7) {
       classification.classified_reason = "UNKNOWN";
    }

    await supabaseAdmin.from('denial_classifications').insert([{
      appeal_id: appealId,
      classified_reason: classification.classified_reason,
      confidence_score: classification.confidence_score,
      ai_rationale: classification.ai_rationale,
      manual_review_required: classification.classified_reason === "UNKNOWN"
    }]);

    if (classification.classified_reason === "UNKNOWN") {
      return NextResponse.json({ 
         status: "MANUAL_REVIEW_NEEDED", 
         message: "Could not safely determine denial reason." 
      });
    }

    // PHASE 4: AI Appeal Letter Draft Generation
    const draftingModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.1 }
    });

    const draftingPrompt = `
      You are an expert Appeals Specialist. Generate a formal Appeal Letter to the insurance provider.

      ### STRICT LEGAL CONSTRAINTS & GROUNDING:
      1. Applicable Law: ${framework.applicable_law}
      2. Required Legal Template Language (USE VERBATIM): "${framework.template_structure}"
      3. Cite ONLY the statutes above. Do not invent or infer case law or medical facts.
      4. If clinical data is missing, insert [INSERT CLINICAL GUIDELINE] instead of fabricating it.
      
      ### FACTS:
      - Denial Class: ${classification.classified_reason}
      - State: ${appeal.patient_state}
      - Plan Type: ${appeal.insurance_plan_type}
      - Original Denial Language: "${appeal.raw_denial_text}"

      Draft the letter using professional structure. Begin with the required template structure wording.
    `;

    const draftRes = await draftingModel.generateContent(draftingPrompt);
    const draftText = draftRes.response.text();

    await supabaseAdmin.from('appeals').update({ 
      ai_generated_appeal_draft: draftText,
      status: 'Action Required'
    }).eq('id', appealId);

    return NextResponse.json({ 
       status: "SUCCESS", 
       draft: draftText,
       classification 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
