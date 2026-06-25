import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { motion } from 'motion/react';
import { User, Mail, Calendar, Package, LogOut, Heart, Clock, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '../lib/time';
import { RelativeTime } from './RelativeTime';

interface UserDashboardViewProps {
  user: FirebaseUser | null;
  onLogout: () => void;
  onViewChange: (view: 'home' | 'shop' | 'about' | 'contact' | 'admin' | 'account') => void;
}

export default function UserDashboardView({ user, onLogout, onViewChange }: UserDashboardViewProps) {
  if (!user) return null;

  const joinedDateContent = user.metadata.creationTime 
    ? <RelativeTime date={user.metadata.creationTime} />
    : 'Recently';

  return (
    <div id="user-dashboard" className="max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        
        {/* Profile Header */}
        <div className="bg-slate-brand text-white rounded-[40px] p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-brand blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-brand/50 blur-[100px] rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white/20 p-1">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=7c3aed&color=fff`} 
                alt={user.displayName || 'User'} 
                className="w-full h-full rounded-full object-cover shadow-xl"
              />
            </div>
            <div className="text-center sm:text-left space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight">
                Welcome back, {user.displayName?.split(' ')[0] || 'Fashionista'}!
              </h1>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-white/60 text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <Mail className="w-3.5 h-3.5 text-purple-brand" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-purple-brand" />
                  <span>Joined {joinedDateContent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Account Stats */}
          <div className="md:col-span-2 space-y-6">
            
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-brand flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-brand" />
                  Order History
                </h3>
                <span className="text-[10px] font-bold text-purple-brand uppercase tracking-widest bg-purple-brand/5 px-3 py-1 rounded-full">
                  Recent Activity
                </span>
              </div>

              <div className="space-y-4">
                {/* Empty State / Simulated History */}
                <div className="py-12 text-center space-y-4 border-2 border-dashed border-gray-100 rounded-3xl">
                  <div className="w-16 h-16 bg-gray-brand rounded-full mx-auto flex items-center justify-center text-slate-brand/20">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-brand/60">No orders yet</p>
                    <p className="text-xs text-slate-brand/40 max-w-[200px] mx-auto leading-relaxed">
                      Your fashion journey is just beginning. Start shopping to build your history!
                    </p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onViewChange('shop')}
                    className="inline-flex items-center gap-2 bg-slate-brand text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-opacity-90 shadow-md group cursor-pointer"
                  >
                    <span>Browse Storefront</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            
            <div className="bg-purple-brand/5 border border-purple-brand/10 rounded-[32px] p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-brand text-sm tracking-tight uppercase">Newsletter Status</h3>
                <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Active Subscriber
                </div>
              </div>
              <p className="text-[11px] text-slate-brand/50 font-medium leading-relaxed">
                You're receiving premium updates, early bird drops, and exclusive flash discounts straight to your inbox.
              </p>
            </div>

            <div className="space-y-3">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewChange('shop')}
                className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-purple-brand/35 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="font-bold text-slate-brand text-sm">Wishlist</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-brand transition-colors" />
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-5 bg-red-50 text-red-600 border border-red-100 rounded-2xl hover:bg-red-100 transition-all font-bold text-sm cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </motion.button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
