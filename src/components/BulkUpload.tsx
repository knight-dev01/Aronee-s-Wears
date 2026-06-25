import React, { useState, useRef, useEffect } from 'react';
import { Upload, Database, X, Check, AlertCircle, FileText, Save, Info, Table, Plus, Camera, Image, RefreshCw, Layers, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as XLSX from 'xlsx';
import imageCompression from 'browser-image-compression';
import { db, storage } from '../firebase';
import { Product, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';

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
  localFiles: File[]; // For staging local files before upload
  featured: boolean;
  errors: string[];
}

export default function BulkUpload({ categories, onSuccess, onClose }: BulkUploadProps) {
  const [stagedData, setStagedData] = useState<StagedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStagingPhotos, setIsStagingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info' | ''; message: string }>({ type: '', message: '' });
  const [inputText, setInputText] = useState('');
  
  // Bulk apply state
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [bulkStock, setBulkStock] = useState<string>('');
  const [bulkNamePrefix, setBulkNamePrefix] = useState<string>('');
  const [isBulkApplyOpen, setIsBulkApplyOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const stagedDataRef = useRef(stagedData);

  // Keep ref in sync for cleanup
  useEffect(() => {
    stagedDataRef.current = stagedData;
  }, [stagedData]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter((f: any) => f.type.startsWith('image/'));
    if (files.length > 0) {
      await processPhotos(files as unknown as FileList);
    }
  };

  // Shared photo processing logic
  const processPhotos = async (files: FileList) => {
    setIsStagingPhotos(true);
    setStatus({ type: 'info', message: 'Processing and staging photos locally...' });

    const newItems: StagedProduct[] = [];
    const compressionOptions = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 1. Compress
        const compressedFile = await imageCompression(file, compressionOptions);
        
        // 2. Create local preview URL
        const localPreviewUrl = URL.createObjectURL(compressedFile);

        // 3. Stage item
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.') || 'New Item';
        const tempId = Math.random().toString(36).substr(2, 9);
        
        const newItem: StagedProduct = {
          tempId,
          name: bulkNamePrefix ? `${bulkNamePrefix} ${nameWithoutExt}` : nameWithoutExt,
          description: '',
          price: bulkPrice ? Number(bulkPrice) : 0,
          category: bulkCategory || categories[0]?.id || '',
          stock: Number(bulkStock) || 0,
          status: 'active',
          images: [localPreviewUrl],
          localFiles: [compressedFile],
          featured: false,
          errors: []
        };
        newItems.push({ ...newItem, errors: validateItem(newItem) });
      }

      setStagedData(prev => [...prev, ...newItems]);
      setStatus({ type: 'success', message: `Locally staged ${files.length} items. Tap "Save to Store" to publish.` });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to process some photos.' });
    } finally {
      setIsStagingPhotos(false);
    }
  };
  
  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      stagedDataRef.current.forEach(item => {
        item.images.forEach(url => {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
      });
    };
  }, []);

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
    await processPhotos(files);
    if (photoInputRef.current) photoInputRef.current.value = '';
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
      localFiles: [],
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
      localFiles: [],
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
    setStagedData(prev => {
      const item = prev.find(i => i.tempId === tempId);
      if (item && item.localFiles.length > 0) {
        item.images.forEach(url => {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
      }
      return prev.filter(i => i.tempId !== tempId);
    });
  };

  const handleCommitUpload = async () => {
    const itemsWithErrors = stagedData.filter(i => i.errors.length > 0);
    if (itemsWithErrors.length > 0) {
      setStatus({ type: 'error', message: 'Please fix all errors before uploading.' });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    try {
      const finalItems = [];

      // 1. Sequential Cloud Upload for local staged files
      for (let i = 0; i < stagedData.length; i++) {
        const item = stagedData[i];
        let finalImageUrls = [...item.images];

        if (item.localFiles.length > 0) {
          const uploadedUrls = [];
          for (const file of item.localFiles) {
            const storageRef = ref(storage, `products/bulk/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            uploadedUrls.push(downloadUrl);
          }
          finalImageUrls = uploadedUrls;
        }
        
        finalItems.push({ ...item, images: finalImageUrls });
        setUploadProgress(((i + 1) / stagedData.length) * 100);
      }

      // 2. Firestore Batch Write
      const batch = writeBatch(db);
      const productsCol = collection(db, 'products');

      finalItems.forEach(item => {
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
      setStatus({ type: 'success', message: `Successfully published ${stagedData.length} items to cloud inventory!` });
      setStagedData([]);
      await onSuccess();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to upload batch. Check storage permissions and connection.' });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-brand font-display flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-brand" />
              Inventory Power Ingress
            </h3>
            <p className="text-[10px] text-slate-brand/40 font-bold uppercase tracking-widest mt-1">Bulk upload multiple products</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-slate-brand/40 hover:text-red-700 transition-colors">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => photoInputRef.current?.click()}
              className={`group relative overflow-hidden border-2 border-dashed rounded-3xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4 ${
                isDragging 
                  ? 'border-purple-brand bg-purple-brand/5 scale-[0.99] shadow-inner' 
                  : 'border-purple-brand/30 bg-purple-brand/5 hover:border-purple-brand hover:bg-gray-50'
              }`}
            >
              <input 
                type="file" 
                ref={photoInputRef} 
                onChange={handlePhotoUpload} 
                multiple 
                accept="image/*" 
                className="hidden" 
              />
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isDragging ? 'bg-purple-brand text-white scale-110 animate-pulse' : 'bg-purple-brand text-white group-hover:scale-110'
              }`}>
                {isStagingPhotos ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Camera className="w-7 h-7" />}
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-brand">
                  {isDragging ? 'Drop Photos Now' : 'Primary: Bulk Upload Photos'}
                </p>
                <p className="text-[10px] text-slate-brand/50 font-medium">
                  Compress and stage multiple images instantly
                </p>
              </div>
              
              {isDragging && (
                <div className="absolute inset-0 bg-purple-brand/5 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                    <Plus className="w-4 h-4 text-purple-brand animate-bounce" />
                    <span className="text-[10px] font-bold text-purple-brand uppercase tracking-widest">Ready to Stage</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-brand border border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 hover:border-purple-brand transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <Table className="w-5 h-5 text-gray-500 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-[10px] text-slate-brand uppercase tracking-wider">Excel / CSV</p>
              </div>
              <div className="bg-gray-brand border border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 hover:border-purple-brand transition-colors cursor-pointer group" onClick={addManualRow}>
                <Plus className="w-5 h-5 text-gray-500 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-[10px] text-slate-brand uppercase tracking-wider">Add Single</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className={`bg-slate-brand/5 border border-slate-brand/10 rounded-2xl transition-all duration-300 ${isBulkApplyOpen ? 'p-5' : 'p-3'}`}>
              <button 
                onClick={() => setIsBulkApplyOpen(!isBulkApplyOpen)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white border border-gray-100 text-slate-brand rounded-lg flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[11px] text-slate-brand uppercase tracking-wider text-left">Bulk Apply Settings</p>
                    {!isBulkApplyOpen && (
                      <p className="text-[9px] text-slate-brand/40 font-medium text-left">Quickly update price, category, or stock for all items</p>
                    )}
                  </div>
                </div>
                {isBulkApplyOpen ? <ChevronUp className="w-4 h-4 text-slate-brand/40" /> : <ChevronDown className="w-4 h-4 text-slate-brand/40" />}
              </button>

              <AnimatePresence>
                {isBulkApplyOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3 pt-4">
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
                      <div className="col-span-2 pt-2">
                        <button
                          onClick={applyBulkToAll}
                          disabled={!stagedData.length}
                          className="w-full bg-slate-brand text-white text-[10px] font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-30 flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Apply to {stagedData.length} Items
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-gray-brand border border-gray-100 rounded-2xl p-4 flex flex-col space-y-3">
              <button 
                onClick={() => setIsGuideOpen(!isGuideOpen)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white border border-gray-100 text-slate-brand rounded-lg flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <Info className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-[11px] text-slate-brand uppercase tracking-wider">Functional Guide</p>
                </div>
                {isGuideOpen ? <ChevronUp className="w-4 h-4 text-slate-brand/40" /> : <ChevronDown className="w-4 h-4 text-slate-brand/40" />}
              </button>
              
              <AnimatePresence>
                {isGuideOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-2">
                      <div className="bg-white/60 rounded-xl p-2.5 border border-gray-100">
                        <p className="text-[9px] text-slate-brand/60 leading-tight font-medium">
                          1. **Bulk Photos**: Compress & stage dozens instantly.<br/>
                          2. **Bulk Apply**: Set shared Category/Price with one tap.<br/>
                          3. **Cloud Save**: Batch-upload and publish all records.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {stagedData.length > 0 && (
              <button
                onClick={() => setStagedData([])}
                className="w-full bg-red-50 text-red-600 font-bold text-[10px] py-2.5 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 border border-red-200 transition-colors uppercase tracking-widest"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Staged List
              </button>
            )}
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
            <div className="flex gap-2 w-full sm:w-auto items-center">
              {isProcessing && (
                <div className="hidden sm:flex flex-col items-end mr-4">
                  <span className="text-[9px] font-bold text-purple-brand uppercase tracking-widest">Uploading to Cloud</span>
                  <div className="w-32 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-purple-brand transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
              <button
                disabled={isProcessing}
                onClick={handleCommitUpload}
                className="flex-1 sm:flex-none bg-emerald-600 text-white font-bold text-[10px] py-3 px-8 rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 uppercase tracking-widest"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isProcessing ? `Uploading ${Math.round(uploadProgress)}%` : 'Save to Store'}
              </button>
            </div>
          </div>

          <div className="space-y-3 pb-24">
            {/* Table Header (Desktop Only) */}
            <div className="hidden lg:grid lg:grid-cols-[80px_1fr_120px_100px_100px_100px_40px] gap-4 px-6 py-2 text-[9px] font-bold text-slate-brand/40 uppercase tracking-widest border-b border-gray-50">
              <div>Preview</div>
              <div>Product Details</div>
              <div>Category</div>
              <div>Price (₦)</div>
              <div>Stock</div>
              <div>Status</div>
              <div className="text-center">Del</div>
            </div>

            {stagedData.map((item) => (
              <div 
                key={item.tempId} 
                className={`bg-white rounded-2xl lg:rounded-[24px] p-2 lg:px-6 lg:py-3 shadow-sm border transition-all duration-300 hover:shadow-md relative group ${
                  item.errors.length > 0 ? 'border-red-200 bg-red-50/10' : 'border-gray-50'
                }`}
              >
                <div className="flex flex-col lg:grid lg:grid-cols-[80px_1fr_120px_100px_100px_100px_40px] lg:items-center gap-2 lg:gap-4">
                  {/* Row 1: Image & Name & Delete */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 lg:w-14 lg:h-14 shrink-0 rounded-lg lg:rounded-xl overflow-hidden bg-gray-brand border border-gray-100">
                      {item.images[0] ? (
                        <img 
                          src={item.images[0]} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-brand/20">
                          <Image className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateStagedItem(item.tempId, 'name', e.target.value)}
                        placeholder="Product Name"
                        className="w-full bg-transparent border-b border-transparent focus:border-purple-brand outline-none py-0 text-[11px] lg:text-xs font-bold text-slate-brand"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateStagedItem(item.tempId, 'description', e.target.value)}
                        placeholder="Desc..."
                        className="w-full bg-transparent border-b border-transparent focus:border-purple-brand outline-none py-0 text-[9px] text-slate-brand/40 font-medium truncate"
                      />
                    </div>

                    <button 
                      onClick={() => removeStagedItem(item.tempId)}
                      className="lg:hidden w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Grid for other fields on Mobile - Optimized for Row Format */}
                  <div className="grid grid-cols-4 lg:contents gap-2 items-center border-t border-gray-50 pt-2 lg:pt-0 lg:border-t-0">
                    {/* Category */}
                    <div className="flex flex-col">
                      <select
                        value={item.category}
                        onChange={(e) => updateStagedItem(item.tempId, 'category', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-purple-brand outline-none rounded-lg px-0.5 py-0.5 text-[9px] lg:text-[10px] font-bold text-purple-brand cursor-pointer"
                      >
                        <option value="">Cat...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col">
                      <div className="relative">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateStagedItem(item.tempId, 'price', Number(e.target.value))}
                          className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-purple-brand outline-none rounded-lg px-0.5 py-0.5 text-[9px] lg:text-[10px] font-bold text-slate-brand font-mono"
                        />
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="flex flex-col">
                      <input
                        type="number"
                        value={item.stock}
                        onChange={(e) => updateStagedItem(item.tempId, 'stock', Number(e.target.value))}
                        className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-purple-brand outline-none rounded-lg px-0.5 py-0.5 text-[9px] lg:text-[10px] font-bold text-slate-brand font-mono"
                      />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col">
                      <select
                        value={item.status}
                        onChange={(e) => updateStagedItem(item.tempId, 'status', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-purple-brand outline-none rounded-lg px-0.5 py-0.5 text-[8px] lg:text-[9px] font-bold text-slate-brand uppercase tracking-tighter cursor-pointer"
                      >
                        <option value="active">Act</option>
                        <option value="draft">Dft</option>
                        <option value="out_of_stock">Out</option>
                      </select>
                    </div>
                  </div>

                  {/* Desktop Remove Button */}
                  <div className="hidden lg:flex justify-center">
                    <button 
                      onClick={() => removeStagedItem(item.tempId)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Desktop Error Tooltip */}
                  {item.errors.length > 0 && (
                    <div className="lg:col-span-7 mt-1 px-2 py-1 bg-red-50 text-red-600 text-[8px] font-bold rounded-md flex items-center gap-1.5 border border-red-100">
                      <AlertCircle className="w-3 h-3" />
                      {item.errors.join(' • ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

