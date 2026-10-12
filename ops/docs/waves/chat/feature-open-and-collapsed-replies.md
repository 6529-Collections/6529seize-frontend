# Open and Collapsed Replies

## Overview

Wave admins can choose who may reply in a wave and where replies appear.

- **Open replies**: everyone who can see the wave can reply to its drops,
  even if they are not in the wave's chat group. Starting a new drop still
  needs chat access.
- **Collapsed replies**: replies stay out of the main chat. Each drop with
  replies shows a `Show N replies` control that opens its thread underneath.

Both settings are off by default. Turning on both suits announcement-style
waves: a small group posts, everyone else can respond without filling the
main chat.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Setting: open `About`, then `Configuration`, then the `Chat` section. The
  `Replies` row shows who can reply (`Chat members` or `Everyone`) and where
  replies appear (`Inline` or `Collapsed`).
- The wave Rules panel shows the same `Replies` value to every viewer.

## Entry Points

- Wave admins and the wave creator select the gear on the `Replies` row and
  set `Anyone who can see this wave can reply` and
  `Collapse replies under each drop`, then select `Save`.
- Viewers who may reply use the drop's `Reply` action (hover actions on
  desktop, long-press menu on touch devices).
- Wave admins and chat members remove unwanted replies with the reply's
  `Delete` action.

## User Journey

1. A viewer outside the chat group opens a wave with open replies. The
   composer area says
   `Only chat members can start new drops here. You can reply to any drop.`
2. They select `Reply` on a drop. The composer opens with the reply target.
3. After sending, the composer returns to the reply-only message.
4. In a wave with collapsed replies, the drop shows `Show N replies`. Selecting it
   opens the thread under the drop, oldest reply first. A new reply opens its
   parent's thread automatically for the person who sent it.
   The sender's pending reply stays visible while saving and loading the thread;
   it is replaced by the saved reply, or removed if sending fails.
5. `Hide replies` closes the thread. Long threads show
   `Show earlier replies` at the top.

## Common Scenarios

- Slow mode and disabled links apply to replies from non-admins, including
  open repliers.
- In a wave with open replies, people who can start drops there (the chat
  group) and the wave's admins and creator can delete anyone's replies from
  the drop's `Delete` action. Top-level drops keep the wave's normal admin
  deletion setting.
- Emoji reactions stay open to everyone who can see the wave, as before.
- Replies can answer other replies inside a thread. The thread shows every
  reply under the top drop.
- Links and notifications that point at a collapsed reply jump to its parent
  drop and open that thread.

## Edge Cases

- Collapsed replies do not count toward the wave's unread count or
  `New Messages` divider, and they do not notify followers who subscribed to
  every drop. The author of the replied-to drop and mentioned profiles are
  still notified.
- Curated views of a wave keep showing curated replies.
- The reply count includes replies to replies anywhere in the thread. Live
  updates refresh the original drop's count from the server for both direct
  and nested replies; duplicate events do not add extra replies.

## Failure and Recovery

- If `Reply` shows `You are not eligible to chat in this wave`, the wave does
  not have open replies, or you cannot see the wave.
- If a thread looks out of date, close and reopen it, or refresh the wave.
- If loading fails, the thread shows `Couldn't load replies.` and `Retry`.
  Replies already loaded stay visible. Select `Retry` to load the thread again.

## Limitations / Notes

- Open replies cover everyone who can see the wave; there is no separate
  reply group yet.
- A thread lists replies under the top drop only. It does not nest threads
  inside threads.
- Proxy profiles and profiles without a handle follow the usual composer
  rules.
