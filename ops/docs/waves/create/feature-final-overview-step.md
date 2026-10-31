# Wave Creation Final Overview

## Overview

`Overview` is the final, read-only step when creating a wave or subwave.
It follows the first Chat screen or `Description` for subwaves. The first guided step is named `Setup`.

Review the configuration, then select `Confirm and create`. Use `Previous`
to return to the first Chat screen or Description, or use completed guided steps to edit
earlier settings. Description text, media, and attachments stay available when
moving backward and forward within the open wizard.

## Configuration Summary

The summary includes the wave name and picture, parent wave name for subwaves,
and the following settings:

- Access, chat and admin groups, with member inspection for restricted groups.
- Whether admins can delete posts.
- Chat guidelines.
- The description drop, including its title, formatted content, media and attachment names.

No configuration fields can be edited on this step. New waves open shared chat;
add schedules, entry requirements, voting and outcomes afterward through
[competition setup](../competitions/feature-manage-competitions.md).

## Confirmation and Recovery

- Description must contain a valid drop before `Next` opens Overview.
- Pending inline image uploads must finish first.
- Confirmation runs the existing authentication, group validation, and
  subwave parent-access warning checks before creating the wave.
- During submission, navigation and confirmation are disabled.
- A failed submission keeps the configuration and description available for
  correction or retry. No wave is created just by opening Overview.

## Related Pages

- [Wave Creation Index](README.md)
- [Setup](feature-overview-step.md)
- [Guidelines](feature-rules-step.md)
- [Description](feature-description-step.md)
