"use client";

import { useEffect, useState } from "react";
import api, { Product } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  useEffect(() => {
    const params = category ? `?category=${category}` : "";
    api
      .get(`/api/products${params}`)
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const categories = ["All", "Electronics", "Clothing", "Footwear", "Accessories"];

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to ShopEase</h1>
        <p className="text-gray-500 mt-2">Discover products you love</p>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === "All" ? "" : cat)}
            className={`px-4 py-2 rounded-full text-sm ${
              (cat === "All" && !category) || cat === category
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No products found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
