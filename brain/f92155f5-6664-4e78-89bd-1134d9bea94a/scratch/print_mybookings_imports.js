const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\nikhil\\Downloads\\ledscreens\\frontend\\src\\pages\\MyBookings.tsx", 'utf8').replace(/\r\n/g, '\n');

const lines = content.split('\n');
for (let i = 0; i < 20; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
