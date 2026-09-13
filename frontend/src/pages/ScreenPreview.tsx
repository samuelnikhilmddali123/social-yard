import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API, { getFullStreamUrl } from '../services/api';
import NotFound from './NotFound';

const ScreenPreview = ({ overrideDeviceId }: { overrideDeviceId?: string }) => {
  const { deviceId: urlDeviceId } = useParams();
  const deviceId = overrideDeviceId || urlDeviceId;
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [volume, setVolume] = useState(50);
  const videoRef = useRef<HTMLVideoElement>(null);



  const [isFallback, setIsFallback] = useState(false);
  const [serverError, setServerError] = useState(false);
  const serverErrorCountRef = useRef(0);

  const getMediaUrl = (path: string) => {
    if (!path) return '/IMG_6479.mp4';
    let cleanPath = path;
    if (cleanPath.includes('www.e3di.org/uploads/')) {
      const idx = cleanPath.indexOf('/uploads/');
      cleanPath = cleanPath.substring(idx);
    }
    if (cleanPath.startsWith('/IMG_') || cleanPath.includes('WhatsApp Video')) {
      return cleanPath;
    }
    return getFullStreamUrl(cleanPath);
  };

  const fetchContent = async () => {
    try {
      const response = await API.get(`/device/${deviceId}`);
      let serverPlaylist = response.data.playlist || [];
      const fallbackFlag = response.data.isFallback === true || serverPlaylist.some((item: any) => item.scheduleId?.startsWith('fallback-'));
      setIsFallback(fallbackFlag);

      // Server responded — clear any error state and auto-recover
      if (serverErrorCountRef.current > 0) {
        serverErrorCountRef.current = 0;
        setServerError(false);
      }

      if (serverPlaylist.length === 0 && response.data.current) {
        serverPlaylist = [{
          _id: response.data.current._id,
          scheduleId: response.data.current.id || response.data.current._id,
          title: response.data.current.title,
          url: response.data.current.url,
          durationSeconds: response.data.current.durationSeconds || 10,
          hasWatermark: response.data.current.hasWatermark !== false,
          date: response.data.current.date,
          startTime: response.data.current.startTime,
          endTime: response.data.current.endTime,
        }];
      }

      // CLIENT-SIDE STRICT TIME GUARD:
      // Keep fallback items and campaigns that are within or past their start time
      const nowMs = Date.now();
      serverPlaylist = serverPlaylist.filter((item: any) => {
        if (!item.date || !item.startTime || item.scheduleId?.startsWith('fallback-')) return true;
        const startMs = new Date(`${item.date}T${item.startTime}:00+05:30`).getTime();
        // Allow full minute up to :59.999
        const endMs = item.endTime ? new Date(`${item.date}T${item.endTime}:59.999+05:30`).getTime() : Infinity;
        if (nowMs < startMs) return false;  // not yet started
        if (nowMs > endMs) return false;    // already ended
        return true;
      });

      // Update audio settings from server
      if (response.data.screen) {
        setSoundEnabled(response.data.screen.soundEnabled || false);
        setVolume(response.data.screen.volume ?? 50);
      }
      
      setPlaylist(prev => {
        const idsEqual = (listA: any[], listB: any[]) => {
          if (listA.length !== listB.length) return false;
          return listA.every((item, idx) => item.scheduleId === listB[idx].scheduleId);
        };
        if (idsEqual(prev, serverPlaylist)) return prev;
        
        // Try to maintain the current playing schedule index if it's still in the new playlist
        const currentScheduleId = prev[currentIndex]?.scheduleId;
        const newIndex = serverPlaylist.findIndex((item: any) => item.scheduleId === currentScheduleId);
        setCurrentIndex(newIndex >= 0 ? newIndex : 0);
        return serverPlaylist;
      });
    } catch (err: any) {
      console.warn('Screen poll retry:', err?.message || err);
      serverErrorCountRef.current += 1;
      // Only show error screen after 5 consecutive failures (15s) or if browser is offline
      if (!navigator.onLine || serverErrorCountRef.current >= 5) {
        setServerError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Instant offline detection — show 404 the moment internet drops
    const handleOffline = () => setServerError(true);
    const handleOnline  = () => {
      setServerError(false);
      serverErrorCountRef.current = 0;
      fetchContent();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);

    // If already offline when component mounts, show 404 immediately
    if (!navigator.onLine) {
      setServerError(true);
    } else {
      fetchContent();
    }

    const interval = setInterval(() => {
      if (navigator.onLine) fetchContent();
    }, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, [deviceId]);

  // Playlist transition loop timer — advances to next ad or checks backend for single ad expiration
  useEffect(() => {
    if (!playlist || playlist.length === 0) return;

    const currentItem = playlist[currentIndex] || playlist[0];
    const duration = (currentItem?.durationSeconds || 15) * 1000;

    const timer = setTimeout(() => {
      fetchContent();
      setCurrentIndex(prev => (playlist.length > 0 ? (prev + 1) % playlist.length : 0));
    }, duration);

    return () => clearTimeout(timer);
  }, [playlist, currentIndex]);

  const getWallClockSeek = () => {
    if (!isFallback || !playlist || playlist.length < 2) return { index: 0, seek: 0 };
    const totalCycleSec = playlist.reduce((sum: number, item: any) => sum + (item.durationSeconds || 15), 0) || 30;
    const nowSec = (Date.now() / 1000) % totalCycleSec;

    let accumulated = 0;
    for (let i = 0; i < playlist.length; i++) {
      const itemDuration = playlist[i].durationSeconds || 15;
      if (nowSec < accumulated + itemDuration) {
        return { index: i, seek: nowSec - accumulated };
      }
      accumulated += itemDuration;
    }
    return { index: 0, seek: 0 };
  };

  // Network-wide wall-clock synchronization for showcase fallback loop across ALL screens
  useEffect(() => {
    if (!isFallback || !playlist || playlist.length < 2) return;

    const syncNetworkShowcase = () => {
      const { index: targetIdx, seek: targetSeek } = getWallClockSeek();

      if (currentIndex !== targetIdx) {
        setCurrentIndex(targetIdx);
      }

      if (videoRef.current && videoRef.current.readyState >= 2) {
        const diff = Math.abs(videoRef.current.currentTime - targetSeek);
        if (diff > 0.8) {
          videoRef.current.currentTime = targetSeek;
        }
      }
    };

    syncNetworkShowcase();
    const syncInterval = setInterval(syncNetworkShowcase, 500);
    return () => clearInterval(syncInterval);
  }, [isFallback, playlist, currentIndex]);

  // Sync video element volume & muted state whenever sound settings change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !soundEnabled;
      videoRef.current.volume = soundEnabled ? volume / 100 : 0;
    }
  }, [soundEnabled, volume]);

  // Show 404 screen when network is down or server keeps erroring
  if (serverError) {
    return <NotFound />;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentVideo = playlist[currentIndex] || null;
  const isVideo = currentVideo
    ? (() => {
        if (!currentVideo.url) return true;
        const cleanUrl = String(currentVideo.url).toLowerCase().split('?')[0];
        const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
        if (imgExts.some((ext) => cleanUrl.endsWith(ext))) return false;
        return true;
      })()
    : true;
  const showWatermark = currentVideo?.hasWatermark === true;

  // Support query param ?fit=fill (default) or ?fit=contain / ?fit=cover
  const fitParam = (new URLSearchParams(window.location.search).get('fit') || 'fill') as React.CSSProperties['objectFit'];

  // Clean, native hardware video styling (100% Filled 3x5 LED Cabinet, Zero Black Borders)
  const mediaStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    objectFit: fitParam || 'fill',
    backgroundColor: '#000000',
  };

  const watermarkOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden cursor-none relative">
      {/* PURE FULL-SCREEN MEDIA PLAYER (No text banners, no standby overlays) */}
      {isVideo ? (
        <video
          ref={videoRef}
          key={currentVideo ? currentVideo.scheduleId : 'idle-loop'}
          src={currentVideo ? getMediaUrl(currentVideo.url) : '/IMG_6479.mp4'}
          autoPlay
          muted={!soundEnabled}
          loop={playlist.length <= 1}
          playsInline
          preload="auto"
          style={mediaStyle}
          onEnded={() => {
            if (playlist.length > 1) {
              setCurrentIndex((prev) => (prev + 1) % playlist.length);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.muted = !soundEnabled;
              videoRef.current.volume = soundEnabled ? volume / 100 : 0;
              if (isFallback) {
                const { seek } = getWallClockSeek();
                if (Math.abs(videoRef.current.currentTime - seek) > 0.2) {
                  videoRef.current.currentTime = seek;
                }
              }
              videoRef.current.play().catch((err) => console.warn('Autoplay error:', err));
            }
          }}
          onCanPlay={() => {
            if (videoRef.current) {
              if (isFallback) {
                const { seek } = getWallClockSeek();
                if (Math.abs(videoRef.current.currentTime - seek) > 0.2) {
                  videoRef.current.currentTime = seek;
                }
              }
              videoRef.current.play().catch((err) => console.warn('Autoplay retry error:', err));
            }
          }}
          onError={(e) => console.error('Video Error:', e)}
        />
      ) : (
        <img
          key={currentVideo.scheduleId}
          src={getMediaUrl(currentVideo.url)}
          style={mediaStyle}
          alt={currentVideo.title || 'Ad'}
          onError={(e) => console.error('Image Error:', e)}
        />
      )}

      {/* Watermarks Overlay (Displays ONLY if customer booked with watermark) */}
      {showWatermark && (
        <div style={watermarkOverlayStyle} className="pointer-events-none select-none">
          {/* Top-right E3Di badge */}
          <div
            className="absolute top-8 right-8 z-50"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.95))' }}
          >
            <div className="px-10 py-4 bg-[#0A0D2A]/95 rounded-3xl border-4 border-[#6C47FF]/80 flex items-center justify-center">
              <span className="text-5xl font-black tracking-wide text-white leading-none">
                E3<span className="text-[#FFD600]">Di</span>
              </span>
            </div>
          </div>

          {/* Bottom yellow branding strip */}
          <div className="absolute bottom-0 left-0 right-0 z-50">
            <div className="w-full py-8 bg-[#FFD600] flex items-center justify-center border-t-8 border-yellow-500 shadow-2xl">
              <span className="text-6xl font-black tracking-[0.3em] text-black lowercase leading-none">
                www.e3di.org
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenPreview;
