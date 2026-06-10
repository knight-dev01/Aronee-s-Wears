import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string; // Category ID
  stock: number;
  featured: boolean;
  status: 'active' | 'draft' | 'out_of_stock';
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
}

export interface Admin {
  email: string;
  addedAt: Timestamp;
}
