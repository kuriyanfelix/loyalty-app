// src/app/api/redeem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest, STAMPS_PER_REWARD } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phoneNumber } = await req.json();
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

  if (user.loyaltyAccount.currentStamps < STAMPS_PER_REWARD) {
    return NextResponse.json(
      { error: `Need ${STAMPS_PER_REWARD} stamps to redeem. Currently: ${user.loyaltyAccount.currentStamps}` },
      { status: 400 }
    );
  }

  const newStamps = user.loyaltyAccount.currentStamps - STAMPS_PER_REWARD;

  const [account] = await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { userId: user.id },
      data: { currentStamps: newStamps },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: "REDEEM", amount: STAMPS_PER_REWARD },
    }),
  ]);

  return NextResponse.json({
    success: true,
    currentStamps: account.currentStamps,
    rewardsAvailable: Math.floor(account.currentStamps / STAMPS_PER_REWARD),
    message: "Reward redeemed successfully!",
  });
}
