import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Mail, Lock, ArrowRight, 
  AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';

const GovLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await API.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      if (user.role !== 'government' && user.role !== 'admin') {
        setError('Unauthorized access. Official government credentials required.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#050505] flex items-center justify-center p-6 lg:p-12 min-h-screen overflow-y-auto">
      <div className="w-full max-w-7xl h-full max-h-[850px] flex gap-[30px] transition-all duration-500">
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-[30px] flex-col p-12 relative overflow-hidden shadow-2xl shadow-indigo-500/10 border border-white/5">
          {/* Decorations */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <motion.div 
              initial={{ opacity: 0, x: 500, rotate: 720 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ 
                duration: 3.5, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.2
              }}
              className="w-40 h-16 flex items-center justify-center"
            >
              <img src="/3d.png" alt="Logo" className="w-full h-full object-contain" />
            </motion.div>
            <motion.span 
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="text-white font-black text-2xl tracking-tighter"
            >
              JAAN<span className="text-rose-600 font-bold ml-0.5">ENTERTAINMENT</span>
            </motion.span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="relative z-10">
              <h2 className="text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                {"India's Premiere".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: 0.2 + index * 0.08 }}
                  >
                    {char}
                  </motion.span>
                ))}
                <br />
                {"Entertainment Ad-Network".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: 0.5 + index * 0.08 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </h2>
              <p className="text-slate-400 text-xl font-medium leading-relaxed mb-10 max-w-md">
                {"Deploy campaigns to 340+ premium screens. Real-time analytics. Instant go-live.".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: 0.5 + index * 0.03 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </p>
              <div className="flex items-center gap-5">
                <div className="flex -space-x-3">
                  {['bg-sky-400', 'bg-emerald-400', 'bg-amber-400', 'bg-white/40'].map((c, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                      className={`w-10 h-10 rounded-full border-2 border-black ${c}`}
                    />
                  ))}
                </div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  className="text-slate-500 font-bold text-sm"
                >
                  Trusted by 500+ brands across India
                </motion.p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#0a0a0a] rounded-[30px] p-8 md:p-16 shadow-2xl border border-white/5 flex flex-col justify-center max-w-xl mx-auto relative overflow-hidden group">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-100" />
          
          <div className="mb-12 relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-white/10"
            >
              <Shield className="text-indigo-400" size={28} />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-3">Gov <span className="text-indigo-500">Login</span></h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Official Government Portal</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Official Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/input:text-indigo-400 transition-colors" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-5 bg-white/5 border border-white/10 rounded-[20px] font-bold text-sm outline-none text-white focus:border-indigo-500/50 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700" 
                  placeholder="name@gov.in"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Security Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/input:text-indigo-400 transition-colors" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-5 bg-white/5 border border-white/10 rounded-[20px] font-bold text-sm outline-none text-white focus:border-indigo-500/50 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700" 
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-indigo-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 shadow-sm shadow-rose-900/10"
                >
                  <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs font-bold text-rose-200 leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[20px] hover:bg-indigo-700 shadow-2xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>SIGN INTO NETWORK <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-3 relative z-10">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">End-to-End Encrypted Session</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovLogin;
