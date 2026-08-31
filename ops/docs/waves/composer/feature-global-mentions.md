# Global Mentions

## Overview

Global mentions notify a Wave audience while keeping a short, shared token in
the posted message. Matching is case-insensitive.

## Location in the Site

Global mentions are available in Wave message, reply, and edit composers.

## Entry Points

- Type `@` in a Wave composer and choose a global mention suggestion.
- Type a complete global mention directly without choosing a suggestion.

## User Journey

1. Open a Wave where you have Chat access.
2. Type or select `@admins` or `@devs6529`.
3. Send the message. The global token remains visible in the posted content.
4. Eligible profiles are resolved when the message is posted.

Wave creators and admins can also use the broadcast mentions `@all` and
`@contributors`.

## Common Scenarios

- `@contributors` notifies profiles with Chat access that joined the Wave and
  enabled `Broadcast mentions`.
- If Chat access is **Public**, there is no finite Chat-access group to expand.
  In that case, joined Wave followers with `Broadcast mentions` enabled are the
  bounded `@contributors` audience; muted followers and the author are still
  excluded from notifications.
- `@admins` notifies the Wave creator and profiles in the `Admins` scope.
- `@devs6529` notifies the platform-configured 6529 developer profiles that
  can view the Wave.
- The `Broadcast mentions` notification preference controls both `@all` and
  `@contributors`; turning it off opts the profile out of both broadcasts.
- `All messages` still notifies a joined profile about every message regardless
  of the broadcast-mention preference.

## Edge Cases

- Global names work with any capitalization, such as `@Contributors`.
- Typing a complete token directly has the same effect as choosing it from the
  suggestion menu. Wave creator or admin access is required for `@all` and
  `@contributors`; Chat access is the invocation requirement for `@admins` and
  `@devs6529`.
- Broadcast suggestions are unavailable to non-admins. If a non-admin types
  `@all` or `@contributors` directly in a new message, the token is posted
  as ordinary text without broadcast metadata or notifications.
- A non-admin can retain `@contributors` while editing an existing message
  that already contained it. The edit does not rebroadcast the mention, and
  they cannot add `@contributors` as a broadcast mention to a message that did
  not already contain it.
- Global mention text inside links or inline/fenced code remains literal and
  does not notify a Wave audience.
- A profile included by more than one mention is notified only once.
- The message author is not notified by their own global mention.
- Muted profiles and profiles that cannot view the Wave are excluded.

## Failure and Recovery

If no eligible profile matches a global mention, the message is still posted
with the visible token. Use individual profile mentions when you need to reach
specific profiles directly.

## Limitations / Notes

Global names are reserved and cannot be used for personal Quick Tags.
Quick Tags expand inline into profile handles; global mentions do not.
Editing a message updates which global tokens are stored with its content, but
does not resend permission-group notifications.
The stored `mentioned_groups` value describes the global tokens in the current
displayed content. It is not a historical record of the profiles notified when
the message was first posted.

## Related Pages

- [Wave Composer](README.md)
- [Quick Tags](feature-personal-mention-shortcuts.md)
- [Wave Mentions](feature-wave-mentions.md)
