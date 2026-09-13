async function test() {
  try {
    const res = await fetch('https://led.stackvil.com/_/backend/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@jaan.com', password: 'adminjaan123' })
    });
    const data = await res.json();
    console.log("Admin login status:", res.status, data);
  } catch (err) {
    console.error("Admin login failed:", err.message);
  }

  try {
    const res = await fetch('https://led.stackvil.com/_/backend/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'official@gov.in', password: 'password123' })
    });
    const data = await res.json();
    console.log("Gov login status:", res.status, data);
  } catch (err) {
    console.error("Gov login failed:", err.message);
  }
}
test();
