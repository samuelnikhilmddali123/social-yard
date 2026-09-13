const http = require('http');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CANDIDATE_IPS = [
  process.env.CAMERA_HOST || '192.168.1.108',
  '192.168.1.64',
  '192.168.1.250',
  '192.168.1.10',
  '192.168.1.88',
  '192.168.0.10',
  '192.168.0.60'
];

const CANDIDATE_PORTS = [80, 8000, 8899, 554];

const PASSWORDS = [
  process.env.CAMERA_PASSWORD || 'Saikiran@26#Q',
  'admin',
  '12345',
  '123456',
  'admin123',
  'Admin@123',
  'Saikiran@123',
  'pass',
  'password',
  ''
];

function buildWsseHeader(username, password) {
  if (!username || !password) return '';

  const created = new Date().toISOString();
  const nonceBytes = crypto.randomBytes(16);
  const nonceBase64 = nonceBytes.toString('base64');

  // ONVIF Password Digest = Base64( SHA-1( Nonce + Created + Password ) )
  const sha = crypto.createHash('sha1');
  sha.update(Buffer.concat([nonceBytes, Buffer.from(created, 'ascii'), Buffer.from(password, 'ascii')]));
  const digest = sha.digest('base64');

  return `
    <s:Header>
      <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
        <wsse:UsernameToken>
          <wsse:Username>${username}</wsse:Username>
          <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${digest}</wsse:Password>
          <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonceBase64}</wsse:Nonce>
          <wsu:Created xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">${created}</wsu:Created>
        </wsse:UsernameToken>
      </wsse:Security>
    </s:Header>`;
}

function testOnvifSoap(ip, port, username, password) {
  return new Promise((resolve) => {
    const wsseHeader = buildWsseHeader(username, password);
    const body = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
  ${wsseHeader}
  <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <GetDeviceInformation xmlns="http://www.onvif.org/ver10/device/wsdl"/>
  </s:Body>
</s:Envelope>`;

    const options = {
      hostname: ip,
      port: port,
      path: '/onvif/device_service',
      method: 'POST',
      timeout: 2000,
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 && data.includes('Manufacturer')) {
          resolve({ ok: true, ip, port, username, password, response: data });
        } else if (res.statusCode === 401 || data.includes('Unauthorized') || data.includes('NotAuthorized')) {
          resolve({ ok: false, authFailed: true, ip, port, username, password });
        } else {
          resolve({ ok: false, code: res.statusCode, ip, port });
        }
      });
    });

    req.on('error', () => resolve({ ok: false, unreachable: true, ip, port }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, timeout: true, ip, port }); });
    req.write(body);
    req.end();
  });
}

async function runDiagnostics(targetIp = null) {
  const ips = targetIp ? [targetIp] : CANDIDATE_IPS;
  console.log('===========================================================');
  console.log('🔎 ONVIF Camera Authentication & Diagnostic Test');
  console.log('===========================================================');

  for (const ip of ips) {
    console.log(`\nTesting IP: ${ip}...`);
    for (const port of CANDIDATE_PORTS) {
      // First test with default credentials
      const result = await testOnvifSoap(ip, port, 'admin', PASSWORDS[0]);
      if (result.ok) {
        console.log(`🎉 SUCCESS! Connected to camera at ${ip}:${port}`);
        console.log(`Working credentials: Username=admin, Password=${PASSWORDS[0]}`);
        return;
      }

      if (result.authFailed) {
        console.log(`📡 Port ${port} responded on ${ip}, but password was rejected! Testing other passwords...`);
        for (const pwd of PASSWORDS.slice(1)) {
          const testPwd = await testOnvifSoap(ip, port, 'admin', pwd);
          if (testPwd.ok) {
            console.log(`🎉 SUCCESS! Connected to camera at ${ip}:${port}`);
            console.log(`Working credentials: Username=admin, Password="${pwd}"`);
            return;
          }
        }
      }
    }
  }

  console.log('\n❌ No camera responded on the standard IPs.');
  console.log('👉 Please check what IP address is shown in ONVIF Device Manager on the left sidebar!');
}

const inputIp = process.argv[2];
runDiagnostics(inputIp).catch(console.error);
