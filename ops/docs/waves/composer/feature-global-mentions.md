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
2. Type or select `@contributors`, `@admins`, or `@devs6529`.
3. Send the message. The global token remains visible in the posted content.
4. Eligible profiles are resolved when the message is posted.

Wave creators and admins can also use `@all`.

## Common Scenarios

- `@contributors` notifies profiles with Chat access to the current Wave.
- `@admins` notifies the Wave creator and profiles with Admin access.
- `@devs6529` notifies the platform-configured 6529 developer profiles that
  can view the Wave.
- `@all` keeps its existing follower-broadcast behavior and notification
  preferences.

## Edge Cases

- Global names work with any capitalization, such as `@Contributors`.
- Typing a complete token directly has the same effect as choosing it from the
  suggestion menu; Chat access is the invocation requirement for
  `@contributors`, `@admins`, and `@devs6529`.
- A profile included by more than one mention is notified only once.
- The message author is not notified by their own global mention.
- Muted profiles and profiles that cannot view the Wave are excluded.

## Failure and Recovery

If no eligible profile matches a global mention, the message is still posted
with the visible token. Use individual profile mentions when you need to reach
specific profiles directly.

## Limitations / Notes

Global names are reserved and cannot be used for personal mention shortcuts.
Personal shortcuts expand inline into profile handles; global mentions do not.
Editing a message updates which global tokens are stored with its content, but
does not resend permission-group notifications.

## Related Pages

- [Wave Composer](README.md)
- [Personal Mention Shortcuts](feature-personal-mention-shortcuts.md)
- [Wave Mentions](feature-wave-mentions.md)
