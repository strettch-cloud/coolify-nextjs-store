"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import api from "@/lib/api";
import Link from "next/link";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState({ street: "", city: "", country: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Please login to checkout</h1>
        <Link
          href="/login"
          className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Login
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <Link
          href="/"
          className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post("/api/orders", {
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: address,
      });
      clearCart();
      router.push("/orders");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message
          : "Failed to place order";
      setError(message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
        {items.map((item) => (
          <div key={item.product._id} className="flex justify-between text-sm py-1">
            <span>
              {item.product.name} x {item.quantity}
            </span>
            <span>${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-3 pt-3 border-t">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Shipping Address</h2>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Street address"
            required
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="City"
            required
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Country"
            required
            value={address.country}
            onChange={(e) => setAddress({ ...address, country: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {submitting ? "Placing Order..." : `Place Order — $${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
