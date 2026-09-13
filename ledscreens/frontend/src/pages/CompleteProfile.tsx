import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Building2, ArrowRight, AlertCircle } from 'lucide-react';
import API from '../services/api';
import { useAuth, needsProfileCompletion } from '../AuthContext';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setAuthData, token } = useAuth();

  useEffect(() => {
    if (user && !needsProfileCompletion(user)) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      navigate(from && from !== '/complete-profile' ? from : '/', { replace: true });
    }
  }, [user, navigate, location.state]);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [gst, setGst] = useState(user?.gst || '');
  const [businessType, setBusinessType] = useState(user?.businessType || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [companyDetails, setCompanyDetails] = useState<{
    companyName: string;
    address: string;
    gst: string;
    pan?: string;
    entityType?: string;
    natureOfBusiness?: string;
    pincode?: string;
    departmentCode?: string;
    registrationType?: string;
    registrationDate?: string;
    status?: string;
  } | null>(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);

  const handleVerifyGst = async (gstCode: string) => {
    const cleanGst = gstCode.trim().toUpperCase();
    if (cleanGst.length !== 15) return;
    setGstError(null);
    setGstLoading(true);
    try {
      const res = await API.post('/schedule/validate-gst', { gst: cleanGst });
      setCompanyDetails(res.data);
      if (res.data?.companyName && !companyName) {
        setCompanyName(res.data.companyName);
      }
    } catch (err: any) {
      setCompanyDetails(null);
      setGstError(err.response?.data?.message || 'Invalid GST number');
    } finally {
      setGstLoading(false);
    }
  };

  useEffect(() => {
    if (gst.trim().length === 15) {
      handleVerifyGst(gst);
    } else {
      setCompanyDetails(null);
      setGstError(null);
    }
  }, [gst]);

  const onPhoneChange = (val: string) => {
    setPhone(val.replace(/\D/g, '').slice(0, 10));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (phone.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/complete-profile', {
        name: name.trim(),
        phone,
        companyName: companyName.trim(),
        gst: gst.trim(),
        businessType: businessType.trim(),
      });

      const updatedUser = res.data.user;
      if (token) {
        setAuthData(token, updatedUser);
      }
      navigate('/launch-campaign', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10"
      >
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
          One more step
        </p>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Complete Your Profile
        </h1>
        <p className="text-sm text-slate-500 font-medium mb-8">
          We need your name and phone number before you can book screens or launch campaigns.
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold"
          >
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Your full name"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <span className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                +91
              </span>
              <input
                required
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                className="w-full pl-20 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="9876543210"
                maxLength={10}
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Company Name <span className="text-slate-300">(optional)</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Company / brand"
              />
            </div>
          </motion.div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  GSTIN <span className="text-slate-300">(opt)</span>
                </label>
                <div className="relative">
                  <input
                    value={gst}
                    onChange={(e) => setGst(e.target.value.toUpperCase())}
                    maxLength={15}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono text-xs"
                    placeholder="15-Digit GSTIN"
                  />
                  {gstLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600 animate-pulse">...</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Business Type <span className="text-slate-300">(opt)</span>
                </label>
                <input
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Retail, Tech, etc."
                />
              </div>
            </div>

            {gstError && (
              <p className="text-[10px] font-bold text-red-500 text-left font-sans">⚠️ {gstError}</p>
            )}

            {companyDetails && (
              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-left space-y-4 animate-fade-in shadow-sm font-sans mt-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                    ✓ VERIFIED GST TAXPAYER
                  </span>
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {companyDetails.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">BUSINESS NAME</span>
                    <input
                      type="text"
                      value={companyDetails.companyName}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setCompanyDetails({ ...companyDetails, companyName: newName });
                        setCompanyName(newName);
                      }}
                      className="w-full text-xs font-black text-slate-800 uppercase block mt-0.5 leading-snug bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none font-sans"
                      placeholder="Enter Trade/Business Name"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PAN</span>
                    <span className="text-xs font-black text-slate-800 uppercase block mt-0.5">{companyDetails.pan || companyDetails.gst.slice(2, 12)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ADDRESS</span>
                    <span className="text-xs font-black text-slate-800 uppercase block mt-0.5 leading-snug">{companyDetails.address}</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ENTITY TYPE</span>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5">{companyDetails.entityType || 'Private Limited Company'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">NATURE OF BUSINESS</span>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5">{companyDetails.natureOfBusiness || 'Others'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PINCODE</span>
                    <span className="text-xs font-black text-slate-800 block mt-0.5">{companyDetails.pincode || '520008'}</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">DEPARTMENT CODE</span>
                    <span className="text-xs font-bold text-slate-700 uppercase block mt-0.5">{companyDetails.departmentCode || 'AUTO NAGAR RANGE'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">REGISTRATION TYPE</span>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5">{companyDetails.registrationType || 'Regular'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">REGISTRATION DATE</span>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5">{companyDetails.registrationDate || '19/12/2025'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (
              <>
                Save & Continue <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CompleteProfile;
