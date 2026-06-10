import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, LayoutDashboard, ShoppingCart, FolderTree, AlertTriangle, 
  Settings, LogOut, CheckCircle, HelpCircle, Save, X, RefreshCw 
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { addDoc, doc, updateDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Category, StoreSettings } from '../types';
import { forceResetDatabase } from '../data/seed';

interface AdminViewProps {
  user: FirebaseUser | null;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  products: Product[];
  categories: Category[];
  settings: StoreSettings | null;
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
  onRefreshData
}: AdminViewProps) {
  
  // Dashboard navigation sub-state
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'inventory' | 'settings'>('overview');

  // Load Status feedback
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Forms / Modal state
  const [productEditing, setProductEditing] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  
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

  // Category Form Input field binds
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');

  // Settings editable forms
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(null);

  const displayNotice = (message: string) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(''), 4500);
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
    } else {
      setProductEditing(null);
      setProdName('');
      setProdDesc('');
      setProdPrice(15000);
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
    const productPayload = {
      name: prodName,
      description: prodDesc,
      price: Number(prodPrice),
      images: preparedImages.length > 0 ? preparedImages : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
      category: prodCategory,
      stock: Number(prodStock),
      featured: prodFeatured,
      status: prodStatus,
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
        displayNotice('Database successfully re-seeded with default footwear catalogs!');
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
        businessHours: settingsForm.businessHours
      });
      displayNotice('Global store settings locked successfully!');
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
            <p className="font-bold">Authorized Account:</p>
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
              <span className="text-[10px] font-bold text-slate-brand/40 uppercase tracking-widest block font-sans">Listed Footwear</span>
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
              <h3 className="font-bold text-sm sm:text-base text-slate-brand font-display">Manage Footwear Inventory</h3>
              <p className="text-[10.5px] text-slate-brand/55">Create customized listings, set prices, and update stock counts.</p>
            </div>
            <button
              onClick={() => openProductForm()}
              className="bg-purple-brand text-white font-bold text-xs py-2.5 px-4.5 rounded-xl flex items-center space-x-1 uppercase tracking-wider shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          {/* List display */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
            {products.length === 0 ? (
              <div className="p-10 text-center text-slate-brand/50 text-sm">No footwear products listed yet. Seed database!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-brand border-b border-gray-100 text-slate-brand/70 font-semibold uppercase tracking-wider">
                      <th className="p-4">Shoe</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Pricing</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Featured</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {products.map((p) => {
                      const cName = categories.find(c => c.id === p.category)?.name || p.category;
                      return (
                        <tr key={p.id} className="hover:bg-gray-brand/50 transition-colors">
                          <td className="p-4 flex items-center space-x-3 max-w-xs">
                            <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg bg-gray-100 shrink-0 border border-gray-200" referrerPolicy="no-referrer" />
                            <span className="font-bold text-slate-brand line-clamp-1">{p.name}</span>
                          </td>
                          <td className="p-4 text-slate-brand/70 uppercase font-mono tracking-wider">{cName}</td>
                          <td className="p-4 font-mono font-bold">&#8358; {p.price.toLocaleString()}</td>
                          <td className={`p-4 font-mono font-bold ${p.stock === 0 ? 'text-red-600' : 'text-slate-brand'}`}>
                            {p.stock} units
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
              <p className="text-[10.5px] text-slate-brand/55 font-sans">Set distinct footwear segments, banners and track calculated catalogs.</p>
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

      {/* TAB 5: CONTACTS AND WHATSAPP SETTINGS */}
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
      {isProductFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base sm:text-lg text-slate-brand font-display">
                {productEditing ? 'Update Shoe Specifications' : 'List New Footwear Item'}
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
                    required rows={3} placeholder="Describe footwear materials, styles, sizing guidelines..."
                    value={prodDesc} onChange={e => setProdDesc(e.target.value)}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand outline-none focus:border-purple-brand transition-all leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-brand/85 uppercase">Price (₦ - Naira)</label>
                  <input
                    type="number" required min="0"
                    value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))}
                    className="w-full bg-gray-brand border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-brand font-semibold underline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-brand/85 uppercase">Stock LimitCount</label>
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

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-brand/85 uppercase flex justify-between">
                    <span>Image Gallery URLs</span>
                    <span className="text-[9px] text-purple-brand">Comma-delimited formatting</span>
                  </label>
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
                <label className="font-bold text-slate-brand/85 uppercase">Cover Image Banner URL</label>
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
