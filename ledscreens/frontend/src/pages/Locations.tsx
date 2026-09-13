import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const screens = [
  {
    id: '65-inch',
    label: '5 × 3 Feet LED Display (Pole 1)',
    description: 'Optimized for dense transit corridors, retail loops, and street-level intersections.',
    image: '/led_pole_75.png',
    badge: '5 × 3 Feet (Pole 1)',
  },
  {
    id: '75-inch',
    label: '5 × 3 Feet LED Display (Pole 2)',
    description: 'Landmark visibility, corporate zones, and maximum exposure exits.',
    image: '/led_pole_65.png',
    badge: '5 × 3 Feet (Pole 2)',
  },
];

const Locations = () => {
  return (
    <div className="flex-1 min-h-screen bg-transparent pt-28 pb-24 px-6 relative overflow-hidden">
      {/* Ambient decorative glows */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(108,71,255,0.06) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(108,71,255,0.04) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200/50 rounded-full text-neutral-800 mb-4">
            <Sparkles size={12} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">E3Di Display Fleet</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Choose Your Screen at Ethree Food Court
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Select from our LED screens installed at Ethree food court, Vijayawada — ultra-bright, weatherproof, and ready to broadcast your brand.
          </p>
        </div>

        {/* Screen Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {screens.map((screen, i) => (
            <motion.div
              key={screen.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-400 flex flex-col group"
            >
              {/* Image — fixed height */}
              <div className="relative bg-slate-950 overflow-hidden" style={{ height: '280px' }}>
                <img
                  src={screen.image}
                  alt={screen.label}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

                {/* Size badge */}
                <div className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[11px] font-black text-slate-900 uppercase tracking-widest shadow">
                  {screen.badge}
                </div>

                {/* Label */}
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-black text-lg leading-tight tracking-tight drop-shadow-lg">
                    {screen.label}
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div className="p-6 flex flex-col gap-4 flex-1">
                <p className="text-slate-500 text-sm font-medium leading-relaxed flex-grow">
                  {screen.description}
                </p>

                <Link
                  to={`/launch-campaign?format=${screen.id}`}
                  className="w-full py-3.5 px-5 bg-neutral-900 hover:bg-black text-white font-black text-sm rounded-xl transition-all shadow-md shadow-neutral-900/10 hover:shadow-neutral-900/25 hover:-translate-y-0.5 flex items-center justify-center gap-2 group/btn uppercase tracking-wide"
                >
                  <span>Book Now — {screen.badge}</span>
                  <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Locations;
