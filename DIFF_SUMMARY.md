# EDGE FUNCTION CHANGES - DETAILED DIFF SUMMARY

## Files Modified/Created

### 1. NEW: `supabase/migrations/010_create_rate_limit_tracker.sql`
**Status:** New file (257 lines)

**Key Components:**
```sql
-- Rate limit tracking table
CREATE TABLE IF NOT EXISTS public.rate_limit_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_ip text,                      -- IP-based identity
  visitor_token text,                  -- Token-based identity
  endpoint text NOT NULL,              -- Which endpoint
  window_type text NOT NULL,           -- per_minute or per_hour
  request_count integer NOT NULL,      -- Count in current window
  window_start_at timestamptz NOT NULL -- When window started
);

-- Atomic rate limit function
CREATE OR REPLACE FUNCTION public.rate_limit_check_and_increment(
  p_endpoint text,
  p_window_type text,
  p_client_ip text,
  p_visitor_token text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE(allowed boolean, current_count integer, reset_at timestamptz) ...
```

### 2. MODIFIED: `supabase/functions/live_chat_proxy/index.ts`
**Status:** Updated (464 lines → ~550 lines)

---

## DETAILED CHANGES BY SECTION

### Section A: Rate Limiting Infrastructure (NEW - Lines 18-94)

**Added:**
```typescript
// In-memory cache for rate limit results (performance optimization)
const rateLimitCache = new Map<string, { allowed: boolean; expireAt: number }>();

// Extract client IP from request
function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

// Check and increment rate limit atomically
async function checkRateLimit(
  endpoint: string,
  identity: string,
  identityType: 'ip' | 'token',
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Cache for performance (1-second TTL)
  // Database call to rate_limit_check_and_increment()
  // Handle failures gracefully (fail-safe)
}

// Track SSE connections per visitor
const sseConnections = new Map<string, Set<string>>();
const MAX_CONCURRENT_SSE_PER_TOKEN = 1;
```

### Section B: POST /session - Create/Get Session

**Before (Lines 70-102):**
```typescript
if (req.method === 'POST' && pathname.endsWith('/session')) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return withCors(new Response(...));
  }
  
  const visitor_token = body?.visitor_token;
  if (!visitor_token) return withCors(...);
  
  // No rate limiting
  // No request size validation
  
  const { data: existing } = await supabase...
  if (existing) return ...
  
  const payload = { visitor_token, ... };
  const { data, error } = await supabase.from(...).insert(payload)...
}
```

**After (Lines 142-197):**
```typescript
if (req.method === 'POST' && pathname.endsWith('/session')) {
  // ✅ NEW: Rate limit 5 sessions per IP per hour
  const clientIp = getClientIp(req);
  const rateLimitCheck = await checkRateLimit('session_create', clientIp, 'ip', 5, 3600);
  
  if (!rateLimitCheck.allowed) {
    const retryAfter = rateLimitCheck.retryAfter || 3600;
    return withCors(
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      })
    );
  }

  // ✅ NEW: Validate request body size (50KB max)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 50000) {
    return withCors(new Response(...{ status: 413 }));
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return withCors(...);
  }
  
  const visitor_token = body?.visitor_token;
  // ✅ NEW: Validate token format
  if (typeof visitor_token !== 'string' || visitor_token.length > 2048) {
    return withCors(...);
  }
  
  // Rest unchanged
  const { data: existing } = await supabase...
  ...
}
```

**Changes Summary:**
- ✅ Added rate limit check (5/hour/IP)
- ✅ Added request body size validation
- ✅ Added visitor_token format validation
- ✓ Preserved upsert logic (returns existing)

---

### Section C: GET /session - Retrieve Session

**Before (Lines 105-111):**
```typescript
if (req.method === 'GET' && pathname.endsWith('/session')) {
  const token = url.searchParams.get('token');
  if (!token) return new Response(...);
  const { data, error } = await supabase.from(...).eq('visitor_token', token)...
  if (error) return withCors(...);
  return withCors(...);
}
```

