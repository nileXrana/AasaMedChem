"use server";

import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { auth } from "@/lib/auth";
import { displayToBase, calculateLinePrice } from "@/lib/conversions";
import Decimal from "decimal.js";
import { z } from "zod";

// ─── Zod Schemas ─────────────────────────────────────────

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z
    .string()
    .refine(
      (val) => {
        try {
          const d = new Decimal(val);
          // Must be positive, max 6 decimal places
          return d.gt(0) && d.decimalPlaces() <= 6;
        } catch {
          return false;
        }
      },
      { message: "Quantity must be positive with max 6 decimal places" }
    ),
  unit: z.string().min(1, "Unit is required"),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

// ─── Create Order (Transactional) ────────────────────────

export async function createOrder(
  items: { productId: string; quantity: string; unit: string }[]
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const parsed = createOrderSchema.safeParse({ items });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let totalPrice = BigInt(0);
      const orderItemsData: {
        productId: string;
        requestedDisplayQuantity: number;
        requestedDisplayUnit: string;
        convertedBaseQuantity: bigint;
        lineItemPrice: bigint;
      }[] = [];

      for (const item of parsed.data.items) {
        // Fetch product with current stock
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        // Convert display quantity to base unit
        const baseQuantity = displayToBase(item.quantity, item.unit);

        // Check stock
        if (product.stockBaseQuantity < baseQuantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stockBaseQuantity}, Requested: ${baseQuantity}`
          );
        }

        // Calculate line price
        const linePrice = calculateLinePrice(
          baseQuantity,
          product.pricePerBaseUnit
        );

        // Deduct stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockBaseQuantity: product.stockBaseQuantity - baseQuantity,
          },
        });

        totalPrice = totalPrice + linePrice;

        orderItemsData.push({
          productId: item.productId,
          requestedDisplayQuantity: parseFloat(item.quantity),
          requestedDisplayUnit: item.unit,
          convertedBaseQuantity: baseQuantity,
          lineItemPrice: linePrice,
        });
      }

      // Create order with items
      const order = await tx.order.create({
        data: {
          sellerId: session.user.id,
          status: "CONFIRMED",
          totalPrice,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      return order;
    });

    return { success: true, order: serialize(result) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order creation failed";
    return { error: message };
  }
}

// ─── Get Orders ──────────────────────────────────────────

export async function getOrders() {
  const orders = await prisma.order.findMany({
    include: {
      seller: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true, dimensionType: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return serialize(orders);
}

// ─── Get Seller Orders ───────────────────────────────────

export async function getSellerOrders() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const orders = await prisma.order.findMany({
    where: { sellerId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { name: true, dimensionType: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return serialize(orders);
}
