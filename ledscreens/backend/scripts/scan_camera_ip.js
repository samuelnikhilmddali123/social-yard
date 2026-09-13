const net = require('net');

const CANDIDATE_IPS = [
  '192.168.1.108', // Sparsh / Dahua / CP PLUS
  '192.168.1.64',  // Hikvision / HiFocus
  '192.168.1.250', // Sparsh alternative
  '192.168.1.10',  // Generic ONVIF / Xiongmai
  '192.168.1.88',  // Secureye
  '192.168.1.128',
  '192.168.0.10',
  '192.168.0.60',  // TP-Link Tapo / Vigi
  '192.168.0.100',
  '192.168.1.100'
];

const PORTS = [554, 80, 8000, 37777, 8899];

function testPort(ip, port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(800);
    s.on('connect', () => {
      s.destroy();
      resolve({ ip, port, open: true });
    });
    s.on('timeout', () => {
      s.destroy();
      resolve({ ip, port, open: false });
    });
    s.on('error', () => {
      s.destroy();
      resolve({ ip, port, open: false });
    });
    s.connect(port, ip);
  });
}

async function scan() {
  console.log('🔍 Scanning candidate camera IPs and ports...');
  let foundAny = false;

  for (const ip of CANDIDATE_IPS) {
    for (const port of PORTS) {
      const res = await testPort(ip, port);
      if (res.open) {
        console.log(`✅ FOUND OPEN PORT! IP: ${ip} | Port: ${port}`);
        foundAny = true;
      }
    }
  }

  if (!foundAny) {
    console.log('ℹ️ No ports open on scanned IPs. If Ethernet adapter IP is not yet set, run setup_camera_ethernet.bat first.');
  }
}

scan().catch(console.error);