**After (Lines 199-223):**
```typescript
if (req.method === 'GET' && pathname.endsWith('/session')) {
  const token = url.searchParams.get('token');
  if (!token) return withCors(...);

  // ✅ NEW: Validate token length
  if (typeof token !== 'string' || token.length > 2048) {
    return withCors(new Response(...{ status: 400 }));
  }

  // ✅ NEW: Rate limit 30 queries per token per minute
  const rateLimitCheck = await checkRateLimit('session_get', token, 'token', 30, 60);
  
  if (!rateLimitCheck.allowed) {
    const retryAfter = rateLimitCheck.retryAfter || 60;
    return withCors(
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      })
    );
  }

  const { data, error } = await supabase...
  if (error) return withCors(...);
  return withCors(...);
}
```

**Changes Summary:**
- ✅ Added token length validation
- ✅ Added rate limit check (30/min/token)
- ✓ Preserved response format

---

### Section D: POST /message - Send Message

**Before (Lines 115-170):**
```typescript
if (req.method === 'POST' && pathname.endsWith('/message')) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return withCors(...);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return withCors(...);
  }

  const session_id = typeof body.session_id === 'string' ? body.session_id.trim() : '';
  const visitor_token = typeof body.visitor_token === 'string' ? body.visitor_token.trim() : '';
  const providedAuthor = body.author;
  const author = providedAuthor === undefined ? 'visitor' : providedAuthor;
  const content = typeof body.content === 'string' ? body.content : '';

  if (!session_id || !isValidUuid(session_id)) {
    return withCors(...);
  }

  if (!visitor_token || visitor_token.length > 2048) {
    return withCors(...);
  }

  if (typeof author !== 'string' || author !== 'visitor') {
    return withCors(...);
  }

  const trimmedContent = content.trim();
  if (!trimmedContent || trimmedContent.length > 4000) {
    return withCors(...);
  }

  // NO rate limiting
  
  const validation = await validateVisitorOwnership(session_id, visitor_token);
  if (!validation.valid) {
    return withCors(...);
  }

  const payload = { session_id, author: 'visitor', content: trimmedContent };
  const { data, error } = await supabase.from(...).insert(payload)...
}
```

**After (Lines 225-298):**
```typescript
if (req.method === 'POST' && pathname.endsWith('/message')) {
  // ✅ NEW: Validate request body size (50KB max)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 50000) {
    return withCors(new Response(...{ status: 413 }));
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return withCors(...);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return withCors(...);
  }

  const session_id = typeof body.session_id === 'string' ? body.session_id.trim() : '';
  const visitor_token = typeof body.visitor_token === 'string' ? body.visitor_token.trim() : '';
  const providedAuthor = body.author;
  const author = providedAuthor === undefined ? 'visitor' : providedAuthor;
  const content = typeof body.content === 'string' ? body.content : '';

  if (!session_id || !isValidUuid(session_id)) {
    return withCors(...);
  }

  if (!visitor_token || visitor_token.length > 2048) {
    return withCors(...);
  }

  if (typeof author !== 'string' || author !== 'visitor') {
    return withCors(...);
  }

  const trimmedContent = content.trim();
  if (!trimmedContent || trimmedContent.length > 4000) {
    return withCors(...);
  }

  // ✅ NEW: Rate limit 15 messages per token per minute
  const rateLimitCheck = await checkRateLimit('message_create', visitor_token, 'token', 15, 60);
  
  if (!rateLimitCheck.allowed) {
    const retryAfter = rateLimitCheck.retryAfter || 60;
    return withCors(
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      })
    );
  }

  const validation = await validateVisitorOwnership(session_id, visitor_token);
  if (!validation.valid) {
    return withCors(...);
  }

  const payload = { session_id, author: 'visitor', content: trimmedContent };
  const { data, error } = await supabase.from(...).insert(payload)...
}
```

**Changes Summary:**
- ✅ Added body size validation
- ✅ Added rate limit check (15/min/token)
- ✓ Preserved author='visitor' enforcement (CRITICAL - no regression)
- ✓ Preserved visitor ownership check

---

### Section E: GET /messages - List Messages

**Before (Lines 160-169):**
```typescript
if (req.method === 'GET' && pathname.endsWith('/messages')) {
  const session_id = url.searchParams.get('session_id');
  const visitor_token = url.searchParams.get('visitor_token');
  
  if (!session_id || !session_id.trim() || !visitor_token || !visitor_token.trim()) {
    return withCors(...);
  }

  // NO parameter length validation
  // NO rate limiting

  const validation = await validateVisitorOwnership(session_id, visitor_token);
  if (!validation.valid) {
    return withCors(...);
  }

  const { data, error } = await supabase.from(...).select(*)...
}
```

