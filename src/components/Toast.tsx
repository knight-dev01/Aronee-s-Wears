import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ShoppingBag } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.8 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.8 }}
          className="fixed bottom-24 left-1/2 z-[1000] bg-slate-brand text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-purple-brand/20 min-w-[280px]"
        >
          <div className="w-10 h-10 bg-purple-brand rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="flex-grow">
            <p className="text-[10px] font-bold text-purple-brand/60 uppercase tracking-widest leading-none mb-1">Success</p>
            <p className="text-sm font-bold tracking-tight">{message}</p>
          </div>
          <CheckCircle className="w-5 h-5 text-green-400 ml-2" />
          
          {/* Progress bar */}
          <motion.div 
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-purple-brand rounded-b-2xl origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
