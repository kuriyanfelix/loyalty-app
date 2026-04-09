// src/app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/auth";

async function sendEmail(to: string, code: string) {
  const user = process.env.GMAIL_USER;
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  console.log("Gmail env check:", {
    user: !!user,
    clientId: !!clientId,
    clientSecret: !!clientSecret,
    refreshToken: !!refreshToken,
    refreshTokenPrefix: refreshToken?.slice(0, 6),
  });

  if (!user || !clientId || !clientSecret || !refreshToken) {
    console.log("Mock mode — OTP:", code);
    return;
  }

  // Step 1: Get access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenRes.json();
  console.log("Token response:", JSON.stringify(tokenData));

  if (!tokenData.access_token) {
    throw new Error("Failed to get access token: " + JSON.stringify(tokenData));
  }

  const access_token = tokenData.access_token;

  // Step 2: Build email
  const message = [
    `From: Crumb & Co <${user}>`,
    `To: ${to}`,
    `Subject: Your Crumb & Co login code`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    `<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background: #fdfaf5; padding: 40px 20px; margin: 0;">
  <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #f2e4cc;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 32px; margin-bottom: 8px;">🥐</div>
      <h1 style="font-family: Georgia, serif; color: #2c1608; margin: 0; font-size: 24px;">Crumb & Co</h1>
      <p style="color: #c8763a; margin: 4px 0 0; font-size: 13px;">Loyalty Rewards</p>
    </div>
    <p style="color: #2c1608; font-size: 14px; margin-bottom: 8px;">Your login code is:</p>
    <div style="background: #f9f2e7; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 36px; font-weight: bold; color: #2c1608; letter-spacing: 8px;">${code}</span>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
      Valid for 10 minutes. If you didn't request this, you can ignore this email.
    </p>
  </div>
</body>
</html>`,
  ].join("\r\n");

  const encoded = Buffer.from(message).toString("base64url");

  // Step 3: Send email
  const sendRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded }),
    }
  );

  const sendData = await sendRes.json();
  console.log("Gmail send response:", JSON.stringify(sendData));

  if (!sendRes.ok) {
    throw new Error("Gmail send failed: " + JSON.stringify(sendData));
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || !/^\+?[\d\s\-()@.a-zA-Z]{5,100}$/.test(phoneNumber)) {
      return NextResponse.json({ error: "Invalid contact" }, { status: 400 });
    }

    const normalized = phoneNumber.trim().toLowerCase();

    const user = await prisma.user.upsert({
      where: { phoneNumber: normalized },
      update: {},
      create: {
        phoneNumber: normalized,
        loyaltyAccount: { create: { currentStamps: 0, totalStampsEarned: 0 } },
      },
    });

    await prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    await sendEmail(normalized, code);

    return NextResponse.json({
      success: true,
      message: "Code sent to your email",
      ...(!process.env.GMAIL_CLIENT_ID &&
        process.env.NODE_ENV !== "production" && { devOtp: code }),
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
