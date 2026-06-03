"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { signOut } from "next-auth/react";
import Decimal from "decimal.js";
import { createOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatPrice,
  getUnitsForDimension,
  getBaseUnitLabel,
  displayToBase,
  calculateLinePrice,
} from "@/lib/conversions";

type SerializedProduct = {
  id: string;
  name: string;
  dimensionType: string;
  pricePerBaseUnit: string;
  stockBaseQuantity: string;
  createdAt: string;
};

type CartItem = {
  product: SerializedProduct;
  quantity: string;
  unit: string;
};

type SerializedOrderItem = {
  id: string;
  requestedDisplayQuantity: string | number;
  requestedDisplayUnit: string;
  convertedBaseQuantity: string;
  lineItemPrice: string;
  product: { name: string; dimensionType: string };
};

type SerializedOrder = {
  id: string;
  status: string;
  totalPrice: string;
  createdAt: string;
  items: SerializedOrderItem[];
};

interface SellerContentProps {
  products: SerializedProduct[];
  orders: SerializedOrder[];
  user: { name: string; email: string; role: string };
  initialQuery: string;
}

// ─── Live Price Calculator (client-side, decimal.js) ─────
function calcItemPrice(
  quantity: string,
  unit: string,
  pricePerBaseUnit: string
): { baseQty: string; price: string; error: string | null } {
  try {
    if (!quantity || new Decimal(quantity).lte(0)) {
      return { baseQty: "0", price: "₹0.00", error: null };
    }
    const baseQty = displayToBase(quantity, unit);
    const price = calculateLinePrice(baseQty, BigInt(pricePerBaseUnit));
    return {
      baseQty: baseQty.toString(),
      price: formatPrice(price),
      error: null,
    };
  } catch (err) {
    return { baseQty: "0", price: "₹0.00", error: "Invalid quantity" };
  }
}

