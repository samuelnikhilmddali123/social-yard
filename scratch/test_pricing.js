async function run() {
  try {
    const res = await fetch('http://localhost:5001/api/schedule/calculate-total', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        screenIds: ['6a0895ba56f9df6bacf434b8'],
        durationSeconds: 10,
        hasWatermark: true,
        daysCount: 30
      })
    });
    console.log('STATUS:', res.status);
    const data = await res.json();
    console.log('SUCCESS Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

run();
