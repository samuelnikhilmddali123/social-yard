const fs = require('fs');
const code = fs.readFileSync('src/pages/LaunchCampaign.tsx', 'utf8');

const returnMatch = code.match(/return\s*\(\s*(<div[\s\S]*?)^\s*\);\s*$/m);
if (!returnMatch) {
  console.log("Could not find return block");
  process.exit(1);
}

const returnBlock = returnMatch[1];
let depth = 0;
let divCount = 0;
let lines = returnBlock.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Very rough regex just to get a sense. It won't handle comments perfectly, but let's see.
  // Actually let's just use a simple regex for <div and </div
  
  const opens = (line.match(/<div(\s|>)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  
  depth += (opens - closes);
  if (opens > 0 || closes > 0) {
    // console.log(`Line ${i + 999}: +${opens} -${closes} => Depth: ${depth}`);
  }
}
console.log("Final depth:", depth);
