# Release Backlog

This backlog turns the current roadmap into releasable versions so `xshow circuits` can move from "keep adding features" to "close, verify, and ship".

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

### Physical Build Bridge

- [x] Generate a first-pass component list from the current workspace.
- [x] Add purchase keywords for each virtual part before real SKU mapping.
- [x] Generate wiring steps from the current wires.
- [x] Add safety notes for polarity-sensitive parts and meter placement.
- [x] Export the first-pass build plan as Markdown.
- [ ] Map virtual parts to real kit SKUs or recommended purchase links.
- [ ] Export a printable assembly sheet with layout and wiring.

## Ship Rule

v0.2 now only accepts blocking bug fixes, real-device QA notes, screenshots, and release-note updates. New feature ideas should go into v0.3 or v0.4 so the mobile release does not stay forever one step away.
