import React, { useState, useRef } from 'react';
import { Upload, Database, X, Check, AlertCircle, FileText, Save, Info, Table } from 'lucide-react';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
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
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateItem = (item: Partial<StagedProduct>): string[] => {
    const errors: string[] = [];
    if (!item.name) errors.push('Name is required');
    if (!item.price || isNaN(Number(item.price))) errors.push('Valid price is required');
    if (!item.category) errors.push('Category is required');
    if (item.category && !categories.find(c => c.id === item.category)) {
      errors.push(`Category "${item.category}" does not exist`);
    }
    return errors;
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
      images: item.images ? (typeof item.images === 'string' ? item.images.split(',') : [item.images]) : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
      featured: !!(item.featured || item.Featured),
      errors: []
    })).map(item => ({ ...item, errors: validateItem(item) }));

    setStagedData(prev => [...prev, ...newStaged]);
    setStatus({ type: 'success', message: `Successfully staged ${newStaged.length} items.` });
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-brand border border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-purple-brand transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
              />
              <div className="w-14 h-14 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Table className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-brand">Upload Excel / CSV</p>
                <p className="text-[10px] text-slate-brand/50 font-medium">Drag and drop or click to select file</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-brand/30 font-bold uppercase tracking-widest text-[9px]">Or Use JSON</span>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='[ { "name": "...", "price": 1000, ... } ]'
                className="w-full h-32 bg-gray-brand border border-gray-200 rounded-2xl p-4 text-[11px] font-mono leading-relaxed outline-none focus:border-purple-brand transition-all"
              />
              <button
                onClick={handleParseJSON}
                className="w-full bg-slate-brand text-white font-bold text-xs py-3 rounded-xl hover:bg-opacity-95 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Parse JSON Data
              </button>
            </div>
          </div>

          <div className="bg-purple-brand/5 border border-purple-brand/10 rounded-3xl p-6 flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-brand text-white rounded-xl flex items-center justify-center shadow-sm">
                <Info className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm text-slate-brand">Format Guide</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-brand/40 uppercase tracking-wider">Required Columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {['name', 'price', 'category', 'stock', 'description'].map(col => (
                    <span key={col} className="bg-white border border-gray-200 text-[10px] font-bold text-slate-brand px-2 py-1 rounded-lg">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-brand/40 uppercase tracking-wider">Valid Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(c => (
                    <span key={c.id} className="bg-white border border-purple-brand/20 text-[10px] font-bold text-purple-brand px-2 py-1 rounded-lg">
                      {c.id}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/50 rounded-2xl p-4 space-y-2 border border-purple-brand/5">
                <div className="text-[10px] font-bold text-slate-brand flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-brand" />
                  Tips for Success
                </div>
                <ul className="text-[10px] text-slate-brand/60 space-y-1.5 font-medium leading-relaxed">
                  <li>• First row must be the header row.</li>
                  <li>• Price and Stock must be numeric values.</li>
                  <li>• Images can be comma-separated URLs.</li>
                  <li>• Use 'active', 'draft', or 'out_of_stock' for status.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stagedData.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm animate-fade-in">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-brand/20">
            <div>
              <h4 className="font-bold text-sm text-slate-brand uppercase tracking-wider">
                Staged Inventory Items
              </h4>
              <p className="text-[10px] text-slate-brand/50 font-medium">Review and edit before saving to cloud database.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStagedData([])}
                className="text-xs font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
              >
                Clear All
              </button>
              <button
                disabled={isProcessing}
                onClick={handleCommitUpload}
                className="bg-emerald-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save {stagedData.length} Items to Store
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="bg-gray-brand border-b border-gray-100 text-slate-brand/70 font-bold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stagedData.map((item) => (
                  <tr key={item.tempId} className={`hover:bg-gray-brand/30 transition-colors ${item.errors.length > 0 ? 'bg-red-50/30' : ''}`}>
                    <td className="p-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateStagedItem(item.tempId, 'name', e.target.value)}
                        className="bg-transparent border-b border-transparent focus:border-purple-brand outline-none font-bold text-slate-brand w-full"
                      />
                      {item.errors.map((err, i) => (
                        <p key={i} className="text-[9px] text-red-600 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> {err}
                        </p>
                      ))}
                    </td>
                    <td className="p-3">
                      <select
                        value={item.category}
                        onChange={(e) => updateStagedItem(item.tempId, 'category', e.target.value)}
                        className="bg-transparent font-bold text-purple-brand outline-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">₦</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateStagedItem(item.tempId, 'price', Number(e.target.value))}
                          className="bg-transparent font-mono font-bold w-20 outline-none"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={item.stock}
                        onChange={(e) => updateStagedItem(item.tempId, 'stock', Number(e.target.value))}
                        className="bg-transparent font-mono font-bold w-16 outline-none"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={item.status}
                        onChange={(e) => updateStagedItem(item.tempId, 'status', e.target.value)}
                        className="bg-transparent font-bold outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="out_of_stock">Out Of Stock</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => removeStagedItem(item.tempId)} className="p-1 text-slate-brand/40 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
  </svg>
);

