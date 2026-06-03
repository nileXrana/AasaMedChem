"use client";

import { useState } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  formatPrice,
  getUnitsForDimension,
  getBaseUnitLabel,
  displayToBase,
  calculateLinePrice,
} from "@/lib/conversions";
import { Search, ShoppingCart, ShoppingBag, LogOut, Package2, X, Plus, Calculator, ArrowRight, LayoutGrid, List, Scale, FlaskConical, Box as BoxIcon } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

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
      setOrderMessage("Please add valid quantities to your items");
      setOrderLoading(false);
      return;
    }

    const result = await createOrder(items);

    if (result.error) {
      setOrderMessage(
        typeof result.error === "string" ? result.error : "Order failed due to insufficient stock or invalid quantity"
      );
    } else {
      setOrderMessage("Order placed successfully!");
      setCart([]);
      setTimeout(() => setIsCartOpen(false), 2000);
      router.refresh();
    }

    setOrderLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Package2 className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">Seller Portal</h1>
              <p className="text-xs font-medium text-gray-500">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart Slide-out Trigger */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger 
                render={
                  <Button variant="outline" className="relative h-10 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors px-3 sm:px-4" />
                }
              >
                <ShoppingCart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline font-medium">Cart</span>
                {cart.length > 0 && (
                  <>
                    <span className="ml-2 hidden sm:inline text-xs font-bold text-gray-500">
                      ({formatPrice(cartTotal)})
                    </span>
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                      {cart.length}
                    </span>
                  </>
                )}
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white border-l border-gray-200 p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-gray-100">
                  <SheetTitle className="text-xl flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5 text-blue-600" />
                    Order Cart
                  </SheetTitle>
                  <SheetDescription>
                    Review and edit the quantities before placing the order.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                      <ShoppingCart className="h-16 w-16 text-gray-200 mb-4" />
                      <p className="text-gray-500 text-base font-medium">Your cart is empty</p>
                      <p className="text-gray-400 text-sm mt-1">Add products from the catalog to begin.</p>
                      <Button variant="outline" className="mt-6" onClick={() => setIsCartOpen(false)}>
                        Browse Catalog
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {cart.map((item) => {
                        const units = getUnitsForDimension(
                          item.product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT"
                        );
                        const calc = calcItemPrice(
                          item.quantity,
                          item.unit,
                          item.product.pricePerBaseUnit
                        );
                        const baseLabel = getBaseUnitLabel(
                          item.product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT"
                        );

                        return (
                          <div key={item.product.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <p className="font-semibold text-gray-900 leading-tight pr-4 text-base">
                                {item.product.name}
                              </p>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                title="Remove item"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex gap-4 items-end mb-4">
                              <div className="flex-1">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
                                  Qty
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
                                  placeholder="0.0"
                                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono text-base"
                                />
                              </div>
                              <div className="w-28">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
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
                                  <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono text-base">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {units.map((u) => (
                                      <SelectItem key={u} value={u} className="font-mono text-sm">
                                        {u}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Live calculation display */}
                            {item.quantity && (
                              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 border border-blue-100">
                                <div className="flex items-center text-sm text-blue-700">
                                  <Calculator className="h-4 w-4 mr-2 opacity-70" />
                                  <span>
                                    {BigInt(calc.baseQty).toLocaleString()} {baseLabel}
                                  </span>
                                </div>
                                <span className="text-base font-bold text-gray-900">
                                  {calc.price}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-200 p-6">
                    <div className="flex items-end justify-between mb-6">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </span>
                      <span className="text-2xl font-bold text-gray-900 leading-none">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                    
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={orderLoading || cart.length === 0}
                      className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      {orderLoading ? (
                        "Processing..."
                      ) : (
                        <>
                          Place Order
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                    
                    {orderMessage && (
                      <div className={`mt-4 p-3 rounded-lg text-sm font-medium border ${
                        orderMessage.includes("success")
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}>
                        {orderMessage}
                      </div>
                    )}
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 hidden sm:flex"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 sm:hidden"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="order" className="space-y-8">
          <TabsList className="bg-white border border-gray-200 p-1 shadow-sm">
            <TabsTrigger value="order" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm px-4 py-2">
              <Package2 className="mr-2 h-4 w-4" />
              Product Catalog
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm px-4 py-2">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Order History
            </TabsTrigger>
          </TabsList>

          {/* ─── Product Catalog Tab ─── */}
          <TabsContent value="order" className="space-y-6">
            <div className="space-y-4">
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Search Products</CardTitle>
                  <CardDescription className="text-gray-500">
                    Search catalog to add items to your cart.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex gap-3 mb-8">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="product-search"
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="Search for products by name..."
                        className="pl-10 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 max-w-2xl"
                      />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 h-12">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`flex items-center justify-center px-3 rounded-md transition-colors ${
                          viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                        }`}
                        title="Grid View"
                      >
                        <LayoutGrid className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center justify-center px-3 rounded-md transition-colors ${
                          viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                        }`}
                        title="List View"
                      >
                        <List className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {products.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                      <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                      <p className="text-gray-500 mt-1">Try adjusting your search terms.</p>
                    </div>
                  ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4 max-w-4xl"}>
                      {products.map((product) => {
                        const inCart = cart.some(
                          (item) => item.product.id === product.id
                        );
                        const baseLabel = getBaseUnitLabel(
                          product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT"
                        );

                        const DimensionIcon = product.dimensionType === "WEIGHT" ? Scale : product.dimensionType === "VOLUME" ? FlaskConical : BoxIcon;

                        return (
                          <div
                            key={product.id}
                            className={`flex group rounded-2xl border transition-all duration-300 ${
                              viewMode === "grid" ? "flex-col p-8 h-full hover:-translate-y-1 hover:shadow-xl" : "items-center justify-between p-5"
                            } ${
                              inCart ? "border-blue-300 bg-blue-50/40 shadow-sm" : "border-gray-200 bg-white hover:border-blue-200 shadow-sm"
                            }`}
                          >
                            <div className={viewMode === "grid" ? "mb-8 flex-1" : ""}>
                              <div className="flex justify-between items-start mb-4">
                                <p className={`font-bold tracking-tight text-gray-900 leading-tight pr-4 ${viewMode === "grid" ? "text-2xl" : "text-base"}`}>
                                  {product.name}
                                </p>
                                {viewMode === "grid" && (
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                                    <DimensionIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div className={`flex flex-wrap items-center gap-4 ${viewMode === "grid" ? "" : "mt-2"}`}>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-semibold px-2.5 py-0.5 rounded-md text-xs uppercase tracking-wider">
                                  {viewMode === "list" && <DimensionIcon className="h-3 w-3 mr-1.5 inline-block" />}
                                  {product.dimensionType}
                                </Badge>
                                <div className={`flex items-baseline ${viewMode === "grid" ? "w-full mt-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100" : ""}`}>
                                  <div className={viewMode === "grid" ? "flex flex-col gap-1 w-1/2 border-r border-gray-200" : "flex items-center"}>
                                    {viewMode === "grid" && <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</span>}
                                    <span className={`font-bold text-gray-900 ${viewMode === "grid" ? "text-xl" : "text-sm"}`}>
                                      {formatPrice(BigInt(product.pricePerBaseUnit))}
                                      <span className="text-gray-500 font-medium text-sm ml-1">/{baseLabel}</span>
                                    </span>
                                  </div>
                                  <div className={viewMode === "grid" ? "flex flex-col gap-1 w-1/2 pl-4" : "flex items-center ml-4"}>
                                    {viewMode === "grid" && <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</span>}
                                    <span className={`text-sm text-gray-600 flex items-center font-medium ${viewMode === "grid" ? "text-base" : ""}`}>
                                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2 shadow-sm"></span>
                                      {BigInt(product.stockBaseQuantity).toLocaleString()} {baseLabel}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button
                              size={viewMode === "grid" ? "default" : "sm"}
                              variant={inCart ? "outline" : "default"}
                              onClick={() => {
                                if (inCart) {
                                  removeFromCart(product.id);
                                } else {
                                  addToCart(product);
                                }
                              }}
                              className={`${
                                viewMode === "grid" ? "w-full h-11" : ""
                              } ${
                                inCart 
                                  ? "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-sm" 
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              {inCart ? (
                                <>
                                  <X className="mr-1.5 h-4 w-4" />
                                  Remove from Cart
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-1.5 h-4 w-4" />
                                  Add to Cart
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Order History Tab ─── */}
          <TabsContent value="history" className="space-y-6">
            {orders.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="py-16 text-center">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No orders placed yet</h3>
                  <p className="text-gray-500 mt-1">Your successful orders will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <Card key={order.id} className="border border-gray-200 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b border-gray-200 pb-4 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            Order #{order.id.slice(0, 8)}
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none font-medium">
                              {order.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-gray-500 mt-1">
                            Placed on {new Date(order.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-500 mb-1">Total</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatPrice(BigInt(order.totalPrice))}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-white">
                          <TableRow className="border-b border-gray-100 hover:bg-white">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 h-10">Product</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500 h-10">Quantity</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500 h-10">Line Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <TableCell className="font-medium text-gray-900">{item.product.name}</TableCell>
                              <TableCell className="text-right font-mono text-sm text-gray-600">
                                {Number(item.requestedDisplayQuantity).toFixed(6)}{" "}
                                {item.requestedDisplayUnit}
                              </TableCell>
                              <TableCell className="text-right font-medium text-gray-900">
                                {formatPrice(BigInt(item.lineItemPrice))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
