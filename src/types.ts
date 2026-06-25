import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string; // Category ID
  stock: number;
  featured: boolean;
  status: 'active' | 'draft' | 'out_of_stock';
  sizes?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    size: string;
    quantity: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  productCount: number;
  createdAt: Timestamp;
}

export interface StoreSettings {
  whatsappNumber: string;
  contactAddress: string;
  contactEmail: string;
  instagramUrl: string;
  facebookUrl: string;
  businessHours: string;
  deliveryLagos: string;
  deliveryOutside: string;
}

export interface Reservation {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export interface Admin {
  email: string;
  addedAt: Timestamp;
}
