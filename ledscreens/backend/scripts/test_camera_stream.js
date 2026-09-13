const net = require('net');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ffmpegStatic = require('ffmpeg-static');
const host = process.env.CAMERA_HOST || '192.168.1.108';
const port = parseInt(process.env.CAMERA_RTSP_PORT || '554', 10);
const username = process.env.CAMERA_USERNAME || 'admin';
const password = process.env.CAMERA_PASSWORD || 'Saikiran@26#Q';
const mainPath = process.env.CAMERA_MAIN_STREAM || '/avstream/channel=1/stream=0.sdp';

const authPart = username && password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : '';
const rtspUrl = `rtsp://${authPart}${host}:${port}${mainPath.startsWith('/') ? '' : '/'}${mainPath}`;
const maskedUrl = rtspUrl.replace(/:[^:@]+@/, ':****@');

console.log('====================================================');
console.log('🎥 E3Di CCTV Camera Stream Diagnostics');
console.log('====================================================');
console.log(`Target Camera Host : ${host}`);
console.log(`Target RTSP Port   : ${port}`);
console.log(`Stream URL         : ${maskedUrl}`);
console.log('----------------------------------------------------');

// Step 1: TCP Port Check
console.log(`[Step 1] Checking TCP connection to ${host}:${port}...`);
const socket = new net.Socket();
socket.setTimeout(3000);

socket.on('connect', () => {
  console.log(`✅ [Step 1] SUCCESS: Port ${port} is OPEN on ${host}!`);
  socket.destroy();
  testRtspStream();
});

socket.on('timeout', () => {
  console.log(`❌ [Step 1] TIMEOUT: Unable to reach ${host}:${port} within 3 seconds.`);
  console.log('👉 Make sure the Ethernet adapter has a static IP in the same subnet (e.g. 192.168.1.99).');
  console.log('👉 Run setup_camera_ethernet.bat as Administrator.');
  socket.destroy();
  process.exit(1);
});

socket.on('error', (err) => {
  console.log(`❌ [Step 1] FAILED: Connection error to ${host}:${port} (${err.message})`);
  console.log('👉 Verify Ethernet cable connection and camera power.');
  process.exit(1);
});

socket.connect(port, host);

// Step 2: RTSP Stream Probe via FFmpeg
function testRtspStream() {
  console.log('\n[Step 2] Probing RTSP stream via FFmpeg (reading 10 video frames)...');
  const args = [
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-vframes', '10',
    '-f', 'null',
    '-'
  ];

  const proc = spawn(ffmpegStatic, args);
  let stderrOutput = '';

  proc.stderr.on('data', (d) => {
    stderrOutput += d.toString();
  });

  proc.on('close', (code) => {
    if (code === 0 || stderrOutput.includes('fps=') || stderrOutput.includes('video:')) {
      console.log('🎉 [Step 2] SUCCESS: RTSP stream successfully decoded!');
      console.log('Live footage will now stream into the portal automatically!');
    } else {
      console.log(`⚠️ [Step 2] FFmpeg returned code ${code}`);
      if (stderrOutput.includes('401 Unauthorized')) {
        console.log('❌ Authentication Error: Invalid RTSP username or password.');
      } else if (stderrOutput.includes('404 Not Found')) {
        console.log(`❌ Path Not Found: Stream path "${mainPath}" might differ for this camera model.`);
      } else {
        console.log('Details:', stderrOutput.substring(0, 500));
      }
    }
  });
}
