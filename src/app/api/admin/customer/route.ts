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
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Normalize: trim and lowercase, same as how it was stored at signup
  const normalized = phone.trim().toLowerCase();

  console.log("Admin searching for:", normalized);

  const user = await prisma.user.findUnique({
    where: { phoneNumber: normalized },
    include: {
      loyaltyAccount: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!user) {
    // Also try a fuzzy search in case of mismatch
    const allUsers = await prisma.user.findMany({
      where: {
        phoneNumber: { contains: normalized.split("@")[0] }
      },
      include: { loyaltyAccount: true, transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
      take: 1,
    });

    console.log("Fuzzy search results:", allUsers.map(u => u.phoneNumber));

    if (allUsers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const found = allUsers[0];
    return NextResponse.json({
      user: found,
      stampsPerReward: STAMPS_PER_REWARD,
      rewardsAvailable: Math.floor((found.loyaltyAccount?.currentStamps ?? 0) / STAMPS_PER_REWARD),
    });
  }

  return NextResponse.json({
    user,
    stampsPerReward: STAMPS_PER_REWARD,
    rewardsAvailable: Math.floor((user.loyaltyAccount?.currentStamps ?? 0) / STAMPS_PER_REWARD),
  });
}
