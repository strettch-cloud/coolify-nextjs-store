"use client";

import Image from "next/image";
import { CartItem as CartItemType } from "@/context/CartContext";
import { useCart } from "@/context/CartContext";

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4 py-4 border-b">
      <div className="relative h-20 w-20 flex-shrink-0">
        <Image
          src={item.product.image}
          alt={item.product.name}
          fill
          className="object-cover rounded"
          sizes="80px"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
        <p className="text-sm text-gray-500">${item.product.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
          className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-100"
        >
          -
        </button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
          className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-100"
        >
          +
        </button>
      </div>
      <p className="font-medium w-20 text-right">
        ${(item.product.price * item.quantity).toFixed(2)}
      </p>
      <button
        onClick={() => removeFromCart(item.product._id)}
        className="text-red-500 hover:text-red-700 text-sm"
      >
        Remove
      </button>
    </div>
  );
}
