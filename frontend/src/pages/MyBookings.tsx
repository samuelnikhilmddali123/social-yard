import { motion } from 'framer-motion';


import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, CheckCircle2, Timer, AlertCircle, BarChart2, Search, Filter, X, File as FileIcon, RotateCcw, Image as ImageIcon } from 'lucide-react';

import { useState, useEffect } from 'react';
import API from '../services/api';

const getMediaUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'https://www.e3di.org/_/backend/api').replace('/api', '').replace(/\/$/, '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const statusStyles = {
  playing: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  approved: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  completed: 'bg-slate-50 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-100/50 border-dashed',
  rejected: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [rebookingId, setRebookingId] = useState<string | null>(null);

  const handleRebook = async (booking: any) => {
    const rawVideoId = booking.videoId?._id || booking.videoId;
    const rawScreenId = booking.screenId?.deviceId || booking.screenId?._id;

    if (!rawVideoId || !rawScreenId) {
      localStorage.setItem('campaign_selectedScreenIds', JSON.stringify([rawScreenId || 'ethree-65']));
      navigate('/launch');
      return;
    }

    if (!confirm('Rebook this campaign? It will be submitted immediately for Admin approval and live broadcast.')) return;

    setRebookingId(booking._id);
    try {
      const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const startH = now.getHours().toString().padStart(2, '0');
      const startM = now.getMinutes().toString().padStart(2, '0');
      const startTimeStr = `${startH}:${startM}`;
      
      const endNow = new Date(now.getTime() + (booking.durationSeconds || 30) * 1000);
      const endH = endNow.getHours().toString().padStart(2, '0');
      const endM = endNow.getMinutes().toString().padStart(2, '0');
      const endTimeStr = `${endH}:${endM}`;

      await API.post('/schedule/campaign', {
        videoId: rawVideoId,
        screenIds: [rawScreenId],
        date: dateStr,
        endDate: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        isInstant: true,
        durationSeconds: booking.durationSeconds || 30,
        hasWatermark: booking.hasWatermark !== false,
        format: booking.format || '65-inch'
      });

      alert('⚡ Campaign Re-booked! Sent for Admin Approval.');
      
      const response = await API.get('/schedule');
      setSchedules(response.data);
    } catch (err: any) {
      console.error('Rebooking failed:', err);
      alert(`Rebooking note: ${err.response?.data?.msg || 'Opening Campaign Studio.'}`);
      localStorage.setItem('campaign_selectedScreenIds', JSON.stringify([rawScreenId]));
      navigate('/launch');
    } finally {
      setRebookingId(null);
    }
  };

  const handlePrintInvoice = (booking: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download/print invoices.');
      return;
    }

    const formattedDate = new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const gstRate = 0.18;
    const priceWithWatermark = booking.calculatedPrice || booking.totalAmount || 0;
    const discountAmount = booking.discountAmount || 0;
    const subtotal = Math.max(0, priceWithWatermark - discountAmount);
    const grandTotal = Math.ceil(subtotal * (1 + gstRate));

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - Jaan Entertainment</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 900; color: #6c47ff; letter-spacing: -1px; }
            .invoice-title { font-size: 28px; font-weight: 900; text-align: right; text-transform: uppercase; margin: 0; }
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 10px; }
            .value { font-size: 13px; font-weight: 700; margin: 2px 0; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th { border-bottom: 2px solid #cbd5e1; padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; }
            .table td { border-bottom: 1px solid #e2e8f0; padding: 16px 8px; font-size: 13px; font-weight: 600; }
            .totals { width: 40%; margin-left: auto; margin-top: 20px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; font-weight: 600; }
            .grand-total { border-top: 2px solid #e2e8f0; padding-top: 12px; font-size: 16px; font-weight: 900; color: #6c47ff; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .btn-print { display: block; margin: 20px auto; padding: 10px 20px; background: #6c47ff; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
            @media print { .btn-print { display: none; } }
          </style>
        </head>
        <body>
          <button class="btn-print" onclick="window.print()">Print Invoice</button>
          <div class="header">
            <div>
              <div class="logo">JAAN ENTERTAINMENT</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Reach Billions Digitally</div>
            </div>
            <div>
              <h1 class="invoice-title">Tax Invoice</h1>
              <div style="font-size: 12px; color: #64748b; text-align: right; margin-top: 6px;">Invoice #: INV-${booking._id.toUpperCase().slice(-6)}</div>
              <div style="font-size: 12px; color: #64748b; text-align: right;">Date: ${formattedDate}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div>
              <div class="section-title">Billed By</div>
              <div class="value" style="font-size: 14px; font-weight: 800;">Jaan Entertainment Private Limited</div>
              <div class="value" style="color: #64748b; font-weight: 500;">MG Road Corridor, Vijayawada</div>
              <div class="value" style="color: #64748b; font-weight: 500;">GSTIN: 37JAANENT2024P1Z4</div>
            </div>
            <div>
              <div class="section-title">Billed To</div>
              <div class="value" style="font-size: 14px; font-weight: 800;">${booking.companyName || booking.bookedByName || 'Valued Customer'}</div>
              <div class="value" style="color: #64748b; font-weight: 500;">Email: ${booking.bookedByEmail || 'N/A'}</div>
              <div class="value" style="color: #64748b; font-weight: 500;">Phone: ${booking.bookedByPhone || 'N/A'}</div>
              ${booking.gst ? `<div class="value" style="font-weight: 800; color: #6c47ff; margin-top: 6px;">GSTIN: ${booking.gst}</div>` : ''}
            </div>
          </div>

          <div class="section-title">Campaign Details</div>
          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Screen / Format</th>
                <th>Schedule Timeline</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div><b>Billboard Ad Campaign</b></div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Video: ${booking.videoId?.title || 'Creative Video'}</div>
                </td>
                <td>
                  <div>${booking.screenId?.name || 'Dual Sided Divider Pole'}</div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Format: ${booking.screenId?.resolution === '1920x1080' ? '5×4 Feet display' : '4×3 Feet display'}</div>
                </td>
                <td>
                  <div>${booking.isInstant ? 'Instant Playback' : booking.date}</div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Duration: ${booking.durationSeconds || 30}s (${booking.startTime} - ${booking.endTime})</div>
                </td>
                <td style="text-align: right; font-weight: 800;">₹${priceWithWatermark.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Gross Price:</span>
              <span>₹${priceWithWatermark.toLocaleString('en-IN')}</span>
            </div>
            ${discountAmount > 0 ? `
            <div class="totals-row" style="color: #16a34a;">
              <span>Discount:</span>
              <span>-₹${discountAmount.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div class="totals-row">
              <span>CGST (9%):</span>
              <span>₹${Math.ceil(subtotal * 0.09).toLocaleString('en-IN')}</span>
            </div>
            <div class="totals-row">
              <span>SGST (9%):</span>
              <span>₹${Math.ceil(subtotal * 0.09).toLocaleString('en-IN')}</span>
            </div>
            <div class="totals-row grand-total">
              <span>Grand Total Paid:</span>
              <span>₹${grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style="margin-top: 40px; display: inline-block; padding: 6px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9999px; font-size: 11px; font-weight: 800; color: #16a34a; text-transform: uppercase;">
            Payment Status: Paid ✓
          </div>

          <div class="footer">
            Thank you for partnering with Jaan Entertainment. This is a computer-generated tax invoice.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await API.get('/schedule');
        setSchedules(response.data);
      } catch (err) {
        console.error('Failed to fetch schedules');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = 
      (s.screenId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.videoId?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeSlots = schedules.filter(s => s.status === 'playing').length;
  const upcomingSlots = schedules.filter(s => s.status === 'approved').length;

  return (
    <div className="app-bg min-h-screen pt-24 pb-20 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-2"
            >
              Account Dashboard
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-black tracking-tight text-slate-900"
            >
              {localStorage.getItem('userRole') === 'admin' ? (
                <>Live <span className="text-indigo-600">Booking</span></>
              ) : localStorage.getItem('userRole') === 'government' ? (
                <>Government <span className="text-indigo-600">Log</span></>
              ) : (
                <>Slot <span className="text-indigo-600">Booked</span></>
              )}
            </motion.h1>
          </div>
          
          <div />
        </header>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Active Slots', value: activeSlots.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Upcoming', value: upcomingSlots.toString(), icon: Timer, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Items', value: schedules.length.toString(), icon: BarChart2, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Pending Approval', value: schedules.filter(s => s.status === 'pending').length.toString(), icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon size={18} className={stat.color} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Bookings Table/List */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-4 md:px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search screen or video..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative w-full sm:w-auto">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="playing">Playing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-4 md:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Location & Screen</th>
                  <th className="px-4 md:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Timeline</th>
                  <th className="px-4 md:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Video</th>
                  <th className="px-4 md:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Time</th>
                  <th className="px-4 md:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 md:px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 md:px-8 py-20 text-center text-slate-400 font-bold">Loading schedules...</td>
                  </tr>
                ) : filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 md:px-8 py-20 text-center text-slate-400 font-bold">
                      {searchTerm || statusFilter !== 'all' ? 'No matching bookings found.' : 'No schedules found.'}
                    </td>
                  </tr>
                ) : filteredSchedules.map((booking, i) => (
                  <motion.tr 
                    key={booking._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * i }}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 md:px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {booking._id.slice(-4).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 mb-1">{booking.screenId?.name || 'Unknown Screen'}</p>
                          <p className="text-[11px] text-indigo-600 font-black mb-1">
                            {booking.selectedScreens || booking.selectedScreenCount || 1} Screen{(booking.selectedScreens || booking.selectedScreenCount || 1) !== 1 ? 's' : ''} • {booking.durationSeconds || 30} Sec ({booking.slotMultiplier || Math.ceil((booking.durationSeconds || 30) / 5)} slots) • ₹{(booking.calculatedPrice || booking.totalAmount || 50).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                            <MapPin size={10} className="text-slate-400" /> {booking.screenId?.location || 'Unknown Location'}
                          </p>
                        </div>
                      </div>
                    </td>
                                        <td className="px-4 md:px-8 py-6">
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Calendar size={13} className="text-slate-400" />
                          {booking.isInstant && booking.status === 'pending'
                            ? 'Immediate'
                            : new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 ml-5">
                          <Clock size={10} />{' '}
                          {booking.isInstant
                            ? booking.status === 'pending'
                              ? `Will begin after approval (${booking.durationSeconds || 30}s)`
                              : `${booking.startTime} - ${booking.endTime} (${booking.durationSeconds || 30}s)`
                            : `${booking.startTime} - ${booking.endTime} (${booking.durationSeconds || 30}s)`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-6">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const rawUrl = booking.videoId?.url || booking.videoId?.filePath || '';
                          const mediaUrl = rawUrl ? getMediaUrl(rawUrl) : '';
                          const isVideo = rawUrl.endsWith('.mp4') || rawUrl.endsWith('.webm') || rawUrl.endsWith('.mov');
                          return (
                            <a 
                              href={mediaUrl || '#'} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative group shadow-sm block hover:ring-2 hover:ring-indigo-500 transition-all"
                              title="Click to view original asset"
                            >
                              {mediaUrl ? (
                                isVideo ? (
                                  <video 
                                    src={mediaUrl} 
                                    className="w-full h-full object-cover" 
                                    muted 
                                    onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
                                    onMouseOut={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                                  />
                                ) : (
                                  <img 
                                    src={mediaUrl} 
                                    alt={booking.videoId?.title || 'Creative Asset'} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <ImageIcon size={18} />
                                </div>
                              )}
                            </a>
                          );
                        })()}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 mb-0.5 truncate max-w-[160px]" title={booking.videoId?.title}>
                            {booking.videoId?.title || 'Untitled Creative'}
                          </p>
                          <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                            <BarChart2 size={10} /> {(booking.videoId?.duration || 0)}s duration
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-6">
                      <p className="text-sm font-bold text-slate-700 mb-1">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {new Date(booking.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 md:px-8 py-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusStyles[booking.status as keyof typeof statusStyles]}`}>
                        <span className={`w-1 h-1 rounded-full mr-1.5 ${booking.status === 'playing' ? 'bg-emerald-500 animate-pulse' : 'bg-current opacity-60'}`} />
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={rebookingId === booking._id}
                          onClick={() => handleRebook(booking)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all shadow-sm hover:shadow uppercase tracking-wider font-sans active:scale-95 shrink-0 disabled:opacity-50"
                        >
                          <RotateCcw size={11} className={rebookingId === booking._id ? 'animate-spin' : ''} />
                          {rebookingId === booking._id ? 'Rebooking...' : 'Book Again'}
                        </button>
                        {booking.paymentStatus === 'paid' && (
                          <button
                            type="button"
                            onClick={() => handlePrintInvoice(booking)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black rounded-xl transition-all shadow-sm hover:shadow uppercase tracking-wider font-sans active:scale-95 shrink-0"
                          >
                            <FileIcon size={11} /> Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-4 md:px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium italic">Showing {filteredSchedules.length} results</p>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyBookings;
