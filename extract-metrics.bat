@echo off
setlocal enabledelayedexpansion

REM Extract metrics from 3 Lighthouse JSON files and display results
echo === PHASE 6 BASELINE - Run 1 ===
for /f "tokens=2 delims=:" %%a in ('findstr /i "numericValue" lighthouse-phase6-run1.json ^| findstr /i "cumulative-layout-shift" -A2') do (
  echo CLS: %%a
  goto :next1
)
:next1

python -c "
import json
results = []
for i in range(1, 4):
    with open(f'lighthouse-phase6-run{i}.json') as f:
        data = json.load(f)
        audits = data['audits']
        results.append({
            'run': i,
            'cls': audits['cumulative-layout-shift']['numericValue'],
            'lcp': audits['largest-contentful-paint']['numericValue'],
            'tbt': audits['total-blocking-time']['numericValue'],
        })

print('Run,CLS,LCP,TBT')
for r in results:
    print(f'{r[\"run\"]},{round(r[\"cls\"],3)},{round(r[\"lcp\"],0)},{round(r[\"tbt\"],0)}')
" > phase6-metrics-summary.txt

type phase6-metrics-summary.txt
