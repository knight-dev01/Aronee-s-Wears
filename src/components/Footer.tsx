import { Mail, MapPin, Phone, Instagram, Facebook } from 'lucide-react';

interface FooterProps {
  onViewChange: (view: 'home' | 'shop' | 'about' | 'contact' | 'admin') => void;
  whatsappNumber: string;
  contactEmail: string;
  instagramUrl: string;
  facebookUrl: string;
}

export default function Footer({
  onViewChange,
  whatsappNumber,
  contactEmail,
  instagramUrl,
  facebookUrl
}: FooterProps) {
  return (
    <footer id="app-footer" className="bg-[#111111] text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full bg-purple-brand flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-display font-bold text-lg tracking-wider text-white">
                ARONEE WEARS
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Step Into Style. Lagos' leading destination for high-fashion sneakers, premium Heels, handmade sandals, and custom beauty accessories.
            </p>
            <div className="flex items-center space-x-4 pt-1">
              <a href={instagramUrl} target="_blank" rel="noreferrer" className="p-2 bg-gray-800 hover:bg-purple-brand rounded-full text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={facebookUrl} target="_blank" rel="noreferrer" className="p-2 bg-gray-800 hover:bg-purple-brand rounded-full text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm tracking-widest uppercase mb-4">
              Shop Categories
            </h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <button onClick={() => onViewChange('shop')} className="hover:text-purple-brand transition-colors text-left cursor-pointer text-gray-400 hover:text-white">
                  Trending Sneakers
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('shop')} className="hover:text-purple-brand transition-colors text-left cursor-pointer text-gray-400 hover:text-white">
                  Elegant High Heels
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('shop')} className="hover:text-purple-brand transition-colors text-left cursor-pointer text-gray-400 hover:text-white">
                  Crafted Male Sandals
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('shop')} className="hover:text-purple-brand transition-colors text-left cursor-pointer text-gray-400 hover:text-white">
                  Textured Handbags
                </button>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm tracking-widest uppercase mb-4">
              The Brand
            </h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <button onClick={() => onViewChange('home')} className="hover:text-purple-brand transition-colors text-left cursor-pointer text-gray-400 hover:text-white">
                  Discover Home
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('about')} className="hover:text-purple-brand transition-colors text-left cursor-pointer text-gray-400 hover:text-white">
                  Our Legacy Story
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('contact')} className="hover:text-purple-brand transition-colors text-left cursor-pointer text-gray-400 hover:text-white">
                  Store Locator & Hours
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('admin')} className="hover:text-purple-brand transition-colors text-left cursor-pointer text-gray-400 hover:text-white">
                  Internal Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-white text-sm tracking-widest uppercase mb-4">
              Get In Touch
            </h3>
            <ul className="space-y-3.5 text-sm text-gray-400">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-purple-brand mt-0.5 shrink-0" />
                <span>
                  Shop 14, Ikotun Fashion Plaza, Governor Road, Ikotun, Lagos, Nigeria
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-purple-brand shrink-0" />
                <span>{contactEmail}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-purple-brand shrink-0" />
                <span>{whatsappNumber}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-xs text-gray-500 font-medium font-sans">
          <div>
            &copy; {new Date().getFullYear()} ARONEE WEARS. All rights reserved. Registered in Nigeria.
          </div>
          <div className="flex space-x-5">
            <button onClick={() => onViewChange('admin')} className="hover:text-purple-brand cursor-pointer">
              Admin Login
            </button>
            <span>&bull;</span>
            <span>Hand-crafted for Lagos Fashionistas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
