import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all seeded data...");

  await prisma.userDevice.deleteMany({});
  await prisma.userCompany.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✔ All data cleared");
}

main().finally(() => prisma.$disconnect());
