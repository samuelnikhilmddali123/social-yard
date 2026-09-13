with open('src/pages/LaunchCampaign.tsx', 'r') as f:
    lines = f.readlines()

brace_depth = 0
paren_depth = 0
bracket_depth = 0

for idx, line in enumerate(lines):
    line_num = idx + 1
    for char_idx, char in enumerate(line):
        if char == '{':
            brace_depth += 1
        elif char == '}':
            brace_depth -= 1
        elif char == '(':
            paren_depth += 1
        elif char == ')':
            paren_depth -= 1
        elif char == '[':
            bracket_depth += 1
        elif char == ']':
            bracket_depth -= 1
            
        if brace_depth < 0 or paren_depth < 0 or bracket_depth < 0:
            print(f"Negative depth at L{line_num} C{char_idx}: braces={brace_depth}, parens={paren_depth}, brackets={bracket_depth}")
            # Reset
            if brace_depth < 0: brace_depth = 0
            if paren_depth < 0: paren_depth = 0
            if bracket_depth < 0: bracket_depth = 0

print(f"Final up to end: braces={brace_depth}, parens={paren_depth}, brackets={bracket_depth}")
