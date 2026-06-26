import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ShoppingBag } from 'lucide-react';

interface WelcomeViewProps {
  onClose: () => void;
}

export default function WelcomeView({ onClose }: WelcomeViewProps) {
  return (
    <div className="fixed inset-0 bg-slate-brand/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center space-y-6 border border-gray-100"
      >
        <div className="relative w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg border border-gray-100 overflow-hidden">
          <img src="/logo.png" alt="Aronee's Wears Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black font-display text-slate-brand tracking-tight">
            Welcome to the Club! 🎉
          </h2>
          <p className="text-xs text-slate-brand/70 font-medium leading-relaxed">
            We are thrilled to have you here at Aronee's Wears. Start exploring our latest collections and find something special today.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full bg-purple-brand hover:bg-purple-brand/90 text-white font-black text-xs tracking-widest uppercase py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Start Shopping</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
