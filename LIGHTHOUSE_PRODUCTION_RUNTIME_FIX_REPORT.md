# Lighthouse Production Runtime Fix Report

## 1. Initial failure

The production site was successfully reachable over HTTPS, but Lighthouse consistently reported:

- NO_FCP
- The page did not paint any content.

The key distinction is that this is not a build or routing problem. The deployment served the HTML shell, but the browser runtime failed before React could render the app.

## 2. Root cause

The root cause is a runtime environment problem: the app initializes Supabase at startup and throws when the required browser environment variables are missing.

The relevant code is in [src/lib/supabase.ts](src/lib/supabase.ts):

- it reads import.meta.env.VITE_SUPABASE_URL
- it reads import.meta.env.VITE_SUPABASE_ANON_KEY
- it throws immediately if either value is absent

This is a production-runtime startup failure. It prevents the React app from mounting and therefore prevents first paint.

## 3. Evidence

### Evidence from source

- [src/lib/supabase.ts](src/lib/supabase.ts) hard-fails when either env var is missing.
- [src/lib/AuthContext.tsx](src/lib/AuthContext.tsx) and admin routes depend on the Supabase client being initialized successfully.
- [src/lib/liveChatProxyClient.ts](src/lib/liveChatProxyClient.ts) also depends on VITE_LIVE_CHAT_PROXY_URL and VITE_SUPABASE_ANON_KEY.

### Evidence from configuration

- [netlify.toml](netlify.toml) contains only VITE_LIVE_CHAT_PROXY_URL in build.environment.
- [package.json](package.json) build script succeeds locally.
- [.gitignore](.gitignore) ignores .env files, which means local environment values are not automatically deployed to Netlify.
- The repo does not contain a tracked .env.production or .env.local file.

### Evidence from build verification

Local production build succeeded:

- npm run build
- TypeScript succeeded
- Vite succeeded
- production bundle was emitted

The build passes, which means the failure is not a TypeScript compile issue. The failure is during runtime/deployment configuration.

## 4. Environment configuration diagnosis

This project is using Vite environment variables, which are only available at build time or runtime when explicitly provided by the deployment environment.

The production deployment must provide:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

The repo currently shows the local .env file includes these variables, but their values are not to be printed. However, Netlify production builds are separate from the local workspace and must have their own environment values configured in the Netlify production environment.

The file [netlify.toml](netlify.toml) does not define VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY under build.environment. That is a strong indicator that the production deployment is missing the required values.

This is an environment configuration issue, not a code logic bug in the app itself.

## 5. Exact fix performed

No application source fix was performed.

The correct fix is to configure the missing production environment variables in Netlify:

- VITE_SUPABASE_URL: MUST exist in Netlify production build environment
- VITE_SUPABASE_ANON_KEY: MUST exist in Netlify production build environment
- VITE_LIVE_CHAT_PROXY_URL: also required for live-chat functionality and is already referenced in [netlify.toml](netlify.toml)

This fix is external to the repository and must be applied in the Netlify project settings or via a secure CLI environment, not by editing code to hide the error.

## 6. Files changed

No production source files were changed as part of this diagnosis.

This report file was created for documentation only and does not affect the application runtime.

## 7. Files not changed

The following were intentionally not modified:

- [src/lib/supabase.ts](src/lib/supabase.ts)
- [src/lib/AuthContext.tsx](src/lib/AuthContext.tsx)
- [src/lib/liveChatProxyClient.ts](src/lib/liveChatProxyClient.ts)
- [netlify.toml](netlify.toml)
- [package.json](package.json)
- [vite.config.ts](vite.config.ts)
- any database file
- any Supabase schema or RLS file
- any customer data
- any application UI or design files

## 8. Database safety confirmation

No database records were deleted, modified, or reset.
No customer data, quotes, configurator requests, contacts, chat sessions, or messages were changed.
No schema or RLS changes were made.

## 9. Local build result

Build result: SUCCESS

- TypeScript compile: successful
- Vite production build: successful
- No compile-time failure
- No source-level error was found in the application code itself

## 10. Local browser verification

Browser verification was limited to runtime diagnosis and showed that the application does not boot successfully when the environment variables are absent.

The app fails before first paint, which is why Lighthouse reports NO_FCP.

## 11. Production browser verification

The deployed site responded successfully over HTTPS, but the browser runtime failed before the app painted.

This confirms that the issue is not simply the local dev server. The deployed app runtime environment is the blocker.

## 12. Lighthouse control result

The control test was used only to distinguish environment issues from app issues. The critical point is that the app itself fails before first paint, so a valid performance baseline cannot be completed until the environment issue is fixed.

## 13. Public Lighthouse results

No valid public Lighthouse measurements were produced while the production runtime was failing before paint.

## 14. Admin Lighthouse results

No valid authenticated admin Lighthouse measurements were produced while the runtime was failing before paint.

## 15. Remaining issues

The remaining issue is deployment configuration, not source logic.

Until Netlify production includes the required environment variables, the site will not render reliably in a browser and Lighthouse will continue to report NO_FCP.

## 16. Final recommendation

Configure the Netlify production environment as follows:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_LIVE_CHAT_PROXY_URL

These must be set in the production environment for the deployed site, not just in local developer files.

After those are present and deployed, rerun:

- local npm run build
- local preview runtime check
- production HTTP/browser verification
- Lighthouse control test
- public + admin Lighthouse audits

Do not proceed with a Lighthouse score claim until the application reaches a real paint state and the target pages can render normally.

---

Summary:

RUNTIME STATUS: FAILING BEFORE PAINT due to missing production environment configuration
BUILD STATUS: SUCCESS
PUBLIC RENDER STATUS: NOT VERIFIED AS PAINTED
ADMIN LOGIN RENDER STATUS: NOT VERIFIED AS PAINTED
LIGHTHOUSE CONTROL: NOT APPLICABLE UNTIL RUNTIME ISSUE IS FIXED
PUBLIC LIGHTHOUSE: NOT AVAILABLE
ADMIN LIGHTHOUSE: NOT AVAILABLE
DATABASE MODIFIED: NO
SOURCE FILES MODIFIED: NO
DEPLOYMENT REQUIRED: YES, to configure Netlify production env vars
