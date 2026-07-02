import { useState, useEffect } from 'react';
import { 
  collection, query, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp, limit, onSnapshot, orderBy, where 
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ShoppingBag, X, MessageSquare, AlertCircle, RefreshCw, Trash2, ArrowUpRight, Truck, Info } from 'lucide-react';

import { db, auth, loginWithGoogle, logoutUser } from './firebase';
import { Product, Category, StoreSettings } from './types';
import { checkAndSeedDatabase } from './data/seed';

import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import ShopView from './components/ShopView';
import AboutView from './components/AboutView';
import ContactView from './components/ContactView';
import ProductDetailView from './components/ProductDetailView';
import AdminView from './components/AdminView';
import UserDashboardView from './components/UserDashboardView';
import WelcomeView from './components/WelcomeView';
import WhatsAppButton from './components/WhatsAppButton';
import Toast from './components/Toast';
import { logWhatsAppRedirect } from './utils/whatsapp';

interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export default function App() {
  
  // Views navigation and Selection
  const [currentView, setCurrentView] = useState<'home' | 'shop' | 'about' | 'contact' | 'admin' | 'account'>(() => {
    const saved = localStorage.getItem('aronee_currentView');
    return (saved as any) || 'home';
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const prodParam = urlParams.get('product') || urlParams.get('p');
      if (prodParam) {
        return prodParam;
      }
      
      const hash = window.location.hash;
      if (hash) {
        const match = hash.match(/(?:product|p)[=-]([^&/]+)/) || hash.match(/#\/product\/([^&/]+)/);
        if (match && match[1]) return match[1];
      }
    } catch (e) {
      console.warn('Failed to parse initial URL parameters:', e);
    }
    return localStorage.getItem('aronee_selectedProductId');
  });

  // Firestore DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Auth States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Shopper's Order Draft (Cart Drawer) States
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('aronee_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [showCartDeliveryInfo, setShowCartDeliveryInfo] = useState<boolean>(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({
    message: '',
    isVisible: false
  });

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
  };

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem('aronee_currentView', currentView);
  }, [currentView]);

  useEffect(() => {
    if (selectedProductId) {
      localStorage.setItem('aronee_selectedProductId', selectedProductId);
    } else {
      localStorage.removeItem('aronee_selectedProductId');
    }
  }, [selectedProductId]);

  useEffect(() => {
    localStorage.setItem('aronee_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // 1. Listen for auth changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Check if new user
        const userDocRef = doc(db, 'subscribers', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          // New User
          await setDoc(userDocRef, {
            email: currentUser.email,
            displayName: currentUser.displayName,
            createdAt: serverTimestamp(),
            joinedAt: serverTimestamp(),
            authProvider: 'google.com'
          });

          // Trigger Welcome Email
          await addDoc(collection(db, 'welcomeEmails'), {
            userId: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            status: 'pending',
            template: 'welcome',
            couponCode: 'WELCOME10',
            createdAt: serverTimestamp()
          });
          
          setShowWelcome(true);
        } else {
            showToast("Login successful! Welcome back.");
        }

        // Any Google Login where the email is 'greatifet12@gmail.com' is treated as Admin
        // This coordinates nicely with both standard rules check and physical owner accesses
        const userEmail = currentUser.email?.toLowerCase();
        const hardcodedAdmins = ['greatifet12@gmail.com', 'aroneefashion@gmail.com'];
        const isHardcodedAdmin = userEmail ? hardcodedAdmins.includes(userEmail) : false;
        
        // Secondary Admin DB document verification
        try {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          const isDocAdmin = adminDoc.exists();
          setIsAdmin(isHardcodedAdmin || isDocAdmin);
        } catch (err) {
          // If admin collection read is denied, fall back to email match
          setIsAdmin(isHardcodedAdmin);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsInitializing(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 2. Setup real-time queries for Products, Categories, Settings relative to authorization state
  useEffect(() => {
    if (isInitializing) return;

    // Refresh/Initialize database when authorization states are clarified
    const handleDbInit = async () => {
      try {
        await checkAndSeedDatabase(isAdmin);
      } catch (err) {
        console.warn('Initial seeding lookup bypassed:', err);
      }
    };
    handleDbInit();

    // Query active & out_of_stock products for public shoppers to prevent blanket-query permissions violations
    // We default to non-admin query until isAdmin is confirmed
    const productsQuery = isAdmin
      ? query(collection(db, 'products'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'products'), where('status', 'in', ['active', 'out_of_stock']));

    const unsubscribeProducts = onSnapshot(
      productsQuery, 
      (snapshot) => {
        const prodData: Product[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          prodData.push({
            id: doc.id,
            name: d.name || '',
            description: d.description || '',
            price: Number(d.price || 0),
            discountPrice: d.discountPrice ? Number(d.discountPrice) : undefined,
            images: d.images || [],
            category: d.category || '',
            stock: Number(d.stock || 0),
            featured: Boolean(d.featured || false),
            status: d.status || 'active',
            sizes: d.sizes || [],
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          });
        });

        // For non-admin, sort by creation timestamp descending in client-side memory
        if (!isAdmin) {
          prodData.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
        }

        setProducts(prodData);
      },
      (err) => {
        console.error("Products subscriber error:", err);
      }
    );

    const unsubscribeCategories = onSnapshot(
      query(collection(db, 'categories'), orderBy('name', 'asc')), 
      (snapshot) => {
        const catData: Category[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          catData.push({
            id: doc.id,
            name: d.name || '',
            image: d.image || '',
            productCount: Number(d.productCount || 0),
            createdAt: d.createdAt
          });
        });
        setCategories(catData);
      },
      (err) => {
        console.error("Categories subscriber error:", err);
      }
    );

    const unsubscribeSettings = onSnapshot(
      doc(db, 'settings', 'current'), 
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setSettings({
            whatsappNumber: d.whatsappNumber || '+2348123456789',
            contactAddress: d.contactAddress || '',
            contactEmail: d.contactEmail || '',
            instagramUrl: d.instagramUrl || '',
            facebookUrl: d.facebookUrl || '',
            businessHours: d.businessHours || '',
            deliveryLagos: d.deliveryLagos || '2-3 days',
            deliveryOutside: d.deliveryOutside || '4-5 days'
          });
        }
      },
      (err) => {
        console.error("Settings subscriber error:", err);
      }
    );

    let unsubscribeReservations = () => {};
    if (isAdmin) {
      unsubscribeReservations = onSnapshot(
        query(collection(db, 'reservations'), orderBy('createdAt', 'desc'), limit(100)),
        (snapshot) => {
          const resData: any[] = [];
          snapshot.forEach((doc) => {
            resData.push({ id: doc.id, ...doc.data() });
          });
          setReservations(resData);
        }
      );
    }

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeSettings();
      unsubscribeReservations();
    };
  }, [isAdmin, isInitializing]);

  // Sync item count on category changes automatically
  const forceRefreshStats = async () => {
    // Basic triggers
    console.log('Orchestrating inventory statistics updates...');
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/network-request-failed' || String(err).includes('network-request-failed')) {
        alert("Firebase Auth network error. Note: Because this preview applet is run inside an iframe, browser privacy settings or third-party cookie restrictions may block authentication. Please click the 'Open in New Tab' button in the top-right of the screen and log in there!");
      } else {
        alert('Login failed. Please assure popups are enabled, or click the top-right button to run the application in a New Tab.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentView('home');
    } catch (err) {
      console.error(err);
    }
  };

  // Add Item to WhatsApp order draft
  const handleAddToCart = (product: Product, size: string = 'Standard') => {
    setCartItems((prevItems) => {
      const existingIdx = prevItems.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );
      if (existingIdx > -1) {
        const updated = [...prevItems];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prevItems, { product, size, quantity: 1 }];
    });
    
    showToast(`${product.name} added to cart!`);
  };

  const handleUpdateCartQty = (idx: number, amount: number) => {
    setCartItems((prevItems) => {
      const updated = [...prevItems];
      const target = updated[idx];
      const newQty = target.quantity + amount;
      if (newQty <= 0) {
        updated.splice(idx, 1);
      } else {
        target.quantity = newQty;
      }
      return updated;
    });
  };

  const handleRemoveFromCart = (idx: number) => {
    setCartItems((prevItems) => {
      const updated = [...prevItems];
      updated.splice(idx, 1);
      return updated;
    });
  };

  // Compile and Dispatch Multiple Products WhatsApp Order Message
  const handleLaunchWhatsAppMultipleOrder = async () => {
    if (cartItems.length === 0) return;
    
    let totalVal = 0;
    let orderDetailLines = '';
    
    cartItems.forEach((item) => {
      const rowSum = item.product.price * item.quantity;
      totalVal += rowSum;
      const sizeStr = item.product.category === 'bags' ? '' : ` (Size: ${item.size})`;
      const itemUrl = `${window.location.origin}${window.location.pathname}?product=${item.product.id}`;
      orderDetailLines += `- ${item.product.name}${sizeStr}\n  Qty: ${item.quantity} x ₦${item.product.price.toLocaleString()} = ₦${rowSum.toLocaleString()}\n  Link: ${itemUrl}\n\n`;
    });

    const bodyText = `Hello Aronee's Wears,

I would like to order the following fashion items from your storefront:

${orderDetailLines}*Total Order Value:* ₦${totalVal.toLocaleString()}

Please provide payment instructions and coordinate home delivery options.`;

    try {
      await navigator.clipboard.writeText(bodyText);
      showToast('Order details copied to clipboard! Opening WhatsApp...');
    } catch (clipboardErr) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = bodyText;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Order details copied! Opening WhatsApp...');
      } catch (fallbackErr) {
        console.error('Failed to copy to clipboard', fallbackErr);
      }
    }

    const encoded = encodeURIComponent(bodyText);
    const whatsappClean = settings?.whatsappNumber?.replace(/\+/g, '') || '2348123456789';
    await logWhatsAppRedirect('Cart Checkout Order Submission', `Cart Total: ₦${cartItemsTotalPrice.toLocaleString()} for ${cartItemTotalCount} items.`);
    window.open(`https://wa.me/${whatsappClean}?text=${encoded}`, '_blank');
    
    // Clear cart upon launch to reset
    setCartItems([]);
    setIsCartOpen(false);
    setShowCartDeliveryInfo(false);
  };

  // Helper calculating total draft cart item count
  const cartItemTotalCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartItemsTotalPrice = cartItems.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);

  // Transition helper (clearing product selections when views change)
  const handleViewChange = (view: 'home' | 'shop' | 'about' | 'contact' | 'admin' | 'account') => {
    setCurrentView(view);
    setSelectedProductId(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      url.searchParams.delete('p');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn('Failed to update URL in handleViewChange:', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('product', productId);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn('Failed to update URL in handleSelectProduct:', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resolve product detailing object
  const activeDetailProduct = selectedProductId 
    ? products.find((p) => p.id === selectedProductId) 
    : null;

  return (
    <div id="application-root" className="min-h-screen bg-white flex flex-col justify-between font-sans leading-normal tracking-normal text-slate-brand">
      
      {!user && !isInitializing ? (
        /* Compulsory Auth Entrance */
        <div className="fixed inset-0 z-[1000] bg-slate-brand flex items-center justify-center p-6">
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
             <div className="absolute top-0 -left-1/4 w-full h-full bg-purple-brand/30 blur-[120px] rounded-full" />
             <div className="absolute bottom-0 -right-1/4 w-full h-full bg-purple-brand/20 blur-[120px] rounded-full" />
          </div>
          
          <div className="relative z-10 w-full max-w-md bg-white rounded-[40px] p-8 sm:p-12 shadow-2xl text-center space-y-8 animate-scale-up">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg border border-gray-100 overflow-hidden">
                <img src="/logo.png" alt="Aronee's Wears Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold font-display text-slate-brand tracking-tight">
                  Aronee's Wears
                </h1>
                <p className="text-purple-brand font-bold text-xs uppercase tracking-[0.3em]">
                  Style that defines you
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-slate-brand/60 text-sm font-medium leading-relaxed">
                Join our exclusive fashion community for premium wears, personalized updates, and secret discounts!
              </p>
              <div className="flex items-center gap-2 justify-center text-[10px] text-purple-brand font-bold uppercase tracking-wider bg-purple-brand/5 py-2 rounded-xl">
                <AlertCircle className="w-3 h-3" />
                Login is required to browse
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-slate-brand text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-opacity-95 transition-all shadow-xl group"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white p-1 rounded-sm" />
              <span>Enter Storefront</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <p className="text-[10px] text-slate-brand/40 font-medium leading-relaxed">
              By entering, you agree to receive email updates and promotional discounts from Aronee's Wears. You can unsubscribe at any time.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Dynamic Header Component */}
          <Header
            currentView={selectedProductId ? 'shop' : currentView}
            onViewChange={handleViewChange}
            isAdmin={isAdmin}
            user={user}
            onLoginClick={() => handleViewChange('admin')}
            cartCount={cartItemTotalCount}
            onCartToggle={() => setIsCartOpen(!isCartOpen)}
          />

          {/* Main Content Area containing state wrappers */}
          <main className="flex-grow">
            {isInitializing ? (
              <div className="py-24 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-purple-brand animate-spin mx-auto" />
                <p className="text-xs text-slate-brand/50 font-bold uppercase tracking-widest">Hydrating Storefront Configuration...</p>
              </div>
            ) : activeDetailProduct ? (
              /* Render Product Specification Details screen */
              <ProductDetailView
                product={activeDetailProduct}
                allProducts={products}
                categories={categories}
                settings={settings}
                onBack={() => {
                  setSelectedProductId(null);
                  try {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('product');
                    url.searchParams.delete('p');
                    window.history.replaceState({}, '', url.toString());
                  } catch (e) {
                    console.warn('Failed to update URL in onBack:', e);
                  }
                }}
                onSelectProduct={handleSelectProduct}
                whatsappNumber={settings?.whatsappNumber || '+2348123456789'}
                onAddToCart={handleAddToCart}
                onShowToast={showToast}
              />
            ) : (
              /* Render tabbed views */
              <>
                {currentView === 'home' && (
                  <HomeView
                    products={products}
                    categories={categories}
                    onViewChange={handleViewChange}
                    onSelectProduct={handleSelectProduct}
                    onAddToCart={handleAddToCart}
                    whatsappNumber={settings?.whatsappNumber || '+2348123456789'}
                    onShowToast={showToast}
                  />
                )}

                {currentView === 'shop' && (
                  <ShopView
                    products={products}
                    categories={categories}
                    onSelectProduct={handleSelectProduct}
                    onAddToCart={handleAddToCart}
                    onViewChange={handleViewChange}
                  />
                )}

                {currentView === 'about' && <AboutView />}

                {currentView === 'contact' && settings && (
                  <ContactView
                    whatsappNumber={settings.whatsappNumber}
                    contactAddress={settings.contactAddress}
                    contactEmail={settings.contactEmail}
                    instagramUrl={settings.instagramUrl}
                    facebookUrl={settings.facebookUrl}
                    businessHours={settings.businessHours}
                    onShowToast={showToast}
                  />
                )}

                {currentView === 'admin' && (
                  <AdminView
                    user={user}
                    isAdmin={isAdmin}
                    onLogin={handleGoogleLogin}
                    onLogout={handleLogout}
                    products={products}
                    categories={categories}
                    settings={settings}
                    reservations={reservations}
                    onRefreshData={forceRefreshStats}
                  />
                )}

                {currentView === 'account' && (
                  <UserDashboardView
                    user={user}
                    onLogout={handleLogout}
                    onViewChange={handleViewChange}
                  />
                )}
              </>
            )}
          </main>

          {/* FOOTER BLOCK */}
          {settings && (
            <Footer
              onViewChange={handleViewChange}
              whatsappNumber={settings.whatsappNumber}
              contactEmail={settings.contactEmail}
              instagramUrl={settings.instagramUrl}
              facebookUrl={settings.facebookUrl}
            />
          )}
        </>
      )}

      {/* 8. SHOPPING CART / WhatsApp Multiple-Item Draft DRAWER OVERLAY */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none animate-fade-in text-xs font-sans">
          
          {/* Backdrop */}
          <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-3xs" />

          {/* Drawer Body container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-gray-150 animate-slide-left h-full">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-150 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-brand font-display">WhatsApp Order Draft</h3>
                  <p className="text-[10px] text-slate-brand/50 font-medium">Draft multiple shoes and message Aronee's Wears all at once!</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-brand/40 hover:text-red-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Items Center scrolling */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                    <div className="w-16 h-16 bg-gray-brand text-slate-brand/30 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-brand/70 leading-none">Your Order Draft is Empty</p>
                      <p className="text-[10.5px] text-slate-brand/45 leading-relaxed mt-1 max-w-[200px] mx-auto">
                        Browse our sneakers, sandals, and women's heels to add custom sizes here!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item, idx) => (
                      <div key={`${item.product.id}-${item.size}-${idx}`} className="flex items-start space-x-3 bg-gray-brand/60 border border-gray-150/40 p-3 rounded-2xl relative font-sans">
                        
                        {/* Thumbnail */}
                        <img
                          src={item.product.images[0]}
                          alt=""
                          className="w-12 h-12 object-cover rounded-xl shrink-0 border border-gray-200"
                        />
                        
                        {/* Summary details */}
                        <div className="flex-1 space-y-1">
                          <p className="font-bold text-slate-brand line-clamp-1 pr-6 leading-tight">{item.product.name}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {item.product.category !== 'bags' && (
                              <span className="bg-purple-brand/10 text-purple-brand text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                                Size: {item.size}
                              </span>
                            )}
                            <span className="text-[10.5px] font-bold text-slate-brand font-mono">
                              &#8358;{item.product.price.toLocaleString()}
                            </span>
                          </div>

                          {/* Plus minus operators */}
                          <div className="flex items-center space-x-2 pt-1">
                            <button
                              onClick={() => handleUpdateCartQty(idx, -1)}
                              className="w-5 h-5 rounded-md bg-white border border-gray-250 text-[10px] font-bold flex items-center justify-center cursor-pointer hover:border-purple-brand"
                            >
                              -
                            </button>
                            <span className="font-bold text-xs px-1 text-slate-brand">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateCartQty(idx, 1)}
                              className="w-5 h-5 rounded-md bg-white border border-gray-250 text-[10px] font-bold flex items-center justify-center cursor-pointer hover:border-purple-brand"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Direct Removal button */}
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="absolute top-2.5 right-2.5 p-1 text-slate-brand/35 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer summary & WhatsApp launch */}
              <div className="p-6 border-t border-gray-150 bg-gray-brand space-y-4">
                
                {cartItems.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-medium text-slate-brand/60">
                      <span>Standard Items Qty:</span>
                      <span className="font-mono">{cartItemTotalCount} items</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-slate-brand pt-1 border-t border-gray-250/50">
                      <span>Consolidated Estimate:</span>
                      <span className="font-mono text-purple-brand text-base">&#8358; {cartItemsTotalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  disabled={cartItems.length === 0}
                  onClick={() => setShowCartDeliveryInfo(true)}
                  className="w-full bg-purple-brand disabled:bg-gray-400 text-white font-bold text-xs sm:text-sm tracking-widest uppercase py-4 rounded-full shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-5 h-5 fill-white stroke-none shrink-0" />
                  <span>Send Order Draft to WhatsApp</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </button>

                <p className="text-[10px] text-slate-brand/40 text-center leading-relaxed">
                  Clicking will consolidate your selection, close this drawer, and navigate to WhatsApp to finalize payment terms securely!
                </p>
              </div>

            </div>
          </div>
          
        </div>
      )}

      {/* Cart Delivery Info Modal */}
      {showCartDeliveryInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-brand/80 backdrop-blur-sm animate-fade-in text-xs font-sans">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="bg-purple-brand p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold font-display uppercase tracking-widest text-sm">Delivery Information</h3>
              </div>
              <button onClick={() => setShowCartDeliveryInfo(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-purple-brand font-bold text-xs font-mono">01</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-brand text-xs uppercase tracking-wider mb-1">Within Lagos</h4>
                    <p className="text-xs text-slate-brand/60 leading-relaxed font-medium">Estimated arrival in <span className="text-purple-brand font-bold">{settings?.deliveryLagos || '2-3 days'}</span> after confirmation.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-purple-brand font-bold text-xs font-mono">02</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-brand text-xs uppercase tracking-wider mb-1">Outside Lagos</h4>
                    <p className="text-xs text-slate-brand/60 leading-relaxed font-medium">Estimated arrival in <span className="text-purple-brand font-bold">{settings?.deliveryOutside || '4-5 days'}</span> after confirmation.</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Your product is currently <strong>reserved for 30 minutes</strong>. 
                  Send the WhatsApp message to get payment details and secure your items!
                </p>
              </div>

              <button 
                onClick={handleLaunchWhatsAppMultipleOrder}
                className="w-full bg-purple-brand text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 fill-white stroke-none" />
                <span>Confirm & Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SUPPORT BUTTON */}
      <WhatsAppButton phoneNumber={settings?.whatsappNumber} onShowToast={showToast} />

      {/* WELCOME VIEW FOR NEW USERS */}
      {showWelcome && (
        <WelcomeView 
          onClose={() => setShowWelcome(false)} 
        />
      )}

      {/* SUCCESS TOAST NOTIFICATION */}
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

    </div>
  );
}
