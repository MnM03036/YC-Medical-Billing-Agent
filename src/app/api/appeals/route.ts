import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { state, planType, denialDate, rawText } = await req.json();

    if (!state || !planType || !denialDate || !rawText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('appeals')
      .insert([
        {
          patient_state: state,
          insurance_plan_type: planType,
          denial_date: denialDate,
          raw_denial_text: rawText,
          status: 'Draft'
        }
      ])
      .select();

    if (error || !data || data.length === 0) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error?.message || "Failed to insert appeal." }, { status: 500 });
    }

    return NextResponse.json({ id: data[0].id }, { status: 200 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
