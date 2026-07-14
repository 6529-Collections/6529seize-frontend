# Personal Mention Shortcuts

## Overview

Personal mention shortcuts let a profile save a private alias for several
profiles. For example, `@frens` can expand into `@alice @bob @charlie` inside a
Wave composer.

## Setup

- Open your own profile and select `Mention shortcuts`.
- Create a shortcut with a 3–15 character name containing letters, numbers, or
  underscores.
- Add between 1 and 25 profiles and save.
- Shortcuts are private to the profile that created them and are unavailable
  while acting as a proxy.

Reserved global mention names, including `@all`, `@everyone`, common
administrator/moderator/developer terms, `@contributors`, `@team`,
`@6529devs`, and `@devs6529`, cannot be used as personal shortcuts. Matching is
case-insensitive.

## Composer Behavior

- Type a shortcut after `@` to find it alongside profile and global mention
  suggestions.
- Selecting the shortcut or confirming the highlighted suggestion with Space
  expands it immediately into normal profile mention tokens.
- Sending a new message, reply, quote, or storm part also expands any remaining
  standalone shortcut before submission.
- Existing profile mentions are not inserted twice.
- Shortcuts do not expand inside links or inline/fenced code.
- The posted message contains only the expanded profile mentions. The private
  shortcut name is not stored in the drop.
- Global mentions such as `@all` remain visible and follow their own permission
  and notification rules.

## Related Pages

- [Wave Mentions](feature-wave-mentions.md)
- [Wave Composer](README.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
