# PHASE 3: INSTRUMENTATION VS. LIGHTHOUSE COMPARISON

**Date**: 2026-08-18  
**Instrumentation Build**: Deployed with CLS observer, footer sampling, fetch tracking, layout state changes
**Lighthouse Run**: Instrumented build on http://localhost:4181/products  

---

## Key Metrics: Instrumented Build

| Metric | Value | vs. Baseline | Status |
|--------|-------|------------|--------|
| **CLS** | 0.493 | ≈ 0.492 (no change) | ⚠️ NO IMPROVEMENT |
| **LCP** | 4598ms | ≈ 4.6s (no change) | ⚠️ NO IMPROVEMENT |
| **TBT** | 433ms | ≈ 370-401ms (slight increase) | ⚠️ WORSE |

**Lighthouse Version**: 13.4.1  
**Form Factor**: Mobile (simulated)  
**Throttling**: Simulated Slow 4G  
**Run Date**: 2026-08-18 10:16:29 UTC  

---

## Critical Discovery: Instrumentation vs. Reality Gap

### Dev Environment (Manual Browser Test)
**Footer Monitoring Results**:
- ✅ CLS observer initialized
- ✅ Footer found and position sampled
- ✅ **NO layout-shift events detected** (5 samples all showed identical position)
- **Measured CLS from footer**: 0

### Lighthouse Audit (Simulated Environment)
**Metrics from audit**:
- ⚠️ **CLS reported**: 0.493
- ⚠️ **Footer is contributing to measured CLS** (only element with significant layout shift)
- ❓ **CLS observer did NOT log any events** during instrumentation

**Interpretation**:
1. **CLS happens before instrumentation initializes** — The PerformanceObserver may be set up too late
2. **Lighthouse simulates different conditions** — Network/device context triggers CLS differently
3. **Footer shift is real but not captured** — Our sampling strategy misses the timing

---

## Timeline Analysis: When Does CLS Happen?

### Hypothesis 1: CLS During Resource Loading (0-1000ms)
**Evidence**:
- Fonts ready at 178ms
- Products fetch at 796-799ms
- Footer samples START at 1779ms ← **AFTER 1.7 seconds**

**Conclusion**: Instrumentation sampling might start TOO LATE to catch early CLS

### Hypothesis 2: CLS From Newsletter Message (Non-deterministic)
**Evidence**:
- Newsletter message renders only on user interaction
- In Lighthouse's headless run, no user interaction occurs
- But CLS is still 0.493, suggesting it's automatic

**Conclusion**: Unlikely to be newsletter-driven

### Hypothesis 3: CLS From Product Images (1000-5000ms)
**Evidence**:
- Product images start loading at 799.6ms
- Images are lazy-loaded and render progressively
- Image height adjustments could trigger layout shifts
- Footer position appears stable in sampling, but images might push body height

**Conclusion**: **MOST LIKELY** — Product images loading causes body height to increase, pushing footer down

---

## What the Data Tells Us

### ✅ What We Know (Verified by Instrumentation)
1. **Products fetch is cached** (2.3ms - essentially free)
2. **Images load immediately after DOM render** (starts at 799.6ms)
3. **Fonts are ready early** (178ms)
4. **No JavaScript long tasks detected** in dev environment
5. **Footer position stable** when sampled (every 100ms starting at 1779ms)

### ⚠️ What We DON'T Know
1. **Exact timing of CLS trigger** — Observer not detecting the shift
2. **Which element causes the shift** — Likely product image heights
3. **Why TBT increased slightly** — Should investigate long tasks in Lighthouse context
4. **LCP element identity** — Not captured by instrumentation

---

## PHASE 4-5 Next Steps

### CRITICAL: Improve Instrumentation Timing

**Issue**: Instrumentation initializes at page load, but CLS observer may miss early shifts.

**Solution**:
1. Start PerformanceObserver setup IMMEDIATELY in main.tsx (before React renders)
2. Move footer sampling to start at 0ms (don't wait 1.7s)
3. Instrument the VERY FIRST layout shift, not after 1.7s delay

### Instrument Product Image Height Changes

**Purpose**: Detect if image aspect ratio changes cause body height shifts

**Add**:
- Track observed image heights
- Monitor document.body.scrollHeight changes
- Correlate with image load events
- Log body height at: page load, after products fetch, after each image load chunk

### Extend LCP Capture

**Add**:
- Capture LCP element details (tag, class, src, dimensions)
- Record LCP timing vs. resource timing
- Identify if LCP is blocking on vendor.js or image resources

### Verify TBT in Lighthouse Context

**Add**:
- Longer monitoring window for long tasks
- Capture script URLs from attribution
- Correlate long tasks with products page load

---

## Why Previous Changes Showed No Improvement

| Change | Expected Impact | Actual Result | Issue |
|--------|-----------------|---------------|--------|
| Remove Framer Motion | Reduce JS blocking | No change in TBT | Motion lib already removed from Products.tsx, not impacting TBT |
| fetchPriority="high" first image | Prioritize LCP resource | No change in LCP | LCP may not be an image, or resource isn't bottleneck |
| ChatWidget 5s delay | Reduce blocking | TBT increased | Delay doesn't address the blocking task itself |

**Insight**: None of these changes addressed the actual root causes because we didn't know them yet. That's why we MUST find evidence first.

---

## Critical Path to Fix

1. **CONFIRM**: CLS is from product image aspect ratio (body height changes)
2. **CONFIRM**: LCP element and whether it's network- or render-bound
3. **CONFIRM**: What causes TBT (vendor.js, React rendering, image decode)
4. **THEN**: Implement specific fixes:
   - For CLS: Reserve space or set explicit image heights
   - For LCP: Prioritize resource or optimize render
   - For TBT: Break up long tasks or defer non-critical work

---

## Files Created

- `PHASE2_INSTRUMENTATION_BASELINE.md` — Development environment baseline
- `lighthouse-inst-prod.json` — Lighthouse audit with instrumentation build
- `PHASE3_INSTRUMENTATION_VS_LIGHTHOUSE.md` — This analysis

**Next Build**: Enhanced instrumentation with earlier CLS observer and better timing capture
