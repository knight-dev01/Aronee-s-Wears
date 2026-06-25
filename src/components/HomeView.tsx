import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Star, Truck, Award, Shield, DollarSign, ArrowUpRight, MessageCircle, ShoppingBag } from 'lucide-react';
import { Product, Category } from '../types';
import { motion } from 'motion/react';

interface HomeViewProps {
  products: Product[];
  categories: Category[];
  onViewChange: (view: 'home' | 'shop' | 'about' | 'contact' | 'admin') => void;
  onSelectProduct: (productId: string) => void;
  onAddToCart: (product: Product, size?: string) => void;
  whatsappNumber: string;
}

export default function HomeView({
  products,
  categories,
  onViewChange,
  onSelectProduct,
  onAddToCart,
  whatsappNumber
}: HomeViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: 'Style that defines you',
      subtitle: 'Step into a world of premium wears and fashion accessories crafted for your unique expression.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
      badge: 'PREMIUM WEARS'
    },
    {
      title: 'Confidence at Every Step',
      subtitle: 'Elegantly tailored high heel collections designed to make statements at Lagos weddings and high societal galas.',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85',
      badge: 'PREMIUM WOMEN HEELS'
    },
    {
      title: 'Handcrafted Tradition & Comfort',
      subtitle: 'Premium full-grain leather male sandals built to endure regular Lagos commutes beautifully.',
      image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=85',
      badge: 'TRADITIONAL MALE SANDALS'
    }
  ];

  // Auto slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Filter products
  const featuredProducts = products.filter(p => p.featured && p.status === 'active').slice(0, 4);
  const newArrivals = [...products]
    .filter(p => p.status === 'active')
    .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis())
    .slice(0, 4);

  // Fallback if collections are empty yet (while loading/seeding)
  const isProductsEmpty = products.length === 0;

  const handleCTAClick = () => {
    const text = encodeURIComponent("Hello Aronee Wears, I am browsing your e-commerce website and would like to order from your boutique! Please guide me on payment and delivery details.");
    window.open(`https://wa.me/${whatsappNumber.replace(/\+/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div id="home-view" className="space-y-16">
      
      {/* 1. Hero Banner Carousel / Slider */}
      <section id="hero-slider" className="relative h-[65vh] sm:h-[75vh] md:h-[80vh] w-full overflow-hidden bg-slate-brand">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/45 z-10" />
            
            {/* Hero Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-center transform scale-102 transition-transform duration-[6000ms]"
              loading="eager"
            />
            
            {/* Hero Content */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-left">
                <div className="max-w-2xl text-white space-y-4">
                  <span className="inline-block bg-purple-brand text-white font-mono font-bold text-xs tracking-[0.2em] px-3.5 py-1.5 rounded-sm uppercase mb-2">
                    {slide.badge}
                  </span>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display leading-[1.1] tracking-tight">
                    {slide.title}
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-gray-200 font-light leading-relaxed max-w-xl">
                    {slide.subtitle}
                  </p>
                  <div className="pt-6 flex flex-wrap gap-4">
                    <button
                      onClick={() => onViewChange('shop')}
                      className="bg-purple-brand text-white font-bold text-sm tracking-widest uppercase py-3.5 px-8 rounded-full shadow-lg hover:bg-opacity-95 transition-all cursor-pointer flex items-center space-x-2"
                    >
                      <span>Shop Now</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const categoriesEl = document.getElementById('featured-categories-section');
                        categoriesEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-widest uppercase py-3.5 px-8 rounded-full border border-white/20 transition-all cursor-pointer"
                    >
                      Browse Categories
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Navigation Arrows */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/10 text-white transition-all cursor-pointer hidden sm:block"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/10 text-white transition-all cursor-pointer hidden sm:block"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center space-x-2.5">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3.5 h-1.5 rounded-full transition-all ${
                idx === currentSlide ? 'bg-purple-brand w-7' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. Featured Categories Section */}
      <section id="featured-categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 max-w-xl mx-auto mb-10">
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-brand">
            Featured Categories
          </h2>
          <p className="text-sm text-slate-brand/60 font-medium">
            Explore curated segments of luxury Nigerian wears and accessories.
          </p>
          <div className="w-16 h-1 bg-purple-brand mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onViewChange('shop')}
              className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md cursor-pointer transition-all border border-gray-100"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-10 transition-all group-hover:from-black/90" />
              <img
                src={cat.image}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute bottom-4 left-4 right-4 z-20 space-y-1">
                <h3 className="text-white font-bold text-sm sm:text-base tracking-wide uppercase">
                  {cat.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block bg-white text-slate-brand text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {cat.productCount} Items
                  </span>
                  <span className="text-[9px] text-white/70 font-bold uppercase tracking-tighter">Available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. New Arrivals Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-brand">
              New Arrivals
            </h2>
            <p className="text-xs sm:text-sm text-slate-brand/60 font-medium">
              Hot off the workshop! Just landed item additions.
            </p>
          </div>
          <button
            onClick={() => onViewChange('shop')}
            className="text-xs sm:text-sm font-bold text-purple-brand hover:text-opacity-80 flex items-center space-x-1 uppercase tracking-wider cursor-pointer"
          >
            <span>See All Products</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isProductsEmpty ? (
          <div className="py-12 text-center bg-gray-brand rounded-2xl border border-gray-100">
            <p className="text-sm font-medium text-slate-brand/50">Loading initial wears arrivals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => {
              const catName = categories.find(c => c.id === product.category)?.name || 'Wears';
              
              // Calculate if "Just in" (last 7 days)
              const now = Date.now();
              const createdDate = product.createdAt?.toMillis() || 0;
              const isRecent = now - createdDate < 7 * 24 * 60 * 60 * 1000;
              
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
                      <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold font-mono py-1 px-2.5 rounded-full shadow-sm z-10">
                        JUST IN
                      </span>
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
                  <div className="space-y-1">
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
                    <div className="flex justify-between items-center pt-1.5">
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
      </section>

      {/* 4. Why Choose Us Sections */}
      <section id="why-choose-us" className="bg-gray-brand py-16 border-y border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-brand">
              Why Lagos Shops Aronee Wears
            </h2>
            <p className="text-xs sm:text-sm text-slate-brand/60 font-medium">
              We stand out in premium wears standards and dedicated customer delivery.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
            <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-100 text-center space-y-3 shrink-y">
              <div className="w-12 h-12 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-sm sm:text-base text-slate-brand">
                Premium Quality
              </h3>
              <p className="text-xs text-slate-brand/60 font-sans leading-relaxed">
                Handpicked dual-stitching design and high-quality leather/suede.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-100 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-sm sm:text-base text-slate-brand">
                Affordable Prices
              </h3>
              <p className="text-xs text-slate-brand/60 font-sans leading-relaxed">
                Direct workshop rates without unfair retail markups. Genuine value.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-100 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-sm sm:text-base text-slate-brand">
                Fast Lagos Delivery
              </h3>
              <p className="text-xs text-slate-brand/60 font-sans leading-relaxed">
                Same-day shipping options inside Ikotun and dynamic Lagos locations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-100 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-sm sm:text-base text-slate-brand">
                Trusted Lagos Brand
              </h3>
              <p className="text-xs text-slate-brand/60 font-sans leading-relaxed">
                100% secure order verification and real-time WhatsApp shopper support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 max-w-xl mx-auto mb-10">
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-brand">
            Featured Collections
          </h2>
          <p className="text-sm text-slate-brand/60 font-medium">
            Handpicked wears styles recommended for highest standards of presentation.
          </p>
          <div className="w-16 h-1 bg-purple-brand mx-auto rounded-full" />
        </div>

        {isProductsEmpty ? (
          <div className="py-12 text-center bg-gray-brand rounded-2xl border border-gray-100">
            <p className="text-sm font-medium text-slate-brand/50">Hydrating featured luxury items...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => {
              const catName = categories.find(c => c.id === product.category)?.name || 'Wears';
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
                    <span className="absolute top-2 right-2 bg-purple-brand/95 text-white p-1 rounded-full shadow-md">
                      <Star className="w-3.5 h-3.5 fill-white stroke-none" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] tracking-widest text-purple-brand/85 font-bold uppercase">
                      {catName}
                    </p>
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-brand line-clamp-1 group-hover:text-purple-brand transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center pt-1.5">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-brand font-mono">
                        &#8358; {product.price.toLocaleString()}
                      </span>
                      <button className="text-[10px] font-bold border border-purple-brand/20 text-purple-brand py-1 px-2.5 rounded-full hover:bg-purple-brand hover:text-white transition-colors cursor-pointer">
                        Shop Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. Instagram Showcase Section */}
      <section className="bg-white border-t border-gray-100 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 max-w-xl mx-auto mb-10">
            <span className="text-purple-brand font-mono font-bold text-[10px] uppercase tracking-widest block">
              @aroneeswears
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-brand">
              Style Showcase
            </h2>
            <p className="text-xs sm:text-sm text-slate-brand/60 font-medium">
              Join our growing community. Follow us on Instagram for daily feet look inspirations.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=70',
              'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=70',
              'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=400&q=70',
              'https://images.unsplash.com/photo-1622271380962-d4df35dcb934?auto=format&fit=crop&w=400&q=70',
              'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=70',
              'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=400&q=70'
            ].map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                <div className="absolute inset-0 bg-purple-brand/20 opacity-0 group-hover:opacity-100 z-10 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold uppercase tracking-widest font-mono">View Look</span>
                </div>
                <img
                  src={url}
                  alt="Fashion Showcase"
                  className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Call To Action (WhatsApp Converter) */}
      <section id="banner-cta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="relative bg-gradient-to-r from-purple-brand to-lavender-brand rounded-3xl overflow-hidden shadow-xl p-8 sm:p-12 md:p-16 text-center text-white space-y-6">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display tracking-tight">
              Ready to Upgrade Your Feet Game?
            </h2>
            <p className="text-sm sm:text-base text-purple-100 font-light max-w-lg mx-auto leading-relaxed">
              No long checkout structures. Place custom orders instantly via WhatsApp and get premium home delivery across Lagos locations!
            </p>
            <div className="pt-4">
              <button
                onClick={handleCTAClick}
                className="bg-white text-purple-brand font-bold text-sm tracking-widest uppercase py-4 px-10 rounded-full hover:bg-gray-100 transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center space-x-2.5"
              >
                <MessageCircle className="w-5 h-5 fill-purple-brand stroke-none" />
                <span>Chat & Order on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
