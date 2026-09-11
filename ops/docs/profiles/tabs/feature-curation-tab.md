# Profile Curation Tab

## Overview

The Curation tab presents a profile-owned collection of posts. Profile owners
can create a ready-to-use Curation, add new posts, connect an existing public
Wave when advanced settings are needed, and manage the posts that appear on
their profile. Public viewers see the selected Curation without management
controls.

## Location in the Site

- Profile Curation route: `/{user}/curations`
- The `Curation` tab in the profile tab bar

## Entry Points

- Open your own profile and select `Curation`.
- Open another profile's `Curation` tab to view its public collection.
- Use `Manage curations` from a post's Wave action menu to add or remove that
  post from a named Curation you can manage.

## User Journey

1. Open your own `Profile -> Curation`.
2. Select `Create Curation`.
3. Enter a Curation name. The default is `Posts`.
4. The site prepares access, creates the public source Wave, creates the
   Curation, and connects it to the profile.
5. After setup succeeds, the `Add post` dialog opens automatically.
6. Publish a post. The post is created in the source Wave and added to the
   selected Curation.
7. Use `Manage` to rename or delete the selected Curation. Use `Switch
   curation` to select or create another Curation from the same source.

The setup dialog exposes source Wave and Group details under `Advanced setup
details`. Existing public Waves remain available as an advanced alternative.

## Common Scenarios

- **No profile handle:** `Go to Identity` opens the profile's Identity route so
  the owner can finish profile setup.
- **No eligible public Wave:** guided Curation setup is the primary action;
  `Advanced Wave setup` remains available for custom Wave configuration.
- **No Curation in the selected source:** `Create curation` opens the compact
  name flow, with Group permissions under `Advanced permissions`.
- **Empty Curation:** `Add your first post` opens the post composer.
- **Existing post:** from its Wave menu, choose `Manage curations`, then add or
  remove the post from an eligible named Curation.
- **Profile post actions:** open the card menu to open the original Wave, edit
  the post when you are its author, or remove it from the Curation.
- **Owner controls:** `Add post` is the primary action. `Manage` groups profile
  display actions separately from actions that change the Curation itself.
- **Profile display:** `Choose another Curation`, `Use another source Wave`,
  and `Hide from profile` only change what this profile displays. Hiding keeps
  the Curation, source Wave, Groups, and posts available.
- **Curation management:** `Edit Curation` changes the named Curation.
  `Delete Curation` deletes it and removes it from the profile, while keeping
  its source Wave and posts.

## Edge Cases

- Proxy mode is read-only for profile Curation setup and management. Switch
  out of proxy mode to make changes.
- A stale selected Curation falls back to the first available Curation in the
  connected source Wave.
- If the connected source Wave is unavailable, the owner can hide it from the
  profile and create or select another source.
- Only users allowed by a Curation's Group can add or remove posts.
- `Edit post` appears only to the post author, outside proxy mode, and not for
  participatory posts.
- Public viewers do not see owner setup, switching, management, or removal
  controls.
- Card actions are exposed through a labeled button on touch and keyboard
  surfaces; Curation removal and source removal require confirmation.

## Failure and Recovery

- Setup progress lists each dependency. If a later step fails, `Continue
  setup` resumes from that step and reuses resources already created during the
  open setup session.
- Duplicate Curation names and permission failures remain in the dialog with
  actionable error feedback.
- Loading and API failures expose retry actions without discarding the current
  profile selection.
- If a new post is created but cannot be added to the Curation, the dialog
  keeps the successful post and offers `Retry add`; retrying does not publish a
  second post.
- Failed removal or membership changes keep their dialog open and can be
  retried.

## Limitations / Notes

- Curation posts always have an original source Wave because post authorship,
  editing, and permissions remain Wave-backed.
- Guided setup creates a public Chat Wave and an owner-only initial management
  Group. Advanced Wave and Group settings remain available from their existing
  management surfaces.
- Removing a Curation from the profile or removing content from a Curation does
  not delete the underlying post or source resources.
- New Curation messages currently use the complete `en-US` source copy; other
  supported locales use the documented `en-US` fallback until translated.

## Related Pages

- [Profiles Tabs Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Wave Drop Curation Actions](../../waves/drop-actions/feature-drop-curation.md)
- [Wave Drop Touch Menu](../../waves/drop-actions/feature-touch-drop-menu.md)
- [Profiles Index](../README.md)
