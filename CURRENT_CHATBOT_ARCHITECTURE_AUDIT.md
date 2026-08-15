# Current Chatbot Architecture Audit

## Summary

The Oak Cherry Kraft chatbot is not currently using an external generative AI provider such as OpenAI, Gemini, or Anthropic. The active implementation is a local, rule-based assistant that matches user intent against canned responses and quick actions, with optional handoff to a live human chat flow. The browser does not make direct calls to an AI model provider.

## Current AI provider

Current provider: none / local rule-based assistant

Evidence in the active source:

- [src/components/chatbot/ChatWidget.tsx](src/components/chatbot/ChatWidget.tsx) imports and uses getChatResponse from [src/components/chatbot/chatKnowledge.ts](src/components/chatbot/chatKnowledge.ts)
- [src/components/chatbot/chatKnowledge.ts](src/components/chatbot/chatKnowledge.ts) contains local response logic, pattern matching, action routing, WhatsApp links, phone links, and navigation actions
- There are no active imports of OpenAI, Google AI, or Anthropic SDKs in the app source
- [package.json](package.json) contains no OpenAI, Gemini, or Anthropic client dependency
- [package-lock.json](package-lock.json) contains no direct runtime dependency on openai, @google/genai, or @anthropic-ai/sdk

## Request flow

1. User interacts with the widget in the browser through [src/components/chatbot/ChatWidget.tsx](src/components/chatbot/ChatWidget.tsx)
2. The widget calls the local function getChatResponse from [src/components/chatbot/chatKnowledge.ts](src/components/chatbot/chatKnowledge.ts)
3. That function evaluates the message content against local keyword and intent patterns and returns a canned response plus action links
4. If the user chooses to start live chat, the widget uses the proxy client in [src/lib/liveChatProxyClient.ts](src/lib/liveChatProxyClient.ts)
5. The proxy client sends requests to the configured endpoint in VITE_LIVE_CHAT_PROXY_URL
6. The request reaches the Supabase Edge Function at [supabase/functions/live_chat_proxy/index.ts](supabase/functions/live_chat_proxy/index.ts)
7. The Edge Function manages live chat session creation, validation, message persistence, and SSE events against Supabase tables

This is not an AI model inference path. It is a local assistant plus a server-side session proxy.

## Frontend/backend boundary

Frontend:

- [src/components/chatbot/ChatWidget.tsx](src/components/chatbot/ChatWidget.tsx)
- [src/components/chatbot/chatKnowledge.ts](src/components/chatbot/chatKnowledge.ts)
- [src/lib/liveChatProxyClient.ts](src/lib/liveChatProxyClient.ts)
- [src/lib/supabase.ts](src/lib/supabase.ts)

Backend / server-side:

- [supabase/functions/live_chat_proxy/index.ts](supabase/functions/live_chat_proxy/index.ts)
- Supabase project database tables for live chat sessions and messages

Runtime boundary:

- Browser requests to the live chat proxy endpoint
- No direct browser request to an external AI API endpoint in the active source
- No browser-side model SDK initialization is present

## Required production secrets and config names

Current active env names visible in the source:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_LIVE_CHAT_PROXY_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- ALLOWED_ORIGINS

These are the names that are relevant to the current production architecture. There is no active OpenAI secret variable in use by the current chatbot source.

## Obsolete OpenAI references

Searches of the active repository source did not identify active runtime references to:

- OPENAI_API_KEY
- OpenAI
- api.openai.com
- openai SDK
- Gemini
- Anthropic
- Claude

The live source does not currently instantiate a model client from any external provider.

## Security assessment

- No evidence of active OpenAI usage in the current app code
- No browser-side OpenAI credential exposure in active source files
- No direct AI-provider secret is required for the current chatbot behaviour
- The current runtime architecture is safer and simpler: it uses local conversation logic plus a server-side session/proxy boundary
- The earlier exposed OpenAI key should be treated as historical and already cleaned from reachable branch history, but the original key still needs to be revoked at the provider side if it was not already revoked

## Recommended cleanup

Recommended cleanup scope for the current repo:

- Remove any stale docs or scripts that reference OpenAI-era setup if they are not part of the current architecture
- Remove any unused AI provider package references if they remain in non-source artifacts or old dependency snapshots
- Keep current runtime configuration focused on Supabase and the proxy URL
- Do not remove any still-active Supabase configuration that is needed for the live chat session flow

No code change is required before the current architecture is understood, but a cleanup pass is appropriate once the implementation plan is approved.

## Deployment considerations

Current deployment architecture appears to be:

- Netlify hosts the frontend build from [netlify.toml](netlify.toml)
- Frontend reads VITE_LIVE_CHAT_PROXY_URL to call the Supabase function endpoint
- Supabase Edge Function at [supabase/functions/live_chat_proxy/index.ts](supabase/functions/live_chat_proxy/index.ts) handles session logic and message / event operations
- No OpenAI model is part of the request path in production

This means removing OpenAI configuration would not affect the current chatbot flow, because the chatbot is not invoking OpenAI at runtime.

## Conclusion

The current chatbot is not an AI-model chatbot. It is a rule-based visitor assistant with human handoff support, using a browser frontend plus a Supabase Edge Function for session management and real-time chat flow.

## Files reviewed

- [package.json](package.json)
- [package-lock.json](package-lock.json)
- [netlify.toml](netlify.toml)
- [src/components/chatbot/ChatWidget.tsx](src/components/chatbot/ChatWidget.tsx)
- [src/components/chatbot/chatKnowledge.ts](src/components/chatbot/chatKnowledge.ts)
- [src/lib/liveChatProxyClient.ts](src/lib/liveChatProxyClient.ts)
- [src/lib/supabase.ts](src/lib/supabase.ts)
- [supabase/functions/live_chat_proxy/index.ts](supabase/functions/live_chat_proxy/index.ts)
- src/components/chatbot/ChatWindow.tsx
- src/components/chatbot/ContactForm.tsx

## Short status

- Current AI provider: local rule-based assistant, no external AI model provider
- Server/client boundary: browser frontend calls local chat logic and then the Supabase proxy; no direct AI API call from browser
- OpenAI still required: NO
- OpenAI code still present: NO in active app source
- OpenAI key replacement required: NO
- Current secrets required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_LIVE_CHAT_PROXY_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGINS
- Next implementation step: confirm the exact production config values in the hosting environment and keep the current Supabase proxy architecture as the canonical deployment path
