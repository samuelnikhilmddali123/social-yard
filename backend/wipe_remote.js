const BASE_URL = 'https://led.stackvil.com/_/backend/api';
const EMAIL = 'admin@jaan.com';
const PASSWORD = 'adminjaan123';

async function wipeRemoteScreens() {
  try {
    console.log(`📡 Connecting to remote API: ${BASE_URL}`);
    
    // 1. Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.msg || 'Login failed');
    
    const token = loginData.token;
    console.log('✅ Remote Login Successful');
    
    const authHeaders = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Get all screens
    const screensRes = await fetch(`${BASE_URL}/screens`, { headers: authHeaders });
    const screens = await screensRes.json();
    console.log(`🔍 Found ${screens.length} screens on remote server.`);
    
    if (screens.length === 0) {
      console.log('✨ Remote inventory is already empty.');
      return;
    }
    
    // 3. Delete one by one
    console.log(`🗑️  Starting wipe of ${screens.length} screens...`);
    for (const screen of screens) {
      try {
        const delRes = await fetch(`${BASE_URL}/screens/${screen._id}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        if (delRes.ok) {
          console.log(`   - Deleted: ${screen.deviceId} (${screen.name})`);
        } else {
          const errData = await delRes.json();
          console.error(`   ❌ Failed to delete ${screen.deviceId}:`, errData.msg || 'Unknown error');
        }
      } catch (delErr) {
        console.error(`   ❌ Failed to delete ${screen.deviceId}:`, delErr.message);
      }
    }
    
    console.log('✅ Remote wipe completed.');
    
  } catch (err) {
    console.error('❌ Remote operation failed:', err.message);
  }
}

wipeRemoteScreens();
