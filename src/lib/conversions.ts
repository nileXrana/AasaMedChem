import Decimal from "decimal.js";

// ─── Conversion Factors ──────────────────────────────────
// Maps display unit → multiplier to reach base unit.
// WEIGHT base = milligrams (mg)
// VOLUME base = milliliters (mL)
// COUNT  base = units

const CONVERSION_FACTORS: Record<string, Decimal> = {
  // Weight
  kg: new Decimal("1000000"), // 1 kg = 1,000,000 mg
  g: new Decimal("1000"),     // 1 g  = 1,000 mg
  mg: new Decimal("1"),       // 1 mg = 1 mg

  // Volume
  l: new Decimal("1000"),     // 1 L  = 1,000 mL
  ml: new Decimal("1"),       // 1 mL = 1 mL

  // Count
  unit: new Decimal("1"),     // 1 unit = 1 unit
  units: new Decimal("1"),
};

// ─── Display → Base ──────────────────────────────────────
// Converts a user-entered display value to the base unit integer.
// e.g., displayToBase("1.123456", "kg") → 1123456n
export function displayToBase(
  value: number | string,
  unit: string
): bigint {
  const unitLower = unit.toLowerCase();
  const factor = CONVERSION_FACTORS[unitLower];
  if (!factor) {
    throw new Error(`Unknown unit: ${unit}`);
  }

  const result = new Decimal(value).mul(factor).toFixed(0);
  return BigInt(result);
}

// ─── Base → Display ──────────────────────────────────────
// Converts a base unit integer back to a display string.
// e.g., baseToDisplay(1123456n, "kg") → "1.123456"
export function baseToDisplay(
  value: bigint,
  unit: string
): string {
  const unitLower = unit.toLowerCase();
  const factor = CONVERSION_FACTORS[unitLower];
  if (!factor) {
    throw new Error(`Unknown unit: ${unit}`);
  }

  return new Decimal(value.toString()).div(factor).toFixed(6);
}

// ─── Price Calculation ───────────────────────────────────
// Calculates line item price: baseQuantity × pricePerBaseUnit
// Both are bigints (base units and paise), result is paise.
export function calculateLinePrice(
  baseQuantity: bigint,
  pricePerBaseUnit: bigint
): bigint {
  const result = new Decimal(baseQuantity.toString())
    .mul(new Decimal(pricePerBaseUnit.toString()))
    .toFixed(0);
  return BigInt(result);
}

// ─── Format Price ────────────────────────────────────────
// Converts paise (bigint) to a human-readable INR string.
// e.g., formatPrice(1234567n) → "₹12,345.67"
export function formatPrice(paise: bigint): string {
  const rupees = new Decimal(paise.toString()).div(100).toFixed(2);
  const [whole, decimal] = rupees.split(".");

  // Indian number formatting (lakhs/crores)
  const lastThree = whole.slice(-3);
  const otherDigits = whole.slice(0, -3);
  const formatted =
    otherDigits.length > 0
      ? otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree;

  return `₹${formatted}.${decimal}`;
}

// ─── Available Units ─────────────────────────────────────
// Returns the valid display units for a given dimension type.
export function getUnitsForDimension(
  dimensionType: "WEIGHT" | "VOLUME" | "COUNT"
): string[] {
  switch (dimensionType) {
    case "WEIGHT":
      return ["kg", "g", "mg"];
    case "VOLUME":
      return ["L", "mL"];
    case "COUNT":
      return ["units"];
  }
}

// ─── Get Base Unit Label ─────────────────────────────────
export function getBaseUnitLabel(
  dimensionType: "WEIGHT" | "VOLUME" | "COUNT"
): string {
  switch (dimensionType) {
    case "WEIGHT":
      return "mg";
    case "VOLUME":
      return "mL";
    case "COUNT":
      return "units";
  }
}
