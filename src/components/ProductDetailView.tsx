import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, ZoomIn, X, ShieldAlert, ShoppingBag, CheckCircle, ArrowRight, Truck, Info, Clock, Loader2, AlertCircle, Link as LinkIcon, Check } from 'lucide-react';
import { doc, updateDoc, addDoc, collection, serverTimestamp, increment, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Category, StoreSettings } from '../types';
import { motion } from 'motion/react';
import { logWhatsAppRedirect } from '../utils/whatsapp';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  categories: Category[];
  settings: StoreSettings | null;
  onBack: () => void;
  onSelectProduct: (productId: string) => void;
  whatsappNumber: string;
  onAddToCart: (product: Product, size: string) => void;
  onShowToast?: (message: string) => void;
}

export default function ProductDetailView({
  product,
  allProducts,
  categories,
  settings,
  onBack,
  onSelectProduct,
  whatsappNumber,
  onAddToCart,
  onShowToast
}: ProductDetailViewProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [addFeedback, setAddFeedback] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Update page tab title and Open Graph metadata dynamically for social media previews
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Aronee's Wears`;
      
      // Update social media metadata for direct links
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', `${product.name} | Aronee's Wears`);
      
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', product.description || "Discover premium wears and fashion accessories at Aronee's Wears.");
      
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', product.images[0] || '/logo.png');

      const twitterTitle = document.querySelector('meta[property="twitter:title"]');
      if (twitterTitle) twitterTitle.setAttribute('content', `${product.name} | Aronee's Wears`);

      const twitterDesc = document.querySelector('meta[property="twitter:description"]');
      if (twitterDesc) twitterDesc.setAttribute('content', product.description || "Discover premium wears and fashion accessories at Aronee's Wears.");

      const twitterImage = document.querySelector('meta[property="twitter:image"]');
      if (twitterImage) twitterImage.setAttribute('content', product.images[0] || '/logo.png');
    }
    return () => {
      document.title = "Aronee's Wears | Style that defines you";
    };
  }, [product]);

  const handleCopyLink = async () => {
    // Generate direct URL using current window location
    const shareUrl = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      if (onShowToast) {
        onShowToast('Direct product link copied to clipboard!');
      }
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      try {
        // Fallback for iframe environments / older devices
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setIsCopied(true);
        if (onShowToast) {
          onShowToast('Direct product link copied to clipboard!');
        }
        setTimeout(() => setIsCopied(false), 3000);
      } catch (fallbackErr) {
        console.error('Failed to copy link:', fallbackErr);
      }
    }
  };

  // Generate size choices based on category type
  const isWomens = ['heels', 'womens-wears'].includes(product.category);
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
    .filter(p => p.category === product.category && p.id !== product.id && (p.status === 'active' || p.status === 'out_of_stock'))
    .slice(0, 4);

  const handleOrderInitiation = () => {
    // Validation
    if (!product.stock || product.status === 'out_of_stock') return;
    
    // Warn if non-bag item has no size selected
    if (!isBags && !selectedSize) {
      setErrorFeedback("Please select your size before ordering!");
      setTimeout(() => setErrorFeedback(null), 3000);
      return;
    }

    setErrorFeedback(null);
    setShowDeliveryInfo(true);
  };

  const handleWhatsAppOrder = async () => {
    // Validation
    if (!product.stock || product.status === 'out_of_stock') return;
    
    // Warn if non-bag item has no size selected
    if (!isBags && !selectedSize) {
      setErrorFeedback("Please select your size before ordering!");
      setTimeout(() => setErrorFeedback(null), 3000);
      return;
    }

    setIsReserving(true);
    setErrorFeedback(null);

    try {
      // 1. Create Reservation (valid for 30 mins)
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 30);

      await addDoc(collection(db, 'reservations'), {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        status: 'pending',
        expiresAt: Timestamp.fromDate(expiryDate),
        createdAt: serverTimestamp()
      });

      // 2. Decrement Stock
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        stock: increment(-1)
      });

      // 3. Copy message to clipboard and Open WhatsApp
      const formattingPrice = product.price.toLocaleString();
      const sizeLine = isBags ? '' : `\nSize: ${selectedSize}`;
      const productLink = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
      const text = `Hello Aronee's Wears,

I would like to order:

Product Name: ${product.name}${sizeLine}
Price: ₦${formattingPrice}
Product Link: ${productLink}

Please provide payment details to confirm my order.`;

      try {
        await navigator.clipboard.writeText(text);
        if (onShowToast) {
          onShowToast('Order details copied to clipboard! Opening WhatsApp...');
        }
      } catch (clipboardErr) {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.top = "0";
          textArea.style.left = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          if (onShowToast) {
            onShowToast('Order details copied! Opening WhatsApp...');
          }
        } catch (fallbackErr) {
          console.error('Failed to copy to clipboard', fallbackErr);
        }
      }

      const encodedText = encodeURIComponent(text);
      await logWhatsAppRedirect('Product Detail Order (WhatsApp Direct)', `Product: ${product.name}, Price: ₦${formattingPrice}, Size: ${selectedSize || 'Standard'}`);
      window.open(`https://wa.me/${whatsappNumber.replace(/\+/g, '')}?text=${encodedText}`, '_blank');
      
      // 4. Close Delivery Info
      setShowDeliveryInfo(false);
    } catch (err) {
      console.error(err);
      setErrorFeedback('Failed to process reservation. Please check your connection and try again.');
      setTimeout(() => setErrorFeedback(null), 5000);
      try {
        handleFirestoreError(err, OperationType.WRITE, 'reservations_or_products');
      } catch (logErr) {
        // Detailed error logged successfully
      }
    } finally {
      setIsReserving(false);
    }
  };

  const handleAddToCartClick = () => {
    if (!isBags && !selectedSize) {
      setErrorFeedback("Please select your custom size first!");
      setTimeout(() => setErrorFeedback(null), 3000);
      return;
    }
    onAddToCart(product, selectedSize || 'One Size');
    setAddFeedback(true);
    setTimeout(() => setAddFeedback(false), 2500);
  };

  return (
    <div id="product-detail-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Top navigation row with back button and share action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        {/* Back button link */}
        <motion.button
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="font-sans font-bold text-xs sm:text-sm text-slate-brand hover:text-purple-brand flex items-center space-x-1.5 uppercase tracking-wider cursor-pointer py-1 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collections</span>
        </motion.button>

        {/* Copy Share Link */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopyLink}
          className="font-sans font-bold text-xs text-purple-brand hover:bg-purple-brand/5 border border-purple-brand/30 hover:border-purple-brand px-5 py-2.5 rounded-full flex items-center justify-center space-x-2 uppercase tracking-widest cursor-pointer shadow-xs transition-all self-start sm:self-auto"
        >
          {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          <span>{isCopied ? 'Link Copied!' : 'Copy Share Link'}</span>
        </motion.button>
      </div>

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
              {categoryObject?.name || 'Wears'} Collection
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
                  <p>This item is currently out of stock. Contact the owner below to customize or backorder this item!</p>
                </div>
              </div>
            ) : null}

            {product.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-3.5">
                
                {/* 1. Direct WhatsApp Purchase (Primary CTA) */}
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleOrderInitiation}
                  className="flex-1 bg-purple-brand text-white font-bold text-sm tracking-widest uppercase py-4.5 px-8 rounded-full shadow-lg hover:bg-opacity-95 cursor-pointer flex items-center justify-center space-x-2.5"
                >
                  <MessageSquare className="w-5 h-5 fill-white stroke-none" />
                  <span>Order via WhatsApp Now</span>
                </motion.button>

                {/* 2. Add to Order Draft/Cart */}
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddToCartClick}
                  className="bg-gray-brand hover:bg-purple-brand/5 border-2 border-gray-200 hover:border-purple-brand text-slate-brand font-bold text-sm tracking-widest uppercase py-4 px-8 rounded-full cursor-pointer flex items-center justify-center space-x-2.5"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Cart</span>
                </motion.button>

              </div>
            )}

            {addFeedback && (
              <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 p-3.5 rounded-r-xl flex items-center space-x-2.5 text-xs animate-fade-in">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span className="font-semibold">Successfully added product to your custom WhatsApp Order Draft list! See navbar.</span>
              </div>
            )}

            {errorFeedback && (
              <div className="bg-red-50 text-red-800 border-l-4 border-red-500 p-3.5 rounded-r-xl flex items-center space-x-2.5 text-xs animate-fade-in">
                <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                <span className="font-semibold">{errorFeedback}</span>
              </div>
            )}
            
            {/* Reservation Info Notice */}
            {product.stock > 0 && (
              <div className="bg-slate-brand/5 p-4 rounded-2xl flex items-start space-x-3 text-[10px] leading-relaxed text-slate-brand/60 border border-slate-brand/5">
                <Clock className="w-4 h-4 shrink-0 text-purple-brand" />
                <p>
                  Clicking "Order" will <strong>reserve this item for you for 30 minutes</strong>. 
                  Please complete payment on WhatsApp within this window to confirm your order.
                </p>
              </div>
            )}

            {/* Direct Social Share copy button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyLink}
              className="w-full bg-slate-brand/5 hover:bg-slate-brand/10 text-slate-brand font-bold text-xs tracking-wider uppercase py-4 px-6 rounded-2xl cursor-pointer flex items-center justify-center space-x-2.5 transition-colors border border-slate-brand/5 hover:border-slate-brand/10"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <LinkIcon className="w-4 h-4 text-purple-brand" />
              )}
              <span className={isCopied ? 'text-emerald-700 font-extrabold' : ''}>
                {isCopied ? 'Direct Link Copied!' : 'Copy Link for Social Media'}
              </span>
            </motion.button>
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
                Other beautiful {categoryObject?.name || 'Wears'} options compatible with your look.
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

      {/* Delivery Info Modal */}
      {showDeliveryInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-brand/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="bg-purple-brand p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold font-display uppercase tracking-widest text-sm">Delivery Information</h3>
              </div>
              <button onClick={() => setShowDeliveryInfo(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
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
                  Send the WhatsApp message to get payment details and secure your item!
                </p>
              </div>

              <button 
                onClick={handleWhatsAppOrder}
                disabled={isReserving}
                className="w-full bg-purple-brand text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {isReserving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Reserving Stock...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 fill-white stroke-none" />
                    <span>Confirm & Open WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
