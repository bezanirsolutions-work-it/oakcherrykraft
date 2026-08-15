# DATABASE MIGRATION READ-ONLY AUDIT

## Scope

This audit is read-only and intentionally does not modify files, schema, migration history, application code, or deploy state.

## Current migration chain

The relevant migration sequence in the repository is:

1. `supabase/migrations/001_initial_schema.sql`
   - Creates `public.profiles`
   - Creates the admin role helper function `public.is_admin()`
   - Enables RLS and creates policies that reference `profiles.user_id`
2. `supabase/migrations/008_create_live_chat_tables.sql`
   - Creates `public.live_chat_sessions`
   - Defines `assigned_agent_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL`
3. `supabase/migrations/010_create_rate_limit_tracker.sql`
   - Creates `public.rate_limit_tracker`
   - Creates `public.rate_limit_check_and_increment()`
   - Does not reference `profiles` and does not reference `profiles.user_id`

## `profiles` schema expected by migrations

From `supabase/migrations/001_initial_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer','admin')),
  avatar_url text
);
```

This means the intended schema is:

- `id` — primary key
- `created_at` — timestamp
- `updated_at` — timestamp
- `user_id` — unique UUID reference to `auth.users(id)`
- `full_name` — required
- `role` — enum-like text with values `customer` and `admin`
- `avatar_url` — optional

The same migration also expects this pattern repeatedly:

```sql
WHERE user_id = auth.uid()
```

and creates the admin policy logic based on that expectation.

## `profiles` schema actually referenced by application code

The TypeScript application code does not model `user_id` in the profile table type.

From `src/lib/database.ts`:

```ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
```

This type includes `id`, `full_name`, `avatar_url`, `role`, `created_at`, and `updated_at`, but it does not include `user_id`.

The actual profile lookups in the app use `id`, not `user_id`:

```ts
await supabase
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .maybeSingle();
```

and

```ts
await supabase
  .from('profiles')
  .select('full_name')
  .eq('id', userId)
  .maybeSingle();
```

from `src/lib/profile.ts`.

The admin auth logic in `src/lib/AuthContext.tsx` also prefers session role metadata and then resolves profile role by `id`:

```ts
const { data: userData, error: userError } = await supabase.auth.getUser();
const role = await getProfileRole(userData.user.id);
```

and `getProfileRole()` is explicitly a lookup on `profiles` by `id`.

## Exact mismatch

The mismatch is between:

- the migration expectation in `008_create_live_chat_tables.sql`
- and the actual `profiles` schema that the app and current database usage are aligned to

The critical line is:

```sql
assigned_agent_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
```

This assumes that `public.profiles.user_id` exists and is unique, and that it can be used as the foreign key reference target.

The application code does not read or write `profiles.user_id`; it reads profile rows by `profiles.id` instead. The database type definition also omits `user_id`.

That means the migration is not matching the effective application schema.

## Which migration first creates `profiles`

The first migration creating `profiles` is:

- `supabase/migrations/001_initial_schema.sql`

It creates the table and the associated policies.

## Which migration first expects `profiles.user_id`

There are two relevant answers:

1. The first migration to rely on `profiles.user_id` is also `001_initial_schema.sql` because the helper and policies use:
   - `WHERE user_id = auth.uid()`
   - `USING (auth.uid() IS NOT NULL AND user_id = auth.uid())`
2. The first migration to define a foreign-key relationship against `public.profiles(user_id)` is `008_create_live_chat_tables.sql`.

So the core problem is not merely one migration; it is the combination of:

- the database schema as created in 001
- the assumption in 008 that a `profiles.user_id` foreign key exists and is valid
- the application's actual dependence on `profiles.id` rather than `profiles.user_id`

## Is `profiles.user_id` required by current application code?

Current application code does not require `profiles.user_id` for the main live-chat and admin flows.

Evidence:

- `src/lib/profile.ts` queries `profiles` by `id`, not `user_id`
- `src/lib/AuthContext.tsx` checks admin status using the authenticated user ID and then resolves role from `profiles` by `id`
- `src/lib/database.ts` does not include the column in the generated profile table types
- no application code in the inspected source tree writes to `profiles.user_id`
- no source tree query was found that does `from('profiles').eq('user_id', ...)`

