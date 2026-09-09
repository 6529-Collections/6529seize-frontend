# Quick Tags

## Overview

Quick Tags let a profile save a private tag for several profiles. For example,
`@frens` can expand into `@alice @bob @charlie` inside a Wave composer.

## Location in the Site

- Route: `/{user}/brain`
- Section: `Quick Tags`, shown beneath `Activity` only on your own profile

## Entry Points

- Open your own profile and select `Brain`.
- Select `Manage` or the `+N more` chip to open the manager inside the compact
  `Quick Tags` section.
- Select a visible Quick Tag to edit it. On mobile, create and edit forms open
  in a bottom sheet; on wider screens, they replace the card content inline.

## User Journey

1. Open the `Brain` tab on your own profile.
2. Find the compact `Quick Tags` section beneath `Activity`.
3. Select `New Quick Tag` in the compact section or open `Manage` and select
   `New Quick Tag` there.
4. Create a tag with a 3–15 character name containing letters, numbers, or
   underscores.
5. Add between 1 and 25 profiles and save.
6. Type that Quick Tag in a Wave composer.
7. Select the suggestion or finish the token with Space to expand it into
   ordinary profile mentions before sending.

Reserved global mention names, including `@all`, `@everyone`, common
administrator/moderator/developer terms, `@contributors`, `@team`,
`@6529devs`, and `@devs6529`, cannot be used as Quick Tags. Matching is
case-insensitive.

## Common Scenarios

- Type a Quick Tag after `@` to find it alongside profile and global mention
  suggestions. Quick Tag results show their type and profile count.
- Selecting the Quick Tag or confirming the highlighted suggestion with Space
  expands it immediately into normal profile mention tokens.
- Sending a new message, reply, quote, or storm part also expands any remaining
  standalone Quick Tag before submission.
- Existing profile mentions are not inserted twice.
- Quick Tags do not expand inside links or inline/fenced code.
- The posted message contains only the expanded profile mentions. The private
  Quick Tag name is not stored in the drop.
- Global mentions such as `@all`, `@contributors`, `@admins`, and `@devs6529`
  remain visible and follow their own permission and notification rules.

## Edge Cases

- Quick Tags are private to the profile that created them.
- The compact section shows up to three tags and adds a `+N more` chip when
  more tags exist. Tags wrap at narrow widths so the controls remain visible.
- On mobile, creating or editing a Quick Tag uses a bottom sheet while the
  preceding summary or manager remains in place underneath it. Back, Cancel,
  close, backdrop, and drag dismissal return to that preceding view without
  saving.
- On wider screens, creating and editing stay inline inside the Brain-tab card.
  Deletion remains in the inline manager at every width.
- The section is hidden on other profiles and while acting through a proxy.
- Quick Tags do not have a dedicated profile tab or route.

## Failure and Recovery

- If Quick Tags cannot be loaded, the compact Brain section and inline manager
  show an error with a retry action.
- If saving or deleting fails, the app shows an error notification and keeps
  the existing Quick Tag state available for another attempt.
- Closing the mobile create or edit sheet discards unsaved changes and leaves
  the underlying Brain page and Quick Tags view in place.
- If a selected profile is no longer eligible, remove it and choose another
  profile before saving.

## Limitations / Notes

- A Quick Tag can contain 1–25 profiles.
- Names contain 3–15 letters, numbers, or underscores.
- Quick Tags cannot bypass Wave visibility, mention, or access rules.
- The private Quick Tag name is not stored in the posted drop.

## Related Pages

- [Wave Mentions](feature-wave-mentions.md)
- [Global Mentions](feature-global-mentions.md)
- [Wave Composer](README.md)
- [Profile Brain Tab](../../profiles/tabs/feature-brain-tab.md)
- [Profile Routes and Tab Visibility](../../profiles/navigation/feature-tabs.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
