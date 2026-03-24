"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/products/${product._id}`}>
        <div className="relative h-48 w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs text-indigo-600 font-medium uppercase">{product.category}</p>
        <Link href={`/products/${product._id}`}>
          <h3 className="font-semibold text-gray-900 mt-1 hover:text-indigo-600">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