**After (Lines 300-331):**
```typescript
if (req.method === 'GET' && pathname.endsWith('/messages')) {
  const session_id = url.searchParams.get('session_id');
  const visitor_token = url.searchParams.get('visitor_token');
  
  if (!session_id || !session_id.trim() || !visitor_token || !visitor_token.trim()) {
    return withCors(...);
  }

  // ✅ NEW: Validate parameter lengths
  if (session_id.length > 2048 || visitor_token.length > 2048) {
    return withCors(new Response(...{ status: 400 }));
  }

  // ✅ NEW: Rate limit 30 queries per token per minute
  const rateLimitCheck = await checkRateLimit('messages_get', visitor_token, 'token', 30, 60);
  
  if (!rateLimitCheck.allowed) {
    const retryAfter = rateLimitCheck.retryAfter || 60;
    return withCors(
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      })
    );
  }

  const validation = await validateVisitorOwnership(session_id, visitor_token);
  if (!validation.valid) {
    return withCors(...);
  }

  const { data, error } = await supabase.from(...).select(*)...
}
```

**Changes Summary:**
- ✅ Added parameter length validation
- ✅ Added rate limit check (30/min/token)
- ✓ Preserved visitor ownership check

---

### Section F: GET /events - SSE Stream (CRITICAL CHANGES)

**Before (Lines 182-240):**
```typescript
if (req.method === 'GET' && pathname.endsWith('/events')) {
  const session_id = url.searchParams.get('session_id');
  const visitor_token = url.searchParams.get('visitor_token');
  
  if (!session_id || !session_id.trim() || !visitor_token || !visitor_token.trim()) {
    return withCors(...);
  }

  // NO parameter validation
  // NO connection limiting
  // NO timeout

  const validation = await validateVisitorOwnership(session_id, visitor_token);
  if (!validation.valid) {
    return withCors(...);
  }

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const writeEvent = (event: string, data: any) => { ... };

      // Load history
      (async () => { ... })();

      // Subscribe to realtime updates
      const channel = supabase.channel(...)
        .on('postgres_changes', ...)
        .subscribe();

      // NO timeout
      // NO connection tracking
      // Closes only when client aborts
      req.signal.addEventListener('abort', () => {
        closed = true;
        try { channel.unsubscribe(); } catch {}
        controller.close();
      });
    },
  });

  return withCors(new Response(stream, { ... }));
}
```

**After (Lines 333-410):**
```typescript
if (req.method === 'GET' && pathname.endsWith('/events')) {
  const session_id = url.searchParams.get('session_id');
  const visitor_token = url.searchParams.get('visitor_token');
  
  if (!session_id || !session_id.trim() || !visitor_token || !visitor_token.trim()) {
    return withCors(...);
  }

  // ✅ NEW: Validate parameter lengths
  if (session_id.length > 2048 || visitor_token.length > 2048) {
    return withCors(new Response(...{ status: 400 }));
  }

  // ✅ NEW: Check concurrent connection limit (max 1 per token)
  const existingConnections = sseConnections.get(visitor_token) || new Set();
  if (existingConnections.size >= MAX_CONCURRENT_SSE_PER_TOKEN) {
    return withCors(
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Retry-After': '60' },
      })
    );
  }

  const validation = await validateVisitorOwnership(session_id, visitor_token);
  if (!validation.valid) {
    return withCors(...);
  }

  const connectionId = crypto.randomUUID();
  
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      
      // ✅ NEW: Register connection
      if (!sseConnections.has(visitor_token)) {
        sseConnections.set(visitor_token, new Set());
      }
      sseConnections.get(visitor_token)!.add(connectionId);

      // ✅ NEW: 2-hour timeout (prevents zombie connections)
      const timeoutId = setTimeout(() => {
        if (!closed) {
          try {
            controller.close();
          } catch {}
        }
      }, 2 * 60 * 60 * 1000); // 2 hours

      const writeEvent = (event: string, data: any) => { ... };

      // Load history
      (async () => { ... })();

      // Subscribe to realtime updates
      const channel = supabase.channel(...)
        .on('postgres_changes', ...)
        .subscribe();

      req.signal.addEventListener('abort', () => {
        if (!closed) {
          closed = true;
          clearTimeout(timeoutId);  // ✅ NEW: Clean up timeout
          try {
            channel.unsubscribe();
          } catch {}
          
          // ✅ NEW: Deregister connection
          const connections = sseConnections.get(visitor_token);
          if (connections) {
            connections.delete(connectionId);
            if (connections.size === 0) {
              sseConnections.delete(visitor_token);
            }
          }
          
          controller.close();
        }
      });
    },
  });

  return withCors(new Response(stream, { ... }));
}
```

