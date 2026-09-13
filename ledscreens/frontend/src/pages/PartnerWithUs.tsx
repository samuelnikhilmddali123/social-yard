import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const PartnerWithUs = () => {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F8FAFC] flex flex-col justify-center items-center px-6 relative font-sans">
      
      {/* ─── BACKGROUND LAYERS ─── */}
      {/* Soft radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,71,255,0.04)_0%,transparent_60%)] pointer-events-none z-0" />
      
      {/* Animated soft glow blob behind the content */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.45, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#6C47FF]/10 to-[#8B5CF6]/5 blur-[80px] pointer-events-none z-0"
      />

      {/* Calligraphy Font Import Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap');
        .calligraphy-title {
          font-family: 'Alex Brush', cursive !important;
        }
      `}</style>

      {/* ─── HERO CONTENT (VERTICALLY CENTERED) ─── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15,
            }
          }
        }}
        className="max-w-[700px] w-full text-center relative z-10 flex flex-col items-center space-y-6 md:space-y-8"
      >

        {/* Heading & Calligraphy Title */}
        <div className="space-y-2 md:space-y-4">
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 }
            }}
            className="text-4xl md:text-[56px] font-black text-slate-900 tracking-tight leading-none pt-2"
          >
            E3Di Partner Network
          </motion.h1>
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 }
            }}
            className="calligraphy-title text-6xl md:text-[76px] text-[#6C47FF] select-none leading-none pt-1"
          >
            Coming Soon
          </motion.h2>
        </div>

        {/* Description */}
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 }
          }}
          className="text-slate-500 font-medium text-sm md:text-lg leading-relaxed max-w-[620px] mx-auto px-4"
        >
          Our partner onboarding portal is currently under calibration. Screen owners can register displays and slots in our upcoming automated network loops launch.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 }
          }}
          className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md pt-2 px-4"
        >
          <Link
            to="/"
            className="flex-1 px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl border border-slate-200 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] text-center flex items-center justify-center active:scale-[0.98]"
          >
            Go To Home
          </Link>
          <Link
            to="/contact"
            className="flex-1 px-8 py-4 bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] hover:from-[#5b3ce6] hover:to-[#7c4df6] text-white font-bold text-sm rounded-2xl transition-all shadow-[0_4px_25px_0_rgba(108,71,255,0.25)] hover:shadow-[0_8px_30px_0_rgba(108,71,255,0.35)] text-center flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <span>Inquire About Onboarding</span>
            <ArrowRight size={15} />
          </Link>
        </motion.div>

      </motion.div>

    </div>
  );
};

export default PartnerWithUs;
