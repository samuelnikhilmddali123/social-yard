import React, { useEffect, useState } from 'react';
import { getActivePromoCodes, getPromoCodeUsage, getAllPromoCodes } from '../../services/api';
import { Copy, Check, RefreshCw, ShieldCheck, Ticket, Search, Phone, DollarSign, Sparkles, CheckCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ActiveCode {
  _id: string;
  code: string;
  status: string;
  type?: 'SYSTEM' | 'SOCIAL_ADS';
  createdByName?: string;
  createdByEmail?: string;
  createdAt: string;
}

interface UsageRecord {
  _id: string;
  promoCode: string;
  userId: string;
  userName: string;
  phoneNumber: string;
  email: string;
  orderId: string;
  discountAmount: number;
  originalOrderAmount: number;
  finalOrderAmount: number;
  usedAt: string;
  status: string;
  promoType?: string;
  generatedBy?: string;
}

interface SocialStats {
  totalSocialGenerated: number;
  totalSocialActive: number;
  totalSocialUsed: number;
  totalSocialFreeValue: number;
}

export const PromoCodeManagement: React.FC = () => {
  const [activeCodes, setActiveCodes] = useState<ActiveCode[]>([]);
  const [allCodes, setAllCodes] = useState<ActiveCode[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [socialStats, setSocialStats] = useState<SocialStats>({
    totalSocialGenerated: 0,
    totalSocialActive: 0,
    totalSocialUsed: 0,
    totalSocialFreeValue: 0
  });
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'social'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allRes = await getAllPromoCodes();
      if (allRes.success) {
        setAllCodes(allRes.allCodes || []);
        setActiveCodes(allRes.activePool || []);
        setUsageRecords(allRes.usage || []);
        if (allRes.socialStats) setSocialStats(allRes.socialStats);
      } else {
        const [activeRes, usageRes] = await Promise.all([
          getActivePromoCodes(),
          getPromoCodeUsage()
        ]);
        if (activeRes.success) setActiveCodes(activeRes.activeCodes || []);
        if (usageRes.success) setUsageRecords(usageRes.usage || []);
      }
    } catch (err) {
      console.error('Error loading promo codes data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Socket.IO real-time updates
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket: Socket = io(backendUrl.replace(/\/api\/?$/, ''), {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('PROMO_CODES_UPDATED', (data: any) => {
      if (data.activeCodes) setActiveCodes(data.activeCodes);
      if (data.usageHistory) setUsageRecords(data.usageHistory);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredUsage = usageRecords.filter(r => {
    const isSocial = r.promoType === 'SOCIAL_ADS' || (r.promoCode && r.promoCode.startsWith('SOCIAL'));
    if (activeTab === 'system' && isSocial) return false;
    if (activeTab === 'social' && !isSocial) return false;

    return (
      r.promoCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phoneNumber?.includes(searchTerm) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.generatedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const systemCodesList = activeCodes.filter(c => c.type !== 'SOCIAL_ADS' && !c.code?.startsWith('SOCIAL'));
  const socialCodesList = allCodes.filter(c => c.type === 'SOCIAL_ADS' || c.code?.startsWith('SOCIAL'));

  const displayedActiveCodes = activeTab === 'social'
    ? socialCodesList
    : activeTab === 'system'
      ? systemCodesList
      : allCodes;

  return (
    <div className="space-y-8 font-sans text-slate-800">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Ticket className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black tracking-tight">Real-Time Promo Codes & Social Ads Audit</h2>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Track System 3-Pool codes and Social Ads generated promo codes. 100% free checkout bypasses payment gateways.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-extrabold border ${
            socketConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {socketConnected ? 'Real-Time Sync Active' : 'Polling Sync'}
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Social Ads Audit Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Social Codes</span>
            <Sparkles size={16} className="text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{socialStats.totalSocialGenerated}</p>
          <p className="text-[11px] text-slate-500 font-semibold">Generated by Social Ads</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Social Codes</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{socialStats.totalSocialActive}</p>
          <p className="text-[11px] text-slate-500 font-semibold">Ready for client redemption</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Redeemed Client Codes</span>
            <Ticket size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-600">{socialStats.totalSocialUsed}</p>
          <p className="text-[11px] text-slate-500 font-semibold">Used by Social Ads clients</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Free Campaign Value</span>
            <DollarSign size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">₹{socialStats.totalSocialFreeValue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 font-semibold">Saved for Social Ads clients</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'all'
              ? 'bg-[#6C47FF] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Promo Codes ({allCodes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'system'
              ? 'bg-[#6C47FF] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          System Pool (3 Active)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'social'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          ⚡ Social Ads Codes ({socialStats.totalSocialGenerated})
        </button>
      </div>

      {/* SECTION 1: Active & Generated Promo Codes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              {activeTab === 'social' ? (
                <>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Social Ads Generated Promo Codes ({socialCodesList.length})
                </>
              ) : activeTab === 'system' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Active System Promo Pool ({systemCodesList.length})
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4 text-slate-800" />
                  All Active & Generated Promo Codes ({displayedActiveCodes.length})
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {activeTab === 'social'
                ? 'Codes generated exclusively by Social Ads partner accounts (social@e3di.org).'
                : activeTab === 'system'
                  ? '3 active system codes maintained automatically for 100% free checkout.'
                  : 'Complete overview of all active system pool and social promo codes.'}
            </p>
          </div>
        </div>

        {displayedActiveCodes.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center font-sans">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-slate-700">No Social Ads Promo Codes Generated Yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When the Social Ads account (social@e3di.org) generates a promo code, it will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {displayedActiveCodes.map((codeObj, idx) => {
              const isSocial = codeObj.type === 'SOCIAL_ADS' || codeObj.code?.startsWith('SOCIAL');
              return (
                <div 
                  key={codeObj._id || idx}
                  className={`relative bg-white border-2 hover:shadow-md rounded-3xl p-6 transition-all group flex flex-col justify-between ${
                    isSocial ? 'border-purple-200 hover:border-purple-500' : 'border-indigo-100 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-full border flex items-center gap-1.5 ${
                      codeObj.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {codeObj.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                      {codeObj.status || 'ACTIVE'}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isSocial ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}>
                      {isSocial ? 'Social Ads' : `Slot #${idx + 1}`}
                    </span>
                  </div>

                  <div className={`my-2 text-center py-3 rounded-2xl border border-dashed ${
                    isSocial ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-2xl font-black tracking-widest font-mono select-all ${
                      isSocial ? 'text-purple-700' : 'text-indigo-600'
                    }`}>
                      {codeObj.code}
                    </span>
                  </div>

                  <div className="space-y-1 my-2 text-[11px] font-medium text-slate-600">
                    <p><span className="text-slate-400 font-semibold">Generated By:</span> <strong className="text-slate-800">{codeObj.createdByEmail || (isSocial ? 'social@e3di.org' : 'System Admin')}</strong></p>
                    {isSocial && codeObj.createdByName && (
                      <p><span className="text-slate-400 font-semibold">Partner Name:</span> <strong className="text-slate-800">{codeObj.createdByName}</strong></p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400 font-semibold">
                      <span>Created:</span>{' '}
                      <span className="font-bold text-slate-600">
                        {codeObj.createdAt ? new Date(codeObj.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        }) : 'Just now'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(codeObj.code)}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                        copiedCode === codeObj.code
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isSocial
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                    >
                      {copiedCode === codeObj.code ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Promo Code Usage List */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-indigo-600" />
              Promo Code Usage Log ({filteredUsage.length})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Complete audit trail of users & Social Ads clients who redeemed free promo codes.
            </p>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, name, phone, generator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 font-sans">
                  <th className="py-3.5 px-4">Promo Code</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Generated By</th>
                  <th className="py-3.5 px-4">Client / User Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4 text-right">Original Amount</th>
                  <th className="py-3.5 px-4 text-right">Discount</th>
                  <th className="py-3.5 px-4 text-right">Final Amount</th>
                  <th className="py-3.5 px-4">Used At</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredUsage.map((usage) => (
                  <tr key={usage._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {usage.promoCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                        (usage.promoType === 'SOCIAL_ADS' || usage.promoCode?.startsWith('SOCIAL'))
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {(usage.promoType === 'SOCIAL_ADS' || usage.promoCode?.startsWith('SOCIAL')) ? 'Social Ads' : 'System Pool'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700 text-[11px]">
                      {usage.generatedBy || (usage.promoCode?.startsWith('SOCIAL') ? 'social@e3di.org' : 'System Admin')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {usage.userName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-800">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {usage.phoneNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {usage.email}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      #{usage.orderId ? usage.orderId.slice(-8) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-600">
                      ₹{usage.originalOrderAmount?.toLocaleString() || '0'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                      -₹{usage.discountAmount?.toLocaleString() || '0'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      ₹{usage.finalOrderAmount || 0}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      {usage.usedAt ? new Date(usage.usedAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      }) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider rounded-full">
                        {usage.status || 'USED'}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredUsage.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                      {searchTerm ? 'No matching promo code usage records found.' : 'No promo code redemptions recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeManagement;
