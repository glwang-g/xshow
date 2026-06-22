# Release Backlog

This backlog turns the current roadmap into releasable versions so `xshow circuits` can move from "keep adding features" to "close, verify, and ship".

## Public Beta: Release Hardening

Status: **in hardening; freeze large features and accept only blocking fixes, verification notes, and release-documentation updates**.

The current main branch has enough product surface for a public beta: mobile/PWA layout, free dragging and arbitrary part rotation, guided workspaces, more components, node/branch simulation, physical build plans, local records, share links, and cloud records. The remaining work is mostly reducing unknowns rather than adding scope.

### Must Finish

- [x] Local automated checks pass: `pnpm test` and `pnpm build`.
- [ ] Run the [mobile QA checklist](mobile-qa.md) on phone portrait, phone landscape, iPad landscape, and desktop.
- [ ] Recheck the small-screen bottom HUD, default recenter layout, arbitrary rotation, rotated terminal wiring, and PNG export.
- [ ] Confirm the deployed PWA manifest, service worker, offline relaunch, and manual update-check button work in production.
- [ ] Confirm deployed share links restore the current workbench in a fresh browser and on mobile.
- [ ] Verify Supabase sign-in, save, load, rename, delete, and conflict handling in production; if cloud records stay closed for beta, label that state in the UI and docs.
- [x] Draft the [public beta release note](releases/public-beta-candidate.md) with intended audience, known limits, and feedback path.
- [ ] After verification, decide the version number, tag, and public entry point.

### Ship Gate

- No known blocker prevents basic circuit building, saving, sharing, PWA launch, or lesson completion.
- Signed-out users can complete the local workflow; cloud unavailability does not block the workbench.
- Small-screen default layout keeps core actions visible and usable after recentering.
- The new-version prompt or manual update check is visible in the deployed browser/PWA experience.

## v0.2: Mobile And Sharing Release

Status: **Released as v0.2.0**.

The core v0.2 features are mostly in main: mobile HUD, touch pan/zoom, guided tasks, series/parallel lessons, LED, PWA support, JSON archives, URL sharing, and image export.

### Must Finish

- [x] Accept v0.2 for release based on project-owner review.
- [ ] Run the [mobile QA checklist](mobile-qa.md) on real devices as follow-up regression.
- [ ] Record iPad landscape, phone portrait, and phone landscape test results.
- [ ] Fix blocking issues found during real-device QA.
- [x] Update the README screenshot or add mobile screenshots.
- [ ] Confirm deployed PWA manifest, service worker, and share links work in production after deployment.
- [x] Write release notes.
- [x] Tag v0.2.0 after release acceptance.

### Nice To Have

- [x] Shorten the mobile lesson hint strip copy to reduce overlap.
- [x] Add clearer feedback when share-link copy or clipboard access fails.
- [x] Include the current lesson title in PNG exports.
- [x] Make the PWA update prompt copy friendlier.

### Keep Out Of v0.2

- Cloud accounts and automatic sync.
- More components.
- Full physical circuit solving.
- Classroom or class-space features.

## v0.3: Cloud Records And Cross-Device Continuation

Status: **feature complete, pending live auth QA**.

Reference: [Cloud Sync Plan](cloud-sync-plan.md). Supabase table setup lives in [supabase-schema.sql](supabase-schema.sql).

### Must Finish

- [x] Choose Supabase as the backend.
- [x] Add email/password auth without blocking signed-out use.
- [x] Add a cloud workspace record list.
- [x] Save the current workbench to the cloud.
- [x] Load cloud records into the workbench.
- [x] Show sync state: signed out, local changes, syncing, synced, and sync failed.
- [x] Handle conflicts by overwriting cloud or saving as a copy.

### Nice To Have

- [x] Let users copy a shared workspace into their own records.
- [x] Rename and delete cloud records.
- [x] After first sign-in, ask whether to upload the current local workbench.

## v0.4: More Components And Better Rules

Status: **first slice implemented, pending regression QA**.

### Candidate Components

- [x] Buzzer
- [x] Motor
- [x] Diode
- [x] Capacitor
- [x] Ammeter
- [x] Voltmeter

### Simulation Improvements

- [x] Fully connect current direction with battery polarity.
- [x] Make bulb, LED, wire animation, and current values feel visually consistent.
- [x] Move from single-path approximations to a clearer node/branch model.
- [x] Add regression tests for the node/branch solver and physical build-plan output.
- [x] Support arbitrary part rotation and keep terminal positions, wire endpoints, and PNG export aligned with the rotated parts.

### Physical Build Bridge

- [x] Generate a first-pass component list from the current workspace.
- [x] Add purchase keywords for each virtual part before real SKU mapping.
- [x] Generate wiring steps from the current wires.
- [x] Add safety notes for polarity-sensitive parts and meter placement.
- [x] Export the first-pass build plan as Markdown.
- [ ] Map virtual parts to real kit SKUs or recommended purchase links.
- [x] Export a printable assembly sheet with material, wiring, safety, and observation sections.

## Ship Rule

v0.2 now only accepts blocking bug fixes, real-device QA notes, screenshots, and release-note updates. New feature ideas should go into v0.3 or v0.4 so the mobile release does not stay forever one step away.
