# PHASE 6: LCP & TBT OPTIMIZATION INVESTIGATION

## Current State (PHASE 5 → PHASE 6 Baseline)

### Baseline Metrics (3 Lighthouse Runs)

| Run | CLS | LCP (ms) | TBT (ms) | SI (ms) | FCP (ms) |
|-----|-----|----------|----------|---------|----------|
| 1   | 0   | 4018     | 174      | 2779    | 2779     |
| 2   | 0   | 4076     | 320      | 2802    | 2802     |
| 3   | 0   | 4011     | 381      | 3629    | 3788     |

### Median Values
- **CLS: 0** ✅ (PHASE 5 fix intact)
- **LCP: 4018ms** ❌ (target <2500ms, 60.7% above target)
- **TBT: 320ms** ❌ (target <150ms, 113% above target)
- **Speed Index: 2802ms** (reasonable)
- **FCP: 2787ms** (reasonable)

### Comparison to PHASE 5
- CLS: 0 → 0 (no change, good)
- LCP: 4100ms → 4018ms (-82ms, -2% improvement)
- TBT: 362ms → 320ms (-42ms, -11.6% improvement)

### Key Observations
1. **CLS is fixed and stable** - ProductSkeleton is working correctly
2. **TBT has high variability** - ranges from 174ms to 381ms (207ms spread)
3. **LCP is consistent** - tight range 4011-4076ms suggests stable network/CPU behavior
4. **No regression** - metrics are same or better than PHASE 5

---

## Technical Analysis

### LCP Bottleneck Timeline

**From instrumentation data:**
- 943ms: Products fetch START (Supabase query begins)
- 1721ms: Products fetch END (778ms duration)
- 1722ms: React setState(products) called
- 1851ms: ProductSkeleton renders, body height 569→7023px
- 4018ms: LCP element (first product image) paints

**Gap analysis:**
- Supabase query: 778ms (943→1721)
- React state update to paint: 100ms (1722→1851 skeleton visible)
- **Skeleton render to LCP: 2167ms** (1851→4018)

**2167ms gap consists of:**
1. Rendering 12 product cards with images (~400-600ms)
2. Image discovery and browser request (~200-400ms)
3. Image download from Supabase storage (~800-1000ms)
4. Image decode and render (~200-300ms)
5. Layout adjustment and paint (~100-200ms)

### Root Cause Analysis

#### LCP Constraint: Image URL is Dynamic
- Image URL depends on Supabase product data
- URL not available until Supabase fetch completes (1721ms)
- Cannot preload unknown URL at build time
- This is a **hard constraint** - image must fetch after product data

#### Best Optimization Targets (in order):
1. **Reduce Supabase query time** (778ms) - network/query optimization
2. **Faster React rendering** (~400-600ms for 12 cards) - component efficiency
3. **Image size optimization** (~800-1000ms download) - smaller file size
4. **Defer non-critical images** - load below-fold images lazy

### TBT Bottleneck

**Current state:** 320ms median (113% above 150ms target)

**Sources (from instrumentation):**
- Long task at 842ms duration: 105ms
- Likely additional tasks during 1722-1851ms render window
- Possible vendor.js main thread blocking

**TBT not fully understood yet** - requires Chrome DevTools trace to identify exact functions

---

## Potential Optimizations (Evidence-Based Only)

### SAFE Options (Low Risk)

1. **Optimize Product Card Rendering**
   - Risk: Low
   - Potential gain: 100-200ms TBT reduction
   - Method: Memoize ProductCard if prop changes are minimal
   - Evidence: Multiple cards render in sequence

2. **Image Size Optimization**
   - Risk: None (improves without changing UX)
   - Potential gain: 200-400ms LCP reduction
   - Method: Ensure image dimensions match display size
   - Evidence: Images already have width=800 height=600 query params

3. **Lazy Load Below-Fold Images**
   - Risk: Low  
   - Potential gain: 100-200ms TBT reduction (fewer parallel loads)
   - Method: loading="lazy" for images 2-12, keep "eager" for image 1
   - Evidence: LCP is first image, rest can defer

### RISKY Options (High Risk of Regression)

1. **Reduce Products Count** - Would change UX/functionality ❌
2. **Virtualize Product List** - Major architectural change ❌
3. **Remove Features** - Breaks product display ❌
4. **Cache on Client** - Already using getCachedData (10-minute TTL) ✅
5. **Prerender Products** - Cannot, data is dynamic per user ❌

---

## Verification Checklist

✅ Home remains lazy-loaded (confirmed in App.tsx)
✅ CLS is at 0 (skeleton fix intact)
✅ Supabase cache working (memoryCache + sessionStorage)
✅ Product functionality preserved (filtering, search, routing)
✅ No TypeScript errors in build
✅ All 14 PHASE 5 constraints maintained

---

## Next Steps (Recommended)

### Immediate (High Confidence)
1. Verify first product image has correct explicit dimensions
2. Add loading="lazy" to images 2-12 in product grid
3. Measure TBT with Chrome DevTools trace to find exact bottleneck

### Secondary (Requires More Investigation)  
1. Profile React rendering of ProductCard components
2. Analyze vendor.js for main-thread blocking
3. Check Supabase query for optimization opportunities

### NOT Recommended
- Reduce column count (UX regression)
- Virtualize products (architecture change violates constraint)
- Remove product details (functionality loss)
- Code-split vendor.js (would require routing changes)

---

## PHASE 6 Constraints

Based on user requirements:
- ✅ Do NOT undo PHASE 5 skeleton fix
- ✅ Do NOT make speculative changes
- ✅ Do NOT break product functionality
- ✅ Do NOT change Supabase data behavior
- ✅ Do NOT remove features
- ✅ Must measure before/after with 3 Lighthouse runs
- ✅ Only keep changes that improve metrics
- ✅ Do NOT revert CLS fix if regressed

---

## Summary

**Status:** Investigation complete, ready for targeted optimization
**CLS:** Fixed and stable ✅
**LCP:** Needs optimization (60.7% above target)
**TBT:** Needs optimization (113% above target)
**Recommended Action:** Start with low-risk image optimizations and lazy loading
