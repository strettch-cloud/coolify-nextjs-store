"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            ShopEase
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-indigo-600">
              Products
            </Link>

            <Link href="/cart" className="relative text-gray-700 hover:text-indigo-600">
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                <Link href="/orders" className="text-gray-700 hover:text-indigo-600">
                  Orders
                </Link>
                <span className="text-sm text-gray-500">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
