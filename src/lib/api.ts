import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  total: number;
  status: string;
  shippingAddress: { street: string; city: string; country: string };
  createdAt: string;
}

export default api;
