import { Link } from 'react-router-dom';

const Footer = () => {
  const footerLinks: Record<string, { label: string; to?: string; href?: string }[]> = {
    Company: [
      { label: 'About Us', to: '/about' },
      { label: 'Contact Us', to: '/contact' },
    ],
    Campaigns: [
      { label: 'Launch Campaign', to: '/launch-campaign' },
      { label: 'View Pricing', to: '/pricing' },
    ],
    Inventory: [
      { label: 'eThree Vijayawada', to: '/locations' },
    ],
  };

  return (
    <footer id="contact" className="bg-slate-950 border-t border-white/5 relative overflow-hidden">
      {/* Subtle grid backdrop decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 pt-20 pb-12 relative z-10">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          {/* Brand Col */}
          <div className="md:col-span-4 space-y-6">
            <Link to="/" className="inline-block group">
              <div className="h-12 md:h-14 w-auto flex items-center justify-start">
                <img src="/3d.png" alt="E3Di Platform" className="h-full w-auto object-contain" />
              </div>
            </Link>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
              India's premium digital out-of-home advertising network. Enabling brands to broadcast content, engage premium audiences, and track real-world impact instantly.
            </p>
          </div>

          {/* Links Cols */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading} className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">{heading}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.href ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.to!}
                          className="text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex flex-wrap items-center gap-6 justify-center sm:justify-start">
            <span>© {new Date().getFullYear()} E3Di. All rights reserved.</span>
            <Link to="/privacy" className="hover:text-slate-350">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-350">Terms of Service</Link>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 rounded-full px-3 py-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>All display servers operational</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
