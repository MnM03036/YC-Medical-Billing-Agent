import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseClient';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, appealId } = await req.json();

    const { data: appeal } = await supabaseAdmin.from('appeals').select('*').eq('id', appealId).single();

    if (!appeal) throw new Error("Appeal not found");

    const { data, error } = await resend.emails.send({
      from: 'BillAuditor Appeals <onboarding@resend.dev>', // Default free tier address
      to: [email],
      subject: `Formal Appeal: Denial of Service Notice (${appeal.patient_state} / ${appeal.insurance_plan_type})`,
      text: "Please find the attached formal appeal text submitted via BillAuditor platform.\n\n" + appeal.ai_generated_appeal_draft,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Update status
    await supabaseAdmin.from('appeals').update({ status: 'Sent' }).eq('id', appealId);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
