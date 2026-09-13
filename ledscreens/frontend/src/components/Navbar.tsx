import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const userRole = user?.role || localStorage.getItem('userRole');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks: { label: string; to?: string; href?: string }[] = [
    { label: 'Screens', to: '/locations' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Partner With Us', to: '/partner-with-us' },
    { label: 'Contact', to: '/contact' },
    ...(userRole === 'admin' ? [{ label: 'Live Booking', to: '/profile' }] : []),
    ...(userRole === 'government' ? [{ label: 'Gov Dashboard', to: '/gov-dashboard' }] : []),
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path: string) => {
    if (path.startsWith('#')) {
      return location.hash === path;
    }
    return location.pathname === path;
  };

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (to.startsWith('#')) {
      e.preventDefault();
      const element = document.getElementById(to.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(to.substring(1));
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 px-4 md:px-8 ${scrolled ? 'pt-2 md:pt-3' : 'pt-4 md:pt-6'
          }`}
      >
        <div className={`max-w-6xl mx-auto px-5 py-2.5 rounded-2xl flex items-center justify-between transition-all duration-300 bg-white/85 border border-slate-200/50 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.04)]`}>
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="h-10 md:h-12 w-auto flex items-center justify-start">
              <img src="/3d.png" alt="E3Di Platform" className="h-full w-auto object-contain" />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.href) {
                return (
                  <a
                    key={link.href + '-' + link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#6C47FF] hover:bg-[#6C47FF]/5 transition-all"
                  >
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.to + '-' + link.label}
                  to={link.to!}
                  onClick={(e) => handleNavLinkClick(e, link.to!)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive(link.to!)
                      ? 'text-[#6C47FF] bg-[#6C47FF]/5 border border-[#6C47FF]/10'
                      : 'text-slate-600 hover:text-[#6C47FF] hover:bg-[#6C47FF]/5'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#6C47FF] transition-colors"
              >
                Login
              </Link>
            ) : (
              <Link to="/profile" className="flex items-center gap-3 pr-2 mr-2 border-r border-slate-200 hover:opacity-85 transition-opacity cursor-pointer">
                <div className="text-right hidden lg:block">
                  <div className="flex items-center justify-end gap-1.5">
                    {userRole === 'government' && (
                      <span className="text-[8px] font-black bg-[#6C47FF] text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Official Govt.</span>
                    )}
                    <p className="text-xs font-bold text-[#1A1F36] leading-none">{user?.name || localStorage.getItem('userName') || 'User'}</p>
                  </div>
                  <p className="text-[9px] font-semibold text-slate-400 leading-tight mt-0.5">{user?.email}</p>
                </div>
                {user?.profilePic || user?.photoURL ? (
                  <img src={user.profilePic || user.photoURL} alt="Profile" className="w-7 h-7 rounded-full border border-slate-200 shadow-sm object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                    <UserIcon size={14} />
                  </div>
                )}
              </Link>
            )}

            <Link
              to="/launch-campaign"
              className="px-5 py-2 bg-[#6C47FF] hover:bg-[#8A6EFF] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_14px_rgba(108,71,255,0.35)] hover:shadow-[0_6px_20px_rgba(108,71,255,0.5)] active:scale-95"
            >
              Book Campaign
            </Link>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl transition-all border border-slate-200 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 shadow-sm"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#6C47FF] transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-4 right-4 mt-2 max-h-[calc(100vh-120px)] overflow-y-auto bg-white/95 border border-slate-200/60 rounded-2xl shadow-2xl p-5 backdrop-blur-xl flex flex-col gap-4 md:hidden"
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  if (link.href) {
                    return (
                      <a
                        key={link.href + '-mobile-' + link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#6C47FF] transition-all"
                      >
                        {link.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={link.to + '-mobile-' + link.label}
                      to={link.to!}
                      onClick={(e) => {
                        setMobileOpen(false);
                        handleNavLinkClick(e, link.to!);
                      }}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${isActive(link.to!) ? 'text-[#6C47FF] bg-[#6C47FF]/5' : 'text-slate-600 hover:bg-slate-50 hover:text-[#6C47FF]'
                        }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="h-px bg-slate-200/60 w-full" />
              <div className="flex flex-col gap-3">
                {!isAuthenticated ? (
                  <Link to="/login" className="block text-center py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                    Login
                  </Link>
                ) : (
                  <Link to="/profile" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                    {user?.profilePic || user?.photoURL ? (
                      <img src={user.profilePic || user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-slate-200 object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                        <UserIcon size={16} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#1A1F36] leading-none">{user?.name || localStorage.getItem('userName') || 'User'}</p>
                        {userRole === 'government' && (
                          <span className="text-[8px] font-black bg-[#6C47FF] text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Official Govt.</span>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">{user?.email}</p>
                    </div>
                  </Link>
                )}
                <Link to="/launch-campaign" className="block text-center py-3.5 rounded-xl bg-[#6C47FF] text-white text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-transform shadow-lg shadow-[#6C47FF]/20">
                  Book Campaign
                </Link>
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Navbar;
