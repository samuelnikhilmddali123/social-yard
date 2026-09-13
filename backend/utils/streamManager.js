const { spawn } = require('child_process');
let ffmpeg = null;
if (!process.env.VERCEL) {
  try { ffmpeg = require('ffmpeg-static'); } catch (e) {}
}
const path = require('path');
const fs = require('fs');

class StreamManager {
  constructor() {
    this.streams = new Map();
    this.baseDir = path.join(__dirname, '..', 'uploads', 'streams');
    
    // Ensure streams directory exists (Skip on Vercel as it's Read-Only)
    if (!process.env.VERCEL && !fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch (err) {
        console.error('[StreamManager] Failed to create base directory:', err.message);
      }
    }
  }

  startStream(screenId, rtspUrl) {
    if (process.env.VERCEL) {
      console.log('[StreamManager] Streaming is disabled on Vercel (Read-Only FS)');
      return null;
    }
    if (this.streams.has(screenId)) {
      console.log(`[StreamManager] Stream for ${screenId} already running.`);
      return;
    }

    const streamDir = path.join(this.baseDir, screenId);
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }

    const playlistPath = path.join(streamDir, 'index.m3u8');
    
    // FFmpeg command to convert RTSP to HLS
    // Low latency settings: 
    // -hls_time 1 (1 second segments)
    // -hls_list_size 3 (keep only 3 segments)
    // -hls_flags delete_segments (auto delete old segments)
    const ffmpegPath = process.env.FFMPEG_PATH || ffmpeg;
    
    const args = [
      '-i', rtspUrl,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-an', // disable audio
      '-f', 'hls',
      '-hls_time', '1',
      '-hls_list_size', '3',
      '-hls_flags', 'delete_segments',
      playlistPath
    ];

    console.log(`[StreamManager] Starting FFmpeg for ${screenId}: ${ffmpegPath} ${args.join(' ')}`);

    const proc = spawn(ffmpegPath, args);

    proc.stdout.on('data', (data) => {
      // console.log(`stdout: ${data}`);
    });

    proc.stderr.on('data', (data) => {
      // console.error(`stderr: ${data}`);
    });

    proc.on('close', (code) => {
      console.log(`[StreamManager] FFmpeg for ${screenId} exited with code ${code}`);
      this.streams.delete(screenId);
    });

    this.streams.set(screenId, {
      process: proc,
      playlistUrl: `/uploads/streams/${screenId}/index.m3u8`
    });

    return this.streams.get(screenId).playlistUrl;
  }

  stopStream(screenId) {
    const stream = this.streams.get(screenId);
    if (stream) {
      console.log(`[StreamManager] Stopping stream for ${screenId}`);
      stream.process.kill();
      this.streams.delete(screenId);
    }
  }

  getStreamUrl(screenId) {
    const stream = this.streams.get(screenId);
    return stream ? stream.playlistUrl : null;
  }
}

module.exports = new StreamManager();
