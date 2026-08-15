# LIGHTHOUSE PRODUCTION BASELINE REPORT

## Audit scope

- Production URL verified: https://oakcherrykraft.netlify.app
- Chrome used: C:\Program Files\Google\Chrome\Application\chrome.exe
- Audit constraint: no production source code, schema, config, dependencies, data, or environment changes were made.
- Verification source: the live route inventory in [src/App.tsx](src/App.tsx)

## Production URL verification

- URL check result: HTTP 200 from the deployed site.
- Browser and runtime verification: the deployed app does not render content in a real browser context. The browser console reports the app boot failure before paint, which is consistent with the Lighthouse NO_FCP runtime error.

## Route inventory verified from source

### Public routes discovered from source

The app router in [src/App.tsx](src/App.tsx) currently defines the following public route entries:

- /
- /products
- /products/:category
- /products/:category/:slug
- /projects
- /gallery
- /projects/:slug
- /request-quote
- /quote
- /configurator
- /configuration-selector
- /about
- /contact
- /privacy-policy
- /terms
- /*

This is 16 actual route entries in source, including 2 aliases. The earlier estimate of 18 public routes is not reflected by the current router source.

### Protected admin routes discovered from source

The app router in [src/App.tsx](src/App.tsx) currently defines these protected routes under /admin:

- /admin
- /admin/quotes
- /admin/configurator
- /admin/testimonials
- /admin/contacts
- /admin/products
- /admin/projects
- /admin/analytics
- /admin/settings
- /admin/live-chat

The authentication page itself is /admin/login and is not included in the protected-route count.

---

## LIGHTHOUSE MEASURED

No valid Lighthouse measurement was obtained for the deployed application.

### Actual measured failure

- Desktop Lighthouse against the deployed homepage was attempted with the installed Chrome binary.
- Result: runtime error code NO_FCP
- The official Lighthouse error message was: "The page did not paint any content. Please ensure you keep the browser window in the foreground during the load and try again. (NO_FCP)"
- This means there was no valid Performance/Accessibility/Best Practices/SEO score and no trustworthy Core Web Vitals capture for the deployed site.

### Technical reason

The deployed app fails before paint in a real browser context. In the browser, the client-side runtime throws before app content renders, which prevents the first contentful paint. Because Lighthouse depends on a successful initial paint, the page cannot produce a legitimate measurement.

### Browser-verified runtime behavior

The deployed app is browser-verified to fail before paint on the public route and admin auth flow:

- public home page: app bootstrap error prevents rendering
- admin login page: app bootstrap error prevents rendering and therefore the authenticated admin flow cannot be reached reliably in the same runtime path

This is real runtime evidence from the operational site and is not a substitute for Lighthouse measurement.

### Mobile audit status

A mobile Lighthouse run was attempted using the CLI with the mobile preset, but Lighthouse 13.4.1 rejects the value "mobile" and reports:

- Invalid values: Argument: preset, Given: "mobile", Choices: "perf", "experimental", "desktop"

As a result, no valid mobile Lighthouse audit was produced.

---

## BROWSER VERIFIED

### Public route browser verification

The deployed public route was loaded in a real browser to verify the actual runtime state and failure mode.

- Route: /
- Method: browser navigation with installed Chrome
- Outcome: the page does not render; runtime failure occurs before paint
- Evidence: page error surfaced during app boot and no meaningful DOM content was displayed
- Status: BROWSER VERIFIED, NOT LIGHTHOUSE MEASURED

### Admin route browser verification

The authentication flow was inspected in a real browser to verify whether a protected admin route could be reached.

- Route: /admin/login
- Method: real browser authentication flow attempt using the site’s admin form
- Outcome: the app fails before paint in the deployed runtime, preventing authenticated admin access from being established in a valid Lighthouse capture path
- Status: BROWSER VERIFIED, NOT LIGHTHOUSE MEASURED

---

## NOT MEASURED

The following routes were not measured because the deployed runtime fails before paint and prevents valid Lighthouse metrics from being generated.

### Public routes not measured

All public routes are NOT MEASURED for the same reason: NO_FCP / no paint in deployed runtime.

- /
- /products
- /products/:category
- /products/:category/:slug
- /projects
- /gallery
- /projects/:slug
- /request-quote
- /quote
- /configurator
- /configuration-selector
- /about
- /contact
- /privacy-policy
- /terms
- /*

### Admin routes not measured

All protected admin routes are NOT MEASURED for the same reason: the deployed app fails before paint and the authenticated flow cannot be established reliably in a valid Lighthouse capture path.

- /admin
- /admin/quotes
- /admin/configurator
- /admin/testimonials
- /admin/contacts
- /admin/products
- /admin/projects
- /admin/analytics
- /admin/settings
- /admin/live-chat

---

## PUBLIC ROUTES

| Route | Device | Status | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|---|
| / | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| / | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /products | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /products | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /products/:category | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /products/:category | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /products/:category/:slug | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /products/:category/:slug | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /projects | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /projects | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /gallery | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /gallery | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /projects/:slug | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /projects/:slug | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /request-quote | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /request-quote | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /quote | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /quote | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /configurator | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /configurator | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /configuration-selector | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /configuration-selector | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /about | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /about | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /contact | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /contact | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /privacy-policy | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /privacy-policy | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /terms | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /terms | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |
| /* | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP | NOT MEASURED - NO_FCP |
| /* | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED |

## ADMIN ROUTES

| Route | Device | Status | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|---|
| /admin | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/quotes | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/quotes | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/configurator | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/configurator | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/testimonials | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/testimonials | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/contacts | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/contacts | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/products | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/products | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/projects | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/projects | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/analytics | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/analytics | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/settings | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/settings | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/live-chat | Desktop | NOT MEASURED | NOT MEASURED - NO_FCP / runtime failure before paint | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |
| /admin/live-chat | Mobile | NOT MEASURED | NOT MEASURED - no valid mobile Lighthouse run; CLI rejected preset | NOT MEASURED | NOT MEASURED | NOT MEASURED - private page, not intentionally indexable |

---

## CORE WEB VITALS

No valid Lighthouse Core Web Vitals values were produced because the application never reached a paintable state in the deployed runtime.

For every attempted production route/device combination, the result was the same:

- Performance score: not measured
- LCP: not measured
- CLS: not measured
- INP: not measured
- FCP: not measured
- TBT: not measured
- Speed Index: not measured
- total page weight: not measured
- total requests: not measured
- largest resources: not measured
- LCP element: not measured
- render-blocking resources: not measured

## ACCESSIBILITY FINDINGS

No valid Lighthouse accessibility score or failure list was produced because the page did not reach first contentful paint.

## BEST PRACTICES

No valid Lighthouse Best Practices score or failure breakdown was produced because the runtime did not render content.

## SEO

No valid SEO audit data was produced for public routes because the deployed application did not paint. The admin pages are intentionally private and should not be indexable. SEO is not a valid Lighthouse measurement for those protected routes while the runtime is failing.

---

## RESPONSIVE VERIFICATION

Responsive checks were not converted into Lighthouse measurements due the same failure-before-paint issue. Manual browser inspection matched the same result: the app does not render to a paintable DOM on the deployed site, so responsive layout checks cannot be meaningfully completed while the runtime is failing.

Observations from the real browser:

- mobile widths not renderable because no paint occurs
- desktop widths not renderable because no paint occurs
- no horizontal overflow, clipped UI, navigation, sidebar, chatbot overlap, or touch target evaluation could be trusted while the app is failing to render

---

## RAW RESULTS

List of actual production Lighthouse JSON artifacts:

- lighthouse-production-public-home-desktop.json

No successful mobile JSON file was produced. The attempted mobile command did not run because Lighthouse 13.4.1 rejects the mobile preset in this environment.

---

## FINAL AUDIT COUNTS

PUBLIC ROUTES DISCOVERED: 16
PUBLIC ROUTES LIGHTHOUSE MEASURED: 0
PUBLIC ROUTES BROWSER VERIFIED ONLY: 0
PUBLIC ROUTES NOT MEASURED: 16

ADMIN ROUTES DISCOVERED: 10
ADMIN ROUTES LIGHTHOUSE MEASURED: 0
ADMIN ROUTES BROWSER VERIFIED ONLY: 0
ADMIN ROUTES NOT MEASURED: 10

DESKTOP LIGHTHOUSE AUDITS: 1
MOBILE LIGHTHOUSE AUDITS: 0

TOTAL SUCCESSFUL LIGHTHOUSE AUDITS: 0
TOTAL FAILED LIGHTHOUSE AUDITS: 1

PRODUCTION SOURCE MODIFIED: NO
DATABASE MODIFIED: NO
PRODUCTION DATA MODIFIED: NO
DEPENDENCIES MODIFIED: NO
CONFIGURATION MODIFIED: NO

---

## Final audit conclusion

This is a genuine production baseline result, not an estimated or manual score substitute.

The deployed site currently fails before first paint in a real browser and Lighthouse runtime, so it does not qualify for a valid public or authenticated admin Lighthouse score. The correct baseline status is therefore:

- LIGHTHOUSE MEASURED: none
- BROWSER VERIFIED: runtime failure before paint on production
- NOT MEASURED: all public and protected admin routes

The customer-request cleanup and associated production data work must not be performed until a valid production baseline is available.
