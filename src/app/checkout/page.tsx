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
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-text">Sign in to checkout</h1>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm bg-text text-white px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-text">Your cart is empty</h1>
        <Link
          href="/"
          className="mt-6 inline-block text-sm bg-text text-white px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors"
        >
          Browse products
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
      <h1 className="text-2xl font-semibold tracking-tight text-text mb-8">Checkout</h1>

      <div className="border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Order Summary</h2>
        {items.map((item) => (
          <div key={item.product._id} className="flex justify-between text-sm py-1.5">
            <span className="text-text-secondary">
              {item.product.name} <span className="text-text-tertiary">&times; {item.quantity}</span>
            </span>
            <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between mt-4 pt-4 border-t border-border">
          <span className="text-sm text-text-secondary">Total</span>
          <span className="text-lg font-semibold">${total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border border-border rounded-xl p-6">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Shipping Address</h2>

        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Street address"
            required
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-text/10 focus:border-text transition-colors placeholder:text-text-tertiary"
          />
          <input
            type="text"
            placeholder="City"
            required
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-text/10 focus:border-text transition-colors placeholder:text-text-tertiary"
          />
          <input
            type="text"
            placeholder="Country"
            required
            value={address.country}
            onChange={(e) => setAddress({ ...address, country: e.target.value })}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-text/10 focus:border-text transition-colors placeholder:text-text-tertiary"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full bg-text text-white py-3 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {submitting ? "Placing order..." : `Place order \u2014 $${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
