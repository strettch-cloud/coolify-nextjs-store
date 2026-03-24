"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <Link href="/" className="text-lg font-semibold tracking-tight text-text">
            ShopEase
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              Shop
            </Link>

            <Link
              href="/cart"
              className="relative text-sm text-text-secondary hover:text-text transition-colors"
            >
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-3.5 bg-text text-white text-[10px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                <Link
                  href="/orders"
                  className="text-sm text-text-secondary hover:text-text transition-colors"
                >
                  Orders
                </Link>
                <div className="flex items-center gap-3 pl-3 border-l border-border">
                  <span className="text-sm text-text-secondary">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm text-text-tertiary hover:text-text transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-text text-white px-4 py-1.5 rounded-full hover:bg-primary-hover transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
