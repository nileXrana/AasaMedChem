// ─── BigInt Serialization Helper ─────────────────────────
// Next.js cannot serialize native BigInt across the server→client
// boundary. This utility converts all BigInt values in a Prisma
// result to strings before passing to Client Components.
//
// Usage:
//   const product = await prisma.product.findFirst();
//   return serialize(product);  // BigInt fields become strings

type Serialized<T> = T extends BigInt
  ? string
  : T extends Date
    ? string
    : T extends { d: number[]; e: number; s: number }
      ? string
      : T extends Array<infer U>
        ? Serialized<U>[]
        : T extends object
          ? { [K in keyof T]: Serialized<T[K]> }
          : T;

export function serialize<T>(data: T): Serialized<T> {
  if (data === null || data === undefined) {
    return data as Serialized<T>;
  }

  if (typeof data === "bigint") {
    return data.toString() as Serialized<T>;
  }

  if (data instanceof Date) {
    return data.toISOString() as Serialized<T>;
  }

  if (
    data !== null &&
    typeof data === "object" &&
    "toNumber" in data &&
    typeof (data as any).toNumber === "function" &&
    "toString" in data &&
    typeof (data as any).toString === "function"
  ) {
    return (data as any).toString() as Serialized<T>;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serialize(item)) as Serialized<T>;
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serialize(value);
    }
    return result as Serialized<T>;
  }

  return data as Serialized<T>;
}
