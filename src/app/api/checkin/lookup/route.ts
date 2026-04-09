// src/app/api/checkin/lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest, STAMPS_PER_REWARD } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const checkIn = await prisma.checkInCode.findUnique({
    where: { code },
    include: {
      user: {
        include: {
          loyaltyAccount: true,
          transactions: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      },
    },
  });

  if (!checkIn) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }

  if (checkIn.used) {
    return NextResponse.json({ error: "Code already used" }, { status: 400 });
  }

  if (new Date() > checkIn.expiresAt) {
    return NextResponse.json({ error: "Code expired — ask customer to generate a new one" }, { status: 400 });
  }

  // Mark code as used
  await prisma.checkInCode.update({
    where: { code },
    data: { used: true },
  });

  const user = checkIn.user;

  return NextResponse.json({
    user,
    stampsPerReward: STAMPS_PER_REWARD,
    rewardsAvailable: Math.floor((user.loyaltyAccount?.currentStamps ?? 0) / STAMPS_PER_REWARD),
  });
}
