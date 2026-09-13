import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, RefreshCw, Save } from 'lucide-react';
import API from '../../services/api';

interface PricingProps {
  plans?: any[];
}

const Pricing: React.FC<PricingProps> = ({ plans = [] }) => {
  const [corridors, setCorridors] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadCorridors = async () => {
    setLoading(true);
    try {
      const res = await API.get('/corridors');
      setCorridors(res.data);
      const next: Record<string, string> = {};
      res.data.forEach((c: any) => {
        next[c._id] = String(c.pricePer5Sec || Math.ceil((c.pricePer30Sec || c.pricePerScreen || 50) / 6));
      });
      setEdits(next);
    } catch {
      alert('Failed to load corridor pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCorridors();
  }, []);

  const saveCorridor = async (id: string) => {
    const val = Number(edits[id]);
    if (!Number.isFinite(val) || val < 1) {
      alert('Price per 5 second slot must be at least ₹1');
      return;
    }
    setSavingId(id);
    try {
      await API.put(`/corridors/${id}`, { 
        pricePer5Sec: Math.round(val),
        pricePer30Sec: Math.round(val) * 6,
        pricePerScreen: Math.round(val) 
      });
      await loadCorridors();
    } catch (e: any) {
      alert(e.response?.data?.msg || 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
      <div>
        <motion.div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Corridor Screen Pricing (per 5 Sec Slot)</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Set price per screen per 5 second slot for each corridor. Changes apply to new bookings only.
            </p>
          </div>
          <button
            type="button"
            onClick={loadCorridors}
            disabled={loading}
            className="p-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </motion.div>

        {loading && corridors.length === 0 ? (
          <p className="text-sm font-bold text-slate-400">Loading corridors…</p>
        ) : corridors.length === 0 ? (
          <p className="text-sm font-bold text-slate-400">No corridors found. Add screens with corridor names first.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {corridors.map((corridor) => (
              <div
                key={corridor._id}
                className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <motion.div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                      {corridor.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {corridor.city} · {corridor.area}
                    </p>
                  </motion.div>
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                    <IndianRupee size={20} />
                  </div>
                </div>

                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Price Per Screen Per 5 Sec Slot (₹)
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={edits[corridor._id] ?? ''}
                    onChange={(e) =>
                      setEdits((prev) => ({ ...prev, [corridor._id]: e.target.value }))
                    }
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => saveCorridor(corridor._id)}
                    disabled={savingId === corridor._id}
                    className="px-5 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save size={14} />
                    {savingId === corridor._id ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-3">
                  Example: 4 screens × 12s (3 slots) × ₹{edits[corridor._id] || corridor.pricePer5Sec || '—'} = ₹
                  {(
                    (Number(edits[corridor._id]) || corridor.pricePer5Sec || 0) * 4 * 3
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {plans.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Subscription Plans</h2>
          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                  {plan.badge && (
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                      Plan Price
                    </label>
                    <input
                      id={`p-${plan._id}`}
                      defaultValue={plan.price}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <motion.div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                      Description
                    </label>
                    <textarea
                      id={`d-${plan._id}`}
                      defaultValue={plan.desc}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-indigo-500 resize-none"
                    />
                  </motion.div>
                  <button
                    type="button"
                    onClick={async () => {
                      const p = (document.getElementById(`p-${plan._id}`) as HTMLInputElement).value;
                      const d = (document.getElementById(`d-${plan._id}`) as HTMLTextAreaElement).value;
                      try {
                        await API.put(`/plans/${plan._id}`, { price: p, desc: d });
                        alert('Plan Updated!');
                      } catch {
                        alert('Failed');
                      }
                    }}
                    className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-lg active:scale-[0.98]"
                  >
                    Update Plan
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Pricing;
