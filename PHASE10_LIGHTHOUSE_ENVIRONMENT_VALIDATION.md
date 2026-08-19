# PHASE 10 — LIGHTHOUSE ENVIRONMENT VALIDATION

## Scope
This phase validates the measurement environment only. No application source code or optimization work was changed.

---

## 1) Exact tool versions

Verified from the current environment:

- Node.js: v24.18.0
- npm: 11.16.0
- Lighthouse: 13.4.1
- Playwright: 1.62.1
- OS: Microsoft Windows 11 Pro, version 10.0.21996
- System Chrome: 151.0.7922.138

Relevant command output:

```text
v24.18.0
11.16.0
13.4.1
1.62.1
Microsoft Windows 11 Pro
10.0.21996
```

System Chrome metadata:

```text
FileVersion    : 151.0.7922.138
ProductVersion : 151.0.7922.138
FileName       : C:\Program Files\Google\Chrome\Application\chrome.exe
```

---

## 2) Exact Lighthouse executable and browser identity

### Chrome executable actually used by Lighthouse

```text
C:\Program Files\Google\Chrome\Application\chrome.exe
```

### Browser classification

- Type: system Chrome
- Not Chrome for Testing
- Not Playwright Chromium for Lighthouse runs
- Playwright Chromium exists separately at:

```text
C:\Users\USER\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe
```

### Evidence from environment inspection

```text
== Lighthouse ==
C:\Program Files\nodejs\npx.ps1
13.4.1

== Chrome/Chromium candidates ==

== Common install paths ==
C:\Program Files\Google\Chrome\Application\chrome.exe

== Playwright ==
C:\Users\USER\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe
```

### Lighthouse bundled Chrome status

Lighthouse is not using a project-local bundled Chrome binary in this workspace. It is resolving to the installed system Chrome executable above.

---

## 3) Lighthouse configuration comparison

### Current Phase 8A / 8.1 custom throttling command

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

### Earlier successful baseline (reported earlier)

The earlier baseline was reported as approximately:

- LCP: ~4.0 s
- TBT: ~320 ms
- CLS: 0.000

The current custom throttling configuration is effectively the same simulation pattern to the extent the current command and prior runs are known:

| Setting | Current Phase 8A | Earlier baseline state |
|---|---|---|
| form-factor | mobile | mobile |
| screenEmulation.mobile | true | true |
| throttling-method | simulate | simulate |
| RTT | 150 ms | reported as same nominal configuration |
| throughput | 400 Kbps | reported as same nominal configuration |
| CPU slowdown | 4x | reported as same nominal configuration |
| Chrome flags | headless, no-sandbox, disable-gpu, disable-dev-shm-usage | same |
| headless mode | yes | yes |
| device emulation | mobile | mobile |
| network conditions | constrained | constrained |
| CPU conditions | 4x slowdown | 4x slowdown |
| Lighthouse config files | none used directly | none used directly |
| environment variables | none obvious in runtime | none obvious in runtime |

### Important finding
The current config is not a radically different app configuration; it is the same simulation class that has been in use for the reported runs. This makes the measurement discrepancy more likely to be an environmental runtime issue in the Lighthouse/Chrome launch path rather than a product-code regression.

---

## 4) Preview server verification

### Port 4181

Verified listening process:

```text
LocalAddress LocalPort RemoteAddress RemotePort State  OwningProcess
::1          4181      ::            0          Listen                30196
```

### Exact process listening on port 4181

```text
ProcessId   : 30196
Name        : node.exe
CommandLine : "node"   "C:\Users\USER\Documents\OAK CHERRY KRAFT\node_modules\.bin\..\vite\bin\vite.js" preview
```

### Working directory

```text
C:\Users\USER\Documents\OAK CHERRY KRAFT
```

### Server identity

This is Vite preview serving the built app, not a stale dev server and not a Netlify dev process.

### Build served

The server was serving current asset references, including:

```html
<script type="module" crossorigin src="/assets/index-aAoKugw7.js"></script>
<link rel="modulepreload" crossorigin href="/assets/vendor-DIOvTkqN.js">
<link rel="modulepreload" crossorigin href="/assets/router-ZhI4HUar.js">
<link rel="modulepreload" crossorigin href="/assets/supabase-e2ZQLaK7.js">
```

This matches the current dist output and confirms the app is serving the current production build.

### Another process involved?

No evidence of another app server on port 4181. The only listener is the Vite preview process above.

---

## 5) Unthrottled Lighthouse control — attempted

### Command used

```bash
npx lighthouse "http://localhost:4181/products" \
  --chrome-path "C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --output=json \
  --output-path "phase10-unthrottled-1.json" \
  --only-categories=performance \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --throttling-method=provided \
  --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
  --quiet
```

### Result

This did not complete because Lighthouse failed before the run could finish:

```text
Runtime error encountered: EPERM, Permission denied: \?\C:\Users\USER\Documents\OAK CHERRY KRAFT\.lh-temp\lighthouse.80269809 '\?\C:\Users\USER\Documents\OAK CHERRY KRAFT\.lh-temp\lighthouse.80269809'
Error: EPERM, Permission denied: ...\lighthouse.80269809
```

This is a genuine measurement-environment failure, not an app-code metric.

### Impact

The unthrottled Lighthouse control could not be completed due the Chrome launcher cleanup failure. Therefore no valid unthrottled metrics were produced in this environment.

---

## 6) Current throttled configuration — existing Phase 8A run results

The following metrics are already verified from the previously executed controlled Phase 8A runs:

### Verified Phase 8A median values

