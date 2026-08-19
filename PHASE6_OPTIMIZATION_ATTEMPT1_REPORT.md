# PHASE 6 OPTIMIZATION ATTEMPT #1 - RESULTS

## Optimization Attempted
**Added explicit width/height attributes to product images**
- Intent: Reduce layout shift and paint time by pre-informing browser of image dimensions
- Implementation: Added `width={800} height={600}` to all `<img>` tags in products grid
- Basis: Standard web performance practice

## Results (3 Lighthouse Runs)

### Baseline Metrics (Original Code)
| Run | LCP | TBT | CLS |
|-----|-----|-----|-----|
| 1   | 4018.77ms | 174.5ms | 0 |
| 2   | 4076.51ms | 320ms | 0 |
| 3   | 4011.20ms | 381.24ms | 0 |
| **MEDIAN** | **4018.77ms** | **320ms** | **0** |

### Optimized Metrics (With width/height)
| Run | LCP | TBT | CLS |
|-----|-----|-----|-----|
| 1   | 4125.61ms | 424.82ms | 0 |
| 2   | 3995.97ms | 317ms | 0 |
| 3   | 4087.66ms | 535ms | 0 |
| **MEDIAN** | **4087.66ms** | **424.82ms** | **0** |

## Analysis

### Impact
- **LCP: 4018.77ms → 4087.66ms** = **+69ms REGRESSION (-1.7%)** ❌
- **TBT: 320ms → 424.82ms** = **+105ms REGRESSION (-32.8%)** ❌
- **CLS: 0 → 0** = **No change (good)** ✅

### Why This Made Things Worse

1. **CSS aspect-ratio conflict**: The `.aspect-[4/3]` Tailwind class already constrains dimensions. Adding explicit width/height may have conflicted with the aspect-ratio constraint.

2. **Image mismatch**: Supabase image natural dimensions (689×600px) vs specified dimensions (800×600px) may cause rescaling operations.

3. **Browser rendering pipeline change**: Adding explicit width/height changes how browsers allocate resources:
   - Instead of calculating from aspect-ratio + CSS classes
   - Browser must reconcile width/height attributes with aspect-ratio constraint
   - This extra validation/calculation adds overhead

4. **TBT increase**: The 32.8% TBT regression suggests main-thread blocking increased significantly, likely from layout recalculations.

### Key Learning

**Width/height attributes are most beneficial when:**
- Image dimensions are unknown to the browser until runtime
- No aspect-ratio CSS is in use
- Browser can use them to pre-allocate layout space

**They are harmful when:**
- Dimensions conflict with CSS constraints (aspect-ratio)
- Actual image dimensions differ from specified dimensions
- The "known dimensions" come too late (still waiting on fetch)

In our case, image URL is not known until 1721ms (fetch complete), so width/height attributes provide no benefit during the critical path.

## Decision

**REVERTED** - This optimization made performance worse and is being rolled back to baseline.

## Next Optimization Attempts

Since adding explicit dimensions didn't help, we need to explore different approaches:

1. **Reduce Supabase query time** - Profile the database query itself
2. **Optimize JavaScript execution** - Identify which specific vendor code blocks the main thread
3. **Investigate image loading strategy** - Check if image download is the bottleneck
4. **Cache improvements** - Current 10-minute TTL may not be sufficient for FCP metric
5. **Code-split decisions** - Review whether vendor chunk contains non-critical code

The fundamental constraint remains: **image URL is dynamic and not known until 1721ms**, making any preload-based optimization ineffective.

---

## PHASE 6 Status Update

✅ PHASE 5 CLS fix validated (remains at 0)
❌ Optimization attempt #1 regressed performance, reverted
⏳ Continue with different approach (TBT root cause analysis recommended)
