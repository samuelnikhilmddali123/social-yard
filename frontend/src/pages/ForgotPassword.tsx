import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    // Simulate API call to reset password
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(234,197,16,0.06) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(234,197,16,0.04) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="flex items-center justify-center mb-8">
          <div className="w-44 h-16 flex items-center justify-center">
            <img src="/3d.png" alt="E3Di Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="bg-[#10131E] py-10 px-6 shadow-2xl rounded-[24px] sm:px-10 border border-white/8">
          {!submitted ? (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Reset password</h2>
                <p className="mt-2 text-sm font-medium text-slate-400">
                  Enter your email and we'll send a reset link.
                </p>
              </div>

              <form className="space-y-6" onSubmit={onSubmit}>
                <div>
                  <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-400/60 focus:ring-2 focus:ring-yellow-400/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 py-4 font-black text-sm text-[#0B0E1A] rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 group"
                  style={{ background: 'linear-gradient(135deg, #EAC516, #F5D320)', boxShadow: '0 4px 20px rgba(234,197,16,0.25)' }}
                >
                  {loading ? 'Sending link...' : <><span>Send reset link</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 mb-6">
                <CheckCircle size={32} className="text-yellow-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">Check your email</h2>
              <p className="text-sm font-medium text-slate-400 mb-8 leading-relaxed">
                We've sent reset instructions to<br />
                <span className="font-bold text-white">{email}</span>
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center py-4 bg-white/5 text-white text-sm font-black rounded-xl hover:bg-white/10 transition-all border border-white/10"
              >
                Back to sign in
              </Link>
            </div>
          )}

          {!submitted && (
            <div className="mt-8 text-center">
              <Link to="/login" className="text-sm font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
                ← Back to sign in
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
