// src/app/api/admin/customer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest, STAMPS_PER_REWARD } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Phone required" }, { status: 400 });
  }

  const normalized = phone.replace(/[\s\-()]/g, "");

  const user = await prisma.user.findUnique({
    where: { phoneNumber: normalized },
    include: {
      loyaltyAccount: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({
    user,
    stampsPerReward: STAMPS_PER_REWARD,
    rewardsAvailable: Math.floor((user.loyaltyAccount?.currentStamps ?? 0) / STAMPS_PER_REWARD),
  });
}
