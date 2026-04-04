// src/app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || !/^\+?[\d\s\-()]{7,15}$/.test(phoneNumber)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const normalized = phoneNumber.replace(/[\s\-()]/g, "");

    // Upsert user
    const user = await prisma.user.upsert({
      where: { phoneNumber: normalized },
      update: {},
      create: {
        phoneNumber: normalized,
        loyaltyAccount: { create: { currentStamps: 0, totalStampsEarned: 0 } },
      },
    });

    // Invalidate old OTPs
    await prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.otpCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    // MVP: log OTP to console instead of sending SMS
    console.log(`\n🔐 OTP for ${normalized}: ${code}\n`);

    return NextResponse.json({
      success: true,
      message: "OTP sent (check server console for MVP)",
      // Remove in production — only for dev convenience:
      ...(process.env.NODE_ENV !== "production" && { devOtp: code }),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
