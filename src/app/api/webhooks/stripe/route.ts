import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/services/stripeService";
import { supabaseAdmin } from "@/lib/supabaseClient";
import Stripe from "stripe";

// Handle Stripe Webhooks for invoice completion
export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "invoice.paid") {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Log payment success in audit trail
        const { data: user } = await supabaseAdmin.from("users").select("id").eq("stripe_customer_id", customerId).single();
        if (user) {
            await supabaseAdmin.from("audit_logs").insert({
                user_id: user.id,
                action: "success_fee_paid"
            });
        }
    }

    return NextResponse.json({ received: true });
}
