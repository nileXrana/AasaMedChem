"use server";

import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { z } from "zod";

// ─── Zod Schemas ─────────────────────────────────────────

const addProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  dimensionType: z.enum(["WEIGHT", "VOLUME", "COUNT"]),
  pricePerBaseUnit: z.string().min(1, "Price is required"),
  stockBaseQuantity: z.string().min(1, "Stock is required"),
});

// ─── Get All Products ────────────────────────────────────

export async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return serialize(products);
}

// ─── Search Products (ilike on indexed name) ─────────────

export async function searchProducts(query: string) {
  if (!query || query.trim().length === 0) {
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });
    return serialize(products);
  }

  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: query.trim(),
        mode: "insensitive",
      },
    },
    orderBy: { name: "asc" },
  });

  return serialize(products);
}

// ─── Add Product ─────────────────────────────────────────

export async function addProduct(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    dimensionType: formData.get("dimensionType") as string,
    pricePerBaseUnit: formData.get("pricePerBaseUnit") as string,
    stockBaseQuantity: formData.get("stockBaseQuantity") as string,
  };

  const parsed = addProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, dimensionType, pricePerBaseUnit, stockBaseQuantity } =
    parsed.data;

  await prisma.product.create({
    data: {
      name,
      dimensionType: dimensionType as "WEIGHT" | "VOLUME" | "COUNT",
      pricePerBaseUnit: BigInt(pricePerBaseUnit),
      stockBaseQuantity: BigInt(stockBaseQuantity),
    },
  });

  return { success: true };
}
