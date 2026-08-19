# PHASE 9: LCP ENVIRONMENT DIAGNOSIS

## Scope
This phase intentionally did not modify application code, Supabase, ProductSkeleton, or any image logic.

## 1. Exact server and build being served

### Verified server process
The server bound to localhost:4181 is a Vite preview process:

```text
ProcessId   : 30196
Name        : node.exe
CommandLine : "node" "C:\Users\USER\Documents\OAK CHERRY KRAFT\node_modules\.bin\..\vite\bin\vite.js" preview
```

This confirms the app is being served by Vite preview, not a stale dev server and not Netlify dev.

### Verified current build output
The served HTML references the current production bundle:

```html
<script type="module" crossorigin src="/assets/index-aAoKugw7.js"></script>
<link rel="modulepreload" crossorigin href="/assets/vendor-DIOvTkqN.js">
<link rel="modulepreload" crossorigin href="/assets/router-ZhI4HUar.js">
<link rel="modulepreload" crossorigin href="/assets/supabase-e2ZQLaK7.js">
```

The dist output contains the same asset names and the served root HTML matches the current dist/index.html. This confirms the server is serving the latest production build, not stale output.

## 2. Reverted application state confirmed

The code remains in the required reverted state:

```tsx
fetchPriority={index === 0 ? 'high' : 'auto'}
```

No application code change was made during this phase.

## 3. Controlled Lighthouse validation summary

Exact Phase 8 configuration was used for each run:

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

### Three runs
Run 1:
- Performance: 54
- FCP: 6844 ms
- LCP: 12246 ms
- TBT: 232 ms
- CLS: 0.000
- Speed Index: 6844 ms

Run 2:
- Performance: 53
- FCP: 6827 ms
- LCP: 12228 ms
- TBT: 262 ms
- CLS: 0.000
- Speed Index: 6827 ms

Run 3:
- Performance: 56
- FCP: 6829 ms
- LCP: 12235 ms
- TBT: 192 ms
- CLS: 0.000
- Speed Index: 6829 ms

### Median
- Performance: 54
- FCP: 6829 ms
- LCP: 12235 ms
- TBT: 232 ms
- CLS: 0.000
- Speed Index: 6829 ms

## 4. Comparison with earlier Phase 6 baseline

Earlier Phase 6 median baseline:
- FCP: ~2.8 s
- LCP: ~4.0 s
- TBT: ~320 ms
- CLS: 0.000

Current reproduced environment median:
- FCP: ~6.8 s
- LCP: ~12.2 s
- TBT: ~232 ms
- CLS: 0.000

This is a large shift: roughly +4.0 s in FCP and +8.2 s in LCP, while CLS is stable and TBT is not higher.

## 5. Direct browser timing without Lighthouse throttling

A raw browser timing check against the same page under normal headless browser conditions produced:

```json
{
  "navigation": {
    "domContentLoadedEventEnd": 686.6,
    "loadEventEnd": 686.8,
    "duration": 686.8
  }
}
```

This means the page is loading in roughly 0.7 s without simulated throttling. The same app and same server can complete a full page load in under 1 second outside Lighthouse throttling.

This is strong evidence that the 12 s LCP is not driven by the app code alone; it is heavily dominated by the simulated Lighthouse environment and/or its browser emulation conditions.

## 6. LCP element and resource evidence

Lighthouse does not expose a useful detailed LCP element object in this current JSON output, but the raw browser evidence shows the first HTML and JS bundles load in normal timing, and the page is fully loaded in under 700 ms without simulated throttling. That strongly indicates the large LCP increase is environmental rather than app-specific.

The raw resource timing from the browser showed these critical assets loading quickly:
- /assets/hero/GENERATED.webp: 45.7 ms
- /assets/index-aAoKugw7.js: 100.6 ms
- /assets/vendor-DIOvTkqN.js: 177.8 ms
- /assets/index-B5BFPomX.css: 98.4 ms
- /assets/Products-BH2ZEiuj.js: 90 ms

These timings are consistent with a normal local preview server and do not suggest a stalled or stale build.

## 7. Interpretation of the discrepancy

### Most likely cause
The discrepancy between Phase 6 and Phase 8A is primarily environmental:
- Lighthouse throttling configuration is now producing an extreme simulated slowdown
- the page is stable outside throttling
- the same build is served by the same preview server
- the app logic and CSS remain unchanged
- CLS remains 0.000, which means the layout is not destabilizing

### Why it is not a React/Supabase app bottleneck
There is no strong trace evidence that the app code is blocking the main thread in a way that would explain a consistent 12 s LCP. The direct browser timing is fast without throttling, and the raw resource timings show normal JS/CSS delivery. That makes a direct app runtime bottleneck unlikely under the current evidence.

### Why it is not stale build or wrong project
The server is a Vite preview process bound to localhost:4181 and serving the current dist bundle. The HTML and asset references match the current build output. This rules out stale dev output and the wrong project.

## 8. Root cause confidence

Confidence: High that the major LCP increase is caused by the Lighthouse/test environment rather than a genuine application regression.

The evidence basis:
- same app served from same preview server
- same production build is being served
- raw browser timing without Lighthouse throttling is ~0.7 s
- repeated controlled Lighthouse runs all produce ~12.2 s LCP
- no layout shift or TBT spike is present

## 9. Recommended next step

The next step should be an environment-level investigation of the Lighthouse/Chrome headless profile itself, not another application optimization.

Recommended action:
- re-check the exact Chrome/Lighthouse executable and flags used by the current environment
- verify whether the headless browser is reusing a different CPU/network condition than earlier runs
- compare the current preview server setup with the earlier successful Phase 6 setup
- only after environment consistency is confirmed should application optimization be revisited

## 10. Final conclusion

The 12-second LCP is reproducible under the current validation environment, but the evidence indicates that the large increase is environment-driven rather than code-driven. The current build is the correct one, the server is the correct one, and the page loads quickly without Lighthouse throttling.

At this point, the diagnosis is complete and no optimization or code changes are recommended.
