import { useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, RefreshCw, Star, ShoppingBag, ArrowLeft, Clock } from 'lucide-react';
import { Product, Category } from '../types';
import { motion } from 'motion/react';
import { formatRelativeTime } from '../lib/time';
import { RelativeTime } from './RelativeTime';

interface ShopViewProps {
  products: Product[];
  categories: Category[];
  onSelectProduct: (productId: string) => void;
  onAddToCart: (product: Product, size?: string) => void;
  onViewChange: (view: 'home' | 'shop' | 'about' | 'contact' | 'admin') => void;
}

export default function ShopView({
  products,
  categories,
  onSelectProduct,
  onAddToCart,
  onViewChange
}: ShopViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all'); // 'all', 'instock', 'outofstock'
  const [sortBy, setSortBy] = useState<string>('newest'); // 'newest', 'price-asc', 'price-desc', 'popular'
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Constants
  const priceOptions = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under ₦20,000', value: 'under-20' },
    { label: '₦20,000 - ₦35,000', value: '20-35' },
    { label: 'Over ₦35,000', value: 'over-35' }
  ];

  const sortOptions = [
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Featured First', value: 'popular' }
  ];

  // Filtering Logic
  const filteredProducts = products
    .filter((product) => {
      // 1. Search filter
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Category filter
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      // 3. Price filter
      let matchesPrice = true;
      if (priceRange === 'under-20') matchesPrice = product.price < 20000;
      else if (priceRange === '20-35') matchesPrice = product.price >= 20000 && product.price <= 35000;
      else if (priceRange === 'over-35') matchesPrice = product.price > 35000;

      // 4. Stock filter
      let matchesStock = true;
      if (stockFilter === 'instock') matchesStock = product.stock > 0 && product.status !== 'out_of_stock';
      else if (stockFilter === 'outofstock') matchesStock = product.stock === 0 || product.status === 'out_of_stock';

      // 0. Status filter (Defensive)
      const isVisible = product.status === 'active' || product.status === 'out_of_stock';
      
      return matchesSearch && matchesCategory && matchesPrice && matchesStock && isVisible;
    })
    // Sorting Logic
    .sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      }
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
    });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange('all');
    setStockFilter('all');
    setSortBy('newest');
  };

  return (
    <div id="shop-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Title Header */}
      <div className="mb-8 space-y-4">
        <motion.button 
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewChange('home')}
          className="flex items-center gap-2 text-purple-brand font-bold text-xs uppercase tracking-widest cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </motion.button>
        
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-slate-brand">
            Browse All Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-brand/60 font-medium">
            Showing <span className="text-purple-brand font-bold">{filteredProducts.length}</span> high-fashion products available right now.
          </p>
        </div>
      </div>

      {/* Controls: Search and Mobile Filter Buttons */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search input bar */}
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-brand/40">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search sneakers, heels, sandals, handbags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-brand border border-gray-200 hover:border-gray-300 focus:border-purple-brand focus:ring-1 focus:ring-purple-brand rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium transition-all text-slate-brand outline-none"
          />
        </div>

        {/* Sort Trigger */}
        <div className="flex gap-3">
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-brand/40 pointer-events-none">
              <ArrowUpDown className="w-4 h-4" />
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-brand border border-gray-200 rounded-2xl py-3.5 pl-11 pr-10 text-xs sm:text-sm font-semibold text-slate-brand outline-none focus:border-purple-brand transition-all cursor-pointer appearance-none w-full"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Toggle Slide Panel on Mobile */}
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden bg-gray-brand border border-gray-200 text-slate-brand hover:text-purple-brand p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center"
            title="Toggle Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters Widget (Desktop Only) */}
        <aside id="desktop-filters" className="hidden md:block w-64 shrink-0 space-y-7 pr-4">
          
          {/* Headline & Reset */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-display font-semibold text-sm tracking-widest uppercase text-slate-brand">
              Filter Options
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetFilters}
              className="text-xs text-purple-brand hover:text-opacity-80 font-bold flex items-center space-x-1 uppercase tracking-wider cursor-pointer group"
            >
              <motion.span whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}>
                <RefreshCw className="w-3 h-3" />
              </motion.span>
              <span>Reset</span>
            </motion.button>
          </div>

          {/* Categories select list */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs sm:text-sm text-slate-brand">Category</h4>
            <div className="space-y-1.5 flex flex-col">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory('all')}
                className={`text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all uppercase tracking-wider ${
                  selectedCategory === 'all'
                    ? 'bg-purple-brand text-white'
                    : 'bg-gray-brand text-slate-brand hover:bg-purple-brand/5'
                }`}
              >
                All Categories
              </motion.button>
              {categories.map((cat) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all uppercase tracking-wider flex justify-between items-center ${
                    selectedCategory === cat.id
                      ? 'bg-purple-brand text-white'
                      : 'bg-gray-brand text-slate-brand hover:bg-purple-brand/5'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 rounded-full ${selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-brand/5 text-slate-brand/40'}`}>
                    {cat.productCount}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Prices filters */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs sm:text-sm text-slate-brand">Price Range</h4>
            <div className="space-y-1.5 flex flex-col">
              {priceOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center space-x-3 text-xs font-medium text-slate-brand/80 hover:text-slate-brand cursor-pointer select-none py-1"
                >
                  <input
                    type="radio"
                    name="priceFilter-desktop"
                    value={opt.value}
                    checked={priceRange === opt.value}
                    onChange={() => setPriceRange(opt.value)}
                    className="w-4 h-4 text-purple-brand border-gray-300 focus:ring-purple-brand cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability filters */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs sm:text-sm text-slate-brand">Availability</h4>
            <div className="space-y-1.5 flex flex-col">
              {[
                { label: 'All Items', value: 'all' },
                { label: 'In Stock only', value: 'instock' },
                { label: 'Out of Stock / Sold', value: 'outofstock' }
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center space-x-3 text-xs font-medium text-slate-brand/80 hover:text-slate-brand cursor-pointer select-none py-1"
                >
                  <input
                    type="radio"
                    name="stockFilter-desktop"
                    value={opt.value}
                    checked={stockFilter === opt.value}
                    onChange={() => setStockFilter(opt.value)}
                    className="w-4 h-4 text-purple-brand border-gray-300 focus:ring-purple-brand cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

        </aside>

        {/* Mobile Filters Drawer Panel */}
        {showFiltersMobile && (
          <div id="mobile-filters-drawer" className="md:hidden bg-white border border-gray-200 rounded-2xl p-5 mb-4 space-y-5 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-bold text-sm tracking-wider uppercase text-slate-brand">Filters Drawer</span>
              <button onClick={handleResetFilters} className="text-xs text-purple-brand font-bold uppercase tracking-wider">
                Reset All
              </button>
            </div>

            {/* Mobile category button selectors */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-brand/60 block uppercase tracking-wide">Category</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`text-[10px] font-bold py-2 px-3.5 rounded-full transition-all uppercase tracking-wider ${
                    selectedCategory === 'all' ? 'bg-purple-brand text-white' : 'bg-gray-brand text-slate-brand'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-[10px] font-bold py-2 px-3.5 rounded-full transition-all uppercase tracking-wider ${
                      selectedCategory === cat.id ? 'bg-purple-brand text-white' : 'bg-gray-brand text-slate-brand'
                    }`}
                  >
                    {cat.name} ({cat.productCount})
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile price radio fields */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-brand/60 block uppercase tracking-wide">Price Limit</span>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="bg-gray-brand border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-brand outline-none focus:border-purple-brand w-full"
                >
                  {priceOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-brand/60 block uppercase tracking-wide">Availability</span>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="bg-gray-brand border border-gray-200 rounded-xl py-2 px-3 text-xs text-slate-brand outline-none focus:border-purple-brand w-full"
                >
                  <option value="all">All Items</option>
                  <option value="instock">In Stock</option>
                  <option value="outofstock">Out of Stock</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowFiltersMobile(false)}
              className="w-full bg-purple-brand text-white font-bold text-sm tracking-wider uppercase py-3 rounded-lg cursor-pointer"
            >
              Apply Filter Selections
            </button>
          </div>
        )}

        {/* Wears Grid Section */}
        <div className="flex-grow">
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-2xl space-y-4">
              <p className="text-base font-semibold text-slate-brand/70">No compatible wears matches found</p>
              <p className="text-xs text-slate-brand/40 font-medium max-w-sm mx-auto">
                Try loosening your parameters, resetting the active filters, or scanning with a different search query!
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-purple-brand text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-opacity-90 cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => {
                const catName = categories.find(c => c.id === product.category)?.name || 'Wears';
                
                // Calculate if "Just in" (last 1 hour)
                const now = Date.now();
                const createdDate = product.createdAt?.toMillis() || 0;
                const isRecent = now - createdDate < 1 * 60 * 60 * 1000;

                return (
                  <div
                    key={product.id}
                    onClick={() => onSelectProduct(product.id)}
                    className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 p-2 sm:p-3 hover:shadow-lg transition-all"
                  >
                    <div className="relative aspect-square w-full rounded-xl bg-gray-brand overflow-hidden mb-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500"
                        loading="lazy"
                      />
                      {isRecent && (
                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                          <span className="bg-emerald-500 text-white text-[8px] font-bold font-mono py-1 px-2 rounded-full shadow-sm">
                            JUST IN
                          </span>
                          <RelativeTime 
                            date={product.createdAt} 
                            className="bg-white/90 backdrop-blur-sm text-slate-brand text-[7px] font-bold py-0.5 px-1.5 rounded-full shadow-xs uppercase tracking-tighter" 
                          />
                        </div>
                      )}
                      {product.discountPrice && (
                        <span className="absolute bottom-2 left-2 bg-purple-brand text-white text-[9px] font-bold font-mono py-1 px-2.5 rounded-full shadow-sm z-10">
                          OFFER
                        </span>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                          <span className="bg-red-600 text-white text-[9px] font-bold font-mono py-1.5 px-3 rounded-full">
                            SOLD OUT
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1 px-1">
                      <div className="flex justify-between items-center">
                        <p className="text-[9px] tracking-widest text-purple-brand/80 font-bold uppercase">
                          {catName}
                        </p>
                        {product.sizes && product.sizes.length > 0 && (
                          <p className="text-[8px] text-slate-brand/40 font-bold uppercase">
                            {product.sizes.length} Sizes
                          </p>
                        )}
                      </div>
                      <h3 className="font-semibold text-xs sm:text-sm text-slate-brand line-clamp-1 group-hover:text-purple-brand transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex flex-col">
                          {product.discountPrice ? (
                            <>
                              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 font-mono">
                                &#8358; {product.discountPrice.toLocaleString()}
                              </span>
                              <span className="text-[9px] font-bold text-slate-brand/30 line-through font-mono">
                                &#8358; {product.price.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs sm:text-sm font-extrabold text-slate-brand font-mono">
                              &#8358; {product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <motion.button 
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product);
                            }}
                            className="bg-purple-brand text-white p-1.5 rounded-full hover:bg-opacity-90 transition-all cursor-pointer shadow-sm"
                            title="Add to Cart"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
