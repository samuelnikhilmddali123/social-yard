import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Mail, Lock, ArrowRight, 
  AlertCircle, Gift,
  TrendingUp, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { useAuth, needsProfileCompletion } from '../AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempUserId, setTempUserId] = useState('');
  const { loginWithGoogle, setAuthData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const googleUser: any = await loginWithGoogle();
      
      // Sync with backend
      if (!googleUser?.email) {
        throw new Error('Google account did not return an email address');
      }

      const response = await API.post('/auth/google-login', {
        email: googleUser.email,
        name: googleUser.displayName || 'Google User',
        googleId: googleUser.uid
      });

      const { token, user } = response.data;
      handleLoginSuccess(token, user);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (code === 'auth/popup-blocked') {
        setError('Popup blocked — allow popups for this site and try again');
      } else {
        setError(err.response?.data?.msg || err.response?.data?.details || err.message || 'Google Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await API.post('/auth/login', { email, password });
      console.log('Login Response Data:', response.data);
      
      if (response.data.require2FA) {
        console.log('Switching to 2FA View');
        setTempUserId(response.data.userId);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      const { token, user } = response.data;
      handleLoginSuccess(token, user);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Login failed');
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/verify-2fa', { userId: tempUserId, code: twoFactorCode });
      const { token, user } = res.data;
      handleLoginSuccess(token, user);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Invalid verification code');
      setLoading(false);
    }
  };

  const handleLoginSuccess = (token: string, user: any) => {
    setAuthData(token, user);

    if (user.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (user.role === 'government') {
      navigate('/gov-dashboard', { replace: true });
    } else if (needsProfileCompletion(user)) {
      navigate('/complete-profile', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 lg:p-12 min-h-screen overflow-y-auto relative">
      
      {/* Left side image: left of the main content box, floating, spanning top to bottom */}
      <div className="hidden xl:block absolute left-4 xl:left-8 2xl:left-16 top-0 bottom-0 w-[320px] pointer-events-none select-none z-10 py-0">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="w-full h-full"
        >
          <img src="/pole1.png" alt="Pole 1 Left" className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)] transform scale-[1.8] origin-center" />
        </motion.div>
      </div>

      {/* Right side image: right of the main content box, floating, spanning top to bottom */}
      <div className="hidden xl:block absolute right-4 xl:right-8 2xl:right-16 top-0 bottom-0 w-[320px] pointer-events-none select-none z-10 py-0">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="w-full h-full"
        >
          <img src="/pole2.png" alt="Pole 2 Right" className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)] transform scale-[1.8] origin-center" />
        </motion.div>
      </div>

      <div className="w-full max-w-5xl h-full max-h-[800px] flex gap-[30px] transition-all duration-500 relative z-20">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-[30px] flex-col p-12 relative overflow-hidden shadow-2xl shadow-slate-200/50">
        {/* Decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: 500, rotate: 720 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ 
              duration: 3.5, 
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2
            }}
            className="w-full flex justify-start mb-6"
          >
            <img src="/3d.png" alt="E3Di Logo" className="w-full h-auto object-contain" />
          </motion.div>
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
            <p className="text-indigo-100 text-xl font-medium leading-relaxed mb-10 max-w-md">
              {"Deploy campaigns to our 2 premium screens. Real-time analytics. Instant go-live.".split("").map((char, index) => (
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
                    initial={{ opacity: 0, scale: 0, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.2 + (i * 0.4),
                      ease: "backOut" 
                    }}
                    className={`w-10 h-10 ${c} rounded-full border-2 border-indigo-600 shadow-lg`} 
                  />
                ))}
              </div>
              <p className="text-indigo-100 text-sm font-bold tracking-wide">
                {"Trusted by 500+ brands across India".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: 0.8 + index * 0.03 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl lg:rounded-[30px] flex flex-col justify-center p-6 sm:p-8 shadow-sm border border-slate-100 overflow-y-auto">
        <div className="max-w-md w-full mx-auto py-2 lg:py-4 lg:-mt-6 font-sans">
          {/* Mobile Brand Header */}
          <div className="flex items-center mb-10 lg:hidden justify-center">
            <div className="w-44 h-16 flex items-center justify-center">
              <img src="/3d.png" alt="E3Di Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div id="recaptcha-container"></div>
          <AnimatePresence mode="wait">
            {!show2FA ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="mb-3">
                  {/* Top pulsing badge */}
                  <div className="flex justify-center lg:justify-start mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#D71920] text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-red-600/10">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                      </span>
                      📢 Advertiser Portal • Live Booking
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-3 text-center lg:text-left flex items-center justify-center lg:justify-start flex-wrap gap-x-1.5 leading-tight animate-fade-in">
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
                </div>

                {/* Campaign Special Offer Banner */}
                <div className="bg-[#FAF8F5] border border-[#EADFC9] rounded-2xl p-3 flex items-center gap-4 shadow-sm transition-all hover:scale-[1.01]">
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
                <div className="grid grid-cols-2 gap-3">
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

                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                      <Link to="/forgot-password" style={{ color: '#EF4444' }} className="text-[10px] font-bold hover:underline cursor-pointer transition-colors duration-200 uppercase tracking-widest">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="..........."
                        required
                        className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-all duration-300"
                      >
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                            {/* Head/Face Shape - More Human */}
                            <path d="M16 26C21.5228 26 26 21.5228 26 16C26 10.4772 21.5228 6 16 6C10.4772 6 6 10.4772 6 16C6 21.5228 10.4772 26 16 26Z" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="14" r="1.5" fill="currentColor" />
                            <circle cx="20" cy="14" r="1.5" fill="currentColor" />
                            <path d="M13 20C13 20 14 21 16 21C18 21 19 20 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            
                            {/* Left Hand */}
                            <motion.path
                              d="M4 22C4 22 6 15 11 15"
                              animate={{ 
                                x: showPassword ? -5 : 0,
                                y: showPassword ? 10 : 0,
                                opacity: showPassword ? 0 : 1,
                                rotate: showPassword ? -45 : 0
                              }}
                              transition={{ type: "spring", stiffness: 200, damping: 15 }}
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            
                            {/* Right Hand */}
                            <motion.path
                              d="M28 22C28 22 26 15 21 15"
                              animate={{ 
                                x: showPassword ? 5 : 0,
                                y: showPassword ? 10 : 0,
                                opacity: showPassword ? 0 : 1,
                                rotate: showPassword ? 45 : 0
                              }}
                              transition={{ type: "spring", stiffness: 200, damping: 15 }}
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold">
                      <AlertCircle size={16} /> {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? 'Authenticating...' : <><Shield size={16} /> Enter Dashboard <ArrowRight size={16} /> </>}
                  </button>
                </form>


                <motion.button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  initial="initial"
                  whileHover="hover"
                  className="w-full flex items-center justify-center gap-3.5 py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] group"
                >
                  <motion.div 
                    variants={{
                      hover: { scale: 1.2, rotate: [0, -10, 10, 0] }
                    }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 drop-shadow-sm">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                  </motion.div>
                  <span className="text-slate-700 text-sm font-semibold tracking-tight group-hover:text-slate-900 transition-colors">
                    Sign in with Google
                  </span>
                </motion.button>

                <p className="mt-4 text-center text-[10px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-widest whitespace-nowrap animate-fade-in">
                  <span className="text-[#94A3B8]">New to E3Di?</span>{' '}
                  <Link to="/register" className="text-[#EF4444] hover:underline cursor-pointer transition-colors duration-200">
                    Create One
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="2fa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-center"
              >
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-sm border border-indigo-100">
                  <Shield size={40} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Two-Step Verification</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Enter the 6-digit code from your app</p>
                </div>

                <form onSubmit={handle2FASubmit} className="space-y-8">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold">
                      <AlertCircle size={16} /> {error}
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <input 
                      type="text" 
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="000000"
                      className="w-full py-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-center text-4xl tracking-[0.4em] outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                      autoFocus
                    />
                  </div>

                  <button disabled={loading} type="submit" className="w-full py-5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50">
                    {loading ? 'Verifying...' : 'Complete Sign-In'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setShow2FA(false)}
                    className="w-full text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                  >
                    Back to Credentials
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Login;
