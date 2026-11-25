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
- Select the blue source Wave name beside `Source Wave:` below the Curation
  title to open it. Long Wave names truncate on one line. On mobile web and in
  the app, source post and joined counts appear on their own line with thousands
  separators.
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
7. Use `Manage` to edit, reorder, or delete the selected Curation. Use
   `Choose another Curation` to select or create another Curation from the
   same source.

If your account can curate the selected Curation, `Organize posts` appears in
`Manage` under `This Curation` when it contains at least two posts. The same
inline organizing mode is available from the source Wave's Curation tab. Posts
stay in the grid and gain small drag handles over each post. Drag a handle, or tap one and then a
destination handle. Keyboard users can select a handle with Space, move with
the arrow keys, and press Space to place it. Each move saves automatically for
all readers. Done exits organizing mode.

Posts load in pages as you scroll. Continue scrolling to load more posts before
moving a post to a destination farther down the Curation.

The setup dialog exposes source Wave and Group details under `Advanced setup
details`. Existing public Waves remain available as an advanced alternative.
Mobile Curation setup and edit sheets use Close or a downward header swipe to
leave without submitting. Their desktop dialogs also offer Cancel.

## Common Scenarios

- **No profile handle:** `Go to Identity` opens the profile's Identity route so
  the owner can finish profile setup.
- **No eligible public Wave:** guided Curation setup is the primary action;
  `Advanced Wave setup` remains available for custom Wave configuration.
- **No Curation in the selected source:** `Create curation` opens the compact
  name flow, with curator criteria under `Advanced permissions`. Select
  `Edit criteria` to adjust who can curate.
- **Empty Curation:** `Add your first post` opens the post composer.
- **Existing post:** from its Wave menu, choose `Manage curations`, then add or
  remove the post from an eligible named Curation.
- **Profile post actions:** open the card menu to open the original Wave, edit
  the post when you are its author, or remove it from the Curation. Removal is
  separated from the other actions and shown in red.
- **Owner controls:** `Add post` is the primary action. `Manage` includes
  `Edit Curation`, `Organize posts`, and `Show on profile` when available under
  `This Curation`, followed by profile display actions under `Shown on profile`.
  `Delete Curation` is a separate red action at the bottom. Desktop menus use
  the same order. Mobile web and app sheets show icons beside the action labels.
- **Mobile owner controls:** the 18px title shares its row with the square
  `Manage` icon button at the right. Long titles wrap as one block beside it.
  `Manage` opens a sheet with the same title on mobile web and in the app.
  `+ Add post` sits at the right of the separate stats row. Visitors see the
  title and stats at full width without owner controls.
- **Mobile Add post:** the sheet has an `Add post` heading with `to <Curation
  name>` on a second, single-line subtitle. The header uses the same close
  button as the other profile sheets. The chat composer requests input focus
  when it opens, and the sheet follows the available keyboard viewport.
- **Mobile empty states:** owner and visitor panels use the same compact frame.
  The owner's `Create Curation` action is a single primary button, with
  `Advanced Wave setup` as a text action below it. Existing setup and empty-state
  copy stays the same.
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

- Setup progress lists each dependency. If a later step fails, `Continue setup`
  resumes from that step and reuses resources already created during the
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
