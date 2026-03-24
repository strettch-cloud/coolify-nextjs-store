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
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Please login to view orders</h1>
        <Link
          href="/login"
          className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Login
        </Link>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading orders...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders yet</p>
          <Link
            href="/"
            className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    order.status === "delivered"
                      ? "bg-green-100 text-green-800"
                      : order.status === "shipped"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold mt-3 pt-3 border-t">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