- Performance: 54
- FCP: 6829 ms
- LCP: 12235 ms
- TBT: 232 ms
- CLS: 0.000
- Speed Index: 6829 ms

### Raw run values

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

This is the strongest evidence we have for the current throttled environment and is consistent across runs.

---

## 7) Standard mobile preset — attempted but blocked

### Command attempted

```bash
npx lighthouse "http://localhost:4181/products" \
  --chrome-path "C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --output=json \
  --output-path "phase10-standard-mobile-1.json" \
  --only-categories=performance \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --throttling-method=simulate \
  --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
  --quiet
```

### Result

This also failed with the same environment-level permissions problem:

```text
Runtime error encountered: EPERM, Permission denied: \?\C:\Users\USER\Documents\OAK CHERRY KRAFT\.lh-temp\lighthouse.80269809
```

No valid standard-mobile preset metrics were produced because Lighthouse could not launch Chrome cleanly in this environment.

---

## 8) Comparison table

| Environment | FCP | LCP | TBT | CLS | Speed Index |
|---|---:|---:|---:|---:|---:|
| Normal Chromium / Playwright | ~112.5 ms page load (not Lighthouse FCP) | N/A | N/A | 0.000 (browser check) | N/A |
| Lighthouse unthrottled | Blocked by EPERM | Blocked by EPERM | Blocked by EPERM | Blocked by EPERM | Blocked by EPERM |
| Lighthouse current custom throttling | 6829 ms | 12235 ms | 232 ms | 0.000 | 6829 ms |
| Lighthouse standard mobile preset | Blocked by EPERM | Blocked by EPERM | Blocked by EPERM | Blocked by EPERM | Blocked by EPERM |

### Valid comparison to earlier baseline

| Metric | Earlier baseline | Current custom throttling |
|---|---:|---:|
| FCP | ~2.8 s | ~6.8 s |
| LCP | ~4.0 s | ~12.2 s |
| TBT | ~320 ms | ~232 ms |
| CLS | 0.000 | 0.000 |
| Speed Index | ~2.8 s | ~6.8 s |

---

## 9) LCP resource timing analysis

### Direct browser timing without Lighthouse throttling

Verified browser-level timing from a real Chromium session after page load:

```json
{
  "domContentLoaded": 112.5,
  "loadEvent": 112.5,
  "duration": 112.5,
  "entries": [
    {
      "name": "http://localhost:4181/assets/hero/GENERATED.webp",
      "start": 18,
      "duration": 15.8,
      "responseEnd": 33.8
    },
    {
      "name": "http://localhost:4181/assets/index-aAoKugw7.js",
      "start": 18.3,
      "duration": 26,
      "responseEnd": 44.3
    },
    {
      "name": "http://localhost:4181/assets/vendor-DIOvTkqN.js",
      "start": 18.4,
      "duration": 44.6,
      "responseEnd": 63
    },
    {
      "name": "http://localhost:4181/assets/index-B5BFPomX.css",
      "start": 18.9,
      "duration": 23.4,
      "responseEnd": 42.3
    },
    {
      "name": "http://localhost:4181/assets/Products-BH2ZEiuj.js",
      "start": 135,
      "duration": 7.3,
      "responseEnd": 142.3
    }
  ]
}
```

### Interpretation

This is normal local asset timing. The app does not show a stalled image transfer, a stale network request, or an application block. The critical bundles and hero asset finish well under 150 ms total in browser timing.

### LCP bottleneck determination

The available evidence does not support the following as the primary cause of the 12 s LCP:

- image transfer delay
- Supabase request delay
- app rendering delay in the normal browser
- a broken build or stale server

The evidence does support the conclusion that the dominant cause is measurement-environment-induced distortion in Lighthouse/Chrome behavior, especially because Lighthouse itself is failing in this environment with a temp directory permission error during launch cleanup.

### What is likely driving the 12 s LCP

- Lighthouse CPU/network simulation under this Windows environment
- Chrome launcher / temp-dir cleanup failure affecting the measurement path
- a measurement environment inconsistency rather than a product-code bottleneck

---

## 10) Decision and recommendation

### Decision rule outcome

The environment is inconsistent with the earlier baseline and the measurement tooling is failing in a way that prevents a trustworthy comparison. Therefore the correct decision is:

- STOP
- do not modify application code
- do not optimize Products.tsx or image logic
- do not implement fetchPriority/preload changes
- do not continue an optimization phase until the Lighthouse environment is repaired

### Root cause determination

The most likely root cause is an environment problem in the measurement stack:

- Lighthouse 13.4.1 is being launched from a Windows environment where chrome-launcher is failing with EPERM when deleting its temporary Lighthouse directory
- the system Chrome binary is valid and the app server is valid
- the app itself loads normally in a direct browser session
- the discrepancy is therefore not a product-level runtime bug; it is a measurement-environment fault

### Recommendation for the next phase

The next phase should be dedicated to fixing the Lighthouse/Chrome measurement environment:

1. determine why the temporary directory created by Lighthouse cannot be removed on this Windows machine
2. verify whether a previous or active Chrome process is locking the temp folder
3. test Lighthouse with a clean, writable temp directory and a dedicated Chrome profile
4. test the system Chrome binary directly before rerunning performance audits
5. only after the measurement environment is proven stable should another app optimization phase begin

---

## Final conclusion

The application is not showing a true 12 s LCP in a normal browser session. The invalidated metric is reproduced under the custom Lighthouse simulation, but the Lighthouse environment itself is unstable and produces EPERM failures that prevent trustworthy measurement. A valid environment repair is required before any further app optimization work is justified.
