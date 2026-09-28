import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY is missing from .env.local",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and email are required.",
        },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: "Sellio <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Sellio!",
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 40px auto;
          padding: 40px;
          background: #ffffff;
          color: #111111;
          border-radius: 16px;
        ">

          <h1 style="font-size: 32px; margin-bottom: 25px;">
            Sellio
          </h1>

          <h2>
            Welcome, ${name}!
          </h2>

          <p style="font-size: 16px; line-height: 1.6; color: #555555;">
            Your Sellio account has been created successfully.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #555555;">
            You can now buy, sell and discover great deals on Sellio.
          </p>

          <a
            href="http://localhost:3000"
            style="
              display: inline-block;
              margin-top: 20px;
              padding: 14px 24px;
              background: #111111;
              color: #ffffff;
              text-decoration: none;
              border-radius: 10px;
              font-weight: bold;
            "
          >
            Go to Sellio
          </a>

          <p style="
            margin-top: 35px;
            font-size: 12px;
            color: #999999;
          ">
            This email was sent because a Sellio account was created
            using this email address.
          </p>

        </div>
      `,
    });

    if (result.error) {
      console.error("RESEND ERROR:", result.error);

      return NextResponse.json(
        {
          success: false,
          error: result.error.message || "Resend rejected the email.",
          details: result.error,
        },
        { status: 500 }
      );
    }

    console.log("WELCOME EMAIL SENT:", result.data);

    return NextResponse.json({
      success: true,
      message: "Welcome email sent successfully.",
      id: result.data?.id,
    });
  } catch (error) {
    console.error("SEND WELCOME ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown email error.",
      },
      { status: 500 }
    );
  }
}