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
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api
      .get(`/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-8" />
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square rounded-xl bg-muted" />
          <div className="space-y-4 pt-4">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-6 bg-muted rounded w-48" />
            <div className="h-8 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-text-tertiary">Product not found</p>
        <Link href="/" className="text-sm text-text underline underline-offset-2 mt-2 inline-block">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-text transition-colors inline-flex items-center gap-1 mb-8"
      >
        <span>&larr;</span> Back to shop
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs text-text-tertiary uppercase tracking-wider">{product.category}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-text mt-2">{product.name}</h1>
          <p className="text-2xl font-semibold text-text mt-4">${product.price.toFixed(2)}</p>
          <p className="text-text-secondary mt-4 leading-relaxed">{product.description}</p>

          <p className="text-sm text-text-tertiary mt-4">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="mt-8 w-full bg-text text-white py-3 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {added ? "Added!" : product.stock > 0 ? "Add to cart" : "Sold out"}
          </button>
        </div>
      </div>
    </div>
  );
}
