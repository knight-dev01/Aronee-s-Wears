import React, { useState, useRef } from 'react';
import { Upload, Database, X, Check, AlertCircle, FileText, Save, Info, Table, Plus, Camera, Image, RefreshCw, Layers, Trash2, Loader2 } from 'lucide-react';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as XLSX from 'xlsx';
import imageCompression from 'browser-image-compression';
import { db, storage } from '../firebase';
import { Product, Category } from '../types';

interface BulkUploadProps {
  categories: Category[];
  onSuccess: () => Promise<void>;
  onClose?: () => void;
}

interface StagedProduct {
  tempId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  status: 'active' | 'draft' | 'out_of_stock';
  images: string[];
  featured: boolean;
  errors: string[];
}

export default function BulkUpload({ categories, onSuccess, onClose }: BulkUploadProps) {
  const [stagedData, setStagedData] = useState<StagedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [inputText, setInputText] = useState('');
  
  // Bulk apply state
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [bulkStock, setBulkStock] = useState<string>('');
  const [bulkNamePrefix, setBulkNamePrefix] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const validateItem = (item: Partial<StagedProduct>): string[] => {
    const errors: string[] = [];
    if (!item.name) errors.push('Name is required');
    if (item.price === undefined || isNaN(Number(item.price)) || Number(item.price) < 0) errors.push('Valid price is required');
    if (!item.category) errors.push('Category is required');
    if (item.category && !categories.find(c => c.id === item.category)) {
      errors.push(`Category "${item.category}" does not exist`);
    }
    return errors;
  };

  const applyBulkToAll = () => {
    setStagedData(prev => prev.map(item => {
      const updated = {
        ...item,
        price: bulkPrice ? Number(bulkPrice) : item.price,
        category: bulkCategory || item.category,
        stock: bulkStock ? Number(bulkStock) : item.stock,
        name: bulkNamePrefix && !item.name.startsWith(bulkNamePrefix) ? `${bulkNamePrefix} ${item.name}` : item.name
      };
      return { ...updated, errors: validateItem(updated) };
    }));
    setStatus({ type: 'success', message: 'Applied bulk settings to all staged items.' });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhotos(true);
    setStatus({ type: '', message: 'Compressing and uploading photos...' });

    const newItems: StagedProduct[] = [];
    const compressionOptions = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1280,
      useWebWorker: true
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 1. Compress
        const compressedFile = await imageCompression(file, compressionOptions);
        
        // 2. Upload to Storage
        const storageRef = ref(storage, `products/bulk/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, compressedFile);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        // 3. Stage item
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.') || 'New Item';
        const newItem: StagedProduct = {
          tempId: Math.random().toString(36).substring(7),
          name: nameWithoutExt,
          description: '',
          price: Number(bulkPrice) || 0,
          category: bulkCategory || categories[0]?.id || '',
          stock: Number(bulkStock) || 0,
          status: 'active',
          images: [downloadUrl],
          featured: false,
          errors: []
        };
        newItem.errors = validateItem(newItem);
        newItems.push(newItem);
      }

      setStagedData(prev => [...prev, ...newItems]);
      setStatus({ type: 'success', message: `Successfully uploaded and staged ${files.length} photos.` });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Photo upload failed. Check your connection.' });
    } finally {
      setIsUploadingPhotos(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const processRows = (rows: any[]) => {
    const newStaged: StagedProduct[] = rows.map((item: any) => ({
      tempId: Math.random().toString(36).substring(7),
      name: item.name || item.Name || '',
      description: item.description || item.Description || '',
      price: Number(item.price || item.Price) || 0,
      category: (item.category || item.Category || '').toLowerCase(),
      stock: Number(item.stock || item.Stock) || 0,
      status: (item.status || item.Status || 'active').toLowerCase() as any,
      images: item.images ? (typeof item.images === 'string' ? item.images.split(',').map((s: string) => s.trim()) : [item.images]) : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
      featured: !!(item.featured || item.Featured),
      errors: []
    })).map(item => ({ ...item, errors: validateItem(item) }));

    setStagedData(prev => [...prev, ...newStaged]);
    setStatus({ type: 'success', message: `Successfully staged ${newStaged.length} items.` });
  };

  const addManualRow = () => {
    const newItem: StagedProduct = {
      tempId: Math.random().toString(36).substring(7),
      name: '',
      description: '',
      price: 0,
      category: categories[0]?.id || '',
      stock: 0,
      status: 'active',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
      featured: false,
      errors: []
    };
    newItem.errors = validateItem(newItem);
    setStagedData(prev => [...prev, newItem]);
    setStatus({ type: '', message: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        processRows(rows);
      } catch (err) {
        setStatus({ type: 'error', message: 'Failed to read file. Ensure it is a valid Excel or CSV.' });
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleParseJSON = () => {
    try {
      const parsed = JSON.parse(inputText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      processRows(items);
      setInputText('');
    } catch (e) {
      setStatus({ type: 'error', message: 'Invalid JSON format. Please check your syntax.' });
    }
  };

  const updateStagedItem = (tempId: string, field: keyof StagedProduct, value: any) => {
    setStagedData(prev => prev.map(item => {
      if (item.tempId === tempId) {
        const updated = { ...item, [field]: value };
        return { ...updated, errors: validateItem(updated) };
      }
      return item;
    }));
  };

  const removeStagedItem = (tempId: string) => {
    setStagedData(prev => prev.filter(i => i.tempId !== tempId));
  };

  const handleCommitUpload = async () => {
    const itemsWithErrors = stagedData.filter(i => i.errors.length > 0);
    if (itemsWithErrors.length > 0) {
      setStatus({ type: 'error', message: 'Please fix all errors before uploading.' });
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const productsCol = collection(db, 'products');

      stagedData.forEach(item => {
        const newDocRef = doc(productsCol);
        batch.set(newDocRef, {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          stock: item.stock,
          status: item.status,
          images: item.images,
          featured: item.featured,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      setStatus({ type: 'success', message: `Successfully uploaded ${stagedData.length} items!` });
      setStagedData([]);
      await onSuccess();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to upload batch. Check your connection.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-brand font-display flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-brand" />
              Inventory Power Ingress
            </h3>
            <p className="text-xs text-slate-brand/60 font-medium">
              Import multiple items at once using Excel, CSV, or JSON data formats.
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-slate-brand/40 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {status.message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-fade-in ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}>
            {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {status.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-purple-brand/5 border border-dashed border-purple-brand/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 hover:border-purple-brand transition-colors cursor-pointer group" onClick={() => photoInputRef.current?.click()}>
              <input 
                type="file" 
                ref={photoInputRef} 
                onChange={handlePhotoUpload} 
                multiple
                accept="image/*" 
                className="hidden" 
              />
              <div className="w-14 h-14 bg-purple-brand text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                {isUploadingPhotos ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Camera className="w-7 h-7" />}
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-brand">Bulk Upload Photos</p>
                <p className="text-[10px] text-slate-brand/50 font-medium">Select multiple from gallery. Fast indexing!</p>
              </div>
            </div>

            <div className="bg-gray-brand border border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 hover:border-purple-brand transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
              />
              <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Table className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xs text-slate-brand">Excel / CSV</p>
                <p className="text-[9px] text-slate-brand/50 font-medium">Traditional sheet import</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-brand/5 border border-slate-brand/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-slate-brand" />
                <p className="font-bold text-xs text-slate-brand uppercase tracking-wider">Bulk Apply Settings</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-brand/50 uppercase">Category</label>
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-purple-brand"
                  >
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[8px] text-slate-brand/40 font-bold uppercase tracking-tighter">* Individual categories can be changed per card.</p>
                </div>
                <div className="sm:col-span-2 pt-2">
                  <button
                    onClick={applyBulkToAll}
                    disabled={!stagedData.length}
                    className="w-full bg-slate-brand text-white text-[10px] font-bold py-2 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-30 flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Apply Bulk Settings to Staged Items
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-brand/50 uppercase">Price (₦)</label>
                  <input
                    type="number"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="9500"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-purple-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-brand/50 uppercase">Stock</label>
                  <input
                    type="number"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    placeholder="10"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-purple-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-brand/50 uppercase">Name Prefix</label>
                  <input
                    type="text"
                    value={bulkNamePrefix}
                    onChange={(e) => setBulkNamePrefix(e.target.value)}
                    placeholder="New..."
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-purple-brand"
                  />
                </div>
              </div>
              <button
                onClick={applyBulkToAll}
                disabled={stagedData.length === 0}
                className="w-full bg-slate-brand text-white font-bold text-[10px] py-2.5 rounded-xl hover:bg-opacity-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest"
              >
                Apply to {stagedData.length} Staged Items
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-brand/30 font-bold uppercase tracking-widest text-[9px]">Manual Entry</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={addManualRow}
                className="bg-purple-brand/10 text-purple-brand font-bold text-xs py-3 rounded-xl hover:bg-purple-brand/20 flex items-center justify-center gap-2 border border-purple-brand/20"
              >
                <Plus className="w-4 h-4" />
                Add Single Row
              </button>
              <button
                onClick={() => setStagedData([])}
                disabled={stagedData.length === 0}
                className="bg-red-50 text-red-600 font-bold text-xs py-3 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 border border-red-200 disabled:opacity-30"
              >
                <X className="w-4 h-4" />
                Reset List
              </button>
            </div>
          </div>

          <div className="bg-gray-brand border border-gray-100 rounded-3xl p-5 flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white border border-gray-100 text-slate-brand rounded-lg flex items-center justify-center shadow-xs">
                <Info className="w-4 h-4" />
              </div>
              <p className="font-bold text-[11px] text-slate-brand uppercase tracking-wider">Instructions</p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/60 rounded-xl p-3 space-y-1.5 border border-gray-100">
                <p className="text-[10px] font-bold text-purple-brand">Pro Phone Workflow:</p>
                <ul className="text-[9px] text-slate-brand/60 space-y-1 font-medium leading-tight">
                  <li>1. Set **Price** and **Category** in Bulk Apply bar.</li>
                  <li>2. Tap **Bulk Upload Photos** & select all new photos.</li>
                  <li>3. Tap **Apply to Staged Items** to set details instantly.</li>
                  <li>4. Scroll down, review names, then tap **Save to Store**.</li>
                </ul>
              </div>

              <div className="bg-white/60 rounded-xl p-3 space-y-1.5 border border-gray-100">
                <p className="text-[10px] font-bold text-slate-brand">Supported Formats:</p>
                <p className="text-[9px] text-slate-brand/60 leading-tight">
                  Photos (JPG/PNG), Excel (.xlsx), CSV, and raw JSON strings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stagedData.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-brand uppercase tracking-widest">
                Staged Inventory ({stagedData.length} items)
              </h4>
              <p className="text-[10px] text-slate-brand/40 font-bold uppercase">Review and refine details before final publication</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                disabled={isProcessing}
                onClick={handleCommitUpload}
                className="flex-1 sm:flex-none bg-emerald-600 text-white font-bold text-[10px] py-3 px-8 rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 uppercase tracking-widest"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save to Store
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {stagedData.map((item) => (
              <div 
                key={item.tempId} 
                className={`bg-white rounded-[32px] p-5 shadow-sm border transition-all duration-300 hover:shadow-md relative group flex flex-col ${
                  item.errors.length > 0 ? 'border-red-200 bg-red-50/10' : 'border-gray-100'
                }`}
              >
                {/* Remove button */}
                <button 
                  onClick={() => removeStagedItem(item.tempId)}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors border border-red-50 z-10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-4 flex-1">
                  {/* Image Preview */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-brand border border-gray-100">
                    {item.images[0] ? (
                      <img 
                        src={item.images[0]} 
                        alt="Product" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-brand/20">
                        <Image className="w-10 h-10 mb-2" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">No Image</span>
                      </div>
                    )}
                    {item.errors.length > 0 && (
                      <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-red-600 text-white p-2 rounded-full shadow-lg">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-brand/40 uppercase tracking-widest px-1">Product Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateStagedItem(item.tempId, 'name', e.target.value)}
                        placeholder="Product Name"
                        className="w-full bg-gray-brand border border-transparent focus:border-purple-brand outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-brand transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-brand/40 uppercase tracking-widest px-1">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateStagedItem(item.tempId, 'description', e.target.value)}
                        placeholder="Product description..."
                        className="w-full bg-gray-brand border border-transparent focus:border-purple-brand outline-none rounded-xl px-4 py-2.5 text-[10px] text-slate-brand/60 h-20 resize-none transition-all leading-tight font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-brand/40 uppercase tracking-widest px-1">Category</label>
                        <select
                          value={item.category}
                          onChange={(e) => updateStagedItem(item.tempId, 'category', e.target.value)}
                          className="w-full bg-gray-brand border border-transparent focus:border-purple-brand outline-none rounded-xl px-2 py-2.5 text-[11px] font-bold text-purple-brand transition-all cursor-pointer"
                        >
                          <option value="">Select...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-brand/40 uppercase tracking-widest px-1">Price (₦)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-brand/30">₦</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateStagedItem(item.tempId, 'price', Number(e.target.value))}
                            className="w-full bg-gray-brand border border-transparent focus:border-purple-brand outline-none rounded-xl pl-6 pr-3 py-2.5 text-xs font-bold text-slate-brand font-mono transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-brand/40 uppercase tracking-widest px-1">Stock</label>
                        <input
                          type="number"
                          value={item.stock}
                          onChange={(e) => updateStagedItem(item.tempId, 'stock', Number(e.target.value))}
                          className="w-full bg-gray-brand border border-transparent focus:border-purple-brand outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-brand transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-brand/40 uppercase tracking-widest px-1">Status</label>
                        <select
                          value={item.status}
                          onChange={(e) => updateStagedItem(item.tempId, 'status', e.target.value)}
                          className="w-full bg-gray-brand border border-transparent focus:border-purple-brand outline-none rounded-xl px-2 py-2.5 text-[10px] font-bold text-slate-brand transition-all cursor-pointer uppercase tracking-widest"
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="out_of_stock">Out</option>
                        </select>
                      </div>
                    </div>

                    {/* Error Messages */}
                    {item.errors.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {item.errors.map((err, i) => (
                          <div key={i} className="bg-red-50 text-red-600 text-[9px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border border-red-100">
                            <AlertCircle className="w-3 h-3" /> {err}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

