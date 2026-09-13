import { BarChart3, Eye, MousePointerClick, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Total Reach', value: '24.6M', change: '+18.4%', up: true, icon: Eye },
  { label: 'Avg Engagement Rate', value: '7.3%', change: '+2.1%', up: true, icon: MousePointerClick },
  { label: 'Conversions', value: '14.2K', change: '-3.2%', up: false, icon: TrendingUp },
  { label: 'Revenue Generated', value: '₹42.8L', change: '+24.6%', up: true, icon: BarChart3 },
];

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const chartValues = [40, 70, 45, 90, 65, 85, 55, 75, 50, 95, 60, 80];

const Analytics = () => {
  const maxVal = Math.max(...chartValues);

  return (
    <div className="app-bg min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-2">Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Analytics</h1>
          <p className="text-slate-500 font-medium">Track campaign performance in real time across every billboard.</p>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, change, up, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500">{label}</span>
                <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                  <Icon size={16} className="text-indigo-500" />
                </div>
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">{value}</p>
              <div className={`inline-flex items-center gap-1 text-xs font-bold ${up ? 'text-emerald-600' : 'text-indigo-500'}`}>
                {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {change} vs last period
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reach Over Time</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Monthly campaign reach across all screens</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
              <span className="text-xs font-bold text-indigo-600">2025 – 2026</span>
            </div>
          </div>

          <div className="flex items-end gap-3 h-52">
            {chartValues.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-indigo-100 rounded-t-md transition-all duration-500 group-hover:bg-indigo-500 relative overflow-hidden"
                  style={{ height: `${(val / maxVal) * 100}%` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-md group-hover:bg-indigo-600 transition-colors"
                    style={{ height: '100%', opacity: 0.6 + (val / maxVal) * 0.4 }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{monthLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
