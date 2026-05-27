# Release Backlog

This backlog turns the current roadmap into releasable versions so `xshow circuits` can move from "keep adding features" to "close, verify, and ship".

## v0.2: Mobile And Sharing Release

Status: **Release Candidate**.

The core v0.2 features are mostly in main: mobile HUD, touch pan/zoom, guided tasks, series/parallel lessons, LED, PWA support, JSON archives, URL sharing, and image export.

### Must Finish

- [ ] Run the [mobile QA checklist](mobile-qa.md) on real devices.
- [ ] Record iPad landscape, phone portrait, and phone landscape test results.
- [ ] Fix blocking issues found during real-device QA.
- [ ] Update the README screenshot or add mobile screenshots.
- [ ] Confirm deployed PWA manifest, service worker, and share links work in production.
- [x] Write release notes.
- [ ] Tag v0.2 after real-device and production checks are complete.

### Nice To Have

- [ ] Shorten the mobile lesson hint strip copy to reduce overlap.
- [ ] Add clearer feedback when share-link copy or clipboard access fails.
- [x] Include the current lesson title in PNG exports.
- [ ] Make the PWA update prompt copy friendlier.

### Keep Out Of v0.2

- Cloud accounts and automatic sync.
- More components.
- Full physical circuit solving.
- Classroom or class-space features.

## v0.3: Cloud Records And Cross-Device Continuation

Status: **designed, not implemented**.

Reference: [Cloud Sync Plan](cloud-sync-plan.md).

### Must Finish

- [ ] Choose a backend, with Supabase as the preferred first option.
- [ ] Add sign-in without blocking signed-out use.
- [ ] Add a cloud workspace record list.
- [ ] Save the current workbench to the cloud.
- [ ] Load cloud records into the workbench.
- [ ] Show sync state: signed out, local changes, syncing, synced, and sync failed.
- [ ] Handle conflicts by overwriting cloud or saving as a copy.

### Nice To Have

- [ ] Let users copy a shared workspace into their own records.
- [ ] Rename and delete cloud records.
- [ ] After first sign-in, ask whether to upload the current local workbench.

## v0.4: More Components And Better Rules

Status: **idea pool**.

### Candidate Components

- [ ] Buzzer
- [ ] Motor
- [ ] Diode
- [ ] Capacitor
- [ ] Ammeter
- [ ] Voltmeter

### Simulation Improvements

- [ ] Fully connect current direction with battery polarity.
- [ ] Make bulb, LED, wire animation, and current values feel visually consistent.
- [ ] Move from single-path approximations to a clearer node/branch model.

## Ship Rule

v0.2 now only accepts blocking bug fixes, real-device QA notes, screenshots, and release-note updates. New feature ideas should go into v0.3 or v0.4 so the mobile release does not stay forever one step away.
