import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="app-bg min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-12 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Shield size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Legal Agreements</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
            </div>
          </div>

          {/* Body Text */}
          <div className="space-y-6 text-sm text-slate-600 font-medium leading-relaxed">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Last updated: July 27, 2026</p>
            
            <p>
              At <strong>E3Di</strong> (accessible from <a href="https://e3di.org" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">e3di.org</a>), one of our main priorities is the privacy of our visitors and customers. This Privacy Policy document outlines the types of information collected and recorded by E3Di and how we use it to support our intelligent digital signage and urban infrastructure services.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">1. Information We Collect</h2>
            <p>
              We collect information that you directly provide to us when setting up an account, updating your profile, uploading advertising creatives (images or video files), scheduling billboard campaigns, and communicating with our team. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Personal and Business details (such as Name, Email, Phone number, Company Name, GST information).</li>
              <li>Creative content uploads (ad files, media parameters, durations).</li>
              <li>Campaign parameters (targeted LED poles, scheduling times, play frequencies).</li>
            </ul>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">2. How We Use Your Information</h2>
            <p>
              We process your data to operate, maintain, and secure the E3Di platform. Specific uses include:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Scheduling and delivering ad creatives to the physical LED poles.</li>
              <li>Generating proof-of-play reports and dashboard telemetry statistics.</li>
              <li>Sending automated campaign approval and status updates via WhatsApp, Telegram, or push notifications.</li>
              <li>Preventing overlapping slot bookings and ensuring conflict-free scheduling.</li>
              <li>Verifying partner requests and handling billing securely.</li>
            </ul>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">3. Log Files and Playback Telemetry</h2>
            <p>
              E3Di follows standard procedures for logging operations. These logs track network connections from clients and hardware players. The information collected includes Internet Protocol (IP) addresses, player device status, connection timestamps, browser version, and bandwidth usage. These logs are used to verify ad delivery, track screen uptime, and monitor hardware performance.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">4. Cookies and Local Cache</h2>
            <p>
              We use functional cookies and browser local storage to preserve your session state, save campaign drafts, and remember configuration presets. This ensures a fluid user experience when designing campaigns and navigating local screen listings.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">5. Information Security and Media Storage</h2>
            <p>
              Your uploaded media files are stored on secure cloud object storage and distributed over protected content networks. Access to the scheduling dashboard is authenticated via secure tokens (JWT) and Firebase Authentication. We enforce industry-standard security protocols to prevent unauthorized access or disclosure of your business data.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">6. Third-Party Integrations</h2>
            <p>
              E3Di integrates with third-party service providers (such as AWS for secure storage, Firebase for authentication and push alerts, and Telegram/WhatsApp APIs for status notifications). These third parties process details solely in accordance with our instructions and security policies.
            </p>

            <h2 className="text-lg font-black text-slate-900 tracking-tight pt-4">7. Consent</h2>
            <p>
              By using our platform and website, you hereby consent to our Privacy Policy and agree to its terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
