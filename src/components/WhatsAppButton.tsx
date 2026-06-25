import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logWhatsAppRedirect } from '../utils/whatsapp';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  onShowToast?: (message: string) => void;
}

export default function WhatsAppButton({ phoneNumber, onShowToast }: WhatsAppButtonProps) {
  // Enforce the exact WhatsApp phone number: 0818 230 5492 -> Nigerian prefix +234, local 8182305492
  const targetNumber = '2348182305492';
  const messageText = "Hello Aronee's Wears, I have a question about your products!";
  const message = encodeURIComponent(messageText);
  const whatsappUrl = `https://wa.me/${targetNumber}?text=${message}`;

  const handleClick = async () => {
    // 1. Log the redirection event in the database to trigger an admin notification
    await logWhatsAppRedirect('Floating Support Button', 'Client requested support chat from floating button.');
    
    // 2. Alert the client briefly with a toast without writing anything to their clipboard
    if (onShowToast) {
      onShowToast("Opening WhatsApp to chat with Aronee's Wears...");
    }
  };

  return (
    <AnimatePresence>
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center group hover:bg-[#128C7E] transition-colors"
        aria-label="Contact support on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        
        {/* Tooltip Label */}
        <span className="absolute right-full mr-3 bg-slate-brand text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm">
          Chatting with Aronee's Wears
        </span>
        
        {/* Pulse effect */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 -z-10" />
      </motion.a>
    </AnimatePresence>
  );
}
