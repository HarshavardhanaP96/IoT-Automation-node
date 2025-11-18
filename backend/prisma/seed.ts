import { PrismaClient } from "../src/generated/prisma";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function loadJSON(filename: string) {
  const filePath = path.join(__dirname, "seed", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
  console.log("🌱 Starting seed...");

  const users = loadJSON("users.json");
  const companies = loadJSON("companies.json");
  const devices = loadJSON("devices.json");
  const userCompanies = loadJSON("userCompanies.json");
  const userDevices = loadJSON("userDevices.json");
  const sessions = loadJSON("sessions.json");

  // Order matters because of foreign keys

  console.log("➡ Inserting companies...");
  await prisma.company.createMany({ data: companies });

  console.log("➡ Inserting users...");
  await prisma.user.createMany({ data: users });

  console.log("➡ Inserting devices...");
  await prisma.device.createMany({ data: devices });

  console.log("➡ Mapping user ↔ company...");
  await prisma.userCompany.createMany({ data: userCompanies });

  console.log("➡ Mapping user ↔ device...");
  await prisma.userDevice.createMany({ data: userDevices });

  console.log("➡ Inserting sessions...");
  await prisma.session.createMany({ data: sessions });

  console.log("🌱 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
