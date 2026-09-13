import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles,
  Calendar
} from 'lucide-react';



const testimonials = [
  {
    quote: "E3Di has completely modernized our brand launch schedules. We can activate and measure outdoor exposure in real-time.",
    author: "Karan Johar",
    role: "Media Buying Director, Wavemaker India",
    logo: "Wavemaker"
  },
  {
    quote: "The display clarity, screen sizes, and absolute platform transparency make this the most luxury DOOH experience in the country.",
    author: "Neha Dhupia",
    role: "Head of Marketing, Tata Motors EV",
    logo: "Tata Motors"
  },
  {
    quote: "A premium network that treats outdoor media like high-performance programmatic display software. Seamless experience from day one.",
    author: "Aditya Roy",
    role: "Brand Director, OnePlus India",
    logo: "OnePlus"
  }
];

const brandLogos = [
  'Tata Motors', 'Reliance Digital', 'Wavemaker', 'Airtel', 'Maruti Suzuki', 'Samsung', 'PepsiCo', 'OnePlus'
];



const FuturisticHeroVisual = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 select-none font-sora z-10">
      
      {/* Calligraphy Font Import Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap');
        .cursive-hello {
          font-family: 'Alex Brush', cursive !important;
        }
      `}</style>

      {/* Calligraphy text "Book Your Slot" drawing/fading up */}
      <div className="overflow-hidden py-2 w-full">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="cursive-hello text-[48px] xs:text-[64px] sm:text-[92px] lg:text-[104px] text-white tracking-tight leading-none filter drop-shadow-[0_4px_25px_rgba(255,255,255,0.3)]"
        >
          Book Your Slot
        </motion.div>
      </div>

      {/* Subtitle / Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-slate-200 font-bold text-sm md:text-base leading-relaxed max-w-md filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
      >
        Choose your preferred location and reserve your advertising slot instantly.
      </motion.p>

      {/* Soft pulsing primary calendar CTA button */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
        className="w-full max-w-xs pt-4"
      >
        <Link to="/launch-campaign">
          <motion.button
            animate={{
              boxShadow: [
                "0 4px 20px rgba(108,77,255,0.35)",
                "0 4px 45px rgba(108,77,255,0.75)",
                "0 4px 20px rgba(108,77,255,0.35)"
              ]
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut"
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4.5 px-6 bg-gradient-to-r from-[#6C4DFF] to-[#8B5CF6] hover:from-[#5b3ce6] hover:to-[#7c4df6] text-white font-bold text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-[0.98] border border-white/20 flex items-center justify-center gap-2.5"
          >
            <Calendar size={16} className="text-[#00E5FF]" />
            <span>Book Campaign</span>
            <ArrowRight size={14} className="opacity-80" />
          </motion.button>
        </Link>
      </motion.div>

    </div>
  );
};

const Home = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Awwwards-style scroll transforms
  const scaleHero = useTransform(scrollYProgress, [0, 0.15], [1, 0.96]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // Automatic slide rotations
  useEffect(() => {
    const testInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => {
      clearInterval(testInterval);
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-[#F8F7F4] text-[#1A1F36] min-h-screen overflow-x-hidden relative font-sans selection:bg-[#6C47FF]/25 noise-bg">
      
      {/* Dynamic ambient background spotlight orbs (Luxury Awwwards feeling) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[-15%] w-[600px] h-[600px] bg-[#6C47FF]/5 rounded-full blur-[140px] animate-glow-orb" />
        <div className="absolute top-[35%] right-[-20%] w-[800px] h-[800px] bg-[#FF5EA8]/4 rounded-full blur-[160px] animate-glow-orb" style={{ animationDelay: '-6s' }} />
        <div className="absolute top-[65%] left-[-25%] w-[700px] h-[700px] bg-[#00D4FF]/4 rounded-full blur-[150px] animate-glow-orb" style={{ animationDelay: '-12s' }} />
        <div className="absolute top-[85%] right-[-10%] w-[500px] h-[500px] bg-[#6C47FF]/3 rounded-full blur-[120px] animate-glow-orb" style={{ animationDelay: '-18s' }} />
      </div>

      {/* Inline styles for custom city lights, ambient animations & sweeps */}
      <style>{`
        @keyframes traffic-right {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes traffic-left {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes sweep {
          0% { transform: translate(-100%, -100%) rotate(45deg); }
          100% { transform: translate(150%, 150%) rotate(45deg); }
        }
        @keyframes window-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
        @keyframes particle-drift {
          0% { transform: translateY(0px) translateX(0px); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: translateY(-120px) translateX(20px); opacity: 0; }
        }
        .animate-traffic-flow-right {
          animation: traffic-right 4.5s infinite linear;
        }
        .animate-traffic-flow-left {
          animation: traffic-left 5s infinite linear;
        }
        .btn-sweep::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 80px; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-20deg);
          animation: sweep 4s infinite ease-in-out;
        }
        .building-window {
          background-image: radial-gradient(circle, #fcd34d 1px, transparent 1.5px);
          background-size: 8px 12px;
        }
        @keyframes draw-flow {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: -40; }
        }
      `}</style>

      {/* Premium light 100vh hero section with background street image */}
      <motion.section 
        style={{ 
          scale: scaleHero, 
          opacity: opacityHero,
          backgroundImage: "url('/premium_street_billboard.png')"
        }}
        className="relative h-screen flex items-center justify-center bg-slate-950 overflow-hidden w-full z-10 font-sans border-b border-slate-900 bg-cover bg-center bg-no-repeat"
      >
        {/* Soft dark overlay and backdrop blur for high-end cinematic readability */}
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] z-0 pointer-events-none" />
        
        {/* Center content container (Porsche-style minimal centered layout) */}
        <div className="relative z-10 max-w-4xl mx-auto w-full px-6 flex justify-center items-center h-full pt-12">
          <FuturisticHeroVisual />
        </div>
      </motion.section>

      {/* ─── BRAND LOGO MARQUEE (World-Class Partners) ─────────── */}
      <section className="bg-white border-t border-b border-slate-200/60 py-12 overflow-hidden relative z-10">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
        
        <div className="max-w-7xl mx-auto px-4 mb-4 text-center">
          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
            Broadcast Campaigns Trusted By India's Elite Enterprises & Media Agencies
          </p>
        </div>

        <div className="flex overflow-x-hidden relative w-full pt-4">
          <div className="marquee-scroll flex gap-20 items-center">
            {brandLogos.concat(brandLogos).map((logo, i) => (
              <span key={i} className="text-base md:text-lg font-extrabold text-slate-400 hover:text-[#1A1F36] transition-colors cursor-default tracking-tight uppercase whitespace-nowrap">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW TO BOOK A CAMPAIGN (Explanatory Process Guide) ─── */}
      <section className="bg-slate-50 py-12 md:py-24 relative z-10 border-b border-slate-200/40">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-[#6C47FF]/10 text-xs font-black tracking-widest text-[#6C47FF] uppercase">
              Campaign Booking
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#111827] tracking-tight mt-4">
              How To Book Your Campaign
            </h2>
            <p className="text-slate-500 font-semibold mt-4 text-base">
              Setting up a digital broadcast across E3Di's premium screen network is simple.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_4px_25px_-8px_rgba(0,0,0,0.03)] space-y-6 text-left hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#6C47FF] flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Select Screen Model</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Browse our premium high-brightness screen models including the **4×3 Feet LED Display** and the **5×4 Feet LED Display**. Choose the size and corridor that fits your campaign.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_4px_25px_-8px_rgba(0,0,0,0.03)] space-y-6 text-left hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#6C47FF] flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Configure Slots & Loops</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Define the slots per hour (frequency of playbacks) and specify the campaign start/end dates. Enter your details to generate your digital invoice and slot locking.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_4px_25px_-8px_rgba(0,0,0,0.03)] space-y-6 text-left hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#6C47FF] flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Upload Creative & Verify</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Upload your widescreen UHD layout designs. Once automatic diagnostic checks pass, E3Di's server telemetry streams your campaign live across your routes.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL CAROUSEL ────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-8 bg-white border-b border-slate-200/60 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-[#6C47FF]/10 text-xs font-black tracking-widest text-[#6C47FF] uppercase">
              Brand Reviews
            </span>
          </div>

          <div className="relative min-h-[180px]">
            <AnimatePresence mode="wait">
              {testimonials.map((t, idx) => {
                if (idx !== activeTestimonial) return null;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6 text-center"
                  >
                    <p className="text-xl md:text-3xl font-black text-[#111827] leading-relaxed italic px-4 md:px-8">
                      "{t.quote}"
                    </p>
                    <div>
                      <h4 className="text-[#111827] font-black text-sm">{t.author}</h4>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">{t.role}</p>
                      
                      <span className="inline-block mt-4 text-[9px] font-black text-[#6C47FF] uppercase tracking-widest bg-[#6C47FF]/5 border border-[#6C47FF]/10 px-3 py-1 rounded-full">
                        {t.logo}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Carousel dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeTestimonial === i ? 'bg-[#6C47FF] w-6' : 'bg-slate-200'
                }`}
                aria-label={`Testimonial slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION (Animated Gradient Mesh) ────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        <div className="relative rounded-[40px] overflow-hidden bg-white border border-slate-200/60 p-6 sm:p-12 md:p-24 shadow-2xl flex flex-col items-center text-center">
          
          {/* Glowing animated mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#6C47FF]/15 via-[#FF5EA8]/15 to-[#00D4FF]/15 pointer-events-none opacity-85 z-0" />
          <motion.div 
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#6C47FF]/10 rounded-full blur-[120px] pointer-events-none z-0" 
          />
          <motion.div 
            animate={{
              scale: [1, 1.08, 1],
              rotate: [0, -2, 2, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-[#00D4FF]/8 rounded-full blur-[140px] pointer-events-none z-0" 
          />
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [200, -100],
                  x: [0, Math.sin(i) * 30],
                  opacity: [0, 0.4, 0]
                }}
                transition={{
                  duration: 5 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "linear"
                }}
                className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#FF5EA8] blur-[0.5px]"
                style={{
                  left: `${15 + (i * 7)}%`,
                  bottom: `0%`
                }}
              />
            ))}
          </div>

          <div className="relative z-10 space-y-6 md:space-y-8 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-500 shadow-sm">
              <Sparkles size={12} className="text-[#6C47FF]" />
              <span>Broadcast campaigns at scale</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-[#111827] leading-none">
              Ready To Dominate India's Screens?
            </h2>
            <p className="text-slate-500 font-semibold text-base md:text-lg max-w-lg mx-auto leading-relaxed">
              Join leading enterprise brands already advertising across India's fastest-growing digital billboard network.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                to="/launch-campaign"
                className="luxury-btn-primary px-8 py-4 flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <span className="relative z-10">Book Campaign</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#contact"
                className="luxury-btn-secondary-dark px-8 py-4 flex items-center justify-center border border-slate-200 text-slate-800 bg-white hover:bg-slate-50 relative overflow-hidden group active:scale-97 font-semibold"
              >
                Talk To Sales
              </a>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
