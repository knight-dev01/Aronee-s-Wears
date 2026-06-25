import React, { useState, useRef } from 'react';
import { 
  Plus, Edit, Trash2, LayoutDashboard, ShoppingCart, FolderTree, AlertTriangle, 
  Settings, LogOut, CheckCircle, HelpCircle, Save, X, RefreshCw, Database,
  Image as ImageIcon, Upload, Loader2, Camera, Clock, Check, Ban
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { addDoc, doc, updateDoc, deleteDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { Product, Category, StoreSettings, Reservation } from '../types';
import { forceResetDatabase } from '../data/seed';
import { formatRelativeTime } from '../lib/time';
import { RelativeTime } from './RelativeTime';
import BulkUpload from './BulkUpload';

interface AdminViewProps {
  user: FirebaseUser | null;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  products: Product[];
  categories: Category[];
  settings: StoreSettings | null;
  reservations?: Reservation[];
  onRefreshData: () => Promise<void>;
}

export default function AdminView({
  user,
  isAdmin,
  onLogin,
  onLogout,
  products,
  categories,
  settings,
  reservations = [],
  onRefreshData
}: AdminViewProps) {
  
  // Dashboard navigation sub-state
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'inventory' | 'reservations' | 'settings'>('overview');

  // Load Status feedback
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Forms / Modal state
  const [productEditing, setProductEditing] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  
  const [categoryEditing, setCategoryEditing] = useState<Category | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

  // Product Form Input field binds
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodImages, setProdImages] = useState<string>('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodStock, setProdStock] = useState<number>(0);
  const [prodFeatured, setProdFeatured] = useState<boolean>(false);
  const [prodStatus, setProdStatus] = useState<'active' | 'draft' | 'out_of_stock'>('active');
  const [prodDiscountPrice, setProdDiscountPrice] = useState<string>('');
  const [prodSizes, setProdSizes] = useState<string>('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'category') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Image Compression
      const options = {
        maxSizeMB: 0.8, // Max 800KB for mobile efficiency
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Upload to Firebase Storage
      const storageRef = ref(storage, `${target === 'product' ? 'products' : 'categories'}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          displayNotice('Failed to upload image. Please try again.');
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (target === 'product') {
            setProdImages(prev => prev ? `${prev}, ${downloadURL}` : downloadURL);
          } else {
            setCatImage(downloadURL);
          }
          setIsUploading(false);
          setUploadProgress(0);
          displayNotice('Image optimized and uploaded successfully!');
        }
      );
    } catch (error) {
      console.error('Compression error:', error);
      displayNotice('Failed to process image.');
      setIsUploading(false);
    }
  };

  // Category Form Input field binds
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');

  // Settings editable forms
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(null);

  const displayNotice = (message: string) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  const photoInputRefSingle = useRef<HTMLInputElement>(null);

  const handleMultiPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const compressionOptions = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    };

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await imageCompression(file, compressionOptions);
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, compressedFile);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadUrl);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      const existingUrls = prodImages ? prodImages.split(',').map(s => s.trim()).filter(s => s !== '') : [];
      setProdImages([...existingUrls, ...uploadedUrls].join(', '));
      displayNotice(`Successfully uploaded ${files.length} photos!`);
    } catch (err) {
      console.error(err);
      displayNotice('Failed to upload some photos.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (photoInputRefSingle.current) photoInputRefSingle.current.value = '';
    }
  };

  const removeSingleImage = (index: number) => {
    const existingUrls = prodImages ? prodImages.split(',').map(s => s.trim()).filter(s => s !== '') : [];
    existingUrls.splice(index, 1);
    setProdImages(existingUrls.join(', '));
  };

  // Setup Product Inputs for Add or Edit
  const openProductForm = (prod: Product | null = null) => {
    if (prod) {
      setProductEditing(prod);
      setProdName(prod.name);
      setProdDesc(prod.description);
      setProdPrice(prod.price);
      setProdImages(prod.images.join(', '));
      setProdCategory(prod.category);
      setProdStock(prod.stock);
      setProdFeatured(prod.featured);
      setProdStatus(prod.status);
      setProdDiscountPrice(prod.discountPrice ? String(prod.discountPrice) : '');
      setProdSizes(prod.sizes ? prod.sizes.join(', ') : '');
    } else {
      setProductEditing(null);
      setProdName('');
      setProdDesc('');
      setProdPrice(15000);
      setProdDiscountPrice('');
      setProdSizes('38, 39, 40, 41, 42, 43, 44, 45');
      setProdImages('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80');
      setProdCategory(categories[0]?.id || 'sneakers');
      setProdStock(10);
      setProdFeatured(false);
      setProdStatus('active');
    }
    setIsProductFormOpen(true);
  };

  // Submit Product Form Changes
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    const preparedImages = prodImages.split(',').map(img => img.trim()).filter(img => img.length > 0);
    const preparedSizes = prodSizes.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    const productPayload = {
      name: prodName,
      description: prodDesc,
      price: Number(prodPrice),
      discountPrice: prodDiscountPrice ? Number(prodDiscountPrice) : null,
      images: preparedImages.length > 0 ? preparedImages : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
      category: prodCategory,
      stock: Number(prodStock),
      featured: prodFeatured,
      status: prodStatus,
      sizes: preparedSizes,
      updatedAt: serverTimestamp()
    };

    try {
      if (productEditing) {
        // Edit mode
        const pRef = doc(db, 'products', productEditing.id);
        await updateDoc(pRef, productPayload);
        displayNotice('Successfully updated product catalog!');
      } else {
        // Create Mode
        const productsColRef = collection(db, 'products');
        await addDoc(productsColRef, {
          ...productPayload,
          createdAt: serverTimestamp()
        });
        displayNotice('Successfully created and listed product!');
      }
      setIsProductFormOpen(false);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      alert('Error updating product: Check security rules or inputs.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete product trigger
  const handleProductDelete = async (prodId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this product? This action is irreversible.')) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'products', prodId));
      displayNotice('Product deleted from inventory.');
      await onRefreshData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${prodId}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Category operations
  const openCategoryForm = (cat: Category | null = null) => {
    if (cat) {
      setCategoryEditing(cat);
      setCatName(cat.name);
      setCatImage(cat.image);
    } else {
      setCategoryEditing(null);
      setCatName('');
      setCatImage('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80');
    }
    setIsCategoryFormOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    // Create safe alphanumeric category ID
    const catId = categoryEditing ? categoryEditing.id : catName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const categoryPayload = {
      name: catName,
      image: catImage,
      productCount: categoryEditing ? categoryEditing.productCount : 0,
      createdAt: categoryEditing ? categoryEditing.createdAt : serverTimestamp()
    };

    try {
      if (categoryEditing) {
        await updateDoc(doc(db, 'categories', categoryEditing.id), categoryPayload);
        displayNotice('Category details updated!');
      } else {
        const catRef = doc(db, 'categories', catId);
        // Write manually assigning doc ID
        const batchPayload = {
          name: catName,
          image: catImage,
          productCount: 0,
          createdAt: serverTimestamp()
        };
        await updateDoc(catRef, batchPayload).catch(async () => {
          // If update fails due to document not existing, create it
          const docRef = doc(db, 'categories', catId);
          await updateDoc(docRef, batchPayload);
        });
        displayNotice('New category catalog registered!');
      }
      setIsCategoryFormOpen(false);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      alert('Error updating category. Check connection state.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCategoryDelete = async (catId: string) => {
    if (!window.confirm('Deleting this category will orphan products in this catalog. Continue?')) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'categories', catId));
      displayNotice('Category reference deleted.');
      await onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Seeder force reset trigger
  const handleDatabaseReset = async () => {
    if (!window.confirm('WARNING: This will wipe all existing store products and categories and replace them with default premium Lagos items. Proceed?')) return;
    setActionLoading(true);
    try {
      const res = await forceResetDatabase();
      if (res) {
        displayNotice('Database successfully re-seeded with default wears catalogs!');
        await onRefreshData();
      } else {
        alert('Encountered an issue seeding. Ensure your auth has admin permissions.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Save Settings Modification
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'settings', 'current'), {
        whatsappNumber: settingsForm.whatsappNumber,
        contactAddress: settingsForm.contactAddress,
        contactEmail: settingsForm.contactEmail,
        instagramUrl: settingsForm.instagramUrl,
        facebookUrl: settingsForm.facebookUrl,
        businessHours: settingsForm.businessHours,
        deliveryLagos: settingsForm.deliveryLagos,
        deliveryOutside: settingsForm.deliveryOutside
      });
      displayNotice('Global store settings locked successfully!');
      await onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSale = async (res: Reservation) => {
    setActionLoading(true);
    try {
      // 1. Mark reservation as confirmed
      await updateDoc(doc(db, 'reservations', res.id), { status: 'confirmed' });
      
      // 2. Decrement stock permanently (it was already reserved, so we don't need to decrement again 
      // if our logic treats reserved as 'out of stock' for others. 
      // Actually, my plan was: WhatsApp Click -> Create Reservation (status: pending, decrement product stock by 1).
      // So if status confirmed, we just leave stock as is.
      // If status cancelled/expired, we increment stock back.
      
      displayNotice(`Sale confirmed for ${res.productName}!`);
      await onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async (res: Reservation) => {
    setActionLoading(true);
    try {
      // 1. Mark reservation as cancelled
      await updateDoc(doc(db, 'reservations', res.id), { status: 'cancelled' });
      
      // 2. Restore stock
      await updateDoc(doc(db, 'products', res.productId), {
        stock: increment(res.quantity)
      });
      
      displayNotice(`Reservation cancelled and stock restored for ${res.productName}.`);
      await onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const initSettingsForm = () => {
    if (settings) {
      setSettingsForm({ ...settings });
    }
  };

  // Secure locked view gate
  if (!user || !isAdmin) {
    return (
      <div id="admin-security-gate" className="max-w-md mx-auto my-20 px-4">
        <div className="bg-white border border-gray-150 rounded-3xl p-8 text-center space-y-6 shadow-md select-none">
          <div className="w-16 h-16 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Settings className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold font-display text-slate-brand">
              Admin Access Required
            </h1>
            <p className="text-xs text-slate-brand/60 font-medium leading-relaxed">
              Management of stock, categories, images, and pricing is strictly restricted to verified store administrators.
            </p>
          </div>

          <div className="p-4 bg-purple-brand/5 border border-purple-brand/15 rounded-xl text-left space-y-1 text-xs text-purple-950 font-medium">
            <p className="font-bold">Authorized Accounts:</p>
            <p className="font-mono text-[11px]">greatifet12@gmail.com</p>
            <p className="font-mono text-[11px]">aroneefashion@gmail.com</p>
            <p className="text-[10px] text-slate-brand/50 mt-1 block">Please log in using an authorized store administrator email address profile.</p>
          </div>

          <hr className="border-gray-100" />

          <button
            onClick={onLogin}
            className="w-full bg-purple-brand text-white font-bold text-sm tracking-widest uppercase py-4 rounded-xl shadow-md transition-all hover:bg-opacity-95 cursor-pointer flex items-center justify-center space-x-2.5"
          >
            <span>Sign In with Google</span>
          </button>
        </div>
      </div>
    );
  }

  // Admin state calculations
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const featuredCount = products.filter(p => p.featured).length;
  const outOfStockItems = products.filter(p => p.stock === 0 || p.status === 'out_of_stock');
  const lowStockThreshold = 4;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;

  return (
    <div id="admin-workspace" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200 mb-8">
        <div>
          <span className="text-[10px] font-bold text-purple-brand font-mono uppercase tracking-widest leading-none">Console Control</span>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-brand">
            Shop Storefront Dashboard
          </h1>
          <p className="text-xs text-slate-brand/50 font-medium">
            Welcome, logged in as <span className="font-bold text-slate-brand">{user.email}</span>
          </p>
        </div>

        <button
          onClick={onLogout}
          className="bg-gray-brand hover:bg-red-50 text-slate-brand hover:text-red-700 font-bold text-xs px-4 py-2.5 rounded-xl tracking-wider uppercase border border-gray-200 hover:border-red-200 cursor-pointer transition-all flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 p-4 rounded-r-2xl mb-8 flex items-center space-x-3 text-xs leading-none shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Tabs list navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
        {[
          { label: 'Overview', value: 'overview' as const, icon: LayoutDashboard },
          { label: 'Products', value: 'products' as const, icon: ShoppingCart },
          { label: 'Reservations', value: 'reservations' as const, icon: Clock },
          { label: 'Categories', value: 'categories' as const, icon: FolderTree },
          { label: 'Stock Alerts', value: 'inventory' as const, icon: AlertTriangle },
          { label: 'Contact Settings', value: 'settings' as const, icon: Settings }
        ].map((t) => {
          const isSelected = activeTab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => {
                setActiveTab(t.value);
                if (t.value === 'settings' && !settingsForm) initSettingsForm();
              }}
              className={`flex items-center space-x-2 text-xs font-bold py-2.5 px-4.5 rounded-xl tracking-wider uppercase transition-all cursor-pointer ${
                isSelected
                  ? 'bg-purple-brand text-white shadow-sm font-bold'
                  : 'bg-gray-brand text-slate-brand hover:bg-purple-brand/5'
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE TAB */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-10 animate-fade-in">
          
          {/* Bento grids display stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-brand/40 uppercase tracking-widest block font-sans">Listed Wears</span>
              <p className="text-3xl font-extrabold font-mono text-slate-brand">{totalProducts}</p>
              <p className="text-[10px] text-slate-brand/50 font-medium">Active products inside DB</p>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-brand/40 uppercase tracking-widest block font-sans">Active Catalogs</span>
              <p className="text-3xl font-extrabold font-mono text-slate-brand">{totalCategories}</p>
              <p className="text-[10px] text-slate-brand/50 font-medium">Distinct category folders</p>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-brand/40 uppercase tracking-widest block font-sans">Featured Items</span>
              <p className="text-3xl font-extrabold font-mono text-purple-brand">{featuredCount}</p>
              <p className="text-[10px] text-slate-brand/50 font-medium">Highlighted on home carousel</p>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-red-600/80 uppercase tracking-widest block font-sans">Shortages / sold out</span>
              <p className="text-3xl font-extrabold font-mono text-red-600">{outOfStockItems.length + lowStockCount}</p>
              <p className="text-[10px] text-red-600/70 font-bold uppercase tracking-wider">Requires attention</p>
            </div>

          </div>

          {/* Database maintenance settings card */}
          <div className="bg-gray-brand border border-gray-200/80 p-8 rounded-3xl space-y-5">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-brand">
                Technical Seeder Maintenance
              </h3>
              <p className="text-xs text-slate-brand/60 font-medium leading-relaxed">
                If your database is completely blank or you want to return to default elegant sneakers/heels mock data for demonstration, use this trigger!
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                disabled={actionLoading}
                onClick={handleDatabaseReset}
                className="bg-purple-brand/15 hover:bg-purple-brand/25 text-purple-brand font-bold text-xs py-3 px-6 rounded-xl transition-all tracking-wider uppercase flex items-center space-x-2 border border-purple-brand/10 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Force Reset Database to Lagos Demos</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PRODUCTS TABLE */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex justify-between items-center sm:gap-2 border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-brand font-display">Manage Wears Inventory</h3>
              <p className="text-[10.5px] text-slate-brand/55">Create customized listings, set prices, and update stock counts.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsBulkUploadOpen(true)}
                className="bg-gray-brand text-slate-brand hover:text-purple-brand font-bold text-xs py-2.5 px-4.5 rounded-xl flex items-center space-x-1 uppercase tracking-wider shadow-sm cursor-pointer border border-gray-200 transition-all hover:bg-gray-100"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk Upload</span>
                <span className="sm:hidden">Bulk</span>
              </button>
              <button
                onClick={() => openProductForm()}
                className="bg-purple-brand text-white font-bold text-xs py-2.5 px-4.5 rounded-xl flex items-center space-x-1 uppercase tracking-wider shadow-sm cursor-pointer transition-all hover:bg-opacity-90"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
            {products.length === 0 ? (
              <div className="p-10 text-center text-slate-brand/50 text-sm">No wears products listed yet. Seed database!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-brand border-b border-gray-100 text-slate-brand/70 font-semibold uppercase tracking-wider">
                      <th className="p-4">Shoe</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Pricing</th>
                      <th className="p-4">Discount</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Updated</th>
                      <th className="p-4">Featured</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {products.map((p) => {
                      const cName = categories.find(c => c.id === p.category)?.name || p.category;
                      const updateTime = p.updatedAt?.seconds 
                        ? new Date(p.updatedAt.seconds * 1000).toLocaleDateString('en-GB') 
                        : 'N/A';
                      return (
                        <tr key={p.id} className="hover:bg-gray-brand/50 transition-colors">
                          <td className="p-4 flex items-center space-x-3 max-w-xs">
                            <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg bg-gray-100 shrink-0 border border-gray-200" referrerPolicy="no-referrer" />
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-brand line-clamp-1">{p.name}</span>
                              <span className="text-[9px] text-slate-brand/40 uppercase font-bold tracking-tighter">
                                {p.sizes?.join(', ') || 'Standard'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-brand/70 uppercase font-mono tracking-wider">{cName}</td>
                          <td className="p-4 font-mono font-bold text-slate-brand">₦{p.price.toLocaleString()}</td>
                          <td className="p-4 font-mono font-bold">
                            {p.discountPrice ? (
                              <span className="text-emerald-600">₦{p.discountPrice.toLocaleString()}</span>
                            ) : (
                              <span className="text-slate-brand/30">None</span>
                            )}
                          </td>
                          <td className={`p-4 font-mono font-bold ${p.stock === 0 ? 'text-red-600' : 'text-slate-brand'}`}>
                            {p.stock}
                          </td>
                          <td className="p-4 text-slate-brand/50 font-mono text-[10px]">
                            <RelativeTime date={p.updatedAt || p.createdAt} />
                          </td>
                          <td className="p-4">
                            {p.featured ? (
                              <span className="bg-purple-brand/10 text-purple-brand px-2 py-0.5 rounded-full text-[9px] font-bold">YES</span>
                            ) : (
                              <span className="text-slate-brand/35 text-[9px]">NO</span>
                            )}
                          </td>
                          <td className="p-4 uppercase">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              p.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              p.status === 'out_of_stock' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-slate-brand/70'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openProductForm(p)}
                              className="p-1.5 bg-gray-brand text-slate-brand hover:text-purple-brand rounded-lg transition-colors cursor-pointer inline-block"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleProductDelete(p.id)}
                              className="p-1.5 bg-gray-brand text-slate-brand hover:text-red-700 rounded-lg transition-colors cursor-pointer inline-block"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: CATEGORIES TABLE */}
      {activeTab === 'categories' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex justify-between items-center sm:gap-2 border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-brand font-display">Manage Categories</h3>
              <p className="text-[10.5px] text-slate-brand/55 font-sans">Set distinct wears segments, banners and track calculated catalogs.</p>
            </div>
            <button
              onClick={() => openCategoryForm()}
              className="bg-purple-brand text-white font-bold text-xs py-2.5 px-4.5 rounded-xl flex items-center space-x-1 uppercase tracking-wider shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
            {categories.length === 0 ? (
              <div className="p-10 text-center text-slate-brand/50 text-sm">No distinct categories registered yet. Seeder active!</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-gray-brand border-b border-gray-100 text-slate-brand/70 font-semibold uppercase tracking-wider">
                    <th className="p-4">Cover Image</th>
                    <th className="p-4">Alphanumeric ID</th>
                    <th className="p-4">Category Name</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-brand/50 transition-colors">
                      <td className="p-4">
                        <img src={c.image} alt="" className="w-12 h-10 object-cover rounded-lg border border-gray-100" referrerPolicy="no-referrer" />
                      </td>
                      <td className="p-4 font-mono font-bold text-purple-brand">{c.id}</td>
                      <td className="p-4 text-slate-brand uppercase tracking-wide text-xs font-bold">{c.name}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openCategoryForm(c)}
                          className="p-1.5 bg-gray-brand text-slate-brand hover:text-purple-brand rounded-lg transition-colors cursor-pointer inline-block"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleCategoryDelete(c.id)}
                          className="p-1.5 bg-gray-brand text-slate-brand hover:text-red-700 rounded-lg transition-colors cursor-pointer inline-block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: LOW STOCK ALERTS */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-brand font-display">Inventory Deficiencies Tracking</h3>
            <p className="text-[10.5px] text-slate-brand/55 font-sans">Highlights products that are either Sold Out or nearing low threshold bounds (less than 4 items left).</p>
          </div>

          {outOfStockItems.length + lowStockCount === 0 ? (
            <div className="py-12 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-center space-y-2 select-none">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm">Stock Levels 100% Satisfactory</p>
              <p className="text-xs text-emerald-700/80">No deficiencies, empty stock lines, or low bounds detected across catalog items.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Sold Out section */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center space-x-2 text-red-650 font-bold border-b border-red-50 pb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-display uppercase text-xs tracking-wider">Out of Stock & Sold Out ({outOfStockItems.length})</span>
                </div>
                {outOfStockItems.length === 0 ? (
                  <p className="text-xs text-slate-brand/50">No items Sold Out!</p>
                ) : (
                  <div className="space-y-2.5">
                    {outOfStockItems.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-red-50/50 p-2.5 rounded-lg border border-red-50 text-xs">
                        <span className="font-bold text-red-950 truncate max-w-xs">{p.name}</span>
                        <button onClick={() => openProductForm(p)} className="text-[10px] bg-red-100 text-red-800 px-2.5 py-1 rounded-md font-bold hover:bg-red-200">
                          Re-Stock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Low stock indicators */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center space-x-2 text-amber-650 font-bold border-b border-amber-50 pb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="font-display uppercase text-xs tracking-wider">Low Stock Warnings ({lowStockCount})</span>
                </div>
                {lowStockCount === 0 ? (
                  <p className="text-xs text-slate-brand/50">No stock warnings!</p>
                ) : (
                  <div className="space-y-2.5">
                    {products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-amber-50/30 p-2.5 rounded-lg border border-amber-50/80 text-xs">
                        <div>
                          <p className="font-bold text-slate-brand line-clamp-1">{p.name}</p>
                          <p className="text-[9.5px] text-amber-700 font-mono font-bold leading-none mt-0.5">Stock Left: {p.stock} Units</p>
                        </div>
                        <button onClick={() => openProductForm(p)} className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md font-bold">
                          Add Stock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-brand font-display">Active WhatsApp Reservations</h3>
            <p className="text-[10.5px] text-slate-brand/55 font-sans">
              Track products temporarily held when customers click "Order via WhatsApp". 
              Reservations expire in 30 minutes.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
            {reservations.length === 0 ? (
              <div className="p-10 text-center text-slate-brand/50 text-sm">No active or recent reservations.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-brand border-b border-gray-100 text-slate-brand/70 font-semibold uppercase tracking-wider">
                      <th className="p-4">Product</th>
                      <th className="p-4">Qty</th>
                      <th className="p-4">Time Created</th>
                      <th className="p-4">Expires In</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {reservations.map((res) => {
                      const now = new Date();
                      const expiry = res.expiresAt?.toDate ? res.expiresAt.toDate() : new Date(res.expiresAt as any);
                      const diffMs = expiry.getTime() - now.getTime();
                      const diffMin = Math.max(0, Math.floor(diffMs / 60000));
                      const isExpired = diffMs <= 0 && res.status === 'pending';
                      
                      return (
                        <tr key={res.id} className={`hover:bg-gray-brand/50 transition-colors ${isExpired ? 'opacity-50' : ''}`}>
                          <td className="p-4 font-bold text-slate-brand">{res.productName}</td>
                          <td className="p-4 font-mono">{res.quantity}</td>
                          <td className="p-4 text-slate-brand/50">
                            <RelativeTime date={res.createdAt} />
                          </td>
                          <td className="p-4">
                            {res.status === 'pending' ? (
                              <span className={`font-bold ${diffMin < 5 ? 'text-red-600 animate-pulse' : 'text-slate-brand'}`}>
                                {isExpired ? 'Expired' : `${diffMin} mins`}
                              </span>
                            ) : (
                              <span className="text-slate-brand/30">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              res.status === 'pending' ? (isExpired ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-800') :
                              res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isExpired ? 'Expired' : res.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {res.status === 'pending' && !isExpired && (
                              <>
                                <button
                                  onClick={() => handleConfirmSale(res)}
                                  className="bg-emerald-600 text-white p-1 rounded-lg hover:bg-emerald-700 transition-colors"
                                  title="Confirm Sale"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCancelReservation(res)}
                                  className="bg-red-600 text-white p-1 rounded-lg hover:bg-red-700 transition-colors"
                                  title="Cancel Reservation"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: LOW STOCK ALERTS handled above as TAB 4 */}

      {/* TAB 6: CONTACTS AND WHATSAPP SETTINGS */}
      {activeTab === 'settings' && settingsForm && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl bg-white border border-gray-100 p-8 rounded-3xl shadow-xs animate-fade-in font-sans leading-relaxed">
          
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-brand font-display">Configure Global Contacts & Channels</h3>
            <p className="text-[10.5px] text-slate-brand/55">This binds global WhatsApp link generations, social networks, opening hours, and checkout configurations.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-brand/75 uppercase tracking-wide">WhatsApp Phone Number</label>
              <input
                type="text"
                required
                value={settingsForm.whatsappNumber}
                onChange={e => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                className="w-full bg-gray-brand border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-brand outline-none focus:border-purple-brand transition-all"
              />
              <span className="text-[9px] text-slate-brand/50 font-medium block">Complete with country code (e.g., +2348123456789)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-brand/75 uppercase tracking-wide">Contact Email Address</label>
              <input
                type="email"
                required
                value={settingsForm.contactEmail}
                onChange={e => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                className="w-full bg-gray-brand border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-brand outline-none focus:border-purple-brand transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-brand/75 uppercase tracking-wide">Delivery (Lagos)</label>
              <input
                type="text"
                required
                value={settingsForm.deliveryLagos}
                onChange={e => setSettingsForm({ ...settingsForm, deliveryLagos: e.target.value })}
                placeholder="2-3 days"
                className="w-full bg-gray-brand border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-brand outline-none focus:border-purple-brand transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-brand/75 uppercase tracking-wide">Delivery (Outside Lagos)</label>
              <input
                type="text"
                required
                value={settingsForm.deliveryOutside}
                onChange={e => setSettingsForm({ ...settingsForm, deliveryOutside: e.target.value })}
                placeholder="4-5 days"
                className="w-full bg-gray-brand border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-brand outline-none focus:border-purple-brand transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-brand/75 uppercase tracking-wide">Physical Store Address</label>
              <textarea
                required
                rows={2}
                value={settingsForm.contactAddress}
                onChange={e => setSettingsForm({ ...settingsForm, contactAddress: e.target.value })}
                className="w-full bg-gray-brand border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-brand outline-none focus:border-purple-brand transition-all font-sans leading-relaxed"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-brand/75 uppercase tracking-wide">Business Operating Hours</label>
              <input
                type="text"
                required
                value={settingsForm.businessHours}
                onChange={e => setSettingsForm({ ...settingsForm, businessHours: e.target.value })}
                className="w-full bg-gray-brand border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-brand outline-none focus:border-purple-brand transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-brand/75 uppercase tracking-wide">Instagram Profile Link</label>
              <input
                type="url"
                required
                value={settingsForm.instagramUrl}
                onChange={e => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                className="w-full bg-gray-brand border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-brand outline-none focus:border-purple-brand transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-brand/75 uppercase tracking-wide">Facebook Link</label>
              <input
                type="url"
                required
                value={settingsForm.facebookUrl}
                onChange={e => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                className="w-full bg-gray-brand border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-brand outline-none focus:border-purple-brand transition-all"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="bg-purple-brand text-white font-bold text-xs py-3 px-8 rounded-xl tracking-wider uppercase shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>
      )}

      {/* DETAILED FORM MODAL: PRODUCTS EDIT/CREATE */}
      {isBulkUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center animate-fade-in font-sans">
          <div className="bg-white w-full h-full shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            <div className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-brand text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-brand font-display uppercase tracking-widest text-sm">Professional Bulk Indexing</h3>
                  <p className="text-[10px] text-slate-brand/40 font-bold uppercase">Multi-product staging environment</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkUploadOpen(false)} 
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-slate-brand/30 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-brand/30">
              <BulkUpload 
                categories={categories} 
                onSuccess={async () => {
                  await onRefreshData();
                  setIsBulkUploadOpen(false);
                }} 
                onClose={() => setIsBulkUploadOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {isProductFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base sm:text-lg text-slate-brand font-display">
                {productEditing ? 'Update Item Specifications' : 'List New Wear Item'}
              </h3>
              <button onClick={() => setIsProductFormOpen(false)} className="p-1 text-slate-brand/50 hover:text-red-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-sans leading-relaxed">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-brand/85 uppercase">Product Name</label>
                  <input
                    type="text" required placeholder="e.g. Classic Suede Slip-ons"
                    value={prodName} onChange={e => setProdName(e.target.value)}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand outline-none focus:border-purple-brand transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-brand/85 uppercase">Product Description</label>
                  <textarea
                    required rows={3} placeholder="Describe wears materials, styles, sizing guidelines..."
                    value={prodDesc} onChange={e => setProdDesc(e.target.value)}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand outline-none focus:border-purple-brand transition-all leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-brand/85 uppercase">Base Price (₦)</label>
                  <input
                    type="number" required min="0"
                    value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand font-semibold underline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-brand/85 uppercase">Discount Price (₦)</label>
                  <input
                    type="number" min="0" placeholder="Optional"
                    value={prodDiscountPrice} onChange={e => setProdDiscountPrice(e.target.value)}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-emerald-600 font-semibold underline-none font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-brand/85 uppercase">Available Sizes</label>
                  <input
                    type="text" placeholder="e.g. 38, 39, 40, 41 (comma separated)"
                    value={prodSizes} onChange={e => setProdSizes(e.target.value)}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand font-semibold outline-none focus:border-purple-brand transition-all"
                  />
                  <p className="text-[9px] text-slate-brand/40 font-medium">Leave blank for categories where size doesn't apply (e.g. bags).</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-brand/85 uppercase">Inventory Count</label>
                  <input
                    type="number" required min="0"
                    value={prodStock} onChange={e => setProdStock(Number(e.target.value))}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand font-semibold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-brand/85 uppercase">Item Category</label>
                  <select
                    value={prodCategory} onChange={e => setProdCategory(e.target.value)}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand font-semibold outline-none"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-brand/85 uppercase">Status Visibility</label>
                  <select
                    value={prodStatus} onChange={e => setProdStatus(e.target.value as any)}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand font-semibold outline-none"
                  >
                    <option value="active">Active (Public)</option>
                    <option value="draft">Draft (Admin hidden)</option>
                    <option value="out_of_stock">Out Of Stock</option>
                  </select>
                </div>

                {/* Multi-Photo Gallery Picker */}
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-brand/85 uppercase">Product Gallery</label>
                    <button
                      type="button"
                      onClick={() => photoInputRefSingle.current?.click()}
                      className="text-[10px] font-bold text-purple-brand hover:underline flex items-center gap-1 uppercase tracking-widest cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Add from Gallery
                    </button>
                  </div>

                  <input 
                    type="file" 
                    ref={photoInputRefSingle} 
                    onChange={handleMultiPhotoUpload} 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                  />

                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {prodImages.split(',').map(s => s.trim()).filter(s => s !== '').map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group shadow-xs">
                        <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => removeSingleImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {isUploading ? (
                      <div className="aspect-square rounded-2xl border-2 border-dashed border-purple-brand/20 bg-purple-brand/5 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 text-purple-brand animate-spin" />
                        <span className="text-[8px] font-bold text-purple-brand">{Math.round(uploadProgress)}%</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => photoInputRefSingle.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-purple-brand hover:bg-purple-brand/5 transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
                      >
                        <Plus className="w-5 h-5 text-gray-300 group-hover:text-purple-brand" />
                        <span className="text-[9px] font-bold text-gray-400 group-hover:text-purple-brand uppercase">Add</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-brand/85 uppercase">Image Gallery URLs (comma separated)</label>
                  <textarea
                    required rows={2} placeholder="https://unsplash.com/... , https://unsplash.com/..."
                    value={prodImages} onChange={e => setProdImages(e.target.value)}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-[10.5px] text-slate-brand leading-relaxed outline-none focus:border-purple-brand"
                  />
                </div>

                <div className="sm:col-span-2 py-1 bg-gray-brand/50 rounded-xl px-4 flex items-center space-x-3 select-none">
                  <input
                    type="checkbox" id="check-featured"
                    checked={prodFeatured} onChange={e => setProdFeatured(e.target.checked)}
                    className="w-4 h-4 text-purple-brand border-gray-300 focus:ring-purple-brand rounded cursor-pointer"
                  />
                  <label htmlFor="check-featured" className="font-bold cursor-pointer text-slate-brand/70 uppercase">
                    Mark as Featured Product (Highlight on home showcase)
                  </label>
                </div>

              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3.5">
                <button
                  type="button" onClick={() => setIsProductFormOpen(false)}
                  className="bg-gray-brand text-slate-brand font-bold py-2.5 px-5 rounded-xl border border-gray-200 text-xs tracking-wider uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="bg-purple-brand text-white font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase shadow-md hover:bg-opacity-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{productEditing ? 'Apply Edit' : 'Save & Publish'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAILED FORM MODAL: CATEGORIES EDIT/CREATE */}
      {isCategoryFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base sm:text-lg text-slate-brand font-display">
                {categoryEditing ? 'Edit Category Details' : 'Register New Category'}
              </h3>
              <button onClick={() => setIsCategoryFormOpen(false)} className="p-1 text-slate-brand/50 hover:text-red-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs font-sans leading-relaxed">
              
              <div className="space-y-1.5">
                <label className="font-bold text-slate-brand/85 uppercase">Category Name</label>
                <input
                  type="text" required placeholder="e.g. Handmade Mules"
                  value={catName} onChange={e => setCatName(e.target.value)}
                  className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand outline-none focus:border-purple-brand transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-brand/85 uppercase flex justify-between items-center">
                  <span>Cover Image Banner URL</span>
                  <label className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${isUploading ? 'bg-gray-100 text-gray-400' : 'bg-purple-brand text-white hover:bg-purple-brand/90'}`}>
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                    {isUploading ? `${Math.round(uploadProgress)}%` : 'Upload Banner'}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'category')} disabled={isUploading} />
                  </label>
                </label>
                <input
                  type="url" required placeholder="https://images.unsplash.com/..."
                  value={catImage} onChange={e => setCatImage(e.target.value)}
                  className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand outline-none focus:border-purple-brand transition-all"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3.5">
                <button
                  type="button" onClick={() => setIsCategoryFormOpen(false)}
                  className="bg-gray-brand text-slate-brand font-bold py-2.5 px-5 rounded-xl border border-gray-200 text-xs tracking-wider uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="bg-purple-brand text-white font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase shadow-md hover:bg-opacity-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{categoryEditing ? 'Apply Edit' : 'Add Category'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
