import { MapPin, Mail, Clock, MessageSquare, Instagram, Facebook, Send } from 'lucide-react';

interface ContactViewProps {
  whatsappNumber: string;
  contactAddress: string;
  contactEmail: string;
  instagramUrl: string;
  facebookUrl: string;
  businessHours: string;
}

export default function ContactView({
  whatsappNumber,
  contactAddress,
  contactEmail,
  instagramUrl,
  facebookUrl,
  businessHours
}: ContactViewProps) {

  const handleWhatsAppChat = () => {
    const text = encodeURIComponent("Hello Aronee's Wears, I would like to make an inquiry about product availability and shipping!");
    window.open(`https://wa.me/${whatsappNumber.replace(/\+/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div id="contact-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16 space-y-3">
        <span className="text-purple-brand font-mono font-bold text-xs uppercase tracking-[0.2em] block">
          Visit or Call Us
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-slate-brand">
          Get in Touch
        </h1>
        <p className="text-sm text-slate-brand/60 font-medium">
          Have any footwear inquiries? Need custom sizing details? Message us directly!
        </p>
        <div className="w-16 h-1 bg-purple-brand mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Contact Info & Fields */}
        <div className="space-y-8">
          
          {/* Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-gray-brand border border-gray-100 p-6 rounded-2xl space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-brand font-display">
                Main Showroom
              </h3>
              <p className="text-xs text-slate-brand/65 leading-relaxed font-sans">
                {contactAddress}
              </p>
            </div>

            <div className="bg-gray-brand border border-gray-100 p-6 rounded-2xl space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-brand font-display">
                Email Address
              </h3>
              <p className="text-xs text-slate-brand/65 leading-relaxed font-sans truncate">
                {contactEmail}
              </p>
            </div>

            <div className="bg-gray-brand border border-gray-100 p-6 rounded-2xl space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-brand font-display">
                Business Hours
              </h3>
              <p className="text-xs text-slate-brand/65 leading-relaxed font-sans">
                {businessHours}
              </p>
            </div>

            <div className="bg-gray-brand border border-gray-100 p-6 rounded-2xl space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-brand font-display">
                WhatsApp Chat
              </h3>
              <p className="text-xs text-slate-brand/65 leading-relaxed font-sans">
                {whatsappNumber} (24/7 Response)
              </p>
            </div>
          </div>

          {/* Social connections */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-brand text-sm tracking-wider uppercase font-display">
              Connect With Us
            </h3>
            <div className="flex gap-4">
              <button
                onClick={handleWhatsAppChat}
                className="flex-1 bg-purple-brand text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-md cursor-pointer hover:bg-opacity-95 transition-all text-center flex items-center justify-center space-x-2"
              >
                <span>Chat via WhatsApp</span>
              </button>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-gray-brand border border-gray-200 text-slate-brand/80 hover:text-purple-brand rounded-xl cursor-pointer transition-colors flex items-center justify-center"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-gray-brand border border-gray-200 text-slate-brand/80 hover:text-purple-brand rounded-xl cursor-pointer transition-colors flex items-center justify-center"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>

        {/* Custom Interactive Map Representation */}
        <div className="bg-gray-brand border border-gray-100 rounded-3xl overflow-hidden p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-brand font-display">
                Interactive Store Locator
              </h3>
              <p className="text-[10px] text-slate-brand/50 font-medium">
                Governor Road Crossroads, Ikotun-Egbe Crossroads, Lagos, Nigeria
              </p>
            </div>
            <span className="bg-purple-brand text-white text-[9px] font-bold font-mono py-1 px-3 rounded-full uppercase tracking-wider">
              Lagos Centre
            </span>
          </div>

          {/* Visual SVG Map (high-craft vector simulation of map coordinates) */}
          <div className="relative w-full aspect-[4/3] bg-[#E8ECEF] rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm flex items-center justify-center">
            {/* SVG Roads & Pins layout */}
            <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full select-none">
              {/* Roads */}
              <line x1="0" y1="150" x2="400" y2="150" stroke="#FFFFFF" strokeWidth="24" /> {/* Governor Road */}
              <line x1="0" y1="150" x2="400" y2="150" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 4" />
              
              <line x1="120" y1="0" x2="120" y2="300" stroke="#FFFFFF" strokeWidth="18" /> {/* Ikotun Road */}
              <line x1="120" y1="0" x2="120" y2="300" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 4" />

              <line x1="280" y1="0" x2="280" y2="300" stroke="#FFFFFF" strokeWidth="14" /> {/* Egbe Passage */}

              {/* Text Layouts for roads */}
              <text x="10" y="142" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Governor Rd</text>
              <text x="127" y="20" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="sans-serif" transform="rotate(90 127 20)">Ikotun Rd</text>

              {/* Buildings & Plazas */}
              <rect x="150" y="70" width="100" height="50" rx="6" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
              <text x="160" y="94" fill="#334155" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Ikotun Plaza</text>

              {/* Aronee's Wears Pin */}
              <g className="animate-bounce">
                <circle cx="200" cy="95" r="4" fill="#6A0DAD" />
                <path d="M200 95 C195 85, 205 85, 200 95" fill="none" stroke="#6A0DAD" strokeWidth="2" />
                <circle cx="200" cy="84" r="12" fill="#6A0DAD" />
                <text x="195" y="88" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">A</text>
              </g>

              {/* Legend Callout bubble */}
              <g transform="translate(190, 30)">
                <rect x="-60" y="0" width="140" height="30" rx="8" fill="#1E293B" />
                <polygon points="10,30 5,34 0,30" fill="#1E293B" />
                <text x="-50" y="16" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                  ARONEE'S WEARS (Shop 14)
                </text>
              </g>
            </svg>
            
            {/* Watermark/Address Card footer inside map */}
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs border border-gray-100 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded-full bg-purple-brand flex items-center justify-center">
                  <span className="text-[7.5px] text-white font-bold">A</span>
                </div>
                <span className="text-[10px] font-bold text-slate-brand">Aronee's Wears (Shop 14)</span>
              </div>
              <button
                onClick={handleWhatsAppChat}
                className="bg-purple-brand text-white font-bold text-[9px] py-1.5 px-3 rounded-lg leading-none cursor-pointer"
              >
                Send Directions to me
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
