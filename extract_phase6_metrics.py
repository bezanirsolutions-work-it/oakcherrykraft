import json
import os

results = []
for i in range(1, 4):
    file = f"lighthouse-phase6-run{i}.json"
    if os.path.exists(file):
        with open(file, 'r') as f:
            data = json.load(f)
            audits = data['audits']
            results.append({
                'run': i,
                'cls': round(audits['cumulative-layout-shift']['numericValue'], 3),
                'lcp': round(audits['largest-contentful-paint']['numericValue'], 0),
                'tbt': round(audits['total-blocking-time']['numericValue'], 0),
                'si': round(audits['speed-index']['numericValue'], 0),
                'fcp': round(audits['first-contentful-paint']['numericValue'], 0),
            })

# Sort by each metric to find medians
cls_vals = sorted([r['cls'] for r in results])
lcp_vals = sorted([r['lcp'] for r in results])
tbt_vals = sorted([r['tbt'] for r in results])
si_vals = sorted([r['si'] for r in results])
fcp_vals = sorted([r['fcp'] for r in results])

print("=== PHASE 6 BASELINE METRICS ===\n")
print(f"{'Run':<6} {'CLS':<8} {'LCP (ms)':<10} {'TBT (ms)':<10} {'SI (ms)':<10} {'FCP (ms)':<10}")
print("-" * 60)
for r in results:
    print(f"{r['run']:<6} {r['cls']:<8} {int(r['lcp']):<10} {r['tbt']:<10} {r['si']:<10} {r['fcp']:<10}")

print("\n=== MEDIAN VALUES ===\n")
print(f"CLS: {cls_vals[1]} (target <0.10)")
print(f"LCP: {int(lcp_vals[1])}ms (target <2500ms)")
print(f"TBT: {tbt_vals[1]}ms (target <150ms)")
print(f"SI: {int(si_vals[1])}ms")
print(f"FCP: {int(fcp_vals[1])}ms")

# Compare to PHASE 5
print("\n=== COMPARISON TO PHASE 5 ===\n")
phase5_baseline = {
    'cls': 0.0,
    'lcp': 4100,
    'tbt': 362,
    'si': 2818,
}

print(f"CLS: {phase5_baseline['cls']} → {cls_vals[1]} (change: {round(cls_vals[1] - phase5_baseline['cls'], 3)})")
print(f"LCP: {phase5_baseline['lcp']}ms → {int(lcp_vals[1])}ms (change: {int(lcp_vals[1]) - phase5_baseline['lcp']}ms)")
print(f"TBT: {phase5_baseline['tbt']}ms → {tbt_vals[1]}ms (change: {tbt_vals[1] - phase5_baseline['tbt']}ms)")
print(f"SI: {phase5_baseline['si']}ms → {int(si_vals[1])}ms (change: {int(si_vals[1]) - phase5_baseline['si']}ms)")
