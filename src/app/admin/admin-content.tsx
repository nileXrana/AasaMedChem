"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { addProduct, getProducts } from "@/app/actions/products";
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
import { formatPrice, baseToDisplay, getBaseUnitLabel } from "@/lib/conversions";

type SerializedProduct = {
  id: string;
  name: string;
  dimensionType: string;
  pricePerBaseUnit: string;
  stockBaseQuantity: string;
  createdAt: string;
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
  seller: { name: string; email: string };
  items: SerializedOrderItem[];
};

interface AdminContentProps {
  products: SerializedProduct[];
  orders: SerializedOrder[];
  user: { name: string; email: string; role: string };
}

export function AdminContent({ products: initialProducts, orders, user }: AdminContentProps) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAddProduct(formData: FormData) {
    setLoading(true);
    setMessage("");

    const result = await addProduct(formData);

    if (result.error) {
      setMessage("Error adding product");
    } else {
      setMessage("Product added successfully!");
      const updated = await getProducts();
      setProducts(updated);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
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
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="products" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Orders ({orders.length})
            </TabsTrigger>
          </TabsList>

          {/* ─── Products Tab ─── */}
          <TabsContent value="products" className="space-y-6">
            {/* Add Product Form */}
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Add New Product</CardTitle>
                <CardDescription className="text-slate-400">
                  Prices in paise per base unit · Stock in base units (mg/mL/units)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleAddProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-slate-300">Product Name</Label>
                    <Input
                      name="name"
                      placeholder="e.g., Aspirin Powder"
                      required
                      className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Dimension Type</Label>
                    <Select name="dimensionType" required>
                      <SelectTrigger className="border-slate-700 bg-slate-800/50 text-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 bg-slate-800">
                        <SelectItem value="WEIGHT">Weight (mg)</SelectItem>
                        <SelectItem value="VOLUME">Volume (mL)</SelectItem>
                        <SelectItem value="COUNT">Count (units)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Price (paise/base)</Label>
                    <Input
                      name="pricePerBaseUnit"
                      type="number"
                      placeholder="e.g., 5"
                      required
                      className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Stock (base units)</Label>
                    <Input
                      name="stockBaseQuantity"
                      type="number"
                      placeholder="e.g., 10000000"
                      required
                      className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="flex items-end sm:col-span-2 lg:col-span-5">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                    >
                      {loading ? "Adding..." : "Add Product"}
                    </Button>
                    {message && (
                      <span className={`ml-4 text-sm ${message.includes("Error") ? "text-red-400" : "text-emerald-400"}`}>
                        {message}
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Price/Base Unit</TableHead>
                      <TableHead className="text-slate-400">Stock (base)</TableHead>
                      <TableHead className="text-slate-400">Stock (display)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const baseLabel = getBaseUnitLabel(product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT");
                      const displayUnit = product.dimensionType === "WEIGHT" ? "kg" : product.dimensionType === "VOLUME" ? "L" : "units";
                      const displayStock = baseToDisplay(BigInt(product.stockBaseQuantity), displayUnit);

                      return (
                        <TableRow key={product.id} className="border-slate-800 hover:bg-slate-800/30">
                          <TableCell className="font-medium text-white">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              {product.dimensionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatPrice(BigInt(product.pricePerBaseUnit))}/{baseLabel}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-400">
                            {BigInt(product.stockBaseQuantity).toLocaleString()} {baseLabel}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-emerald-400">
                            {displayStock} {displayUnit}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Orders Tab ─── */}
          <TabsContent value="orders" className="space-y-4">
            {orders.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/60">
                <CardContent className="py-12 text-center text-slate-400">
                  No orders yet
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
                          By {order.seller.name} ({order.seller.email}) · {new Date(order.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={order.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}>
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
                          <TableHead className="text-slate-400">Requested (display)</TableHead>
                          <TableHead className="text-slate-400">Converted (base)</TableHead>
                          <TableHead className="text-right text-slate-400">Line Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => {
                          const baseLabel = getBaseUnitLabel(item.product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT");
                          return (
                            <TableRow key={item.id} className="border-slate-800/50 hover:bg-slate-800/20">
                              <TableCell className="text-white">{item.product.name}</TableCell>
                              <TableCell className="font-mono text-sm text-indigo-400">
                                {Number(item.requestedDisplayQuantity).toFixed(6)} {item.requestedDisplayUnit}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-amber-400">
                                {BigInt(item.convertedBaseQuantity).toLocaleString()} {baseLabel}
                              </TableCell>
                              <TableCell className="text-right font-medium text-white">
                                {formatPrice(BigInt(item.lineItemPrice))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
