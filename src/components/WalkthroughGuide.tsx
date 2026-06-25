import { useState } from 'react';
import { 
  Sparkles, Search, Sliders, ShoppingBag, MessageSquare, 
  ShieldAlert, ArrowRight, ArrowLeft, Check, Star, CheckSquare
} from 'lucide-react';

interface GuideStep {
  title: string;
  badge: string;
  icon: any;
  description: string;
  instructions: string[];
  tips: string;
  mockupRenderer: () => any;
}

export default function WalkthroughGuide() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('EU 42');
  const [whatsappSent, setWhatsappSent] = useState<boolean>(false);

  // EU sizes list for Step 2 mockup
  const sizes = ['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'];

  const steps: GuideStep[] = [
    {
      title: "Discover & Filter the Catalog",
      badge: "STEP 1: EXPLORATION",
      icon: Search,
      description: "Instantly explore Nigeria's trendiest wears, from custom sneakers to elegant bridal heels and durable leather sandals.",
      instructions: [
        "Select pre-sorted main categories (e.g., Sneakers, Heels, Sandals/Slides) in the Catalog view.",
        "Use the category counters to find exactly how many items are in active stock.",
        "Browse the 'New Arrivals' and 'Featured Products' on the home page for trending inspirations."
      ],
      tips: "All listed items are kept in real-time sync with our physical shop in Ikotun, Lagos.",
      mockupRenderer: () => (
        <div className="bg-slate-900 rounded-2xl p-5 text-white font-sans space-y-4 border border-white/10 shadow-2xl relative overflow-hidden h-full min-h-[300px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-brand/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3">
            {/* Catalog Mockup Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
              <span className="text-xs font-bold tracking-widest text-purple-200 uppercase">Interactive Catalog</span>
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>

            {/* Category selection */}
            <div className="flex gap-2">
              <span className="text-[10px] bg-purple-brand text-white font-semibold py-1 px-2.5 rounded-full">All Items</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-medium py-1 px-2.5 rounded-full">Sneakers</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-medium py-1 px-2.5 rounded-full">Heels</span>
            </div>

            {/* Simulated Grid of Shoe item */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex space-x-3 items-center">
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80" 
                alt="Product" 
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 space-y-1">
                <span className="text-[8px] uppercase tracking-wider font-bold text-purple-400 font-mono">Premium Sneakers</span>
                <h4 className="text-xs font-bold text-gray-100">Superstar Classic Red</h4>
                <p className="text-[10px] text-gray-400 font-semibold font-mono">&#8358; 45,000</p>
              </div>
              <span className="bg-green-500/10 text-green-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-green-500/20">In Stock</span>
            </div>
          </div>

          <div className="text-[9px] bg-slate-800/40 p-2 rounded border border-slate-700/55 text-slate-300 flex items-center space-x-2">
            <span className="text-amber-400 font-bold">💡 Pro-Tip:</span>
            <span>Toggle views using the top header links at any time!</span>
          </div>
        </div>
      )
    },
    {
      title: "Customize & Choose Your Size",
      badge: "STEP 2: CUSTOMIZATION",
      icon: Sliders,
      description: "Wears fit is personal. Our store supports direct sizing specifications so your order sits perfectly snug.",
      instructions: [
        "Click on any product card in the Shop page to open the high-fidelity detailed view.",
        "Examine high-definition product material shots and detailed stitching specs.",
        "Select your appropriate Nigerian/EU Shoe Size from the size selector panel."
      ],
      tips: "If you require custom ankle fittings or wider widths, you can type special notes before carting.",
      mockupRenderer: () => (
        <div className="bg-slate-900 rounded-2xl p-5 text-white font-sans space-y-4 border border-white/10 shadow-2xl relative overflow-hidden h-full min-h-[300px] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-center border-b border-gray-800 pb-2">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">Select Size Specification</span>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-purple-300 font-bold uppercase font-mono">Jordan Retro Low</span>
              <p className="text-xs text-gray-300 leading-relaxed font-light">Available in standard EU sizing:</p>
            </div>

            {/* Sizes Select simulation */}
            <div className="grid grid-cols-4 gap-1.5">
              {sizes.slice(0, 4).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`text-[10px] font-mono py-1 rounded border text-center transition-all ${
                    selectedSize === size 
                      ? 'bg-purple-brand text-white border-purple-brand shadow-md' 
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/60 flex justify-between items-center text-xs">
              <span className="text-[10px] text-gray-400">Selected Spec:</span>
              <strong className="text-purple-300 font-mono font-bold animate-pulse">{selectedSize} Standard Fit</strong>
            </div>
          </div>

          <div className="text-[9px] text-purple-250 italic text-center font-medium">
            Try clicking the sizes above to see how our selector reacts!
          </div>
        </div>
      )
    },
    {
      title: "Add Items to Your Order Draft",
      badge: "STEP 3: NO-FRICTION CART",
      icon: ShoppingBag,
      description: "Unlike slow global corporate stores, we use a lightweight, instant 'Order Draft' that requires absolutely zero registration upfront.",
      instructions: [
        "Select size and click 'Add to Order Draft' to register your items locally.",
        "Your cart drawer is stored securely in browser state and doesn't get wiped on refresh.",
        "Add multiple shoe models or size selections into a single comprehensive draft."
      ],
      tips: "You can modify item quantities or completely wipe out orders from your drawer instantly.",
      mockupRenderer: () => (
        <div className="bg-slate-900 rounded-2xl p-5 text-white font-sans space-y-4 border border-white/10 shadow-2xl relative overflow-hidden h-full min-h-[300px] flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <div className="flex items-center space-x-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-bold text-gray-100 uppercase tracking-widest">Active Order Draft</span>
              </div>
              <span className="text-[9px] bg-purple-brand/20 text-purple-300 font-bold px-2 py-0.5 rounded-full font-mono">1 Item</span>
            </div>

            {/* Cart item mock */}
            <div className="bg-slate-800/50 rounded-lg p-2.5 space-y-2 border border-slate-700/50">
              <div className="flex justify-between items-start">
                <h5 className="text-xs font-bold text-gray-200 truncate max-w-[120px]">Superstar Classic Red</h5>
                <span className="text-[9px] font-mono text-purple-300 font-semibold">&#8358; 45,000</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-400">
                <span>Size: <strong className="text-gray-200 font-mono">{selectedSize}</strong></span>
                <span className="font-mono">Qty: 1</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-400">Estimated Total:</span>
              <strong className="text-purple-300 font-mono font-bold text-sm">&#8358; 45,000</strong>
            </div>
          </div>

          <button className="w-full bg-purple-brand/90 hover:bg-purple-brand text-white font-bold text-[10px] uppercase py-2 tracking-widest rounded-lg transition-transform hover:-translate-y-0.5 shadow-md flex items-center justify-center space-x-1.5">
            <span>Proceed to Next Step</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )
    },
    {
      title: "Place Direct Order on WhatsApp",
      badge: "STEP 4: INSTANT CHECKOUT",
      icon: MessageSquare,
      description: "Lagos shopping is built on trust and direct talking. We connect our database drawer directly to WhatsApp with automated text templates.",
      instructions: [
        "In your Order Drawer, click the green 'Place Order on WhatsApp' trigger.",
        "The website will pre-format your order into structured Nigerian pidgin or professional text.",
        "Your WhatsApp client will open automatically pre-loaded with names, sizes, prices, and image attachment links."
      ],
      tips: "Our representative instantly replies to confirm the delivery address and provide secure payment info.",
      mockupRenderer: () => (
        <div className="bg-slate-900 rounded-2xl p-5 text-white font-sans space-y-4 border border-white/10 shadow-2xl relative overflow-hidden h-full min-h-[300px] flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center space-x-1.5 border-b border-gray-800 pb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest">WhatsApp Simulator</span>
            </div>

            {/* WhatsApp message bubble */}
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 italic text-left">Pre-formatted message sent to store:</p>
              <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-100 rounded-xl rounded-tr-none p-3 text-[10px] font-mono leading-relaxed space-y-1">
                <p className="font-bold text-emerald-400">Order from Aronee's Wears:</p>
                <p>========================</p>
                <p>• 1x Superstar Classic Red ({selectedSize})</p>
                <p>========================</p>
                <p className="font-bold">Total: &#8358; 45,000</p>
                <p className="text-[9px] text-emerald-400/80">Please confirm my payment and Lagos dispatch details!</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              setWhatsappSent(true);
              setTimeout(() => setWhatsappSent(false), 3000);
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase py-2 px-3 tracking-wider rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {whatsappSent ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Simulated Order Dispatched!</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Simulate Click Order</span>
              </>
            )}
          </button>
        </div>
      )
    },
    {
      title: "Store Management Workspace",
      badge: "STEP 5: ADMIN INSTRUMENTS",
      icon: Sparkles,
      description: "For store owners: Aronee's Wears features a fully equipped admin workspace connected to Firebase.",
      instructions: [
        "Login using your registered Google Account (aroneefashion@gmail.com).",
        "Add, update, or instantly delete product listings directly in cloud storage.",
        "Change WhatsApp numbers, address specifications, and business hours dynamically.",
        "Switch product statuses (e.g., Active, Draft, Out Of Stock) to align with inventory."
      ],
      tips: "Out-of-stock listings are dynamically marked with tags on the front-end catalog in real-time.",
      mockupRenderer: () => (
        <div className="bg-slate-900 rounded-2xl p-5 text-white font-sans space-y-4 border border-white/10 shadow-2xl relative overflow-hidden h-full min-h-[300px] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-bold text-gray-100 uppercase tracking-widest">Admin Dashboard</span>
              </div>
              <span className="text-[8px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/20 font-mono">Live Secure Sync</span>
            </div>

            {/* Quick Admin Action metrics */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-800 p-2 rounded border border-slate-700/60">
                <p className="text-[8px] text-gray-400 font-bold uppercase">Total Listings</p>
                <p className="text-sm font-black text-purple-300 font-mono">42 Pairs</p>
              </div>
              <div className="bg-slate-800 p-2 rounded border border-slate-700/60">
                <p className="text-[8px] text-gray-400 font-bold uppercase">Hot Stock</p>
                <p className="text-sm font-black text-emerald-300 font-mono">15 Kicks</p>
              </div>
            </div>

            {/* Form control mockup */}
            <div className="space-y-1.5 text-left bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/40">
              <p className="text-[9px] text-gray-400 font-bold">Quick WhatsApp Config:</p>
              <div className="flex space-x-1">
                <span className="bg-slate-800 font-mono px-2 py-1 text-[10px] rounded border border-slate-700 flex-1">+234 812 345 6789</span>
                <span className="bg-purple-brand text-white text-[9px] font-bold px-2.5 rounded flex items-center justify-center border border-purple-brand">Save</span>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 flex items-center space-x-1 justify-center">
            <ShieldAlert className="w-3 h-3 text-purple-400" />
            <span>Unauthorized users are strictly blocked via rules.</span>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const ActiveIcon = steps[activeStep].icon;

  return (
    <div id="interactive-walkthrough" className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-10 shadow-md space-y-8 max-w-6xl mx-auto">
      
      {/* Walkthrough Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-1 text-left">
          <span className="inline-flex items-center space-x-1.5 text-purple-brand font-mono font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-purple-brand" />
            <span>Interactive Guide</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-brand">
            How to Use Aronee's Wears
          </h2>
          <p className="text-xs sm:text-sm text-slate-brand/60 font-medium">
            Learn the complete process from discovering the catalog to placing order sheets or managing database inventory.
          </p>
        </div>

        {/* Progress Tracker Dots */}
        <div className="flex items-center space-x-1 bg-gray-50 p-2 rounded-full border border-gray-150">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`w-8 h-2.5 rounded-full transition-all text-[8px] font-mono font-bold flex items-center justify-center leading-none ${
                idx === activeStep 
                  ? 'bg-purple-brand text-white w-10 shadow-xs' 
                  : 'bg-gray-200 text-slate-400 hover:bg-gray-300'
              }`}
              title={`Skip to Step ${idx+1}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Work area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-stretch">
        
        {/* Left Side: Instructions and Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 text-left">
          <div className="space-y-4">
            {/* Step Badge */}
            <span className="inline-block bg-purple-brand/10 text-purple-brand font-mono font-black text-[10px] tracking-widest px-3 py-1 rounded-full uppercase">
              {steps[activeStep].badge}
            </span>
            
            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-brand flex items-center space-x-2">
              <div className="p-2 bg-purple-brand/10 text-purple-brand rounded-xl shrink-0">
                <ActiveIcon className="w-5 h-5" />
              </div>
              <span>{steps[activeStep].title}</span>
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-brand/80 leading-relaxed font-sans font-medium">
              {steps[activeStep].description}
            </p>

            {/* Sub-instructions list */}
            <div className="bg-gray-brand border border-gray-100 rounded-2xl p-5 space-y-3.5">
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-slate-brand/80 font-mono flex items-center space-x-1.5 mb-1">
                <CheckSquare className="w-3.5 h-3.5 text-purple-brand" />
                <span>Step Goals & Actions</span>
              </h4>
              <ul className="space-y-2.5">
                {steps[activeStep].instructions.map((ins, i) => (
                  <li key={i} className="flex items-start space-x-2 text-xs text-slate-brand/70 font-medium">
                    <span className="w-5 h-5 rounded-full bg-purple-brand/10 text-purple-brand font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 text-[9px]">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Micro Pro Tip Panel */}
            <div className="border-l-2 border-purple-brand pl-3 py-1">
              <p className="text-[10px] font-bold text-purple-brand tracking-widest uppercase mb-0.5">ℹ️ Quick Tip</p>
              <p className="text-[11px] text-slate-brand/65 font-medium leading-normal">{steps[activeStep].tips}</p>
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              onClick={handleBack}
              disabled={activeStep === 0}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${
                activeStep === 0
                  ? 'opacity-40 cursor-not-allowed border-gray-250 text-gray-300'
                  : 'bg-white hover:bg-gray-50 border-gray-300 text-slate-brand cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={activeStep === steps.length - 1}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full font-bold uppercase tracking-widest transition-all text-xs ${
                activeStep === steps.length - 1
                  ? 'opacity-40 cursor-not-allowed bg-purple-brand/50 text-white'
                  : 'bg-purple-brand hover:bg-opacity-90 text-white shadow-xs cursor-pointer'
              }`}
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Mockup Visual Canvas */}
        <div className="lg:col-span-5 bg-gray-brand border border-gray-150 rounded-2xl p-4 flex flex-col justify-center min-h-[340px] shadow-inner select-none relative">
          <div className="absolute top-2.5 left-2.5 text-[8px] font-mono text-slate-brand/45 tracking-widest font-bold uppercase">
            Simulation Window
          </div>
          <div className="w-full h-full max-w-sm mx-auto flex flex-col justify-center">
            {steps[activeStep].mockupRenderer()}
          </div>
        </div>

      </div>
    </div>
  );
}
