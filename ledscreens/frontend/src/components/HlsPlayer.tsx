import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, CameraOff } from 'lucide-react';

interface HlsPlayerProps {
  url: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onLatencyChange?: (latencySec: number) => void;
  onStateChange?: (state: 'CONNECTING' | 'LIVE' | 'OFFLINE' | 'STREAM ERROR') => void;
}

const HlsPlayer = ({
  url,
  autoPlay = true,
  muted = true,
  className = '',
  videoRef: externalVideoRef,
  onLatencyChange,
  onStateChange
}: HlsPlayerProps) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const hlsRef = useRef<Hls | null>(null);
  const sessionRef = useRef<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url || typeof url !== 'string' || !url.trim()) {
      setLoading(true);
      return;
    }

    const currentSession = `${url}-${Date.now()}`;
    sessionRef.current = currentSession;
    let latencyInterval: any = null;

    // Clean up any existing Hls instance before creating a new one
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (videoRef.current) {
      const video = videoRef.current;
      video.muted = muted;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          backBufferLength: 10,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 6,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 15000,
          levelLoadingMaxRetry: 6,
          levelLoadingRetryDelay: 1000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 1000
        });

        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);

        latencyInterval = setInterval(() => {
          if (videoRef.current && hlsRef.current && sessionRef.current === currentSession) {
            const livePos = hlsRef.current.liveSyncPosition || videoRef.current.currentTime;
            const latency = Math.max(0, livePos - videoRef.current.currentTime);
            if (onLatencyChange) {
              onLatencyChange(Number(latency.toFixed(1)));
            }
            // Auto-seek to live edge if lag exceeds 20s
            if (latency > 20 && hlsRef.current.liveSyncPosition) {
              console.warn(`[CCTV HLS] Live lag threshold exceeded (${latency.toFixed(1)}s > 20s). Seeking to live edge!`);
              videoRef.current.currentTime = hlsRef.current.liveSyncPosition;
            }
          }
        }, 2000);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (sessionRef.current !== currentSession) return;
          setLoading(false);
          if (onStateChange) onStateChange('LIVE');
          if (autoPlay) {
            video.play().catch(e => {
              if (e.name !== 'AbortError') {
                console.log("Autoplay blocked:", e.message);
              }
            });
          }
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          if (sessionRef.current !== currentSession) return;
          setError(null);
          setLoading(false);
        });

        let mediaErrorCount = 0;
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (sessionRef.current !== currentSession) return;
          console.warn(`[CCTV HLS Error] type=${data.type} details=${data.details} fatal=${data.fatal}`);

          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              mediaErrorCount += 1;
              if (mediaErrorCount <= 3) {
                hls.recoverMediaError();
              } else {
                mediaErrorCount = 0;
                hls.swapAudioCodec();
                hls.recoverMediaError();
              }
              return;
            }

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              default:
                hls.startLoad();
                break;
            }
          } else {
            // Non-fatal event (e.g. bufferStalledError or fragLoadTimeOut while waiting for next segment)
            if (data.details === 'bufferStalledError' || data.details === 'fragLoadTimeOut' || data.details === 'fragLoadError') {
              console.warn(`[CCTV HLS] Soft-recovering non-fatal: ${data.details}`);
              hls.startLoad();
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = url;
        const onMetadata = () => {
          if (sessionRef.current !== currentSession) return;
          setLoading(false);
          setError(null);
          if (autoPlay) {
            video.play().catch(e => {
              if (e.name !== 'AbortError') {
                console.log("Autoplay blocked:", e.message);
              }
            });
          }
        };
        video.addEventListener('loadedmetadata', onMetadata);
      } else {
        setError('HLS not supported in this browser');
      }
    }

    return () => {
      if (latencyInterval) clearInterval(latencyInterval);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [url, autoPlay, muted]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {loading && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-slate-400 gap-2 p-4">
          <CameraOff size={28} className="text-rose-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-300">{error}</span>
          <span className="text-[10px] text-slate-500">Reconnecting live video feed automatically...</span>
        </div>
      )}
      <video
        ref={videoRef as any}
        className="w-full h-full object-cover"
        muted={muted}
        autoPlay={autoPlay}
        playsInline
      />
    </div>
  );
};

export default HlsPlayer;