Therefore, in the current app, `profiles.user_id` is not a required runtime field for user lookup or auth logic.

## Does the live-chat proxy depend on `profiles.user_id`?

Not directly.

Evidence:

- `supabase/functions/live_chat_proxy/index.ts` operates on `live_chat_sessions` and `live_chat_messages`
- it uses `visitor_token` and session ownership checks based on `session_id` + `visitor_token`
- it does not query `profiles`
- it does not select or update `profiles.user_id`

The only dependency is indirect: the table definition in migration 008 references `public.profiles(user_id)`, so a database-level foreign key exists on `live_chat_sessions.assigned_agent_id` and may fail if `profiles.user_id` is absent or not valid.

## Does admin authentication depend on `profiles.user_id`?

Not in its current application logic.

`src/lib/AuthContext.tsx` is designed to check session metadata and then query profile role by `id`:

```ts
const { data: userData, error: userError } = await supabase.auth.getUser();
const role = await getProfileRole(userData.user.id);
```

The admin gate in `src/components/admin/ProtectedRoute.tsx` only checks `isAdmin` from the auth context; it does not read `profiles.user_id` directly.

The database-level policy in 001 does use `user_id = auth.uid()`, but the current client-side app is not written to depend on that exact column for role resolution.

## Is the mismatch a migration issue, production issue, application issue, or combination?

This is a combination, with migration history and database-shape drift being the main root cause.

### A. Migration-history problem
Yes, because the migration sequence assumes a `profiles.user_id` foreign key and the app code, generated types, and runtime logic currently align to `profiles.id` instead.

### B. Production-schema problem
Yes, because a live production database may have a different shape than what the migration chain expects, especially if earlier migrations were applied in a partially inconsistent environment or a schema was created manually.

### C. Application-code problem
The application code is not directly using `profiles.user_id`, so it is not the primary root cause. However, the app may be relying on a DB design that was intended to exist and is now mismatched.

### D. Combination
Most likely the correct classification is: a combination of migration history drift and a production schema mismatch, with the application code currently using `profiles.id` rather than `profiles.user_id`.

## Exact SQL statement that previously failed

The failing SQL pattern is the foreign key definition in `008_create_live_chat_tables.sql`:

```sql
assigned_agent_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
```

This would fail when the target column does not exist in `public.profiles` in the target database, or when the target is not a valid unique/reference key. In PostgreSQL, this error surface is typically of the form:

- `column "user_id" referenced in foreign key constraint does not exist`
- or `there is no unique constraint matching given keys for referenced table "profiles"`

The exact form depends on the actual database state.

## Why `supabase db push` stopped at that migration

Because the migration runner applies migrations in order. When it reaches migration 008, PostgreSQL validates the foreign key on `live_chat_sessions.assigned_agent_id` against `public.profiles(user_id)`.

If the target database does not have `public.profiles.user_id` in the expected shape, the database rejects the migration and `db push` stops before continuing to later migrations.

This is exactly why the chain blocks at migration 008 rather than advancing to 010.

## Can migration 010 be applied independently once the earlier migration issue is resolved?

Yes, migration 010 is independent of the `profiles.user_id` mismatch.

`010_create_rate_limit_tracker.sql` only creates:

- `public.rate_limit_tracker`
- `public.rate_limit_check_and_increment()`
- indexes and triggers

It does not reference `public.profiles`, `public.live_chat_sessions.assigned_agent_id`, or `profiles.user_id`.

The only caveat is that the migration sequence must have already reached a valid state that allows the earlier broken chain to be repaired. In the currently blocked chain, migration 010 cannot be reached until the 008 / profiles mismatch is resolved.

## Smallest safe remediation

The smallest safe remediation is not to rewrite migration history in-place. The safest approach is to repair the schema and migration assumptions in a controlled manner.

Recommended remediation path:

1. Verify the actual production database schema state and whether `public.profiles.user_id` exists.
2. If the design intention is to use `profiles.user_id`, ensure the database has a proper `user_id` column and unique constraint, and backfill it for existing rows.
3. If the current application code and auth logic are using `profiles.id`, then align the foreign key in 008 to `public.profiles(id)` instead of `public.profiles(user_id)`.
4. Keep migration history intact unless there is a clearly documented reason to rewrite it.
5. Treat any migration reordering or history rewrite as a high-risk operation because it affects the production database's migration state.

