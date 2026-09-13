import { FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="app-bg min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-12 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Legal Agreements</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
            </div>
          </div>

          {/* Body Text */}
          <div className="space-y-6 text-sm text-slate-600 font-medium leading-relaxed">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Last updated: July 27, 2026</p>
            
            <p>
              Welcome to <strong>E3Di</strong> (accessible via <a href="https://e3di.org" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">e3di.org</a>). These Terms of Service outline the rules and regulations for using E3Di's intelligent digital billboard booking network.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">1. License & Content Guidelines</h2>
            <p>
              By uploading video creatives or images to our platform, you guarantee that you own the rights to the intellectual property and that the material complies with national and local advertising standards. We reserve the right to reject any ad that contains offensive, misleading, or restricted content.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">2. Slot Reservations & Approvals</h2>
            <p>
              Schedules booked under standard advanced campaign planning or instant real-time playback are subject to administrative review. If an ad fails verification, compliance audits, or municipal guidelines, a refund or credit adjustment will be processed.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">3. Watermark Agreement</h2>
            <p>
              Users opting for starter or promotional campaign pricing agree to let the E3Di watermark logo display on the selected screens alongside their creative. Removing the watermark triggers standard customization surcharges, which will be computed dynamically during checkout.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">4. Network Operational Uptime</h2>
            <p>
              While we make every effort to maintain 100% display uptime across our smart LED poles, screen operations might occasionally experience downtime due to power drops, cellular network updates, maintenance windows, or local administrative directives. We will compensate users with equivalent display extensions or credits in such events.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">5. Limitation of Liability</h2>
            <p>
              E3Di shall not be liable for any indirect, consequential, or incidental damages arising out of the failure of screens to display campaigns or any errors in playback telemetry reporting.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">6. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of India, and any disputes shall be settled in the courts of Vijayawada, Andhra Pradesh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
