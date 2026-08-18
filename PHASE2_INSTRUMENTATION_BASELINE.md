# PHASE 2: INSTRUMENTATION BASELINE — /products Route

**Date**: 2026-08-18  
**URL**: http://localhost:4181/products  
**Environment**: Development server (localhost with hot reload)  
**Build**: Instrumentation code deployed and verified  

---

## Executive Summary

Deployed **real-time performance instrumentation** capturing:
- ✅ Layout-shift events via PerformanceObserver
- ✅ Footer position/height sampling every 100ms
- ✅ Product fetch timing (start/end/state update)
- ✅ Image loading lifecycle
- ✅ Font readiness
- ✅ Long task detection

**Key Finding**: **Footer does NOT move during page load on localhost**, contradicting Lighthouse 0.492 CLS report.

---

## Instrumentation Data (Raw)

### Footer Position Sampling

**Status**: ✅ ACTIVE - Footer found and monitored

| Time (ms) | Footer Top | Height | Body Height | Content Height | Change |
|-----------|-----------|--------|------------|----------------|--------|
| 1779.1    | 6341.74   | 681.06 | 7023       | 6265.07        | —      |
| 2777.4    | 6341.74   | 681.06 | 7023       | 6265.07        | NONE   |
| 3776.4    | 6341.74   | 681.06 | 7023       | 6265.07        | NONE   |
| 4776.5    | 6341.74   | 681.06 | 7023       | 6265.07        | NONE   |
| 5776.7    | 6341.74   | 681.06 | 7023       | 6265.07        | NONE   |

**Observations**:
- Footer position is **completely stable** across all samples
- No height changes detected
- Body height does not shift
- Content height stable (products grid rendered)
- ⚠️ **CLS = 0** in this measurement (contradicts Lighthouse 0.492)

### CLS Observer Events

**Status**: ✅ ACTIVE but NO SHIFTS DETECTED

```
[PERF][CLS] Setting up PerformanceObserver for layout-shift
[PERF][CLS] PerformanceObserver active
```

**Events Captured**: 0
- No layout-shift entries recorded
- No element shifts detected
- No CLS value accumulated

**Interpretation**: Either:
1. CLS happens BEFORE instrumentation initializes
2. CLS happens in a DIFFERENT viewport/device context (Lighthouse vs. dev server)
3. CLS is triggered by user interaction after page load (footer newsletter form)
4. Footer shift is minimal and happens too fast to capture in dev environment

### Products Fetch Timeline

```
[PERF][PRODUCTS] Fetch started at 796.8ms
[PERF][PRODUCTS] Fetch ended at 799.1ms (duration: 2.3ms)
[PERF][PRODUCTS] State updated at 799.9ms
```

**Metrics**:
- Fetch Start: 796.8ms
- Fetch End: 799.1ms
- **Duration: 2.3ms** ← **CACHED DATA** (10-minute cache hit)
- State Update: 799.9ms
- Time from fetch end to render: 0.8ms

**Analysis**:
- Products data is being served from cache (supabase getCachedData)
- Fetch is essentially free (2.3ms)
- No network latency because cache is warm
- Products are rendered to DOM immediately

### Image Loading Lifecycle

```
[PERF][IMAGES] Started loading at 799.6ms
```

**Status**: 
- ✅ Images START recorded: 799.6ms
- ⏱️ Images FINISH: **NOT YET RECORDED** (5000ms timeout not yet fired)

**Expected**:
- Images load asynchronously after state update
- First image (eager, fetchPriority=high) should load ~1-2s
- Remaining images lazy-loaded by browser

### Font Readiness

```
[PERF][FONTS] Fonts ready at 178.0ms
```

**Status**: ✅ Fonts loaded early in page lifecycle (178ms)

### Long Tasks Detected

**Status**: ✅ OBSERVER ACTIVE but NO TASKS DETECTED

**Events**: 0 (empty array)

**Interpretation**: 
- No JavaScript long tasks (>50ms) detected during this dev run
- Differs from Lighthouse TBT 370–401ms report
- Likely due to: dev server environment, smaller simulated network throttling, or different device simulation

---

## Timeline Correlation

```
Timeline of /products route load (development):

0ms          - Page starts loading
178ms        - ✅ Fonts ready
796.8ms      - ✅ Products fetch STARTS (from cache)
799.1ms      - ✅ Products fetch ENDS (2.3ms)
799.6ms      - ✅ Images START loading
799.9ms      - ✅ Products rendered to DOM
1779.1ms     - ✅ Footer sampling STARTS (1st sample captured)
~5800ms      - ⏳ Images expected to finish (5s timeout from state update)
```

---

## Discrepancies: Dev vs. Lighthouse

| Metric | Lighthouse | Dev Instrumentation | Interpretation |
|--------|-----------|-------------------|-----------------|
| CLS | 0.492 | 0 | Footer shift happens at different time or in different context |
| TBT | 370–401ms | 0ms | No long tasks detected in dev; Lighthouse has simulated throttling |
| LCP | 4.6–4.7s | — | Not yet measured; need LCP element tracking |
| Footer Movement | 0.492 CLS | NONE | Key discrepancy to investigate |

---

## PHASE 2 Conclusions

### ✅ What We Know
1. **Footer is stable** during normal page load on localhost
2. **Products data is cached** and loads instantly (2.3ms)
3. **Images start loading** immediately after DOM render
4. **Fonts load early** (178ms)
5. **No long tasks** detected in dev environment

### ⚠️ Key Questions
1. **When does footer move in Lighthouse?**
   - Lighthouse simulates different network/device conditions
   - May happen at different point in page load or due to timing
   
2. **What element is causing the 0.492 CLS?**
   - Footer appears stable
   - Could be: newsletter message rendering, content expansion, image height shifts
   
3. **Why no long tasks in dev?**
   - Dev server may have different JS execution profile
   - Lighthouse uses simulated Slow 4G + CPU throttling
   
4. **What is the actual LCP element?**
   - Not detected in this run
   - Need to wait longer or check resource timing

---

## PHASE 3 Next Steps

To correlate CLS trigger with other events, instrument:
1. **Newsletter form state changes** - Record when success/error message renders
2. **Product image load events** - Track when first image renders to screen
3. **DOM size changes** - Monitor body/footer height changes
4. **Layout triggering events** - Detect which state change causes layout shift

To measure Lighthouse vs. dev differences:
1. **Run with throttled network** - Simulate Slow 4G to match Lighthouse
2. **Run with CPU throttling** - Use DevTools CPU throttle 4x to match Lighthouse
3. **Capture LCP timing** - Wait for first LCP element to render

---

## Files Modified

- `src/lib/perfInstrumentation.ts` — Core instrumentation utilities
- `src/pages/Products.tsx` — Product fetch/image tracking
- `src/main.tsx` — Initialization hook

## Instrumentation Status

✅ **Active on localhost** (development only)
- Disabled in production (isDev check)
- Data accessible via `window.__perfData`
- Console logging with `[PERF]` prefix
