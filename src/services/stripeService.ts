import Stripe from 'stripe';
import { supabaseAdmin } from '../supabaseClient';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

/**
 * Triggers a 25% success invoice if the appeal is resolved favorably.
 * The front-end would have already captured a setup intent / customer ID.
 */
export async function triggerSuccessFeeInvoice(appealId: string, recoveredAmount: number) {
    const { data: appeal } = await supabaseAdmin.from('appeals').select('*, user:users(stripe_customer_id, email)').eq('id', appealId).single();

    if (!appeal || !appeal.user?.stripe_customer_id) {
        throw new Error("Cannot trigger invoice: User or Customer ID not found.");
    }

    const feeAmount = Math.floor((recoveredAmount * 0.25) * 100); // 25% fee in cents

    await stripe.invoiceItems.create({
        customer: appeal.user.stripe_customer_id,
        amount: feeAmount,
        currency: 'usd',
        description: `25% Success Fee for Medical Bill Recovery (Overcharge reversed: $${recoveredAmount.toFixed(2)})`
    });

    const invoice = await stripe.invoices.create({
        customer: appeal.user.stripe_customer_id,
        auto_advance: true, 
        collection_method: 'charge_automatically'
    });

    return invoice;
}
