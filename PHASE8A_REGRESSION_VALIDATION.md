# PHASE 8A — REGRESSION VALIDATION REPORT

## 1. Source validation

The reverted production code remains in place in [src/pages/Products.tsx](src/pages/Products.tsx):

```tsx
fetchPriority={index === 0 ? 'high' : 'auto'}
```

This matches the required reverted state. No application code changes were made for this validation step.

## 2. Build verification

Command run:
```bash
npm run build
```

Result: PASS
- TypeScript compiled successfully.
- Vite production build succeeded.
- Output included: `✓ built in 13.21s`

## 3. Lighthouse test configuration

Server validated: http://localhost:4181

Exact configuration used for each of the 3 runs:
```bash
npx lighthouse "http://localhost:4181/products" \
  --output=json \
  --output-path="phase8a-run$i.json" \
  --only-categories=performance \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --throttling-method=simulate \
  --throttling.rttMs=150 \
  --throttling.throughputKbps=400 \
  --throttling.cpuSlowdownMultiplier=4 \
  --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
  --quiet
```

## 4. Three Lighthouse runs

### Run 1
- Performance: 54
- FCP: 6844 ms
- LCP: 12246 ms
- TBT: 232 ms
- CLS: 0.000
- Speed Index: 6844 ms

### Run 2
- Performance: 53
- FCP: 6827 ms
- LCP: 12228 ms
- TBT: 262 ms
- CLS: 0.000
- Speed Index: 6827 ms

### Run 3
- Performance: 56
- FCP: 6829 ms
- LCP: 12235 ms
- TBT: 192 ms
- CLS: 0.000
- Speed Index: 6829 ms

## 5. Median values

Median across the 3 runs:
- Performance: 54
- FCP: 6829 ms
- LCP: 12235 ms
- TBT: 232 ms
- CLS: 0.000
- Speed Index: 6829 ms

## 6. Comparison with Phase 6 baseline

Previous Phase 6 median baseline:
- CLS: 0.000
- LCP: approximately 4019 ms
- TBT: approximately 320 ms

Current reverted code median:
- CLS: 0.000
- LCP: 12235 ms
- TBT: 232 ms

Difference:
- LCP increased by approximately 8.2 seconds
- TBT improved slightly
- CLS remained unchanged at 0.000

## 7. Is the 12-second LCP regression reproducible?

Yes. Under the exact same Phase 8 Lighthouse configuration, the reverted code produces approximately 12-second LCP values across all 3 runs.

This is not a single-run anomaly. The results are stable and consistent:
- 12246 ms
- 12228 ms
- 12235 ms

The measurement is reproducible on the current environment and current reverted code.

## 8. Recommendation

The 12-second LCP reproduction means the previous 4-second baseline is not currently reproducible in this validation environment. Because the code under test remains reverted and the measurement remains consistently poor, this is evidence that the baseline itself has changed or the Lighthouse/server environment is materially different.

Recommendation:
- Do not change application code in this phase.
- Do not reintroduce the fetchPriority="low" change.
- Do not implement another performance optimization until the Lighthouse/server environment is investigated.
- Keep the current reverted state as the measured baseline for this validation branch.

## 9. Evidence-based conclusion

The current reverted code does not return to the earlier ~4-second LCP. Instead, it reproduces the ~12-second LCP pattern across repeated runs. This indicates the earlier 4-second baseline is not stable in the current validation environment, and the measurement requires environment-level investigation before any application optimization is attempted.
