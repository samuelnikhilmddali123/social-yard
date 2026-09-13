import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Monitor, IndianRupee } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface AnalyticsProps {
  analytics: {
    revenue: number;
    reach: number;
    impressions: number;
    chartData: any[];
  };
  screensCount: number;
}

const Analytics: React.FC<AnalyticsProps> = ({ analytics, screensCount }) => {
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
         {[
           { l: 'Total Reach', v: analytics.reach.toLocaleString(), c: '+12%', i: Eye, color: 'text-sky-500' },
           { l: 'Active Screens', v: screensCount.toString(), c: 'Stable', i: Monitor, color: 'text-indigo-500' },
           { l: 'Revenue', v: `₹${analytics.revenue.toLocaleString()}`, c: '+15%', i: IndianRupee, color: 'text-emerald-500' },
         ].map((s, i) => (
           <motion.div whileHover={{ y: -5 }} key={i} className="bg-white p-6 rounded-[28px] sm:rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
              <div className="flex justify-between items-center mb-4">
                <div className={`p-2.5 rounded-xl bg-slate-50 ${s.color}`}>
                  <s.i size={20} />
                </div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{s.c}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{s.v}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.l}</p>
           </motion.div>
         ))}
      </div>
      
      <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
           <div>
             <h3 className="text-lg font-black text-slate-900 tracking-tight">Campaign Performance</h3>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Real-time engagement tracking</p>
           </div>
           <div className="flex gap-2 shrink-0">
             <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">Revenue</span>
             <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">Reach</span>
           </div>
         </div>

         <div className="h-80 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={analytics.chartData}>
               <defs>
                 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
               <YAxis hide />
               <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }} />
               <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
               <Area type="monotone" dataKey="reach" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
             </AreaChart>
           </ResponsiveContainer>
         </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
