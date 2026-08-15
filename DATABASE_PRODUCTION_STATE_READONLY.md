# DATABASE_PRODUCTION_STATE_READONLY

## Production connectivity

- Supabase CLI available: YES (via `npx supabase`)
- Repository linked: YES
- Production schema accessible read-only: YES

## Migration state

### Read-only verification results

The repository is linked to a Supabase project and accessible via the read-only CLI.

The migration state output from `npx supabase migration list --linked` showed:

- 001: present
- 002: present
- 003: present
- 004: present
- 005: present
- 006: present
- 007: present
- 008: present
- 009: present
- 010: present
- 011: present

This means the linked production project currently has local migration files 001 through 011 recorded as part of the migration state. In other words, the repository migration chain is recognized by the linked project and the newer migration file exists in the linked migration set.

Important note:
- The migration presence in the migration list is not proof that the actual schema matches the migration contents in all respects.
- The direct schema inspection below is the authoritative check for the live-chat FK.

## Live-chat FK

Production schema inspection confirms:

- `public.live_chat_sessions.assigned_agent_id` exists
- type: `uuid`
- nullable: YES
- current foreign key constraint name: `live_chat_sessions_assigned_agent_id_fkey`
- referenced table: `profiles`
- referenced column: `id`

This is the exact production state observed via read-only inspection:

```sql
SELECT conname AS constraint_name,
       conrelid::regclass::text AS table_name,
       a.attname AS column_name,
       confrelid::regclass::text AS referenced_table,
       af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = c.confkey[1]
WHERE c.conrelid = 'public.live_chat_sessions'::regclass
  AND c.contype = 'f';
```

Result:

- `constraint_name`: `live_chat_sessions_assigned_agent_id_fkey`
- `table_name`: `live_chat_sessions`
- `column_name`: `assigned_agent_id`
- `referenced_table`: `profiles`
- `referenced_column`: `id`

This means the production schema is already aligned to `profiles(id)`.

The earlier migration file at `008_create_live_chat_tables.sql` shows the incorrect reference as:

```sql
assigned_agent_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
```

but the actual linked production schema does not currently reflect that incorrect target.

## Profiles table

Read-only inspection confirms the linked production schema includes:

- `public.profiles.id` as a UUID primary key
- `public.profiles.role` as a non-null text column
- `public.profiles.created_at` and `public.profiles.updated_at`
- no `user_id` column in `public.profiles`

This is the exact observed state:

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'live_chat_sessions')
ORDER BY table_name, ordinal_position;
```

Observed columns for `profiles` included:

- `id` (uuid)
- `full_name` (text)
- `avatar_url` (text)
- `role` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

The check for `profiles.user_id` returned:

- `profiles_has_user_id`: false

This confirms that the live production database does not currently have a `public.profiles.user_id` column.

## Existing data compatibility

Read-only aggregate query result:

```sql
SELECT COUNT(*) AS assigned_sessions,
       COUNT(p.id) AS matching_profile_ids,
       COUNT(*) FILTER (WHERE p.id IS NULL) AS incompatible_assignments,
       EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'profiles'
           AND column_name = 'user_id'
       ) AS profiles_has_user_id
FROM public.live_chat_sessions s
LEFT JOIN public.profiles p ON p.id = s.assigned_agent_id
WHERE s.assigned_agent_id IS NOT NULL;
```

Observed result:

- `assigned_sessions`: 22
- `matching_profile_ids`: 22
- `incompatible_assignments`: 0
- `profiles_has_user_id`: false

This means all currently assigned live-chat agents in production match `public.profiles.id`, and there is no `profiles.user_id` column in the linked production database.

## Final verdict

- PRODUCTION MIGRATION STATE: VERIFIED
- FK CORRECTION REQUIRED: NO
- DATA COMPATIBILITY: VERIFIED
- MIGRATION 010: READY / INDEPENDENT

## Summary

The live project schema already matches the application identity model:

- `public.profiles.id` is the actual profile identity used by the app
- `live_chat_sessions.assigned_agent_id` is correctly keyed to `public.profiles.id` in the live database
- `profiles.user_id` is not present in the production schema
- no corrective migration is required for the production FK at this time
- migration 010 is not dependent on `profiles.user_id` and is independent of the live-chat FK issue

## Production changes

- production database changed: NO
- Edge Function changed: NO
- Git history changed: NO
- OpenAI changes: NONE

## Critical requirement

No direct production migration or schema changes were run during this task.
This task was read-only only and stops here as required.
