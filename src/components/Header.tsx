import { useState } from 'react';
import { Menu, X, ShoppingBag, ShieldCheck, User } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: 'home' | 'shop' | 'about' | 'contact' | 'admin' | 'account') => void;
  isAdmin: boolean;
  user: FirebaseUser | null;
  onLoginClick: () => void;
  cartCount: number;
  onCartToggle: () => void;
}

export default function Header({
  currentView,
  onViewChange,
  isAdmin,
  user,
  onLoginClick,
  cartCount,
  onCartToggle
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', value: 'home' as const },
    { label: 'Shop', value: 'shop' as const },
    { label: 'About', value: 'about' as const },
    { label: 'Contact', value: 'contact' as const }
  ];

  const handleNavClick = (view: 'home' | 'shop' | 'about' | 'contact' | 'admin' | 'account') => {
    onViewChange(view);
    setMobileMenuOpen(false);
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Brand Logo & Name */}
          <div className="flex-shrink-0 cursor-pointer flex items-center space-x-2" onClick={() => handleNavClick('home')}>
            <img src="/logo.png" alt="Aronee's Wears Logo" className="w-10 h-10 object-contain rounded-full" referrerPolicy="no-referrer" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg sm:text-xl tracking-wider text-slate-brand leading-none">
                ARONEE'S
              </span>
              <span className="text-[10px] tracking-widest text-purple-brand font-medium uppercase leading-tight">
                Wears
              </span>
              <span className="text-[7px] sm:text-[8px] tracking-[0.1em] text-slate-brand/40 font-bold uppercase leading-none mt-0.5">
                Style that defines you
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav id="desktop-nav" className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const isActive = currentView === item.value;
              return (
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  key={item.value}
                  id={`nav-link-${item.value}`}
                  onClick={() => handleNavClick(item.value)}
                  className={`relative font-medium text-sm tracking-wide transition-colors py-2 uppercase ${
                    isActive ? 'text-purple-brand' : 'text-slate-brand/70 hover:text-purple-brand'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span 
                      layoutId="activeUnderline" 
                      className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-brand rounded-full" 
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Icons & Actions */}
          <div id="header-actions" className="hidden md:flex items-center space-x-5">
            {/* My Order Drafter/Cart Icon */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="cart-trigger"
              onClick={onCartToggle}
              className="relative p-2.5 rounded-full hover:bg-gray-55 text-slate-brand/80 hover:text-purple-brand transition-colors cursor-pointer group"
              title="Order Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && (
                  <motion.span
                    key={`cart-badge-${cartCount}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-brand text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Admin Dashboard Indicator or Login */}
            {user ? (
              <div className="flex items-center space-x-3 bg-gray-brand px-3.5 py-1.5 rounded-full border border-gray-200">
                <div className="w-6 h-6 rounded-full bg-purple-brand/10 flex items-center justify-center">
                  {isAdmin ? <ShieldCheck className="w-4 h-4 text-purple-brand" /> : <User className="w-4 h-4 text-slate-brand" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-brand/80 leading-none truncate max-w-[100px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[8px] font-mono tracking-widest text-purple-brand uppercase font-bold">
                    {isAdmin ? 'Admin' : 'Shopper'}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavClick(isAdmin ? 'admin' : 'account')}
                  className="text-xs bg-purple-brand text-white font-medium px-3 py-1 rounded-full cursor-pointer hover:bg-opacity-90 leading-none shadow-xs"
                >
                  Dash
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                id="btn-login"
                onClick={onLoginClick}
                className="text-xs font-semibold text-slate-brand hover:text-purple-brand border border-gray-300 rounded-full py-2 px-4.5 transition-all hover:border-purple-brand shadow-2xs cursor-pointer"
              >
                Admin Login
              </motion.button>
            )}
          </div>

          {/* Mobile Right Controls Menu */}
          <div className="flex items-center md:hidden space-x-3">
            {/* Mobile Cart Icon */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCartToggle}
              className="relative p-2 text-slate-brand/80 hover:text-purple-brand cursor-pointer group"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && (
                  <motion.span
                    key={`cart-badge-mobile-${cartCount}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute top-1 right-1 w-4.5 h-4.5 bg-purple-brand text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center shadow-sm"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Nav Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              id="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-brand/80 hover:text-purple-brand focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-gray-100 bg-white shadow-xl animate-fade-in">
          <div className="px-4 pt-4 pb-6 space-y-3">
            {navItems.map((item) => {
              const isActive = currentView === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => handleNavClick(item.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base font-semibold tracking-wide transition-colors ${
                    isActive
                      ? 'bg-purple-brand/10 text-purple-brand border-l-4 border-purple-brand'
                      : 'text-slate-brand/80 hover:bg-gray-brand hover:text-purple-brand'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            
            <hr className="border-gray-100 my-2" />

            {/* Admin Area Link for Mobile */}
            {user ? (
              <div className="px-4 py-3 bg-purple-brand/5 border border-purple-brand/15 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-brand/90 mb-0.5 leading-none">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[9px] font-mono text-purple-brand font-bold uppercase tracking-wider mb-0 leading-none">
                    {isAdmin ? 'System Admin' : 'Shopper Profile'}
                  </p>
                </div>
                <button
                  onClick={() => handleNavClick(isAdmin ? 'admin' : 'account')}
                  className="bg-purple-brand text-white text-xs font-bold px-4 py-2 rounded-lg leading-none cursor-pointer"
                >
                  Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onLoginClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center bg-purple-brand/5 border border-purple-brand text-purple-brand font-bold text-sm tracking-wide rounded-lg py-3 hover:bg-purple-brand hover:text-white transition-all cursor-pointer"
              >
                Owner / Admin Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