## Risk of breaking existing users/admins if `user_id` is added or migration history is changed

### If `user_id` is added without backfill

Risk: MEDIUM

- Existing profile rows may not have `user_id` values
- RLS policies using `user_id = auth.uid()` would fail for those users
- admin checks could stop recognizing valid admins
- live-chat assignment may fail if `assigned_agent_id` references a user that does not have a matching profile row

### If migration history is rewritten

Risk: HIGH

- The production database may already have partially applied migrations
- rewriting earlier migration files can invalidate previously applied migration state
- it may create impossible or inconsistent replay conditions
- it can cause admin role logic, profile lookups, and live-chat assignment to fail unexpectedly

This is why a non-destructive schema repair is safer than rewriting history.

## Read-only exploratory commands that would be used later

These commands are examples that would be used later only for diagnosis or remediation after approval, but they were not executed in this audit because the task explicitly forbids schema changes and deployment work.

```bash
# Check current migration state
supabase migration list

# Inspect pending and applied migrations
supabase db diff --schema public

# Read the schema for the profiles table
psql "$DATABASE_URL" -c "\d public.profiles"

# Inspect foreign keys on live_chat_sessions
psql "$DATABASE_URL" -c "\d public.live_chat_sessions"

# Search for profiles.user_id usage
grep -R "profiles.user_id\|user_id = auth.uid()\|REFERENCES public.profiles(user_id)" supabase src

# Later remediation (not executed here): check whether a column exists in prod
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles';"
```

## Impact on chatbot

CHATBOT IMPACT: LOW

Reason:

- The live-chat proxy and chat UI are not directly using `profiles.user_id`
- The chat flow is based on `visitor_token`, `live_chat_sessions`, and `live_chat_messages`
- The main risk is indirect: the DB foreign key defined in migration 008 may fail if the referenced profile key is not present, which can prevent admin assignment or chat session assignment in the admin UI

## Impact on admin

ADMIN IMPACT: MEDIUM

Reason:

- Admin auth is generally based on user identity + profile role lookup by `id`
- The database policy design intended to use `profiles.user_id` for access control, but the client code does not depend on that field directly
- If the production database is inconsistent, admin role checks and assignment may fail even though the current TypeScript code looks correct by `id`

## Impact on authentication

AUTH IMPACT: LOW to MEDIUM

Reason:

- Current app code resolves admin access by `auth.getUser()` and then looks up the profile by `id`
- `profiles.user_id` is present in 001 and used in RLS policy logic, but current app logic does not require it for the browser-side flow
- The risk is primarily at the database/RLS layer rather than in the application code itself

## Migration 010 status

MIGRATION 010 STATUS: BLOCKED

Reason:

- In a chained migration environment, migration 010 is not reachable until the earlier migration 008 / profile mismatch is resolved.
- 010 is independent of the mismatch but cannot be applied while the chain is blocked by the earlier schema issue.

## Database remediation

DATABASE REMEDIATION: REQUIRED

Reason:

- The migration chain currently expects a `profiles.user_id` relationship that is not consistent with how the current application code and generated types are modeled.
- A production database mismatch or migration drift must be repaired before later migration work proceeds safely.

## Production database changes made

PRODUCTION DATABASE CHANGES MADE: NO

This audit did not change any file, migration, database schema, or application state.

---

## Final verdict

- CHATBOT IMPACT: LOW
- ADMIN IMPACT: MEDIUM
- AUTH IMPACT: LOW to MEDIUM
- MIGRATION 010 STATUS: BLOCKED
- DATABASE REMEDIATION: REQUIRED
- PRODUCTION DATABASE CHANGES MADE: NO

## Short conclusion

The root issue is a mismatch between:

- the intended schema in `001_initial_schema.sql`
- the specific foreign key assumption in `008_create_live_chat_tables.sql`
- and the current runtime code, which consistently uses `profiles.id` and not `profiles.user_id`

This is not a chatbot logic bug in the rule-based app itself. It is a migration/schema alignment issue that can block later migration application and may affect admin assignment or role enforcement if the production database differs from the intended schema.
