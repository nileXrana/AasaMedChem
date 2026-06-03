"use client";

import { useState, useMemo, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatPrice, baseToDisplay, getBaseUnitLabel } from "@/lib/conversions";
import { LogOut, Package2, Plus, Box, FileText, LayoutDashboard, Activity, DollarSign, TrendingUp, AlertCircle, Search, Layers } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("products");
  const [alertOpen, setAlertOpen] = useState(false);
  const inventoryRef = useRef<HTMLDivElement>(null);

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

  // --- KPI Calculations ---
  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, order) => acc + BigInt(order.totalPrice), BigInt(0));
  }, [orders]);

  const totalOrders = orders.length;
  
  const totalProducts = products.length;

  // --- Helper: Stock Status ---
  const getStockStatus = (product: SerializedProduct) => {
    const stock = BigInt(product.stockBaseQuantity);
    const type = product.dimensionType;

    let isLow = false;
    let isCritical = false;

    if (type === "WEIGHT") {
      // 1kg = 1,000,000 mg. Critical = 100g = 100,000 mg.
      isLow = stock <= BigInt(1000000);
      isCritical = stock <= BigInt(100000);
    } else if (type === "VOLUME") {
      // 1L = 1,000 mL. Critical = 100 mL.
      isLow = stock <= BigInt(1000);
      isCritical = stock <= BigInt(100);
    } else if (type === "COUNT") {
      // 1,000 units. Critical = 100 units.
      isLow = stock <= BigInt(1000);
      isCritical = stock <= BigInt(100);
    }

    return { isLow, isCritical };
  };

  const lowStockProducts = useMemo(() => {
    return products.filter(p => getStockStatus(p).isLow);
  }, [products]);

  const lowStockCount = lowStockProducts.length;

  // --- Filtering ---
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">Admin Console</h1>
              <p className="text-xs font-medium text-gray-500">AASA Command Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4 border-r border-gray-200 pr-4">
              <span className="text-sm font-semibold text-gray-900">{user.name || "Administrator"}</span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        
        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{formatPrice(totalRevenue)}</div>
              <p className="text-xs font-medium text-gray-500 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                Lifetime volume
              </p>
            </CardContent>
          </Card>
          <Card 
            className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2"
            onClick={() => setSelectedTab("orders")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Orders</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalOrders}</div>
              <p className="text-xs font-medium text-gray-500 mt-1">Processed transactions</p>
            </CardContent>
          </Card>
          <Card 
            className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2"
            onClick={() => {
              setSelectedTab("products");
              setTimeout(() => {
                inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Active Products</CardTitle>
              <Box className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalProducts}</div>
              <p className="text-xs font-medium text-gray-500 mt-1">Items in catalog</p>
            </CardContent>
          </Card>
          <Card 
            className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer hover:ring-2 hover:ring-red-500 hover:ring-offset-2"
            onClick={() => setAlertOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Stock Alerts</CardTitle>
              <AlertCircle className={`h-4 w-4 ${lowStockCount > 0 ? "text-red-600" : "text-gray-400"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{lowStockCount}</div>
              <p className="text-xs font-medium text-gray-500 mt-1">Products running low</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="bg-white border border-gray-200 p-1.5 shadow-sm h-auto">
            <TabsTrigger value="products" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2.5 text-sm font-medium rounded-md transition-all">
              <Box className="mr-2 h-4 w-4" />
              Inventory Management
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2.5 text-sm font-medium rounded-md transition-all">
              <Activity className="mr-2 h-4 w-4" />
              Order Operations
            </TabsTrigger>
            <TabsTrigger value="add-product" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2.5 text-sm font-medium rounded-md transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </TabsTrigger>
          </TabsList>

          {/* ─── Add Product Tab ─── */}
          <TabsContent value="add-product" className="space-y-8 animate-in fade-in-50 duration-500">
            {/* Add Product Form */}
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-5">
                <CardTitle className="text-xl font-bold tracking-tight text-gray-900">Register New Product</CardTitle>
                <CardDescription className="text-gray-500 font-medium">
                  Add inventory. Prices must be in rupees (INR). Stock must be in lowest base units (mg/mL/units).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form action={handleAddProduct} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product Name</Label>
                    <Input
                      name="name"
                      placeholder="e.g., Paracetamol 500mg"
                      required
                      className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dimension Type</Label>
                    <Select name="dimensionType" required>
                      <SelectTrigger className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 h-11">
                        <SelectValue placeholder="Select dimension" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEIGHT" className="font-medium">Weight (mg)</SelectItem>
                        <SelectItem value="VOLUME" className="font-medium">Volume (mL)</SelectItem>
                        <SelectItem value="COUNT" className="font-medium">Count (units)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Price (Base)</Label>
                    <Input
                      name="pricePerBaseUnit"
                      type="number"
                      placeholder="e.g., 5"
                      required
                      className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 font-mono h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Stock (Base Units)</Label>
                    <Input
                      name="stockBaseQuantity"
                      type="number"
                      placeholder="e.g., 10000000"
                      required
                      className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 font-mono h-11"
                    />
                  </div>
                  <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4 mt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-semibold h-11 px-8"
                    >
                      {loading ? (
                        "Saving..."
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Product
                        </>
                      )}
                    </Button>
                    {message && (
                      <span className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center ${message.includes("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                        {message.includes("Error") ? <AlertCircle className="h-4 w-4 mr-2" /> : <Package2 className="h-4 w-4 mr-2" />}
                        {message}
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Products Tab ─── */}
          <TabsContent value="products" className="space-y-8 animate-in fade-in-50 duration-500">
            <div ref={inventoryRef} className="scroll-mt-24">

            {/* Products Table */}
            <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
              <div className="bg-white border-b border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">Current Inventory</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search products..." 
                    className="pl-9 w-full sm:w-64 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500 h-12 w-[30%]">Product Name</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500 h-12">Dimension</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-gray-500 h-12">Price/Base Unit</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-gray-500 h-12">Base Stock</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-gray-500 h-12 text-blue-600">Display Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-gray-500 font-medium">
                        No products found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const baseLabel = getBaseUnitLabel(product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT");
                      const displayUnit = product.dimensionType === "WEIGHT" ? "kg" : product.dimensionType === "VOLUME" ? "L" : "units";
                      const displayStock = baseToDisplay(BigInt(product.stockBaseQuantity), displayUnit);

                      return (
                        <TableRow key={product.id} className="border-b border-gray-100 hover:bg-gray-50/80 transition-all group">
                          <TableCell className="py-5">
                            <div className="flex items-center gap-3">
                              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                {product.dimensionType === "WEIGHT" ? <Box className="h-5 w-5" /> : product.dimensionType === "VOLUME" ? <Box className="h-5 w-5" /> : <Package2 className="h-5 w-5" />}
                              </div>
                              <span className="font-bold text-gray-900 text-base">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <Badge 
                              variant="outline" 
                              className={`font-bold uppercase tracking-wide border-transparent ${
                                product.dimensionType === "WEIGHT" ? "bg-amber-50 text-amber-700" :
                                product.dimensionType === "VOLUME" ? "bg-purple-50 text-purple-700" :
                                "bg-indigo-50 text-indigo-700"
                              }`}
                            >
                              {product.dimensionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-5">
                            <div className="inline-flex items-baseline bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                              <span className="text-green-800 font-bold text-base">{formatPrice(BigInt(product.pricePerBaseUnit))}</span>
                              <span className="text-green-600/70 font-semibold text-xs ml-1.5">/ {baseLabel}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-5 text-gray-500 font-medium bg-gray-50/30">
                            <span className="font-mono text-sm">{BigInt(product.stockBaseQuantity).toLocaleString()}</span>
                            <span className="text-xs ml-1.5 opacity-70">{baseLabel}</span>
                          </TableCell>
                          <TableCell className="text-right py-5 bg-blue-50/20 group-hover:bg-blue-50/40 transition-colors border-l border-gray-50">
                            <div className="flex flex-col items-end">
                              <span className="font-mono text-base font-bold text-blue-700">{displayStock}</span>
                              <span className="text-blue-500 font-semibold text-xs uppercase tracking-wider">{displayUnit} Available</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
            </div>
          </TabsContent>

          {/* ─── Orders Tab ─── */}
          <TabsContent value="orders" className="space-y-6 animate-in fade-in-50 duration-500">
            {orders.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="py-24 text-center">
                  <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">No orders to fulfill</h3>
                  <p className="text-gray-500 mt-2 font-medium max-w-md mx-auto">When sellers place orders on the platform, they will appear here for processing.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {orders.map((order) => (
                  <Card key={order.id} className="border border-gray-200 shadow-md bg-white overflow-hidden hover:border-gray-300 transition-colors">
                    <CardHeader className="bg-white border-b border-gray-200 pb-5 pt-6 px-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl font-bold text-gray-900 tracking-tight">
                              Order <span className="text-gray-400 font-mono text-lg">#{order.id.slice(0, 8)}</span>
                            </CardTitle>
                            <Badge className={
                              order.status === "CONFIRMED" 
                                ? "bg-green-100 text-green-800 border border-green-200 font-bold px-3 py-1 uppercase tracking-wider" 
                                : "bg-yellow-100 text-yellow-800 border border-yellow-200 font-bold px-3 py-1 uppercase tracking-wider"
                            }>
                              {order.status}
                            </Badge>
                          </div>
                          <CardDescription className="text-gray-600 font-medium flex items-center">
                            By <span className="font-bold text-gray-900 mx-1">{order.seller.name || "Seller"}</span> ({order.seller.email})
                            <span className="mx-2 text-gray-300">•</span>
                            {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </CardDescription>
                        </div>
                        <div className="bg-gray-50 px-5 py-3 rounded-xl border border-gray-100 text-right">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Value</p>
                          <p className="text-2xl font-bold text-gray-900 leading-none">
                            {formatPrice(BigInt(order.totalPrice))}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-gray-50/80">
                          <TableRow className="hover:bg-transparent border-b border-gray-200">
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-600 h-12 pl-6">Product</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-blue-600 h-12 bg-blue-50/30">Requested Quantity</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-gray-600 h-12">Base Equivalent</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-gray-600 h-12 pr-6">Line Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => {
                            const baseLabel = getBaseUnitLabel(item.product.dimensionType as "WEIGHT" | "VOLUME" | "COUNT");
                            return (
                              <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <TableCell className="font-bold text-gray-900 text-base pl-6">{item.product.name}</TableCell>
                                <TableCell className="text-right font-mono text-base font-bold text-blue-700 bg-blue-50/30">
                                  {Number(item.requestedDisplayQuantity).toFixed(6)} <span className="font-sans text-blue-500 text-sm">{item.requestedDisplayUnit}</span>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-gray-600">
                                  {BigInt(item.convertedBaseQuantity).toLocaleString()} <span className="font-sans text-gray-400 text-xs">{baseLabel}</span>
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-900 text-base pr-6">
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
        
        {/* Low Stock Alert Modal */}
        <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
          <DialogContent className="sm:max-w-3xl overflow-hidden p-0 border-0 shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white tracking-tight">Low Stock Alerts</DialogTitle>
                  <DialogDescription className="text-rose-100 font-medium text-sm mt-0.5">
                    Products requiring immediate replenishment
                  </DialogDescription>
                </div>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6 bg-gray-50">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Box className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">All Stock is Healthy</h3>
                  <p className="text-gray-500 mt-1">No products are currently running below their respective thresholds.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {lowStockProducts
                    .map(p => {
                      const baseLabel = getBaseUnitLabel(p.dimensionType as "WEIGHT" | "VOLUME" | "COUNT");
                      const displayUnit = p.dimensionType === "WEIGHT" ? "kg" : p.dimensionType === "VOLUME" ? "L" : "units";
                      const displayStock = baseToDisplay(BigInt(p.stockBaseQuantity), displayUnit);
                      const { isCritical } = getStockStatus(p);
                      return (
                        <Card key={p.id} className={`border ${isCritical ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-white'} shadow-sm overflow-hidden`}>
                          <div className={`h-1 w-full ${isCritical ? 'bg-red-500' : 'bg-yellow-400'}`}></div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-bold text-gray-900 leading-tight">{p.name}</h4>
                              <Badge variant="outline" className={p.dimensionType === "WEIGHT" ? "text-amber-700 bg-amber-50" : p.dimensionType === "VOLUME" ? "text-purple-700 bg-purple-50" : "text-indigo-700 bg-indigo-50"}>
                                {p.dimensionType}
                              </Badge>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Available Stock</p>
                                <p className={`font-mono text-xl font-bold ${isCritical ? 'text-red-700' : 'text-yellow-700'}`}>
                                  {displayStock} <span className="text-sm font-sans">{displayUnit}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-medium">BASE RESERVE</p>
                                <p className="text-xs font-mono text-gray-500 font-semibold">{BigInt(p.stockBaseQuantity).toLocaleString()} {baseLabel}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
