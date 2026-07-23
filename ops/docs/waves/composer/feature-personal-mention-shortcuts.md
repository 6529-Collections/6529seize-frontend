# Quick Tags

## Overview

Quick Tags let a profile save a private tag for several profiles. For example,
`@frens` can expand into `@alice @bob @charlie` inside a Wave composer.

## Setup

- Open the `Brain` tab on your own profile.
- Find `Quick Tags` beneath the Brain wave sidebar and select `New Quick Tag`.
- Create a tag with a 3–15 character name containing letters, numbers, or
  underscores.
- Add between 1 and 25 profiles and save.
- Quick Tags appear only on your own Brain tab, are private to the profile that
  created them, and are unavailable while acting as a proxy.

Reserved global mention names, including `@all`, `@everyone`, common
administrator/moderator/developer terms, `@contributors`, `@team`,
`@6529devs`, and `@devs6529`, cannot be used as Quick Tags. Matching is
case-insensitive.

## Composer Behavior

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

## Related Pages

- [Wave Mentions](feature-wave-mentions.md)
- [Global Mentions](feature-global-mentions.md)
- [Wave Composer](README.md)
- [Profile Brain Tab Wave Sidebar](../../profiles/tabs/feature-brain-wave-sidebar.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
