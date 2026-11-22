//app/(customer)/account/AccountDashboardClient.tsx
"use client";
export const instant = false;
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Package, Heart, User, MapPin, Truck, CreditCard, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils/formatting";

export default function AccountDashboardClient() {
  const { profile, user } = useAuth();

  const stats = [
    { name: "Total Orders", value: "0", icon: Package, href: "/account/orders", color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Wishlist Items", value: "0", icon: Heart, href: "/account/wishlist", color: "text-pink-500", bg: "bg-pink-500/10" },
    { name: "Saved Addresses", value: "0", icon: MapPin, href: "/account/addresses", color: "text-green-500", bg: "bg-green-500/10" },
    { name: "Pending Orders", value: "0", icon: Clock, href: "/account/orders", color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  interface Order {
    id: string;
    date: string;
    status: "delivered" | "shipped" | "confirmed" | "pending" | "cancelled";
    total: number;
  }

  const recentOrders: Order[] = [
    // Mock data - replace with real data from API
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-pink-100 rounded-2xl p-6 md:p-8 border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {profile?.displayName || user?.displayName || "User"}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening with your account.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/account/orders" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              View Orders
            </Link>
            <Link href="/shop" className="px-4 py-2 border border-input bg-background rounded-lg font-medium hover:bg-muted transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href} className="block">
            <div className="bg-card rounded-xl p-5 border border-border hover:border-primary/50 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={cn(stat.bg, "rounded-lg p-3")}>
                  <stat.icon className={cn(stat.color, "w-6 h-6")} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-primary hover:underline">
            View all orders
          </Link>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">Start shopping to see your orders here.</p>
              <Link href="/shop" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                <Truck className="w-4 h-4" />
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-4 font-medium">Order</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <span className="font-mono text-sm text-foreground">{order.id}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{order.date}</td>
                      <td className="p-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                          order.status === "delivered" && "bg-green-100 text-green-700",
                          order.status === "shipped" && "bg-blue-100 text-blue-700",
                          order.status === "confirmed" && "bg-yellow-100 text-yellow-700",
                          order.status === "pending" && "bg-gray-100 text-gray-700",
                          order.status === "cancelled" && "bg-red-100 text-red-700"
                        )}>
                          {order.status === "delivered" && <CheckCircle className="w-3 h-3" />}
                          {order.status === "shipped" && <Truck className="w-3 h-3" />}
                          {order.status === "confirmed" && <Clock className="w-3 h-3" />}
                          {order.status === "pending" && <Clock className="w-3 h-3" />}
                          {order.status === "cancelled" && <AlertCircle className="w-3 h-3" />}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-foreground">{formatPrice(order.total)}</td>
                      <td className="p-4">
                        <Link href={`/account/orders/${order.id}`} className="text-sm text-primary hover:underline">
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/account/profile" className="group bg-card rounded-xl p-5 border border-border hover:border-primary/50 hover:shadow-md transition-all">
          <div className={cn("rounded-lg p-3", "bg-blue-500/10")}>
            <User className={cn("text-blue-500", "w-6 h-6")} />
          </div>
          <h3 className="font-medium text-foreground mt-3 group-hover:text-primary transition-colors">Edit Profile</h3>
          <p className="text-sm text-muted-foreground mt-1">Update your personal information</p>
        </Link>
        <Link href="/account/addresses" className="group bg-card rounded-xl p-5 border border-border hover:border-primary/50 hover:shadow-md transition-all">
          <div className={cn("rounded-lg p-3", "bg-green-500/10")}>
            <MapPin className={cn("text-green-500", "w-6 h-6")} />
          </div>
          <h3 className="font-medium text-foreground mt-3 group-hover:text-primary transition-colors">Manage Addresses</h3>
          <p className="text-sm text-muted-foreground mt-1">Add or edit delivery addresses</p>
        </Link>
        <Link href="/account/wishlist" className="group bg-card rounded-xl p-5 border border-border hover:border-primary/50 hover:shadow-md transition-all">
          <div className={cn("rounded-lg p-3", "bg-pink-500/10")}>
            <Heart className={cn("text-pink-500", "w-6 h-6")} />
          </div>
          <h3 className="font-medium text-foreground mt-3 group-hover:text-primary transition-colors">My Wishlist</h3>
          <p className="text-sm text-muted-foreground mt-1">View saved items</p>
        </Link>
        <Link href="/account/orders" className="group bg-card rounded-xl p-5 border border-border hover:border-primary/50 hover:shadow-md transition-all">
          <div className={cn("rounded-lg p-3", "bg-purple-500/10")}>
            <Package className={cn("text-purple-500", "w-6 h-6")} />
          </div>
          <h3 className="font-medium text-foreground mt-3 group-hover:text-primary transition-colors">Order History</h3>
          <p className="text-sm text-muted-foreground mt-1">Track and manage orders</p>
        </Link>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}