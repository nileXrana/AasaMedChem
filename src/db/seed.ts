import dotenv from "dotenv";
import path from "node:path";
// Load .env.local before anything else
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

import bcrypt from "bcryptjs";

async function seed() {
  const { prisma } = await import("../lib/prisma");
  console.log("🌱 Seeding database...\n");

  // ─── Users ───────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const sellerPassword = await bcrypt.hash("seller123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@aasa.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: "seller@aasa.com",
      password: sellerPassword,
      name: "Seller User",
      role: "SELLER",
    },
  });

  console.log("✅ Users created:");
  console.log(`   Admin:  ${admin.email} (password: admin123)`);
  console.log(`   Seller: ${seller.email} (password: seller123)\n`);

  // ─── Products ────────────────────────────────────────
  // All prices are in paise per base unit (mg/mL/unit)
  // All stock is in base units (mg/mL/units)
  const productData = [
    {
      name: "Paracetamol Powder",
      dimensionType: "WEIGHT" as const,
      pricePerBaseUnit: BigInt(2),         // ₹0.02 per mg = ₹20,000 per kg
      stockBaseQuantity: BigInt(50000000), // 50 kg in mg
    },
    {
      name: "Ibuprofen Granules",
      dimensionType: "WEIGHT" as const,
      pricePerBaseUnit: BigInt(3),
      stockBaseQuantity: BigInt(25000000), // 25 kg
    },
    {
      name: "Amoxicillin Trihydrate",
      dimensionType: "WEIGHT" as const,
      pricePerBaseUnit: BigInt(5),
      stockBaseQuantity: BigInt(10000000), // 10 kg
    },
    {
      name: "Cetrizine Dihydrochloride",
      dimensionType: "WEIGHT" as const,
      pricePerBaseUnit: BigInt(8),
      stockBaseQuantity: BigInt(5000000),  // 5 kg
    },
    {
      name: "Metformin HCL",
      dimensionType: "WEIGHT" as const,
      pricePerBaseUnit: BigInt(1),
      stockBaseQuantity: BigInt(100000000), // 100 kg
    },
    {
      name: "Ethanol Solution 95%",
      dimensionType: "VOLUME" as const,
      pricePerBaseUnit: BigInt(15),        // ₹0.15 per mL = ₹150 per L
      stockBaseQuantity: BigInt(500000),   // 500 L
    },
    {
      name: "Purified Water IP",
      dimensionType: "VOLUME" as const,
      pricePerBaseUnit: BigInt(1),
      stockBaseQuantity: BigInt(1000000),  // 1000 L
    },
    {
      name: "Glycerin BP",
      dimensionType: "VOLUME" as const,
      pricePerBaseUnit: BigInt(25),
      stockBaseQuantity: BigInt(200000),   // 200 L
    },
    {
      name: "Empty Capsules Size 0",
      dimensionType: "COUNT" as const,
      pricePerBaseUnit: BigInt(50),        // ₹0.50 per capsule
      stockBaseQuantity: BigInt(500000),   // 500,000 units
    },
    {
      name: "Blister Pack Foils",
      dimensionType: "COUNT" as const,
      pricePerBaseUnit: BigInt(200),       // ₹2.00 per foil
      stockBaseQuantity: BigInt(100000),   // 100,000 units
    },
  ];

  for (const product of productData) {
    await prisma.product.create({ data: product });
  }

  console.log("✅ Products created:");
  for (const p of productData) {
    console.log(`   ${p.name} (${p.dimensionType})`);
  }

  console.log("\n🎉 Seed complete!");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    // Process exits, disconnecting Prisma anyway
    process.exit(0);
  });
