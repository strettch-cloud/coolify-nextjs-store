"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api, { Order } from "@/lib/api";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api
      .get("/api/orders")
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-text">Sign in to view orders</h1>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm bg-text text-white px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-8 bg-muted rounded w-32 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-border rounded-xl p-6">
              <div className="flex justify-between mb-4">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-5 bg-muted rounded-full w-16" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight text-text mb-8">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-tertiary">No orders yet</p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm bg-text text-white px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border border-border rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-text-tertiary">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    order.status === "delivered"
                      ? "bg-emerald-50 text-emerald-700"
                      : order.status === "shipped"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-text-secondary">
                    {item.name} <span className="text-text-tertiary">&times; {item.quantity}</span>
                  </span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between mt-4 pt-4 border-t border-border">
                <span className="text-sm text-text-secondary">Total</span>
                <span className="font-semibold">${order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
