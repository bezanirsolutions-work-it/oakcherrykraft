# PHASE 8: LOW-RISK IMAGE PRIORITY OPTIMIZATION REPORT

## 1. Exact code change

File: src/pages/Products.tsx

Original:
```tsx
<img
  src={displayImage}
  alt={product.name ?? ''}
  loading={index === 0 ? 'eager' : 'lazy'}
  fetchPriority={index === 0 ? 'high' : 'auto'}
  decoding="async"
  className="h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105"
/>
```

Targeted change:
```tsx
<img
  src={displayImage}
  alt={product.name ?? ''}
  loading={index === 0 ? 'eager' : 'lazy'}
  fetchPriority={index === 0 ? 'high' : 'low'}
  decoding="async"
  className="h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105"
/>
```

This was implemented and then immediately reverted after controlled testing because it materially regressed the measured route performance.

## 2. Build result

Command run:
```bash
npm run build
```

Result: PASS
- TypeScript compilation succeeded.
- Vite production build succeeded.
- Output: `✓ built in 13.19s`

## 3. Three Lighthouse runs

The same mobile simulation profile used for the earlier baseline was applied three times to `/products`.

### Run 1
- Performance: 55
- FCP: 6848 ms
- LCP: 12201 ms
- TBT: 222 ms
- CLS: 0.000
- Speed Index: 6848 ms

### Run 2
- Performance: 54
- FCP: 6819 ms
- LCP: 12196 ms
- TBT: 254 ms
- CLS: 0.000
- Speed Index: 6819 ms

### Run 3
- Performance: 53
- FCP: 6878 ms
- LCP: 12283 ms
- TBT: 261 ms
- CLS: 0.000
- Speed Index: 6878 ms

## 4. Median metrics

Median across the 3 runs:
- Performance: 54
- FCP: 6848 ms
- LCP: 12201 ms
- TBT: 254 ms
- CLS: 0.000
- Speed Index: 6848 ms

## 5. Comparison against baseline

Established baseline (from earlier phase, median of 3 runs):
- CLS = 0.000
- LCP ≈ 4019 ms
- TBT ≈ 320 ms

Measured post-change median:
- CLS = 0.000
- LCP = 12201 ms
- TBT = 254 ms

Difference:
- LCP change: +8,182 ms (approximately 203% worse)
- TBT change: -66 ms (better by about 21%)
- CLS: unchanged at 0.000

## 6. Keep or revert decision

Decision: REVERTED

Rationale:
- The control test materially regressed LCP.
- The result is not a neutral change; it is a clear regression.
- The decision rule requires immediate revert if LCP materially regresses.
- CLS remained at 0.000, which is acceptable, but the LCP regression is not acceptable.

## 7. Evidence-based conclusion

This low-risk image-priority change was not beneficial in measured testing.

The route was not improved under the same Lighthouse conditions as the original baseline. The measured median LCP jumped from roughly 4.0s to roughly 12.2s, which is a severe regression.

The evidence does not support keeping this optimization. The original fetchPriority behavior (`auto` for non-first images) remained the stable, measured baseline and was restored.

## 8. Unsupported claims

No unsupported claim is made about expected gains. The measured result was used as the deciding factor, and the optimization was reverted because the actual data showed a material LCP regression.

---

## Final decision

- Files changed: src/pages/Products.tsx
- Build status: PASS
- Lighthouse results: three controlled runs show major LCP regression with CLS unchanged at 0.000
- Median comparison: LCP worsened from ~4019 ms to ~12201 ms; TBT improved slightly but not enough to justify the LCP impact
- Keep/revert: REVERTED
- Next optimization: No further optimization should be considered without explicit approval and a new evidence-driven test plan.
