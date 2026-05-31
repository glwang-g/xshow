# Cloud Sync Plan

`xshow circuits` should remain playable without an account. Accounts are only for cloud records, cross-device continuation, copied shared workspaces, and future classroom templates.

## Product Principles

- Login must not block the first screen; signed-out users can complete every local lesson.
- Local records, JSON archives, and URL sharing should remain available. Cloud sync is an enhancement layer.
- Sync state should be visible: signed out, local changes, syncing, synced, and sync failed.
- Student and teacher flows should stay lightweight; the learning tool should not turn into an account form.

## Suggested Phases

### Phase 1: Minimal Cloud Records

- Sign in or sign up with email and password; use email only for confirmation and password resets.
- Save the current workbench snapshot to the cloud.
- Cloud record list supports create, rename, load, and delete.
- The latest workspace can autosync, but failures must not overwrite local records.

Current implemented slice: email/password sign-in, sign-up, password reset, explicit save, update, list, load, rename, delete, visible sync states, overwrite-or-copy conflict handling, shared-link copy, and first-sign-in upload prompts for `workspace_records`.

### Phase 2: Shared Copies

- Share links open as read-only workspaces.
- A signed-in user can copy a shared workspace into their own records.
- Share links should not grant edit permission.

### Phase 3: Classroom Templates

- Teachers can create lesson templates.
- Students copy a template into their own workspace.
- Class spaces, submissions, and bulk review can come later.

## Data Contract Draft

Cloud records can reuse the current `PersistedWorkspace` shape:

```ts
type CloudWorkspaceRecord = {
  id: string;
  owner_id: string;
  title: string;
  workspace: {
    activeLessonId: string;
    parts: Array<{
      closed?: boolean;
      id: string;
      name: string;
      polarity?: "normal" | "reversed";
      resistance?: number;
      type: "battery" | "bulb" | "switch" | "resistor" | "led" | "buzzer" | "motor";
      x: number;
      y: number;
    }>;
    selectedPartId: string;
    version: 1;
    wires: Array<{
      from: { partId: string; terminal: "a" | "b" };
      id: string;
      to: { partId: string; terminal: "a" | "b" };
    }>;
    zoom: number;
  };
  created_at: string;
  updated_at: string;
};
```

## Table Draft

| Table | Purpose |
| --- | --- |
| `profiles` | Minimal user display data, initially just `id` and `email`. |
| `workspace_records` | User-owned cloud workbench records. |
| `shared_workspaces` | Read-only shared copies or copyable templates. |

The initial Supabase table, Row Level Security policies, and `updated_at` trigger are documented in [supabase-schema.sql](supabase-schema.sql).

## Conflict Strategy

- Records have `updated_at`; compare the cloud version before saving.
- If the cloud version is newer than local edits, ask the user to overwrite cloud or save as a copy.
- Local autosave must survive cloud sync failures.

## Backend Choice

Supabase is selected for the first implementation slice:

- Auth uses Supabase email/password sessions with local session persistence, plus email-based password reset.
- Postgres fits JSON workbench payloads.
- Row Level Security can enforce record ownership.
- Share links and classroom templates can grow from the same model.

Avoid building a full custom account system at first; that would pull v0.2 into backend-heavy work too early.

## Implementation Notes

The app reads Supabase configuration from Vite environment variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

If these values are not configured, the cloud sync panel stays visible as "not configured" and all local workflows continue to work.
