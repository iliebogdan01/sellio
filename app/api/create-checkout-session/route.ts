import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const secretKey = process.env.STRIPE_SECRET_KEY;

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Stripe Checkout API funcționează.",
  });
}

export async function POST(req: Request) {
  try {
    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "STRIPE_SECRET_KEY nu este configurat în .env.local",
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);

    const body = await req.json();

    console.log("CHECKOUT BODY:", body);

    const {
      title,
      price,
      listingId,
      days,
    } = body;

    if (!title) {
      return NextResponse.json(
        {
          error: "Lipsește titlul anunțului.",
        },
        { status: 400 }
      );
    }

    if (
      price === undefined ||
      price === null
    ) {
      return NextResponse.json(
        {
          error: "Lipsește prețul.",
        },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      return NextResponse.json(
        {
          error: `Preț invalid: ${price}`,
        },
        { status: 400 }
      );
    }

    const numericDays = Number(days);

    if (
      !Number.isFinite(numericDays) ||
      numericDays <= 0
    ) {
      return NextResponse.json(
        {
          error: "Numărul de zile este invalid.",
        },
        { status: 400 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    console.log(
      "Creating Stripe checkout..."
    );

    console.log(
      "Price:",
      numericPrice
    );

    console.log(
      "Days:",
      numericDays
    );

    console.log(
      "Listing:",
      listingId
    );

    console.log(
      "Site URL:",
      siteUrl
    );

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        line_items: [
          {
            price_data: {
              currency: "gbp",

              product_data: {
                name: String(title),

                description:
                  `Sellio listing promotion - ${numericDays} day${
                    numericDays === 1
                      ? ""
                      : "s"
                  }`,
              },

              unit_amount:
                Math.round(
                  numericPrice * 100
                ),
            },

            quantity: 1,
          },
        ],

        metadata: {
          listingId:
            listingId !== undefined &&
            listingId !== null
              ? String(listingId)
              : "",

          days: String(
            numericDays
          ),
        },

        success_url:
          `${siteUrl}/success` +
          `?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${siteUrl}/cancel`,

      });

    console.log(
      "Stripe session created:",
      session.id
    );

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error(
      "STRIPE CHECKOUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Eroare necunoscută la Stripe.",
      },
      { status: 500 }
    );
  }
}