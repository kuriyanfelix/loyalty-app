// src/app/api/checkin/generate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function generateCode(): string {
  // 4 uppercase letters/numbers, easy to read (no 0/O/1/I confusion)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Invalidate any existing unused codes for this user
  await prisma.checkInCode.updateMany({
    where: { userId: session.userId, used: false },
    data: { used: true },
  });

  // Generate a unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.checkInCode.findUnique({ where: { code } });
    if (!existing || existing.used) break;
    code = generateCode();
    attempts++;
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.checkInCode.create({
    data: { userId: session.userId, code, expiresAt },
  });

  return NextResponse.json({ code, expiresAt });
}
