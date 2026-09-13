import re

with open('src/pages/LaunchCampaign.tsx', 'r') as f:
    code = f.read()

return_match = re.search(r'return\s*\(\s*(<div[\s\S]*?)^\s*\);\s*$', code, re.MULTILINE)
if not return_match:
    print("Could not find return block")
    exit(1)

return_block = return_match.group(1)
lines = return_block.split('\n')
depth = 0

for i, line in enumerate(lines):
    # Remove comments so we don't count them
    clean_line = re.sub(r'\{/\*.*?\*/\}', '', line)
    
    opens = len(re.findall(r'<div(\s|>)', clean_line))
    closes = len(re.findall(r'</div\s*>', clean_line))
    
    if opens > 0 or closes > 0:
        depth += (opens - closes)
        print(f"L{i + 999}: {depth} (+{opens}, -{closes}) | {clean_line.strip()}")

print(f"Final depth: {depth}")
