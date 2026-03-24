"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="group">
      <Link href={`/products/${product._id}`}>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>
      <div className="mt-3 space-y-1">
        <p className="text-xs text-text-tertiary uppercase tracking-wider">{product.category}</p>
        <Link href={`/products/${product._id}`}>
          <h3 className="text-sm font-medium text-text group-hover:underline underline-offset-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-text">${product.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="text-xs font-medium text-text-secondary hover:text-text border border-border hover:border-text rounded-full px-3 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border"
          >
            {product.stock > 0 ? "Add to cart" : "Sold out"}
          </button>
        </div>
      </div>
    </div>
  );
}
