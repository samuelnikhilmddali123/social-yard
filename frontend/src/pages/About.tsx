import { Sparkles, Compass, Heart, Eye } from 'lucide-react';

const About = () => {
  return (
    <div className="flex-1 min-h-screen bg-transparent pt-28 pb-24 px-6 relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(108,71,255,0.06) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(108,71,255,0.04) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700">
            <Sparkles size={12} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">About E3Di</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Beyond Digital Signage.<br />
            <span className="text-indigo-600 font-black">Building the Intelligent Infrastructure of Tomorrow.</span>
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-12 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-8 text-slate-700 leading-relaxed font-medium">
          
          <p className="text-base text-slate-650 leading-relaxed font-medium">
            E3Di was born from a simple yet transformative vision: public infrastructure should do more than display information—it should actively protect, connect, and serve people.
          </p>

          <p className="text-sm text-slate-600 leading-relaxed">
            The concept of E3Di was envisioned by <strong>Jayanarayana Kureti</strong>, an entrepreneur with a passion for combining technology and public infrastructure to solve real-world urban challenges. Recognising the limitations of conventional digital signage, he imagined a smarter platform capable of supporting public safety, emergency response, surveillance, intelligent communication, and smart city operations through a single integrated solution.
          </p>

          <p className="text-sm text-slate-600 leading-relaxed">
            With this vision, <strong>Jayanarayana Kureti</strong>, together with his dedicated technical team, transformed the concept into reality by designing and developing E3Di (Express • Elevate • Engage)—an intelligent digital public utility platform built for the cities of today and tomorrow.
          </p>

          <div className="border-t border-slate-100 pt-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">An Integrated Smart Platform</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Unlike traditional digital displays that are limited to advertising, E3Di is designed as a multi-functional smart infrastructure platform that integrates:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-650 font-semibold mt-4">
              {[
                'Smart Emergency Response (SOS)',
                'Public Safety & AI-enabled Surveillance',
                'Real-Time Public Information Broadcasting',
                'Smart City & IoT Integration',
                'Cultural and Festival Illumination',
                'Intelligent Analytics and Future AI Capabilities'
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-600 mt-6 leading-relaxed">
              Our mission is to help governments, municipalities, smart city authorities, and public organisations build safer, smarter, and more connected urban environments.
            </p>
          </div>

          {/* Vision and Mission grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-800 font-bold text-base">
                <Compass size={18} className="text-indigo-600" />
                <h4>Our Vision</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                To redefine public infrastructure by transforming every digital display into an intelligent public utility that informs, protects, responds, and connects society in real time.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-800 font-bold text-base">
                <Heart size={18} className="text-indigo-600" />
                <h4>Our Mission</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                To deliver innovative, scalable, and sustainable smart infrastructure solutions that enhance public safety, improve emergency response, enable intelligent communication, and support the evolution of future-ready cities.
              </p>
            </div>
          </div>

          {/* Meaning of E3Di */}
          <div className="border-t border-slate-100 pt-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">The Meaning of E3Di</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              E3Di represents our core philosophy: <strong>Express • Elevate • Engage</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold mt-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-xs font-black text-indigo-700 tracking-wider uppercase block">Express</span>
                <p className="text-slate-500 leading-relaxed">Deliver critical information instantly.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-xs font-black text-indigo-700 tracking-wider uppercase block">Elevate</span>
                <p className="text-slate-500 leading-relaxed">Enhance public safety and urban experiences through technology.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-xs font-black text-indigo-700 tracking-wider uppercase block">Engage</span>
                <p className="text-slate-500 leading-relaxed">Connect citizens, governments, and communities through intelligent digital infrastructure.</p>
              </div>
            </div>
          </div>

          {/* Commitment */}
          <div className="border-t border-slate-100 pt-8 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold text-base">
              <Eye size={18} className="text-indigo-600 animate-pulse" />
              <h4>Our Commitment</h4>
            </div>
            <p className="text-sm font-semibold italic text-slate-600 leading-relaxed">
              "Technology should not simply be seen—it should actively serve society."
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              E3Di is more than a digital signage solution. It is the intelligent eye of modern infrastructure, empowering cities to communicate faster, respond smarter, and build a safer future for everyone.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default About;
