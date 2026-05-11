import { Resend } from 'resend';
import Lob from 'lob';
import { supabaseAdmin } from '@/lib/supabaseClient';

const resend = new Resend(process.env.RESEND_API_KEY);
const lob = new Lob({ apiKey: process.env.LOB_API_KEY! });

export async function dispatchElectronicAppeal(appealId: string, email: string, pdfBuffer: Buffer, draftCopy: string) {
    const { data: appeal } = await supabaseAdmin.from('appeals').select('*').eq('id', appealId).single();

    if (!appeal) throw new Error("Appeal not found");

    const { data, error } = await resend.emails.send({
      from: 'BillAuditor <appeals@yourdomain.com>',
      to: [email],
      subject: `Formal Appeal: Denial of Service Notice (${appeal.patient_state})`,
      text: "Please find the attached formal appeal text submitted via BillAuditor platform.\n\n" + draftCopy,
      attachments: [{
          filename: `Appeal_${appealId}.pdf`,
          content: pdfBuffer,
      }]
    });

    if (error) throw new Error(error.message);

    await supabaseAdmin.from('audit_logs').insert({ action: 'email_sent', user_id: appeal.user_id });
    return data;
}

export async function dispatchPhysicalAppeal(appealId: string, pdfBufferOrHtmlString: any, insurerAddressObj: any, userAddressObj: any) {
    const { data: appeal } = await supabaseAdmin.from('appeals').select('*').eq('id', appealId).single();
    if (!appeal) throw new Error("Appeal not found");

    const lobPayload = {
        description: `Appeal for Bill ${appeal.bill_id}`,
        to: insurerAddressObj,
        from: userAddressObj,
        file: pdfBufferOrHtmlString, // For Lob, you can send HTML string directly or a URL to a PDF
        color: false,
        extra_service: "certified" as any, // CRITICAL for legal tracking
        mail_type: "usps_first_class" as any
    };

    try {
        const letter = await lob.letters.create(lobPayload);
        await supabaseAdmin.from('audit_logs').insert({ action: 'lob_mail_sent', user_id: appeal.user_id });
        
        // Update Appeal to Sent
        await supabaseAdmin.from('appeals').update({ status: 'sent' }).eq('id', appealId);
        return letter;
    } catch(err: any) {
        throw new Error("Lob failed to send letter: " + err.message);
    }
}
