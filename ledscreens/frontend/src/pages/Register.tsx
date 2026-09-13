import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, CheckCircle, Eye, EyeOff, Gift, TrendingUp, MapPin } from 'lucide-react';

import API from '../services/api';
import { useAuth } from '../AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await API.post('/auth/register', { name, email, password });
      const { token, user } = response.data;
      setAuthData(token, user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
      <div className="w-full max-w-7xl h-full max-h-[850px] flex gap-[30px] transition-all duration-500">
        {/* Left Side - Premium Branding */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-[30px] flex-col p-12 relative overflow-hidden shadow-2xl shadow-slate-200/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

          <div className="relative z-10">
            <div className="w-full flex justify-start mb-6">
               <img src="/3d.png" alt="E3Di Logo" className="w-full h-auto object-contain" />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl font-black text-white leading-tight mb-8">
                Launch your campaign <br />
                <span className="text-indigo-400">in under 5 minutes.</span>
              </h2>
              <div className="space-y-6">
                {[
                  '2 premium UHD screens',
                  'Instant campaign activation',
                  'No setup fees'
                ].map((text, i) => (
                  <motion.div 
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-4 text-slate-300 font-bold"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                       <CheckCircle size={14} className="text-indigo-400" />
                    </div>
                    {text}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="relative z-10 p-8 bg-white/5 rounded-[24px] border border-white/10 backdrop-blur-sm mt-auto">
             <p className="text-slate-400 text-sm font-bold italic leading-relaxed">
               "Jaan Entertainment is revolutionizing how we think about outdoor advertising. It's fast, smart, and premium."
             </p>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex-1 bg-white rounded-2xl lg:rounded-[30px] flex flex-col justify-center p-6 sm:p-8 shadow-sm border border-slate-100 overflow-y-auto">
          <div className="max-w-md w-full mx-auto py-2 lg:py-4 lg:-mt-6">
            {/* Mobile Brand Header */}
            <div className="flex items-center mb-10 lg:hidden justify-center">
              <div className="w-44 h-16 flex items-center justify-center">
                <img src="/3d.png" alt="E3Di Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="mb-4">
              {/* Top pulsing badge */}
              <div className="flex justify-center lg:justify-start mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#D71920] text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-red-600/10">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  📢 Advertiser Portal • Live Booking
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2 text-center lg:text-left flex items-center justify-center lg:justify-start flex-wrap gap-x-1.5">
                Welcome to
                <span className="inline-flex items-center font-sans font-black tracking-tighter select-none align-middle">
                  <span className="text-[#D4AF37]">E</span>
                  <span className="text-[#D71920]">3</span>
                  <span className="text-[#D4AF37]">D</span>
                  <span className="relative inline-block leading-none">
                    <span className="text-[#D4AF37]">ı</span>
                    <span className="absolute -top-[3px] left-1/2 -translate-x-1/2 text-[#D71920] font-black text-[12px] leading-none">.</span>
                  </span>
                </span>
                Platform
              </h1>
              <p className="text-sm text-slate-400 font-medium text-center lg:text-left">Create your account to get started</p>
            </div>

            {/* Campaign Special Offer Banner */}
            <div className="mb-4 bg-[#FAF8F5] border border-[#EADFC9] rounded-2xl p-3 flex items-center gap-4 shadow-sm transition-all hover:scale-[1.01]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B89025] text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Gift size={16} className="text-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[11px] font-black text-[#6C5328] uppercase tracking-wide">First Booking Special</h3>
                <p className="text-[10px] text-[#8C6D39] font-bold leading-normal mt-0.5">
                  Lock your campaign slot today & claim <span className="text-[#D71920] font-black underline decoration-[#D71920]/30">10 SECONDS FREE</span> on your first billboard stream!
                </p>
              </div>
            </div>

            {/* Live Portal Stats Grid */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2.5 transition-all hover:bg-slate-100/50">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 flex-shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Active Screens</span>
                  <span className="block text-xs font-black text-slate-900 mt-1 leading-none">2 Screens</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2.5 transition-all hover:bg-slate-100/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Daily Reach</span>
                  <span className="block text-xs font-black text-emerald-600 mt-1 leading-none">10k+ Views</span>
                </div>
              </div>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-3">
                <div className="relative group">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                  />
                </div>

                <div className="relative group">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                  />
                </div>

                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="..........."
                    minLength={6}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Create account'}
              </button>

              <p className="text-center text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-tight sm:tracking-widest">
                By signing up, you agree to our{' '}
                <Link to="#" className="text-indigo-600">Terms</Link> & <Link to="#" className="text-indigo-600">Privacy</Link>
              </p>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-center text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-tight sm:tracking-widest whitespace-nowrap">
                  Already have an account?{' '}
                  <Link to="/login" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
