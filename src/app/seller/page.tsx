import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { searchProducts } from "@/app/actions/products";
import { getSellerOrders } from "@/app/actions/orders";
import { SellerContent } from "./seller-content";

export default async function SellerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER") redirect("/admin");

  const { q = "" } = await searchParams;
  const products = await searchProducts(q);
  const orders = await getSellerOrders();

  return (
    <SellerContent
      products={products}
      orders={orders}
      user={session.user}
      initialQuery={q}
    />
  );
}
