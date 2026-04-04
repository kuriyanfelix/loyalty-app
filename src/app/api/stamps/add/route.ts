// src/app/api/stamps/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest, STAMPS_PER_REWARD } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phoneNumber, amount = 1 } = await req.json();
  if (!phoneNumber) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  const normalized = phoneNumber.replace(/[\s\-()]/g, "");

  const user = await prisma.user.findUnique({
    where: { phoneNumber: normalized },
    include: { loyaltyAccount: true },
  });

  if (!user || !user.loyaltyAccount) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newStamps = user.loyaltyAccount.currentStamps + amount;

  const [account] = await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { userId: user.id },
      data: {
        currentStamps: newStamps,
        totalStampsEarned: { increment: amount },
      },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: "ADD_STAMP", amount },
    }),
  ]);

  return NextResponse.json({
    success: true,
    currentStamps: account.currentStamps,
    totalStampsEarned: account.totalStampsEarned,
    stampsPerReward: STAMPS_PER_REWARD,
    rewardsAvailable: Math.floor(account.currentStamps / STAMPS_PER_REWARD),
  });
}
