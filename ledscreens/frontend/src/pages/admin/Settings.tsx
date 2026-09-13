import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Shield, Smartphone, AlertTriangle, Database, AlertCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import API from '../../services/api';

interface SettingsProps {
  profileForm: any;
  setProfileForm: React.Dispatch<React.SetStateAction<any>>;
  handleProfilePicUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateProfile: () => void;
  getMediaUrl: (path: string) => string;
  setTwoFactorSetup: (setup: any) => void;
  setIs2FAModalOpen: (open: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  profileForm, 
  setProfileForm, 
  handleProfilePicUpload, 
  handleUpdateProfile, 
  getMediaUrl,
  setTwoFactorSetup,
  setIs2FAModalOpen
}) => {
  const { loginWithGoogle } = useAuth();

  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [resetConfirmationText, setResetConfirmationText] = React.useState('');
  const [isResetting, setIsResetting] = React.useState(false);

  const handleHardReset = async () => {
    if (resetConfirmationText !== 'RESET') {
      alert('Verification string mismatch.');
      return;
    }
    setIsResetting(true);
    try {
      await API.post('/admin/campaigns/reset');
      alert('Campaign Database hard reset complete! All old test logs have been cleared.');
      setShowResetDialog(false);
      setResetConfirmationText('');
      window.location.reload();
    } catch (err: any) {
      alert(`Hard Reset Failed: ${err.response?.data?.msg || 'Error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: Security & Profile (2-col span) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Profile Card */}
          <div className="bg-white rounded-[32px] sm:rounded-[40px] border border-slate-200 p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 sm:mb-10">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-[28px] sm:rounded-[32px] overflow-hidden border-4 border-white shadow-xl">
                  <img src={getMediaUrl(localStorage.getItem('userProfilePic') || '') || '/logo.jpg'} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <label className="absolute -bottom-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all cursor-pointer active:scale-90 border-4 border-white">
                  <Plus size={18} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
                </label>
              </div>
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">{localStorage.getItem('userName')}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{localStorage.getItem('userEmail')}</p>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
                  <input 
                    type="text" 
                    value={profileForm.name} 
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Email Address</label>
                  <input 
                    type="email" 
                    value={profileForm.email} 
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                  <input 
                    type="tel" 
                    value={profileForm.phone} 
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                    placeholder="+91 00000 00000"
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Linked Account</label>
                  <button 
                    onClick={async () => {
                      try {
                        await loginWithGoogle();
                        alert('Google Account Linked successfully!');
                      } catch (e) {
                        alert('Failed to link Google account');
                      }
                    }}
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                    Link Google Account
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Current Password (Required for changes)</label>
                <input 
                  type="password" 
                  value={profileForm.currentPassword}
                  onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})}
                  placeholder="••••••••" 
                  className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">New Password</label>
                  <input 
                    type="password" 
                    value={profileForm.newPassword}
                    onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={profileForm.confirmPassword}
                    onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>

              <button 
                onClick={handleUpdateProfile}
                className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                Update Profile & Password
              </button>
            </div>
          </div>

          {/* 2FA Card */}
          <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Two-Step Authentication</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Enhanced account security</p>
              </div>
              <div 
                onClick={async () => {
                  if (!profileForm.twoFactorEnabled) {
                    try {
                      const res = await API.get('/auth/setup-2fa');
                      setTwoFactorSetup(res.data);
                      setIs2FAModalOpen(true);
                    } catch (e) { alert('Failed to initiate setup'); }
                  } else {
                    if (confirm('Disable Two-Step Authentication? This reduces your account security.')) {
                      try {
                        await API.post('/auth/confirm-2fa', { disable: true, code: '000000' });
                        setProfileForm({...profileForm, twoFactorEnabled: false});
                        localStorage.setItem('user2FA', 'false');
                      } catch (e) { alert('Action failed'); }
                    }
                  }
                }}
                className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${profileForm.twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <motion.div 
                  animate={{ x: profileForm.twoFactorEnabled ? 24 : 0 }}
                  className="w-4 h-4 bg-white rounded-full shadow-sm" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={async () => {
                  if (!profileForm.twoFactorEnabled) {
                    alert('Please enable Two-Step Authentication toggle first.');
                    return;
                  }
                  try {
                    const res = await API.get('/auth/setup-2fa');
                    setTwoFactorSetup(res.data);
                    setIs2FAModalOpen(true);
                  } catch (e) {
                    alert('Failed to initiate 2FA setup');
                  }
                }}
                className={`p-6 rounded-3xl border flex items-start gap-4 group transition-all cursor-pointer ${profileForm.twoFactorEnabled ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
              >
                <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform ${profileForm.twoFactorEnabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className={`font-black text-sm mb-1 ${profileForm.twoFactorEnabled ? 'text-indigo-900' : 'text-slate-900'}`}>Authenticator App</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">Use Google Authenticator or Authy to generate secure codes.</p>
                </div>
              </div>

              <div 
                onClick={() => {
                  if (!profileForm.twoFactorEnabled) {
                    alert('Please enable Two-Step Authentication toggle first.');
                    return;
                  }
                  alert('SMS Verification: A verification code has been sent to ' + (profileForm.phone || 'your registered number') + '. (Simulation)');
                }}
                className={`p-6 rounded-3xl border flex items-start gap-4 group transition-all cursor-pointer ${profileForm.twoFactorEnabled ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
              >
                <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform ${profileForm.twoFactorEnabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <Smartphone size={24} />
                </div>
                <div>
                  <h4 className={`font-black text-sm mb-1 ${profileForm.twoFactorEnabled ? 'text-indigo-900' : 'text-slate-900'}`}>SMS Verification</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">Receive a one-time code via SMS to your registered mobile number.</p>
                </div>
              </div>
            </div>
          </div>

        </div>{/* END lg:col-span-2 */}

        {/* RIGHT: System Administration / Database Controls (1-col span) */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Database Controls</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Dangerous Actions</p>

            <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-3xl">
              <h4 className="font-black text-rose-900 text-sm mb-2 flex items-center gap-2">
                <Database size={16} /> Hard Reset Campaigns
              </h4>
              <p className="text-[10px] text-rose-600/80 font-bold uppercase leading-relaxed mb-5">
                Wipes ALL pending, approved, upcoming, active, completed, and revoked campaigns. Deletes all uploaded user videos. Resets all screen statuses to online. Admin and user accounts are preserved.
              </p>
              <button 
                onClick={() => setShowResetDialog(true)}
                className="w-full py-3.5 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 active:scale-[0.98] transition-all shadow-lg shadow-rose-600/20"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>{/* END lg:col-span-1 */}

      </div>{/* END grid */}

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div
            onClick={() => { setShowResetDialog(false); setResetConfirmationText(''); }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-md bg-white rounded-[40px] p-10 flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Are you absolutely sure?</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-6">
              This action is permanent and completely irreversible.
            </p>

            <div className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-6 leading-relaxed text-center">
              Type <span className="text-slate-900 font-black">RESET</span> below to authorize this data wipe:
            </div>

            <input 
              type="text"
              value={resetConfirmationText} 
              onChange={e => setResetConfirmationText(e.target.value.toUpperCase())} 
              placeholder="RESET" 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-center text-lg tracking-[0.3em] mb-6 outline-none focus:border-rose-500 focus:bg-white transition-all"
            />

            <div className="flex gap-4 w-full">
              <button
                onClick={() => { setShowResetDialog(false); setResetConfirmationText(''); }}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleHardReset} 
                disabled={resetConfirmationText !== 'RESET' || isResetting}
                className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  resetConfirmationText === 'RESET' && !isResetting
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-600/25 active:scale-[0.98]'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {isResetting ? 'Wiping...' : 'Wipe System'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Settings;
