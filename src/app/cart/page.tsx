"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import CartItemComponent from "@/components/CartItem";

export default function CartPage() {
  const { items, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-text">Your cart is empty</h1>
        <p className="text-text-tertiary mt-2">Add some products to get started</p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm bg-text text-white px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm text-text-tertiary hover:text-text transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="border border-border rounded-xl p-6">
        {items.map((item) => (
          <CartItemComponent key={item.product._id} item={item} />
        ))}

        <div className="flex justify-between items-center mt-6 pt-5 border-t border-border">
          <span className="text-sm text-text-secondary">Total</span>
          <span className="text-xl font-semibold text-text">${total.toFixed(2)}</span>
        </div>

        <Link
          href="/checkout"
          className="mt-6 block w-full bg-text text-white text-center py-3 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
