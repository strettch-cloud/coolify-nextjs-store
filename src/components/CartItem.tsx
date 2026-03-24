"use client";

import Image from "next/image";
import { CartItem as CartItemType } from "@/context/CartContext";
import { useCart } from "@/context/CartContext";

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-5 py-5 border-b border-border last:border-0">
      <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        <Image
          src={item.product.image}
          alt={item.product.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text truncate">{item.product.name}</h3>
        <p className="text-sm text-text-tertiary mt-0.5">${item.product.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
          className="w-7 h-7 rounded-full border border-border text-text-secondary hover:border-text hover:text-text text-sm transition-colors flex items-center justify-center"
        >
          &minus;
        </button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
          className="w-7 h-7 rounded-full border border-border text-text-secondary hover:border-text hover:text-text text-sm transition-colors flex items-center justify-center"
        >
          +
        </button>
      </div>
      <p className="text-sm font-medium w-20 text-right">
        ${(item.product.price * item.quantity).toFixed(2)}
      </p>
      <button
        onClick={() => removeFromCart(item.product._id)}
        className="text-text-tertiary hover:text-text text-xs transition-colors"
      >
        Remove
      </button>
    </div>
  );
}
