import { useState, useEffect } from 'react';
import API from '../services/api';
import ScreenPreview from '../pages/ScreenPreview';

const DomainRouter = ({ children }: { children: React.ReactNode }) => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  useEffect(() => {
    const checkDomain = async () => {
      const hostname = window.location.hostname;
      
      // If it's a subdomain like 1.ledscreen.com or a completely different domain
      // and NOT the main app domain (ledscreens-sigma.vercel.app, e3di.org, or localhost)
      const isMainDomain = hostname.includes('vercel.app') || hostname.includes('e3di.org') || hostname.includes('stackvil.com') || hostname === 'localhost' || hostname === '127.0.0.1';
      
      if (!isMainDomain) {
        try {
          const res = await API.get(`/device/lookup/${hostname}`);
          if (res.data.deviceId) {
            setDeviceId(res.data.deviceId);
            setIsCustomDomain(true);
          }
        } catch (err) {
          console.log('Not a custom domain or lookup failed');
        }
      }
      setLoading(false);
    };

    checkDomain();
  }, []);

  if (loading) return null;

  if (isCustomDomain && deviceId) {
    // Override the entire app and just show the screen preview
    return <ScreenPreview overrideDeviceId={deviceId} />;
  }

  return <>{children}</>;
};

export default DomainRouter;
