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
import { LogOut, Package2, Plus, Box, FileText } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Package2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Admin Console</h1>
              <p className="text-xs font-medium text-gray-500">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="products" className="space-y-8">
          <TabsList className="bg-white border border-gray-200 p-1 shadow-sm">
            <TabsTrigger value="products" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm px-4 py-2">
              <Box className="mr-2 h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm px-4 py-2">
              <FileText className="mr-2 h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          {/* ─── Products Tab ─── */}
          <TabsContent value="products" className="space-y-6">
            {/* Add Product Form */}
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Add New Product</CardTitle>
                <CardDescription className="text-gray-500">
                  Enter product details. Prices are in paise per base unit. Stock is in base units (mg/mL/units).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form action={handleAddProduct} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Product Name</Label>
                    <Input
                      name="name"
                      placeholder="e.g., Aspirin Powder"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Dimension Type</Label>
                    <Select name="dimensionType" required>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEIGHT">Weight (mg)</SelectItem>
                        <SelectItem value="VOLUME">Volume (mL)</SelectItem>
                        <SelectItem value="COUNT">Count (units)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Price (paise/base)</Label>
                    <Input
                      name="pricePerBaseUnit"
                      type="number"
                      placeholder="e.g., 5"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Stock (base units)</Label>
                    <Input
                      name="stockBaseQuantity"
                      type="number"
                      placeholder="e.g., 10000000"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-5 pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      {loading ? (
                        "Adding..."
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Product
                        </>
                      )}
                    </Button>
                    {message && (
                      <span className={`text-sm font-medium ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>
                        {message}
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-gray-200">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 h-10">Product Name</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 h-10">Type</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500 h-10">Price/Base</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500 h-10">Stock (base)</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500 h-10">Stock (display)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const baseLabel = getBaseUnitLabel(product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT");
                    const displayUnit = product.dimensionType === "WEIGHT" ? "kg" : product.dimensionType === "VOLUME" ? "L" : "units";
                    const displayStock = baseToDisplay(BigInt(product.stockBaseQuantity), displayUnit);

                    return (
                      <TableRow key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">
                            {product.dimensionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-gray-700">
                          {formatPrice(BigInt(product.pricePerBaseUnit))}<span className="text-gray-400 text-xs ml-1">/{baseLabel}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">
                          {BigInt(product.stockBaseQuantity).toLocaleString()} {baseLabel}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium text-blue-600">
                          {displayStock} {displayUnit}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ─── Orders Tab ─── */}
          <TabsContent value="orders" className="space-y-6">
            {orders.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="py-16 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                  <p className="text-gray-500 mt-1">When sellers place orders, they will appear here.</p>
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
                            <Badge className={order.status === "CONFIRMED" ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}>
                              {order.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-gray-500 mt-1">
                            Placed by <span className="font-medium text-gray-700">{order.seller.name}</span> ({order.seller.email}) on {new Date(order.createdAt).toLocaleString()}
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
                            <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10">Product</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase text-gray-500 h-10">Requested (display)</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase text-gray-500 h-10">Converted (base)</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase text-gray-500 h-10">Line Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => {
                            const baseLabel = getBaseUnitLabel(item.product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT");
                            return (
                              <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900">{item.product.name}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-gray-700">
                                  {Number(item.requestedDisplayQuantity).toFixed(6)} {item.requestedDisplayUnit}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-gray-500">
                                  {BigInt(item.convertedBaseQuantity).toLocaleString()} {baseLabel}
                                </TableCell>
                                <TableCell className="text-right font-medium text-gray-900">
                                  {formatPrice(BigInt(item.lineItemPrice))}
                                </TableCell>
                              </TableRow>
                            );
                          })}
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
