import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Monitor, Clock, CheckCircle2, XCircle } from 'lucide-react';
import API from '../../services/api';

const PartnerRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const fetchRequests = async () => {
    try {
      const res = await API.get('/partner-requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch partner requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await API.put(`/partner-requests/${id}`, { status });
      fetchRequests();
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update request');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-900 mb-6">Partner Requests</h2>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Partner</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Inventory</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {requests.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No partner requests found.</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-bold">{req.fullName}</div>
                      <div className="text-slate-500 text-xs">{req.email}</div>
                      <div className="text-slate-500 text-xs">{req.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin size={14} className="text-indigo-500" /> {req.city}, {req.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Monitor size={14} className="text-indigo-500" /> {req.totalScreens} Screen(s)
                      </div>
                      <div className="text-slate-500 text-xs">{req.width}x{req.height} ft</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        req.status === 'onboarded' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors text-xs"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 relative z-10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
              <h3 className="text-2xl font-black text-slate-900">Request Details</h3>
              <button onClick={() => setSelectedRequest(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Partner Info</h4>
                  <div className="bg-slate-50 p-4 rounded-xl font-medium text-sm space-y-2">
                    <p><span className="text-slate-500 w-24 inline-block">Name:</span> {selectedRequest.fullName}</p>
                    <p><span className="text-slate-500 w-24 inline-block">Company:</span> {selectedRequest.companyName || 'N/A'}</p>
                    <p><span className="text-slate-500 w-24 inline-block">Email:</span> {selectedRequest.email}</p>
                    <p><span className="text-slate-500 w-24 inline-block">Phone:</span> {selectedRequest.phoneNumber}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location</h4>
                  <div className="bg-slate-50 p-4 rounded-xl font-medium text-sm space-y-2">
                    <p><span className="text-slate-500 w-24 inline-block">City/State:</span> {selectedRequest.city}, {selectedRequest.state}</p>
                    <p><span className="text-slate-500 w-24 inline-block">Address:</span> {selectedRequest.fullAddress}</p>
                    <p><span className="text-slate-500 w-24 inline-block">Traffic:</span> {selectedRequest.dailyTraffic}</p>
                    <a href={selectedRequest.googleMapsLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1 mt-2">
                      <MapPin size={14} /> View on Maps
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hardware Details</h4>
                  <div className="bg-slate-50 p-4 rounded-xl font-medium text-sm grid grid-cols-2 gap-y-2">
                    <p><span className="text-slate-500 block text-xs">Screens</span> {selectedRequest.totalScreens}</p>
                    <p><span className="text-slate-500 block text-xs">Size</span> {selectedRequest.width}x{selectedRequest.height} ft</p>
                    <p><span className="text-slate-500 block text-xs">Environment</span> {selectedRequest.environment}</p>
                    <p><span className="text-slate-500 block text-xs">Type</span> {selectedRequest.sideType}</p>
                    <p><span className="text-slate-500 block text-xs">Resolution</span> {selectedRequest.resolution || 'N/A'}</p>
                    <p><span className="text-slate-500 block text-xs">Control Sys</span> {selectedRequest.controlSystem || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Media Files</h4>
                  {(!selectedRequest.signedUrls || selectedRequest.signedUrls.length === 0) ? (
                    <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl">No media attached.</p>
                  ) : (
                    <div className="flex flex-wrap gap-3 bg-slate-50 p-4 rounded-xl">
                      {selectedRequest.signedUrls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                          {url.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">Video</div>
                          ) : (
                            <img src={url} alt="Media" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
              {selectedRequest.status !== 'approved' && selectedRequest.status !== 'onboarded' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'approved')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
                >
                  <CheckCircle2 size={18} /> Approve
                </button>
              )}
              {selectedRequest.status !== 'rejected' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'rejected')}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors"
                >
                  <XCircle size={18} /> Reject
                </button>
              )}
              {selectedRequest.status === 'approved' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'onboarded')}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <CheckCircle2 size={18} /> Mark as Onboarded
                </button>
              )}
              {selectedRequest.status === 'submitted' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'under_review')}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-600 font-bold rounded-xl hover:bg-amber-100 transition-colors"
                >
                  <Clock size={18} /> Mark Under Review
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PartnerRequests;
