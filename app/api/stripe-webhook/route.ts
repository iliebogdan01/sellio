import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest
) {
  const body = await request.text();

  const signature =
    request.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return NextResponse.json(
      {
        error:
          "Missing Stripe signature",
      },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
  } catch (error) {
    console.error(
      "Stripe webhook signature error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Invalid Stripe webhook signature",
      },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const listingId =
          session.metadata?.listing_id;

        const promotionDays =
          Number(
            session.metadata
              ?.promotion_days || "7"
          );

        if (!listingId) {
          console.error(
            "Missing listing_id in Stripe metadata."
          );

          break;
        }

        const promotedUntil =
          new Date(
            Date.now() +
              promotionDays *
                24 *
                60 *
                60 *
                1000
          ).toISOString();

        const {
          error,
        } = await supabase
          .from("listings")
          .update({
            promoted: true,
            promoted_until:
              promotedUntil,
          })
          .eq(
            "id",
            listingId
          );

        if (error) {
          console.error(
            "Could not promote listing:",
            error
          );

          return NextResponse.json(
            {
              error:
                "Could not update listing",
            },
            { status: 500 }
          );
        }

        console.log(
          `Listing ${listingId} promoted until ${promotedUntil}`
        );

        break;
      }

      case "checkout.session.expired": {
        console.log(
          "Stripe checkout session expired."
        );

        break;
      }

      default: {
        console.log(
          `Unhandled Stripe event: ${event.type}`
        );
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}