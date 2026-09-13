import re

with open('src/pages/LaunchCampaign.tsx', 'r') as f:
    lines = f.readlines()

depth = 0
start = False

for i, line in enumerate(lines):
    if i < 998: continue
    
    clean_line = re.sub(r'\{/\*.*?\*/\}', '', line)
    opens = len(re.findall(r'<div(\s|>)', clean_line))
    closes = len(re.findall(r'</div\s*>', clean_line))
    
    if opens > 0 or closes > 0:
        depth += (opens - closes)
        print(f"L{i+1}: {depth} (+{opens}, -{closes})")
        if depth <= 0 and i > 1000:
            print("ROOT DIV CLOSED!")

