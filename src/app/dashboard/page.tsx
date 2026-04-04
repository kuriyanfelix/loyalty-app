// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession, STAMPS_PER_REWARD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      loyaltyAccount: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!user) redirect("/login");

  const currentStamps = user.loyaltyAccount?.currentStamps ?? 0;
  const rewardsAvailable = Math.floor(currentStamps / STAMPS_PER_REWARD);

  return (
    <DashboardClient
      phone={user.phoneNumber}
      name={user.name}
      currentStamps={currentStamps}
      totalStampsEarned={user.loyaltyAccount?.totalStampsEarned ?? 0}
      stampsPerReward={STAMPS_PER_REWARD}
      rewardsAvailable={rewardsAvailable}
      transactions={user.transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}
