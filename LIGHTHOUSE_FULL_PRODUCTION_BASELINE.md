# LIGHTHOUSE FULL PRODUCTION BASELINE

## Executive Summary

A valid Lighthouse baseline was not obtained for the deployed website because the production application fails before first paint in headless Chrome. The root cause is an application bootstrap/runtime failure caused by missing production Supabase environment configuration, not a Lighthouse calibration issue.

The site is reachable over HTTPS and returns HTTP 200, but the browser runtime throws during startup before React can render any DOM content. Because no paint occurs, Lighthouse cannot compute a valid Performance, Accessibility, Best Practices, or SEO score and emits `NO_FCP`.

## Environment

- Production URL: https://oakcherrykraft.netlify.app
- Lighthouse version: 13.4.1
- Chrome executable: C:\Program Files\Google\Chrome\Application\chrome.exe
- Desktop configuration: `--preset=desktop --chrome-flags="--disable-dev-shm-usage --no-sandbox --headless=new"`
- Mobile configuration: not valid in this environment because Lighthouse 13.4.1 accepts only `perf`, `experimental`, and `desktop` as presets

## Diagnostic Findings

### Root cause of the previous NO_FCP

The decisive runtime issue is the Supabase client bootstrap in [src/lib/supabase.ts](src/lib/supabase.ts):

- it reads `import.meta.env.VITE_SUPABASE_URL`
- it reads `import.meta.env.VITE_SUPABASE_ANON_KEY`
- it throws immediately if either value is missing

This fails before the React root can render. The browser error observed in the production page is consistent with this and matches the runtime problem behind `NO_FCP`.

### Evidence

- Production homepage and admin login route respond successfully over HTTPS.
- The browser runtime fails during boot before paint.
- The exception is a direct application startup failure, not a Lighthouse-only issue.
- Because the app never reaches a painted DOM state, Lighthouse cannot complete valid audits.

## Production HTTP verification

### Homepage

- URL: https://oakcherrykraft.netlify.app/
- HTTP status: 200
- Content type: HTML page served successfully
- Final URL: same as requested
- HTML includes standard app entry markup and references to JS/CSS assets

### Admin login route

- URL: https://oakcherrykraft.netlify.app/admin/login
- HTTP status: 200
- Final URL: same as requested
- HTML shell is served, but app boot fails at runtime

## Public Routes

Source inventory from [src/App.tsx](src/App.tsx):

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

| Route | Desktop Performance | Mobile Performance | Accessibility | Best Practices | SEO | Status |
|---|---|---|---|---|---|---|
| / | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /products | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /products/:category | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /products/:category/:slug | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /projects | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /gallery | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /projects/:slug | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /request-quote | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /quote | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /configurator | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /configuration-selector | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /about | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /contact | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /privacy-policy | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /terms | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |
| /* | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | runtime fails before paint |

## Admin Routes

Protected admin routes discovered from [src/App.tsx](src/App.tsx):

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

| Route | Desktop Performance | Mobile Performance | Accessibility | Best Practices | SEO | Status |
|---|---|---|---|---|---|---|
| /admin | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |
| /admin/quotes | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |
| /admin/configurator | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |
| /admin/testimonials | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |
| /admin/contacts | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |
| /admin/products | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |
| /admin/projects | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |
| /admin/analytics | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |
| /admin/settings | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |
| /admin/live-chat | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | N/A | runtime fails before paint |

## Performance Metrics

No valid Core Web Vitals metrics were produced because no page reached first paint. This includes the earlier `NO_FCP` artifact in [lighthouse-production-public-home-desktop.json](lighthouse-production-public-home-desktop.json).

## Accessibility Findings

No valid Lighthouse accessibility audit could be produced because the page never painted.

## Best Practices Findings

No valid Lighthouse Best Practices result could be produced because the page never painted.

## SEO Findings

No valid public-page SEO audit could be produced because the page never painted. The admin routes are private and should be treated as N/A for SEO.

## Network/Runtime Findings

- Production HTML is served successfully.
- App startup fails before render.
- Browser runtime crashes before the root element is populated.
- The application bundle fails due to missing required Supabase environment configuration.
- This is not a Netlify routing or HTML delivery issue; it is a build/runtime environment issue.

## Overall Baseline

- Average public Performance: not available
- Average public Accessibility: not available
- Average public Best Practices: not available
- Average public SEO: not available
- Average admin Performance: not available
- Average admin Accessibility: not available
- Average admin Best Practices: not available

## Critical Findings

1. The site does not render in headless Chrome because app boot fails before paint.
2. The runtime exception is caused by missing production Supabase env variables, which prevents the app from initializing.
3. Lighthouse cannot complete valid audits until the application reaches a paintable state.

## Audit Limitations

The following routes could not be measured:

- all public routes
- all protected admin routes

The reason is consistent across the site: a runtime exception occurs before first paint, resulting in `NO_FCP`.

## Final Safety Check

This audit was read-only. No production source code was modified, no database data was changed, and no authentication or deployment configuration was altered.
