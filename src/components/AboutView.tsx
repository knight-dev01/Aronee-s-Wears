import { Heart, Compass, Target, ShieldCheck } from 'lucide-react';
import WalkthroughGuide from './WalkthroughGuide';

export default function AboutView() {
  const values = [
    {
      title: 'Precision Quality',
      desc: 'All selected products must undergo rigid material stress testing and stitching audits.',
      icon: ShieldCheck
    },
    {
      title: 'Lagos Modernism',
      desc: 'Inspired by the vibrant, elegant, and modern styles ruling Lagos fashion scenes.',
      icon: Compass
    },
    {
      title: 'Unfailing Devotion',
      desc: 'Dedicated to offering high-fashion items with quick delivery speeds and absolute pricing honesty.',
      icon: Heart
    }
  ];

  return (
    <div id="about-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-20">
      
      {/* Hero Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-purple-brand font-mono font-bold text-xs uppercase tracking-[0.25em] block">
          Aronee's Wears Legacy
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-slate-brand">
          Fusing Premium Craft & Urban Style
        </h1>
        <p className="text-sm sm:text-base text-slate-brand/60 font-light leading-relaxed">
          How a passion for quality and design created a trusted hub for fashionistas and lovers of luxury wears across Lagos, Nigeria.
        </p>
        <div className="w-16 h-1 bg-purple-brand mx-auto rounded-full mt-4" />
      </section>

      {/* Story Column */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-brand">
            Our Business Story
          </h2>
          <div className="space-y-4 text-sm text-slate-brand/70 leading-relaxed font-sans">
            <p>
              Founded in the bustling fashion hub of Ikotun, Lagos, **ARONEE'S WEARS** was birthed out of a straightforward necessity: providing genuine, premium shoes at fair workshop rates without compromising structural integrity or aesthetic appeal.
            </p>
            <p>
              We discovered that Nigerian shoppers often had to compromise between heavily priced international imports and low-grade knockoffs. We set out to change that by curating high-end sneakers, elegant high heels designed for Nigerian wedding occasions, durable handcrafted local leather sandals, and coordinating accessories.
            </p>
            <p>
              Today, Aronee's Wears represents a household stamp of durability, and fashion-forward designs. By leveraging the speed and proximity of WhatsApp ordering, we bridge the gap between our physical Ikotun shopfront and modern smartphones throughout the continent.
            </p>
          </div>
        </div>
        <div className="relative h-96 rounded-2xl overflow-hidden border border-gray-100 shadow-md">
          <img
            src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80"
            alt="Shoe workshop background"
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-brand/20 to-transparent mix-blend-overlay" />
        </div>
      </section>

      {/* Mission & Vision Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-purple-brand text-white p-8 sm:p-12 rounded-3xl space-y-4 select-none shadow-md">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-display font-bold text-2xl">
            Our Mission Statement
          </h3>
          <p className="text-sm text-purple-100 font-light leading-relaxed">
            To curate and deliver high-quality, elegant, and resilient wears and accessories that amplify personal confidence, while ensuring seamless and highly transparent customer transactions from product discovery to door delivery.
          </p>
        </div>

        <div className="bg-slate-brand text-white p-8 sm:p-12 rounded-3xl space-y-4 select-none shadow-md">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-display font-bold text-2xl">
            Our Vision Statement
          </h3>
          <p className="text-sm text-gray-300 font-light leading-relaxed">
            To be recognized as Nigeria’s most trusted, agile, and beloved mobile wears fashion storefront, uniting traditional high-craft standards with progressive modern-era e-commerce accessibility.
          </p>
        </div>
      </section>

      {/* Brand Values */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-brand">
            Our Core Values
          </h2>
          <p className="text-xs sm:text-sm text-slate-brand/60 font-medium">
            The non-negotiable principles guiding every transaction we curate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((v, idx) => (
            <div key={idx} className="bg-gray-brand border border-gray-100 p-8 rounded-2xl text-center space-y-4 shadow-2xs">
              <div className="w-12 h-12 bg-purple-brand/10 text-purple-brand rounded-full flex items-center justify-center mx-auto">
                <v.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-base sm:text-lg text-slate-brand">
                {v.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-brand/60 leading-relaxed font-sans font-medium">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Comprehensive Interactive Site Walkthrough */}
      <section className="pt-8 border-t border-gray-100">
        <WalkthroughGuide />
      </section>

    </div>
  );
}