export function SellerContent({
  products,
  orders,
  user,
  initialQuery,
}: SellerContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Search state
  const [searchValue, setSearchValue] = useState(initialQuery);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");

  // Debounced search — pushes to URL query param
  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    router.push(`${pathname}?${params.toString()}`);
  }, 400);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  }

  // Add to cart
  function addToCart(product: SerializedProduct) {
    if (cart.find((item) => item.product.id === product.id)) return;
    const defaultUnit =
      getUnitsForDimension(
        product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT"
      )[0];
    setCart([...cart, { product, quantity: "", unit: defaultUnit }]);
  }

  // Update cart item
  function updateCartItem(
    productId: string,
    field: "quantity" | "unit",
    value: string
  ) {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, [field]: value } : item
      )
    );
  }

  // Remove from cart
  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.product.id !== productId));
  }

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => {
    try {
      if (!item.quantity || new Decimal(item.quantity).lte(0)) return sum;
      const baseQty = displayToBase(item.quantity, item.unit);
      const price = calculateLinePrice(
        baseQty,
        BigInt(item.product.pricePerBaseUnit)
      );
      return sum + price;
    } catch {
      return sum;
    }
  }, BigInt(0));

  // Place order
  async function handlePlaceOrder() {
    setOrderLoading(true);
    setOrderMessage("");

    const items = cart
      .filter((item) => item.quantity && new Decimal(item.quantity).gt(0))
      .map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unit: item.unit,
      }));

    if (items.length === 0) {
      setOrderMessage("Please add quantities to your items");
      setOrderLoading(false);
      return;
    }

    const result = await createOrder(items);

    if (result.error) {
      setOrderMessage(
        typeof result.error === "string" ? result.error : "Order failed"
      );
    } else {
      setOrderMessage("Order placed successfully!");
      setCart([]);
      router.refresh();
    }

    setOrderLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Seller Dashboard</h1>
              <p className="text-xs text-slate-400">{user.name} · {user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="order" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="order" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              New Order
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              My Orders ({orders.length})
            </TabsTrigger>
          </TabsList>

          {/* ─── New Order Tab ─── */}
          <TabsContent value="order" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Product Search — left panel */}
              <div className="space-y-4 lg:col-span-3">
                <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white">Search Products</CardTitle>
                    <CardDescription className="text-slate-400">
                      Search filters products on the server using indexed name lookup
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <Input
                        id="product-search"
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="Type to search products..."
                        className="pl-10 border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500"
                      />
                    </div>

                    {products.length === 0 ? (
                      <p className="py-8 text-center text-slate-500">
                        No products found
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {products.map((product) => {
                          const inCart = cart.some(
                            (item) => item.product.id === product.id
                          );
                          const baseLabel = getBaseUnitLabel(
                            product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT"
                          );

                          return (
                            <div
                              key={product.id}
                              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-3 transition-colors hover:border-slate-700"
                            >
                              <div>
                                <p className="font-medium text-white">
                                  {product.name}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                                    {product.dimensionType}
                                  </Badge>
                                  <span className="text-xs text-slate-500">
                                    {formatPrice(BigInt(product.pricePerBaseUnit))}/{baseLabel}
                                  </span>
                                  <span className="text-xs text-emerald-500">
                                    Stock: {BigInt(product.stockBaseQuantity).toLocaleString()} {baseLabel}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                disabled={inCart}
                                onClick={() => addToCart(product)}
                                className={
                                  inCart
                                    ? "bg-slate-700 text-slate-400"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                }
                              >
                                {inCart ? "Added" : "Add"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cart — right panel */}
              <div className="space-y-4 lg:col-span-2">
                <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white">
                      Order Cart ({cart.length} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cart.length === 0 ? (
                      <p className="py-8 text-center text-slate-500">
                        Add products from the search panel
                      </p>
                    ) : (
                      <>
                        {cart.map((item) => {
                          const units = getUnitsForDimension(
                            item.product.dimensionType as
                              | "WEIGHT"
                              | "VOLUME"
                              | "COUNT"
                          );
                          const calc = calcItemPrice(
                            item.quantity,
                            item.unit,
                            item.product.pricePerBaseUnit
                          );
                          const baseLabel = getBaseUnitLabel(
                            item.product.dimensionType as
                              | "WEIGHT"
                              | "VOLUME"
                              | "COUNT"
                          );

                          return (
                            <div
                              key={item.product.id}
                              className="rounded-lg border border-slate-800 bg-slate-800/30 p-3 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-white text-sm">
                                  {item.product.name}
                                </p>
                                <button
                                  onClick={() =>
                                    removeFromCart(item.product.id)
                                  }
                                  className="text-slate-500 hover:text-red-400 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label className="text-xs text-slate-400">
                                    Quantity
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.000001"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateCartItem(
                                        item.product.id,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    placeholder="0.000000"
                                    className="h-8 border-slate-700 bg-slate-800/50 text-white text-sm placeholder:text-slate-600"
                                  />
                                </div>
                                <div className="w-24">
                                  <Label className="text-xs text-slate-400">
                                    Unit
                                  </Label>
                                  <Select
                                    value={item.unit}
                                    onValueChange={(v) =>
                                      updateCartItem(
                                        item.product.id,
                                        "unit",
                                        v as string
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 border-slate-700 bg-slate-800/50 text-white text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-700 bg-slate-800">
                                      {units.map((u) => (
                                        <SelectItem key={u} value={u}>
                                          {u}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Live calculation display */}
                              {item.quantity && (
                                <div className="flex items-center justify-between rounded-md bg-slate-900/50 p-2">
                                  <span className="text-xs text-slate-400">
                                    = {BigInt(calc.baseQty).toLocaleString()}{" "}
                                    {baseLabel}
                                  </span>
                                  <span className="text-sm font-semibold text-emerald-400">
                                    {calc.price}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Order Total & Submit */}
                        <div className="border-t border-slate-700 pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-300">
                              Total
                            </span>
                            <span className="text-xl font-bold text-white">
                              {formatPrice(cartTotal)}
                            </span>
                          </div>
                          <Button
                            onClick={handlePlaceOrder}
                            disabled={orderLoading || cart.length === 0}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                          >
                            {orderLoading ? "Placing Order..." : "Place Order"}
                          </Button>
                          {orderMessage && (
                            <p
                              className={`text-center text-sm ${
                                orderMessage.includes("success")
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {orderMessage}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ─── Order History Tab ─── */}
          <TabsContent value="history" className="space-y-4">
            {orders.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/60">
                <CardContent className="py-12 text-center text-slate-400">
                  You haven&apos;t placed any orders yet
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base text-white">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          {order.status}
                        </Badge>
                        <p className="mt-1 text-lg font-bold text-white">
                          {formatPrice(BigInt(order.totalPrice))}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableHead className="text-slate-400">Product</TableHead>
                          <TableHead className="text-slate-400">Quantity</TableHead>
                          <TableHead className="text-right text-slate-400">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id} className="border-slate-800/50 hover:bg-slate-800/20">
                            <TableCell className="text-white">{item.product.name}</TableCell>
                            <TableCell className="font-mono text-sm text-indigo-400">
                              {Number(item.requestedDisplayQuantity).toFixed(6)}{" "}
                              {item.requestedDisplayUnit}
                            </TableCell>
                            <TableCell className="text-right font-medium text-white">
                              {formatPrice(BigInt(item.lineItemPrice))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
