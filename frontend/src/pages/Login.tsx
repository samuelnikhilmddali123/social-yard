import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, ArrowRight, 
  AlertCircle, HelpCircle
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const googleUser: any = await loginWithGoogle();
      
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
      
      if (response.data.require2FA) {
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
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-hidden bg-slate-950 font-sans">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-95 transition-all duration-700"
        style={{ backgroundImage: `url('/Background.webp')` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-6">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/logo.webp" 
            alt="E3Di Logo" 
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-md" 
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </Link>

        <Link 
          to="/contact" 
          className="flex items-center gap-1.5 text-xs text-white/90 font-bold hover:text-white transition-colors cursor-pointer bg-black/20 hover:bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20"
        >
          <HelpCircle size={14} className="text-white/80" />
          <span>Need Help? <span className="underline decoration-white/40">Contact Support</span> →</span>
        </Link>
      </header>

      {/* Left Side Advertising Pole Asset */}
      <div className="hidden lg:flex absolute left-[3%] lg:left-[7%] xl:left-[12%] top-[8%] bottom-[4%] z-10 items-center justify-center pointer-events-none select-none">
        <motion.img 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          src="/Left side pole.webp" 
          alt="Left Advertising Display Pole" 
          className="h-full max-h-[82vh] w-auto object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.55)]" 
        />
      </div>

      {/* Right Side Advertising Pole Asset */}
      <div className="hidden lg:flex absolute right-[3%] lg:right-[7%] xl:right-[12%] top-[8%] bottom-[4%] z-10 items-center justify-center pointer-events-none select-none">
        <motion.img 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          src="/Right pole.webp" 
          alt="Right Advertising Display Pole" 
          className="h-full max-h-[82vh] w-auto object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.55)]" 
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-[390px] sm:max-w-[410px] bg-white/80 backdrop-blur-xl rounded-[28px] p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] border border-white/70 text-slate-800 font-sans relative z-30"
        >
          <AnimatePresence mode="wait">
            {!show2FA ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mb-1">
                    Welcome back!
                  </h1>
                  <p className="text-xs font-medium text-slate-500">
                    Login to your advertiser dashboard
                  </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 text-left mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#310A65] focus:bg-white focus:ring-1 focus:ring-[#310A65] transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 text-left">
                        Password
                      </label>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#310A65] focus:bg-white focus:ring-1 focus:ring-[#310A65] transition-all shadow-sm"
                    />
                    <div className="text-right mt-1.5">
                      <Link 
                        to="/forgot-password" 
                        className="text-[11px] font-semibold text-slate-500 hover:text-[#310A65] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2.5 text-rose-600 text-xs font-bold">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 bg-[#310A65] hover:bg-[#23064B] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-950/15 active:scale-[0.99] transition-all disabled:opacity-60 mt-3"
                  >
                    {loading ? 'AUTHENTICATING...' : (
                      <>
                        <span>ENTER DASHBOARD</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400 font-bold tracking-widest before:flex-1 before:h-px before:bg-slate-200 after:flex-1 after:h-px after:bg-slate-200 uppercase">
                  OR
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.99]"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <p className="mt-6 text-center text-xs font-medium text-slate-500">
                  New to E3Di?{' '}
                  <Link to="/register" className="text-[#5B21B6] hover:text-[#4C1D95] font-bold underline transition-colors">
                    Create account
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="2fa-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-indigo-50 text-[#2B1B8A] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Shield size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Two-Step Verification</h2>
                  <p className="text-xs text-slate-500 font-semibold">Enter the 6-digit code from Google Authenticator</p>
                </div>

                <form onSubmit={handle2FASubmit} className="space-y-5">
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold text-left">
                      <AlertCircle size={15} /> {error}
                    </div>
                  )}

                  <input 
                    type="text" 
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="000000"
                    className="w-full py-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-3xl tracking-[0.4em] outline-none focus:border-[#2B1B8A] focus:bg-white transition-all shadow-inner"
                    autoFocus
                  />

                  <button 
                    disabled={loading} 
                    type="submit" 
                    className="w-full py-3.5 bg-[#2B1B8A] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider hover:bg-[#20136D] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Complete Sign-In'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setShow2FA(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-[#2B1B8A] transition-colors"
                  >
                    ← Back to Login
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-20 px-6 sm:px-12 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/70 font-medium gap-2">
        <div>
          2026 E3Di Advertising Network. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <span>|</span>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of services</Link>
        </div>
      </footer>
    </div>
  );
};

export default Login;
