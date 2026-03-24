"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api, { Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    api
      .get(`/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!product) return <div className="text-center py-12 text-gray-500">Product not found</div>;

  return (
    <div>
      <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm mb-6 inline-block">
        &larr; Back to products
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative h-96 w-full rounded-lg overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div>
          <p className="text-sm text-indigo-600 font-medium uppercase">{product.category}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
          <p className="text-3xl font-bold text-gray-900 mt-4">${product.price.toFixed(2)}</p>
          <p className="text-gray-600 mt-4">{product.description}</p>

          <p className="text-sm text-gray-500 mt-4">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-md text-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
