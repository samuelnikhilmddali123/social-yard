import { Check, Sparkles, ArrowRight, Clock, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const defaultPlans = [
  {
    id: 'starter',
    name: 'Starter',
    badge: null,
    price: '₹24,999',
    duration: '/week',
    desc: 'Perfect for dedicated, high-impact brand-building campaigns.',
    features: [
      'Advertisement displayed every day for 7 days',
      'Dedicated 1,200 minutes daily ad play time allocated',
      'Premium LED display placement (1 Screen)',
      'High-quality video/image advertisements',
      'Campaign performance dashboard',
      'Technical support'
    ],
    cta: 'Book Starter',
    highlight: false,
  },
  {
    id: 'custom',
    name: 'Custom Campaign',
    badge: 'Most Popular',
    price: '₹79,999',
    duration: ' starting rate',
    desc: 'The go-to plan for scaling brands with full date & display flexibility.',
    features: [
      'Custom booking dates (choose any start and end date)',
      'Full-month bookings supported',
      '2 LED Screens included for ₹79,999',
      'Dedicated 1,200 minutes daily ad play time per screen',
      'Premium screen locations & priority placement',
      'Comprehensive performance analytics dashboard',
      'Dedicated account support'
    ],
    cta: 'Design Campaign',
    highlight: true,
  },
];

const Pricing = () => {
  const plans = defaultPlans;

  return (
    <div className="app-bg min-h-screen pt-24 pb-24 px-6 bg-slate-50/50">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <p className="text-xs font-black tracking-widest uppercase text-neutral-800">Pricing Packages</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Simple, Transparent Pricing.</h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">Start small. Scale fast. No hidden fees.</p>
        </div>

        {/* Luxury Apple-inspired Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch mb-20">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className={`relative bg-white rounded-[32px] border transition-all duration-500 flex flex-col justify-between overflow-hidden ${
                plan.highlight
                  ? 'border-neutral-900 shadow-[0_20px_40px_rgba(0,0,0,0.06)]'
                  : 'border-slate-200/80 shadow-[0_4px_25px_-8px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)]'
              }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-neutral-950 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md z-10 animate-pulse">
                  <Sparkles size={10} className="text-yellow-400 fill-yellow-400" /> {plan.badge}
                </div>
              )}

              <div className="p-8 md:p-10 flex-1 flex flex-col justify-between">
                <div>
                  {/* Name & desc */}
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">{plan.name}</h2>
                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{plan.desc}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-black tracking-tight text-slate-950">{plan.price}</span>
                      <span className="text-slate-400 text-xs font-black uppercase tracking-widest">{plan.duration}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-3 text-xs font-semibold text-slate-600 group/item">
                        <div className={`mt-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-neutral-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          <Check size={11} className="stroke-[3]" />
                        </div>
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Link
                  to="/launch-campaign"
                  className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                    plan.highlight
                      ? 'bg-neutral-950 text-white hover:bg-black shadow-md shadow-neutral-900/10 hover:shadow-neutral-900/25'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200/50'
                  }`}
                >
                  {plan.cta} <ArrowRight size={13} className="stroke-[3]" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Advertisement Rotation Logic Infographic Card */}
        <div className="bg-white border border-slate-200/80 rounded-[32px] p-8 md:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#6C47FF] bg-indigo-50 px-2 py-0.5 rounded">
                <Clock size={10} /> Dynamic Playback Allocation
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">Advertisement Rotation Logic</h2>
              <p className="text-xs text-slate-500 font-medium">How we schedule and rotate advertisements to maximize your exposure.</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-right shrink-0">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Screen Total Operating Pool</span>
              <span className="text-lg font-black text-slate-900">1,440 Minutes / Day</span>
            </div>
          </div>

          {/* Timeline Visual Indicator */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-black uppercase tracking-wider">
              <span>Timeline Breakdown (1,440 Mins)</span>
              <span>100% Total screen time</span>
            </div>
            
            <div className="w-full h-10 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden flex shadow-inner relative">
              {/* Dedicated Subscriber Share (1200 mins - 83.3%) */}
              <div className="h-full bg-neutral-900 flex items-center justify-center text-[9px] font-black text-white border-r border-slate-700 w-[83.3%] shrink-0">
                📈 Dedicated Subscriber Ads (1,200 Mins / Day)
              </div>
              
              {/* Remaining Customer Pool (240 mins - 16.7%) */}
              <div className="h-full bg-gradient-to-r from-indigo-500 to-[#6C47FF] flex items-center justify-center text-[9px] font-black text-white w-[16.7%] shrink-0 animate-pulse">
                🔄 Other Loop Ads (240 Mins)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-medium leading-relaxed text-slate-500 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
                <Check className="text-emerald-600 shrink-0 mt-0.5 stroke-[3]" size={14} />
                <div>
                  <b className="text-slate-900 block mb-0.5">Dedicated Package Playback</b>
                  Weekly (Starter) and Monthly (Custom) subscribers receive a guaranteed allocation of **1,200 minutes daily** per screen.
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
                <Check className="text-indigo-600 shrink-0 mt-0.5 stroke-[3]" size={14} />
                <div>
                  <b className="text-slate-900 block mb-0.5">Loop Rotation for Remaining Slots</b>
                  The remaining **240 minutes daily** rotate fairly and intelligently among other daily loop customers.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Info Section */}
          <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6 text-xs text-slate-600 space-y-4">
            <h3 className="font-black text-slate-950 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
              <Monitor size={12} className="text-[#6C47FF]" /> Schedule Engine Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <b className="text-slate-900 block">Dynamic Distribution</b>
                When multiple customers book campaigns, the scheduling engine automatically scales frequency within the 240-minute pool.
              </div>
              <div className="space-y-1">
                <b className="text-slate-900 block">Double-Screen Coverage</b>
                Custom Campaign subscribers (₹79,999 starting) automatically receive their 1,200-minute daily slots across 2 screens.
              </div>
              <div className="space-y-1">
                <b className="text-slate-900 block">Standard Media Loop</b>
                Daily loop ad playtimes scale proportional to customer purchase options and uploaded media duration.
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 font-bold mt-12 tracking-wide">
          All pricing includes GST. Slots are subject to available inventory. <Link to="/contact" className="text-indigo-500 font-black hover:underline uppercase tracking-widest ml-1">Contact Headquarters →</Link>
        </p>
      </div>
    </div>
  );
};

export default Pricing;
