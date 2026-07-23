# Quick Tags

## Overview

Quick Tags let a profile save a private tag for several profiles. For example,
`@frens` can expand into `@alice @bob @charlie` inside a Wave composer.

## Location in the Site

- Route: `/{user}/mention-shortcuts`
- Profile tab: `Quick Tags`, visible only on your own profile

## Entry Points

- Open your own profile and select `Quick Tags`.
- Open your own `/{user}/mention-shortcuts` route directly or from browser
  history.

## User Journey

1. Open your own profile and select `Quick Tags`.
2. Select `New Quick Tag`.
3. Create a tag with a 3–15 character name containing letters, numbers, or
   underscores.
4. Add between 1 and 25 profiles and save.
5. Type that Quick Tag in a Wave composer.
6. Select the suggestion or finish the token with Space to expand it into
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
- The tab stays selected while sign-in and profile ownership are still being
  restored, so browser Back and Forward can return to the Quick Tags route.
- Quick Tags are hidden on other profiles and while acting through a proxy.
- If ownership resolves to another profile, the app falls back to the first
  visible profile tab.

## Failure and Recovery

- If Quick Tags cannot be loaded, the tab shows an error; refresh to retry.
- If saving or deleting fails, the app shows an error notification and keeps
  the existing Quick Tag state available for another attempt.
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
- [Profile Routes and Tab Visibility](../../profiles/navigation/feature-tabs.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
