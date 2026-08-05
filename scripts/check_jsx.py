from pathlib import Path
import re

path = Path('src/pages/Home.tsx')
text = path.read_text(encoding='utf-8', errors='replace')

# Simple JSX tag tracker for component-like tags.
tag_pattern = re.compile(r'<(/?)([A-Za-z][A-Za-z0-9_]*)\b([^>]*)>')
stack = []
for m in tag_pattern.finditer(text):
    slash, tag, rest = m.group(1), m.group(2), m.group(3)
    full = m.group(0)
    self_close = full.endswith('/>') or tag in ['img', 'input', 'br', 'hr', 'meta', 'link']
    if slash:
        if stack and stack[-1]['tag'] == tag:
            stack.pop()
        else:
            print('MISMATCH CLOSE', tag, 'at', m.start(), 'stack top:', stack[-1] if stack else None)
            break
    elif not self_close:
        stack.append({'tag': tag, 'pos': m.start(), 'line': text.count('\n', 0, m.start()) + 1, 'full': full})
else:
    print('DONE, stack len', len(stack))
    if stack:
        for item in stack[-10:]:
            print('OPEN', item['tag'], 'line', item['line'], 'pos', item['pos'])
