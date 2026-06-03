import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProducts } from "@/app/actions/products";
import { getOrders } from "@/app/actions/orders";
import { AdminContent } from "./admin-content";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/seller");

  const products = await getProducts();
  const orders = await getOrders();

  return <AdminContent products={products} orders={orders} user={session.user} />;
}
