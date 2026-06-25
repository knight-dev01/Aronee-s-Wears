import { doc, getDocs, collection, writeBatch, serverTimestamp, getDoc, query, limit } from 'firebase/firestore';
import { db } from '../firebase';

export interface SeedCategory {
  id: string;
  name: string;
  image: string;
}

export interface SeedProduct {
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string; // references SeedCategory.id
  stock: number;
  featured: boolean;
  status: 'active' | 'draft' | 'out_of_stock';
}

export const defaultCategories: SeedCategory[] = [
  {
    id: 'sneakers',
    name: 'Sneakers',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'heels',
    name: 'Heels',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'sandals',
    name: 'Sandals',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'bags',
    name: 'Bags',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'accessories',
    name: 'Accessories',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mens-wears',
    name: "Men's Wears",
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'womens-wears',
    name: "Women's Wears",
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'
  }
];

export const defaultProducts: SeedProduct[] = [
  {
    name: 'Aronne-Air Elite Sneakers',
    description: 'Our flagship urban streetwear sneakers. Feature a premium cushioning midsole, high-grip rubber treading, and a highly breathable woven flyknit upper. Perfect for modern fashion enthusiasts who make style a daily walk.',
    price: 38000,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'sneakers',
    stock: 12,
    featured: true,
    status: 'active'
  },
  {
    name: 'Lagos Urban Retro Trainers',
    description: 'Vintage-styled classic tennis sneakers in striking premium suede. Minimalist aesthetic paired with maximum footbed support. Complete with custom hand-stitched detailing and high-contrast styling lines.',
    price: 32000,
    images: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'sneakers',
    stock: 18,
    featured: true,
    status: 'active'
  },
  {
    name: 'Classy Velvet Crimson Heels',
    description: 'Elevate your evening statements with these stunning 4-inch deep velvet pump high heels. Tailored precisely with premium lining and a reinforced slip-resistant sole to handle Nigeria weddings and high-fashion galas with absolute confidence.',
    price: 26500,
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596702994271-2ed9a7d3ef51?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'heels',
    stock: 6,
    featured: true,
    status: 'active'
  },
  {
    name: 'Glittering Sapphire Stilettos',
    description: 'Glistening crystal encrusted blue stiletto heels designed to capture the light wherever you go. Cushioned leather foot-bed for all-day comfort with the perfect posture lift.',
    price: 29500,
    images: [
      'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'heels',
    stock: 8,
    featured: false,
    status: 'active'
  },
  {
    name: 'Executive Full-Grain Leather Sandals',
    description: 'Premium Nigerian male sandals completely handcraft with rich top-grain calfskin leather in dark mahogany. Fully durable dual-density outsoles with double heavy-duty stitching ensure years of regular wear alongside Agbadas or Kaftans.',
    price: 19500,
    images: [
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'sandals',
    stock: 15,
    featured: true,
    status: 'active'
  },
  {
    name: 'Casual Dual-Strap Suede Slides',
    description: 'Understated elegance at casual moments. High-quality double-strap sandals in supple sand suede with comfortable cork orthotic footbed molds to your walking contours.',
    price: 14000,
    images: [
      'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'sandals',
    stock: 22,
    featured: false,
    status: 'active'
  },
  {
    name: 'Elite Executive Derby Shoes',
    description: 'Perfect styling for traditional Kaftans or corporate business suits. Full-grain, highly polished black calfskin leather lace-up derby shoes with exquisite stitching and moisture-wicking technology.',
    price: 34500,
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'mens-wears',
    stock: 10,
    featured: true,
    status: 'active'
  },
  {
    name: 'Victoria Suede Ankle Chelsea Boots',
    description: 'Rich dark espresso hand-waxed suede boots with dynamic elasticated side gussets and dual pull tabs. Classically versatile and built durable.',
    price: 36000,
    images: [
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'mens-wears',
    stock: 5,
    featured: false,
    status: 'active'
  },
  {
    name: 'Luxury Calfskin Quilted Handbag',
    description: 'Elegant textured luxury black purse handbag with gold chain crossbody shoulder strap. Premium interior compartments with velvet storage. The perfect statement accessory for high societal engagements in Lagos.',
    price: 48000,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'bags',
    stock: 4,
    featured: true,
    status: 'active'
  },
  {
    name: 'Saffiano Leather Mini Crossbody Bag',
    description: 'Chic, compact leather crossbody bag featuring scratch-resistant cross-hatch leather textures and a polished gold twist closure.',
    price: 31000,
    images: [
      'https://images.unsplash.com/photo-1566150905458-1bf1fc15a490?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'bags',
    stock: 7,
    featured: false,
    status: 'active'
  }
];

export const defaultSettings = {
  id: 'current',
  whatsappNumber: '+2348123456789',
  contactAddress: 'Shop 14, Ikotun Fashion Plaza, Governor Road, Ikotun, Lagos, Nigeria',
  contactEmail: 'aroneefashion@gmail.com',
  instagramUrl: 'https://instagram.com/aroneeswears',
  facebookUrl: 'https://facebook.com/aroneeswears',
  businessHours: 'Monday - Saturday: 8:00 AM - 7:00 PM'
};

export async function checkAndSeedDatabase() {
  try {
    // Check settings first
    const settingsDocRef = doc(db, 'settings', 'current');
    const settingsSnap = await getDoc(settingsDocRef);
    
    // Also check if products exist
    const productsSnap = await getDocs(query(collection(db, 'products'), limit(1)));
    
    if (!settingsSnap.exists() || productsSnap.empty) {
      console.log('Database appears empty or incomplete. Seeding starting...');
      
      const batch = writeBatch(db);
      
      // 1. Seed global settings
      const settingsRef = doc(db, 'settings', 'current');
      batch.set(settingsRef, {
        whatsappNumber: defaultSettings.whatsappNumber,
        contactAddress: defaultSettings.contactAddress,
        contactEmail: defaultSettings.contactEmail,
        instagramUrl: defaultSettings.instagramUrl,
        facebookUrl: defaultSettings.facebookUrl,
        businessHours: defaultSettings.businessHours
      });
      
      // 2. Seed classes/categories
      const categoryCounts: { [key: string]: number } = {};
      defaultCategories.forEach((cat) => {
        const catRef = doc(db, 'categories', cat.id);
        const activeProdCount = defaultProducts.filter(p => p.category === cat.id && p.status === 'active').length;
        categoryCounts[cat.id] = activeProdCount;
        batch.set(catRef, {
          name: cat.name,
          image: cat.image,
          productCount: activeProdCount,
          createdAt: serverTimestamp()
        });
      });
      
      // 3. Seed wears products
      defaultProducts.forEach((prod, idx) => {
        const prodId = `prod-${idx + 1}`;
        const prodRef = doc(db, 'products', prodId);
        batch.set(prodRef, {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          images: prod.images,
          category: prod.category,
          stock: prod.stock,
          featured: prod.featured,
          status: prod.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      // 4. Seed an Admin if they login (We trust greatifet12@gmail.com and we can also seed a token inside admins collection)
      const adminRef = doc(db, 'admins', 'greatifet12_id');
      batch.set(adminRef, {
        email: 'greatifet12@gmail.com',
        addedAt: serverTimestamp()
      });

      await batch.commit();
      console.log('Database successfully seeded with elegant fashion items!');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Seeding database failed:', error);
    return false;
  }
}

export async function forceResetDatabase() {
  try {
    const batch = writeBatch(db);
    
    // Clear products
    const productsSnap = await getDocs(collection(db, 'products'));
    productsSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Clear categories
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    categoriesSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Reset settings
    const settingsRef = doc(db, 'settings', 'current');
    batch.set(settingsRef, {
      whatsappNumber: defaultSettings.whatsappNumber,
      contactAddress: defaultSettings.contactAddress,
      contactEmail: defaultSettings.contactEmail,
      instagramUrl: defaultSettings.instagramUrl,
      facebookUrl: defaultSettings.facebookUrl,
      businessHours: defaultSettings.businessHours
    });

    // Write default categories
    defaultCategories.forEach((cat) => {
      const catRef = doc(db, 'categories', cat.id);
      const activeProdCount = defaultProducts.filter(p => p.category === cat.id && p.status === 'active').length;
      batch.set(catRef, {
        name: cat.name,
        image: cat.image,
        productCount: activeProdCount,
        createdAt: serverTimestamp()
      });
    });

    // Write default products
    defaultProducts.forEach((prod, idx) => {
      const prodId = `prod-${idx + 1}`;
      const prodRef = doc(db, 'products', prodId);
      batch.set(prodRef, {
        name: prod.name,
        description: prod.description,
        price: prod.price,
        images: prod.images,
        category: prod.category,
        stock: prod.stock,
        featured: prod.featured,
        status: prod.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    const adminRef = doc(db, 'admins', 'greatifet12_id');
    batch.set(adminRef, {
      email: 'greatifet12@gmail.com',
      addedAt: serverTimestamp()
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Force resetting database failed:', error);
    return false;
  }
}
