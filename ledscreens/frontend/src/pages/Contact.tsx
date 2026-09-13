import { useState } from 'react';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const textMessage = `Hello E3Di Team,\n\nName: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`;
    const encodedText = encodeURIComponent(textMessage);
    const whatsappUrl = `https://wa.me/917036923456?text=${encodedText}`;
    
    // Open WhatsApp link in new tab
    window.open(whatsappUrl, '_blank');

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="app-bg min-h-screen pt-28 pb-24 px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(108,71,255,0.06) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(108,71,255,0.04) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-black tracking-widest uppercase text-indigo-600 mb-4">Get In Touch</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">We are here to help.</h1>
          <p className="text-lg text-slate-500 font-medium">Have questions about E3Di screens, loop scheduling, or partner setups? Let's connect.</p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Info Card (Left) */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Contact Information</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Reach out to our customer support team or visit our regional executive offices.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">+91 70369 23456</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">jay@e3di.org</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Headquarters</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5 leading-relaxed">
                      ETHREE Food Court,opp PNBS Bus Stand<br />
                      Vijayawada
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100/50 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <MessageSquare size={14} />
              </div>
              <div>
                <p className="text-xs font-black text-[#1A1F36] uppercase tracking-wider">Live Support</p>
                <p className="text-[11px] text-slate-500 font-medium">Chat is online Mon - Sat from 9:00 AM to 6:00 PM IST.</p>
              </div>
            </div>
          </div>

          {/* Contact Form (Right) */}
          <div className="md:col-span-7">
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Send us a Message</h2>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center text-emerald-800"
                >
                  <p className="font-bold text-base mb-1">Message Sent Successfully!</p>
                  <p className="text-xs font-medium text-emerald-600">Our customer team will respond to your inquiry within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                        placeholder="Enter Your Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                        placeholder="Enter your Mail ID"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      placeholder="Campaign Booking Assistance"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Message</label>
                    <textarea
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none"
                      placeholder="Tell us about your outdoor advertising goals..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