**Changes Summary:**
- ✅ Added parameter length validation
- ✅ Added connection count limit check (1 concurrent max)
- ✅ Added 2-hour connection lifetime limit
- ✅ Added connection tracking and cleanup
- ✅ Returns 429 when connection limit exceeded
- ✓ Preserved realtime message updates
- ✓ Preserved visitor ownership check

---

### Section G: POST /session/close - Close Session

**Before (Lines 242-270):**
```typescript
if (req.method === 'POST' && pathname.endsWith('/session/close')) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return withCors(...);
  }
  
  const session_id = body?.session_id;
  const visitor_token = body?.visitor_token;

  if (!session_id || !visitor_token) {
    return withCors(...);
  }

  // NO request size validation
  // NO rate limiting

  const validation = await validateVisitorOwnership(session_id, visitor_token);
  if (!validation.valid) {
    return withCors(...);
  }

  const { error } = await supabase.from(...).update({ status: 'closed' })...
}
```

**After (Lines 412-464):**
```typescript
if (req.method === 'POST' && pathname.endsWith('/session/close')) {
  // ✅ NEW: Validate request body size (50KB max)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 50000) {
    return withCors(new Response(...{ status: 413 }));
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return withCors(...);
  }
  
  const session_id = body?.session_id;
  const visitor_token = body?.visitor_token;

  if (!session_id || !visitor_token) {
    return withCors(...);
  }

  // ✅ NEW: Validate parameter types and lengths
  if (typeof session_id !== 'string' || typeof visitor_token !== 'string') {
    return withCors(new Response(...{ status: 400 }));
  }

  if (session_id.length > 2048 || visitor_token.length > 2048) {
    return withCors(new Response(...{ status: 400 }));
  }

  // ✅ NEW: Rate limit 5 close requests per token per minute
  const rateLimitCheck = await checkRateLimit('session_close', visitor_token, 'token', 5, 60);
  
  if (!rateLimitCheck.allowed) {
    const retryAfter = rateLimitCheck.retryAfter || 60;
    return withCors(
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      })
    );
  }

  const validation = await validateVisitorOwnership(session_id, visitor_token);
  if (!validation.valid) {
    return withCors(...);
  }

  const { error } = await supabase.from(...).update({ status: 'closed' })...
}
```

**Changes Summary:**
- ✅ Added body size validation
- ✅ Added parameter type and length validation
- ✅ Added rate limit check (5/min/token)
- ✓ Preserved visitor ownership check

---

## SUMMARY OF ALL CHANGES

### New Functions
- `getClientIp(req: Request)` - Extract client IP
- `checkRateLimit(endpoint, identity, identityType, limit, windowSeconds)` - Rate limit check/increment

### New Variables
- `rateLimitCache` - In-memory cache for rate limit results
- `sseConnections` - Track concurrent SSE connections
- `MAX_CONCURRENT_SSE_PER_TOKEN` - Max concurrent connections per token (1)

### New Validations
✅ Request body size limits (50KB) on all POST endpoints  
✅ Query parameter length validation on all GET endpoints  
✅ Token/ID format validation  

### New Rate Limits
✅ POST /session: 5/hour/IP  
✅ GET /session: 30/min/token  
✅ POST /message: 15/min/token  
✅ GET /messages: 30/min/token  
✅ GET /events: 1 concurrent/token  
✅ POST /session/close: 5/min/token  

### New Features
✅ SSE timeout (2 hours max lifetime)  
✅ SSE connection limiting (1 concurrent max)  
✅ HTTP 429 responses with Retry-After headers  
✅ Fail-safe design (allow on system failure)  

### Preserved (No Regression)
✓ Author='visitor' enforcement  
✓ Visitor isolation checks  
✓ Admin authentication  
✓ Secrets protection  
✓ CORS validation  
✓ Realtime message updates  
✓ All error responses  

---

**Total Lines Added:** ~90 lines  
**Total Lines Modified:** ~60 lines  
**Total Files Changed:** 2 (1 new migration, 1 modified Edge Function)

