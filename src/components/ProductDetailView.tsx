import { useState } from 'react';
import { ArrowLeft, MessageSquare, ZoomIn, X, ShieldAlert, ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react';
import { Product, Category } from '../types';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  categories: Category[];
  onBack: () => void;
  onSelectProduct: (productId: string) => void;
  whatsappNumber: string;
  onAddToCart: (product: Product, size: string) => void;
}

export default function ProductDetailView({
  product,
  allProducts,
  categories,
  onBack,
  onSelectProduct,
  whatsappNumber,
  onAddToCart
}: ProductDetailViewProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [addFeedback, setAddFeedback] = useState(false);

  // Generate size choices based on category type
  const isWomens = ['heels', 'womens-footwear'].includes(product.category);
  const isBags = ['bags', 'accessories'].includes(product.category);
  
  // Standard sizing selections
  const sizes = isBags 
    ? ['One Size'] 
    : isWomens 
      ? ['37', '38', '39', '40', '41'] 
      : ['40', '41', '42', '43', '44', '45'];

  // Default select first size or leave blank requiring click
  const categoryObject = categories.find(c => c.id === product.category);

  // Filter related products
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id && p.status === 'active')
    .slice(0, 4);

  const handleWhatsAppOrder = () => {
    // Validation
    if (!product.stock || product.status === 'out_of_stock') return;
    
    // Warn if non-bag item has no size selected
    if (!isBags && !selectedSize) {
      alert("Please select your size before ordering!");
      return;
    }

    const formattingPrice = product.price.toLocaleString();
    const sizeLine = isBags ? '' : `\nSize: ${selectedSize}`;

    const text = `Hello Aronee's Wears,

I would like to order:

Product Name: ${product.name}${sizeLine}
Price: ₦${formattingPrice}

Please provide payment and delivery details.`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${whatsappNumber.replace(/\+/g, '')}?text=${encodedText}`, '_blank');
  };

  const handleAddToCartClick = () => {
    if (!isBags && !selectedSize) {
      alert("Please select your custom size first!");
      return;
    }
    onAddToCart(product, selectedSize || 'One Size');
    setAddFeedback(true);
    setTimeout(() => setAddFeedback(false), 2500);
  };

  return (
    <div id="product-detail-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Back button link */}
      <button
        onClick={onBack}
        className="mb-8 font-sans font-bold text-xs sm:text-sm text-slate-brand hover:text-purple-brand flex items-center space-x-1.5 uppercase tracking-wider cursor-pointer py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Collections</span>
      </button>

      {/* Main product presentation block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        
        {/* Left Side: Images Section */}
        <div className="space-y-4">
          
          {/* Main Visual Window with zoom */}
          <div className="relative aspect-square w-full rounded-3xl bg-gray-brand overflow-hidden border border-gray-100/50 group select-none shadow-xs">
            <img
              src={product.images[activeImageIndex]}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
            />
            {/* Quick Zoom Trigger */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute bottom-4 right-4 p-3 rounded-full bg-white/90 shadow-md hover:bg-purple-brand hover:text-white transition-all text-slate-brand cursor-pointer"
              title="Fullscreen Preview"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            {/* Overlay labels */}
            {product.stock === 0 && (
              <span className="absolute top-4 left-4 bg-red-600 text-white font-mono font-bold text-xs py-1.5 px-3.5 rounded-full">
                SOLD OUT
              </span>
            )}
            {product.stock > 0 && product.stock <= 3 && (
              <span className="absolute top-4 left-4 bg-amber-500 text-slate-brand font-mono font-bold text-xs py-1.5 px-3.5 rounded-full">
                LOW STOCK (ONLY {product.stock} LEFT)
              </span>
            )}
          </div>

          {/* Gallery Thumbnails List */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative w-20 aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-gray-brand ${
                    i === activeImageIndex ? 'border-purple-brand' : 'border-transparent select-none'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${i}`} className="w-full h-full object-cover object-center" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Right Side: Specifications Details */}
        <div className="space-y-6">
          
          {/* Headline Metadata */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-purple-brand tracking-[0.2em] block uppercase">
              {categoryObject?.name || 'Footwear'} Collection
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display leading-[1.1] tracking-tight text-slate-brand">
              {product.name}
            </h1>
            <div className="flex items-center space-x-3.5 pt-1.5">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-brand">
                &#8358; {product.price.toLocaleString()}
              </span>
              <span className="text-[10px] bg-gray-brand border border-gray-200 text-slate-brand/60 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                VAT Incl.
              </span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Description Copy */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-[11px] sm:text-xs text-slate-brand tracking-widest uppercase font-display">
              Item Details
            </h4>
            <p className="text-sm text-slate-brand/70 font-sans font-light leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Sizing Selections */}
          {!isBags && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-brand uppercase tracking-wider">Select Size (Nigerian / EU)</span>
                <span className="text-purple-brand font-medium">Standard Fit</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`min-w-[48px] h-[48px] border-2 font-mono font-semibold text-xs rounded-xl transition-all cursor-pointer ${
                      selectedSize === sz
                        ? 'border-purple-brand bg-purple-brand text-white'
                        : 'border-gray-200 hover:border-purple-brand text-slate-brand'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Operational ordering buttons */}
          <div className="pt-4 space-y-3">
            {product.stock === 0 ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-start space-x-3 text-xs leading-relaxed border border-red-100">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-bold">Currently Sold Out</p>
                  <p>This item is currently out of stock. Contact the owner below to customize or backorder this footwear!</p>
                </div>
              </div>
            ) : null}

            {product.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-3.5">
                
                {/* 1. Direct WhatsApp Purchase (Primary CTA) */}
                <button
                  onClick={handleWhatsAppOrder}
                  className="flex-1 bg-purple-brand text-white font-bold text-sm tracking-widest uppercase py-4.5 px-8 rounded-full shadow-lg hover:bg-opacity-95 transition-all cursor-pointer flex items-center justify-center space-x-2.5"
                >
                  <MessageSquare className="w-5 h-5 fill-white stroke-none" />
                  <span>Order via WhatsApp Now</span>
                </button>

                {/* 2. Add to Order Draft/Cart */}
                <button
                  onClick={handleAddToCartClick}
                  className="bg-gray-brand hover:bg-purple-brand/5 border-2 border-gray-200 hover:border-purple-brand text-slate-brand font-bold text-sm tracking-widest uppercase py-4 px-8 rounded-full transition-all cursor-pointer flex items-center justify-center space-x-2.5"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Order Draft</span>
                </button>

              </div>
            )}

            {addFeedback && (
              <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 p-3.5 rounded-r-xl flex items-center space-x-2.5 text-xs animate-fade-in">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span className="font-semibold">Successfully added product to your custom WhatsApp Order Draft list! See navbar.</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Related Products Collections */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-16 border-t border-gray-100">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-brand">
                Related Styling Recommendations
              </h2>
              <p className="text-xs text-slate-brand/60 font-medium">
                Other beautiful {categoryObject?.name || 'Footwear'} options compatible with your look.
              </p>
            </div>
            <button
              onClick={onBack}
              className="text-xs font-bold text-purple-brand uppercase tracking-wider flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProduct(p.id);
                  setActiveImageIndex(0);
                  setSelectedSize('');
                }}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 p-2 sm:p-3 hover:shadow-lg transition-all"
              >
                <div className="relative aspect-square w-full rounded-xl bg-gray-brand overflow-hidden mb-3">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-brand line-clamp-1 group-hover:text-purple-brand transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs font-extrabold text-slate-brand font-mono pt-1">
                  &#8358; {p.price.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Image Fullscreen Modal View zoom */}
      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={product.images[activeImageIndex]}
            alt={product.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

    </div>
  );
}
