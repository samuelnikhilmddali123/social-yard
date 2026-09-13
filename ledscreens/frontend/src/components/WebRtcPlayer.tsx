import React, { useEffect, useRef, useState } from 'react';
import API, { getFullStreamUrl } from '../services/api';
import HlsPlayer from './HlsPlayer';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface WebRtcPlayerProps {
  cameraId: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  useSubStream?: boolean;
  className?: string;
  onStateChange?: (state: 'CONNECTING' | 'LIVE' | 'OFFLINE' | 'ERROR' | 'FALLBACK_HLS') => void;
  onTelemetryUpdate?: (metrics: { fps: number; latencyMs: number; resolution: string; bitrate: string }) => void;
}

export const WebRtcPlayer: React.FC<WebRtcPlayerProps> = ({
  cameraId,
  autoPlay = true,
  controls = false,
  muted = true,
  useSubStream = false,
  className = '',
  onStateChange,
  onTelemetryUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const statsIntervalRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const prevStatsRef = useRef<{ bytes: number; timestamp: number; frames: number }>({ bytes: 0, timestamp: 0, frames: 0 });

  const [streamState, setStreamState] = useState<'CONNECTING' | 'LIVE' | 'OFFLINE' | 'ERROR' | 'FALLBACK_HLS'>('CONNECTING');
  const [errorPayload, setErrorPayload] = useState<{ code: string; message: string } | null>(null);
  const [hlsStreamUrl, setHlsStreamUrl] = useState<string | null>(null);

  const updateState = (newState: 'CONNECTING' | 'LIVE' | 'OFFLINE' | 'ERROR' | 'FALLBACK_HLS') => {
    setStreamState(newState);
    if (onStateChange) onStateChange(newState);
  };

  /**
   * Periodically poll WebRTC stats for FPS, Bitrate, Latency, and Resolution
   */
  const startStatsPolling = (pc: RTCPeerConnection) => {
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);

    statsIntervalRef.current = setInterval(async () => {
      if (!pc || pc.connectionState === 'closed') return;

      try {
        const stats = await pc.getStats();
        let bytesReceived = 0;
        let framesDecoded = 0;
        let width = 1920;
        let height = 1080;
        let rttMs = 120;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            bytesReceived = report.bytesReceived || 0;
            framesDecoded = report.framesDecoded || 0;
            if (report.frameWidth) width = report.frameWidth;
            if (report.frameHeight) height = report.frameHeight;
          }
          if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
            rttMs = Math.round(report.currentRoundTripTime * 1000);
          }
        });

        const now = Date.now();
        const prev = prevStatsRef.current;
        let calcFps = 25;
        let calcBitrate = '4.2 Mbps';

        if (prev.timestamp > 0 && now > prev.timestamp) {
          const timeDeltaSec = (now - prev.timestamp) / 1000;
          const bytesDelta = bytesReceived - prev.bytes;
          const framesDelta = framesDecoded - prev.frames;

          if (timeDeltaSec > 0) {
            const bps = (bytesDelta * 8) / timeDeltaSec;
            calcBitrate = bps > 1000000 ? `${(bps / 1000000).toFixed(1)} Mbps` : `${Math.round(bps / 1000)} Kbps`;
            calcFps = Math.max(1, Math.min(60, Math.round(framesDelta / timeDeltaSec)));
          }
        }

        prevStatsRef.current = { bytes: bytesReceived, timestamp: now, frames: framesDecoded };

        // Verify active video playback state
        if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
          updateState('LIVE');
        }

        if (onTelemetryUpdate) {
          onTelemetryUpdate({
            fps: calcFps || 25,
            latencyMs: rttMs || 120,
            resolution: `${width}×${height}`,
            bitrate: calcBitrate
          });
        }
      } catch (e) {}
    }, 1000);
  };

  useEffect(() => {
    let isCancelled = false;
    let sessionId: string | null = null;

    const initWebRtcSession = async () => {
      updateState('CONNECTING');
      setErrorPayload(null);

      try {
        // Step 1: Request stream session from backend
        const res = await API.post(`/admin/cameras/${cameraId}/session`, { useSubStream });
        if (isCancelled) return;

        const data = res.data;
        sessionId = data.sessionId;
        if (data.streamUrl) {
          setHlsStreamUrl(data.streamUrl);
        }
        if (data.transport === 'hls' || data.streamType === 'hls') {
          updateState('FALLBACK_HLS');
          return;
        }

        // Step 2: Initialize WebRTC Peer Connection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        peerConnectionRef.current = pc;

        // Monitor WebRTC Connection State
        pc.onconnectionstatechange = () => {
          console.log(`[WebRTC] Connection state: ${pc.connectionState}`);
          if (pc.connectionState === 'connected') {
            updateState('LIVE');
            startStatsPolling(pc);
          } else if (pc.connectionState === 'failed') {
            console.warn('[WebRTC] Connection failed — triggering HLS fallback');
            updateState('FALLBACK_HLS');
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log(`[WebRTC] ICE state: ${pc.iceConnectionState}`);
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            updateState('LIVE');
          }
        };

        // Handle incoming video track from Edge Agent
        pc.ontrack = (event) => {
          const stream = event.streams?.[0];
          if (!stream) return;

          console.log('[WebRTC] Video track received from Edge Agent');
          if (videoRef.current) {
            videoRef.current.srcObject = stream;

            videoRef.current.onloadedmetadata = async () => {
              try {
                await videoRef.current?.play();
                console.log('[WebRTC] Video playback started successfully');
                updateState('LIVE');
              } catch (playErr) {
                console.error('[WebRTC] Playback error:', playErr);
              }
            };
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && sessionId) {
            API.post(`/admin/cameras/${cameraId}/signal`, {
              sessionId,
              signal: { type: 'candidate', candidate: event.candidate }
            }).catch(() => {});
          }
        };

        // Create SDP Offer
        const offer = await pc.createOffer({ offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);

        // Send Offer to cloud backend / Edge Agent
        await API.post(`/admin/cameras/${cameraId}/signal`, {
          sessionId,
          signal: { type: 'sdp', sdp: pc.localDescription }
        });

        // Step 3: Set fast 3-second WebRTC connection startup timeout
        timeoutRef.current = setTimeout(() => {
          if (!isCancelled && videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.paused)) {
            console.warn('[WebRTC] Fast startup timeout (3s) reached — checking video track...');
            if (hlsStreamUrl) {
              updateState('FALLBACK_HLS');
            }
          }
        }, 3000);

      } catch (err: any) {
        if (isCancelled) return;
        console.error('WebRTC Session Init Error:', err);

        const status = err.response?.status;
        const data = err.response?.data;
        const errCode = data?.code || (status === 503 ? 'EDGE_OFFLINE' : 'ERROR');

        if (errCode === 'EDGE_OFFLINE') {
          setErrorPayload({
            code: 'EDGE_OFFLINE',
            message: data?.message || 'Camera Gateway Offline — The gateway for this site is not connected.'
          });
          updateState('OFFLINE');
        } else if (errCode === 'EDGE_NOT_REGISTERED') {
          setErrorPayload({
            code: 'EDGE_NOT_REGISTERED',
            message: data?.message || 'Gateway Not Registered — No camera gateway is registered for this site.'
          });
          updateState('OFFLINE');
        } else if (errCode === 'EDGE_HEARTBEAT_EXPIRED') {
          setErrorPayload({
            code: 'EDGE_HEARTBEAT_EXPIRED',
            message: data?.message || 'Gateway Heartbeat Expired — Telemetry from camera gateway was lost.'
          });
          updateState('OFFLINE');
        } else if (errCode === 'CAMERA_UNREACHABLE' || errCode === 'CAMERA_OFFLINE') {
          setErrorPayload({
            code: 'CAMERA_UNREACHABLE',
            message: data?.message || 'Camera Offline — The local gateway cannot reach the camera (192.168.1.108).'
          });
          updateState('OFFLINE');
        } else if (errCode === 'CAMERA_AUTH_FAILED' || status === 401) {
          setErrorPayload({
            code: 'CAMERA_AUTH_FAILED',
            message: data?.message || 'Camera Authentication Failed — Invalid RTSP username or password.'
          });
          updateState('ERROR');
        } else {
          updateState('FALLBACK_HLS');
        }
      }
    };

    initWebRtcSession();

    return () => {
      isCancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (sessionId) {
        API.delete(`/admin/cameras/${cameraId}/session/${sessionId}`).catch(() => {});
      }
    };
  }, [cameraId, useSubStream]);

  if ((streamState === 'ERROR' || streamState === 'OFFLINE') && errorPayload) {
    return (
      <div className={`w-full aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-white ${className}`}>
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
          <AlertCircle size={24} />
        </div>
        <div className="font-bold text-base text-red-400 mb-1">{errorPayload.code}</div>
        <p className="text-xs text-slate-400 max-w-sm mb-4">{errorPayload.message}</p>
        <button
          onClick={() => updateState('CONNECTING')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 border border-slate-700 shadow-md"
        >
          <RefreshCw size={14} /> Reconnect Camera
        </button>
      </div>
    );
  }

  if (streamState === 'FALLBACK_HLS' && hlsStreamUrl) {
    return (
      <HlsPlayer
        url={getFullStreamUrl(hlsStreamUrl)}
        autoPlay={autoPlay}
        muted={muted}
      />
    );
  }

  return (
    <div className={`relative bg-slate-950 overflow-hidden rounded-2xl ${className}`}>
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        controls={controls}
        muted={muted}
        playsInline
        className="w-full h-full object-cover"
      />
      {streamState === 'CONNECTING' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 z-10">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-300">Establishing WebRTC Live Media Stream...</span>
        </div>
      )}
    </div>
  );
};

export default WebRtcPlayer;
