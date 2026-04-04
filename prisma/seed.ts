// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a test customer
  const user = await prisma.user.upsert({
    where: { phoneNumber: "+15550001234" },
    update: {},
    create: {
      phoneNumber: "+15550001234",
      name: "Test Customer",
      loyaltyAccount: {
        create: {
          currentStamps: 7,
          totalStampsEarned: 17,
        },
      },
      transactions: {
        create: [
          { type: "ADD_STAMP", amount: 1 },
          { type: "ADD_STAMP", amount: 1 },
          { type: "ADD_STAMP", amount: 1 },
          { type: "REDEEM", amount: 10 },
          { type: "ADD_STAMP", amount: 1 },
          { type: "ADD_STAMP", amount: 1 },
          { type: "ADD_STAMP", amount: 1 },
          { type: "ADD_STAMP", amount: 1 },
          { type: "ADD_STAMP", amount: 1 },
          { type: "ADD_STAMP", amount: 1 },
          { type: "ADD_STAMP", amount: 1 },
        ],
      },
    },
  });

  console.log(`✓ Created test user: ${user.phoneNumber}`);
  console.log("Seeding complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
