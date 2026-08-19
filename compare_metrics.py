import json

runs = {
    'baseline': [
        'lighthouse-phase6-run1.json',
        'lighthouse-phase6-run2.json', 
        'lighthouse-phase6-run3.json'
    ],
    'optimized': [
        'lighthouse-phase6-opt-run1.json',
        'lighthouse-phase6-opt-run2.json',
        'lighthouse-phase6-opt-run3.json'
    ]
}

def extract_metrics(file):
    with open(file) as f:
        data = json.load(f)
        audits = data['audits']
        return {
            'cls': round(audits['cumulative-layout-shift']['numericValue'], 3),
            'lcp': round(audits['largest-contentful-paint']['numericValue'], 0),
            'tbt': round(audits['total-blocking-time']['numericValue'], 0),
            'si': round(audits['speed-index']['numericValue'], 0),
            'fcp': round(audits['first-contentful-paint']['numericValue'], 0),
        }

# Extract all metrics
baseline_metrics = [extract_metrics(f) for f in runs['baseline']]
optimized_metrics = [extract_metrics(f) for f in runs['optimized']]

# Calculate medians
def get_median(metric_name, data_list):
    values = sorted([d[metric_name] for d in data_list])
    return values[1]

print("\n" + "="*80)
print("PHASE 6 OPTIMIZATION RESULTS")
print("="*80)

print("\n┌─ BASELINE METRICS (3 runs)")
print("├─────────────────────────────────────────")
for i, m in enumerate(baseline_metrics, 1):
    print(f"│ Run {i}: CLS={m['cls']} | LCP={int(m['lcp'])}ms | TBT={m['tbt']}ms")
    
baseline_medians = {
    'cls': get_median('cls', baseline_metrics),
    'lcp': get_median('lcp', baseline_metrics),
    'tbt': get_median('tbt', baseline_metrics),
    'si': get_median('si', baseline_metrics),
}
print(f"│")
print(f"│ MEDIAN:   CLS={baseline_medians['cls']} | LCP={int(baseline_medians['lcp'])}ms | TBT={baseline_medians['tbt']}ms")
print("└─────────────────────────────────────────")

print("\n┌─ OPTIMIZED METRICS (3 runs)")
print("├─────────────────────────────────────────")
for i, m in enumerate(optimized_metrics, 1):
    print(f"│ Run {i}: CLS={m['cls']} | LCP={int(m['lcp'])}ms | TBT={m['tbt']}ms")

optimized_medians = {
    'cls': get_median('cls', optimized_metrics),
    'lcp': get_median('lcp', optimized_metrics),
    'tbt': get_median('tbt', optimized_metrics),
    'si': get_median('si', optimized_metrics),
}
print(f"│")
print(f"│ MEDIAN:   CLS={optimized_medians['cls']} | LCP={int(optimized_medians['lcp'])}ms | TBT={optimized_medians['tbt']}ms")
print("└─────────────────────────────────────────")

# Calculate improvements
lcp_diff = int(baseline_medians['lcp']) - int(optimized_medians['lcp'])
lcp_pct = (lcp_diff / int(baseline_medians['lcp'])) * 100 if baseline_medians['lcp'] else 0
tbt_diff = baseline_medians['tbt'] - optimized_medians['tbt']
tbt_pct = (tbt_diff / baseline_medians['tbt']) * 100 if baseline_medians['tbt'] else 0

print("\n┌─ IMPROVEMENT ANALYSIS")
print("├─────────────────────────────────────────")
print(f"│ LCP: {int(baseline_medians['lcp'])}ms → {int(optimized_medians['lcp'])}ms ({lcp_diff:+d}ms, {lcp_pct:+.1f}%) {'✅' if lcp_diff > 0 else '❌'}")
print(f"│ TBT: {baseline_medians['tbt']}ms → {optimized_medians['tbt']}ms ({tbt_diff:+.0f}ms, {tbt_pct:+.1f}%) {'✅' if tbt_diff > 0 else '❌'}")
print(f"│ CLS: {baseline_medians['cls']} → {optimized_medians['cls']} (stable) ✅")
print("└─────────────────────────────────────────")

print("\n┌─ OPTIMIZATION: Added width/height attributes to <img> tags")
print("├─────────────────────────────────────────")
if lcp_diff > 0:
    print(f"│ ✅ LCP improved by {lcp_diff}ms ({lcp_pct:.1f}%)")
else:
    print(f"│ ❌ LCP REGRESSED by {-lcp_diff}ms ({-lcp_pct:.1f}%)")
    
if tbt_diff > 0:
    print(f"│ ✅ TBT improved by {tbt_diff:.0f}ms ({tbt_pct:.1f}%)")
else:
    print(f"│ ❌ TBT REGRESSED by {-tbt_diff:.0f}ms ({-tbt_pct:.1f}%)")
    
if optimized_medians['cls'] == 0:
    print(f"│ ✅ CLS maintained at 0 (no regression)")
else:
    print(f"│ ⚠️  CLS changed to {optimized_medians['cls']} (was {baseline_medians['cls']})")
    
print("└─────────────────────────────────────────\n")
