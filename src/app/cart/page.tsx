"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import CartItemComponent from "@/components/CartItem";

export default function CartPage() {
  const { items, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="text-gray-500 mt-2">Add some products to get started</p>
        <Link
          href="/"
          className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <button onClick={clearCart} className="text-sm text-red-600 hover:text-red-800">
          Clear Cart
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        {items.map((item) => (
          <CartItemComponent key={item.product._id} item={item} />
        ))}

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>

        <Link
          href="/checkout"
          className="mt-6 block w-full bg-indigo-600 text-white text-center py-3 rounded-md hover:bg-indigo-700"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
