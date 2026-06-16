# Wave Drop Video Player

Parent: [Wave Drop Actions Index](README.md)

## Overview

Video media in wave and direct-message drops uses an inline shorts-style player
for short looping artwork and animations. The player keeps source actions close
to the media without relying on the browser's native control chrome.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages/{waveId}`
- Single-drop overlay in the same route context via `?drop={dropId}`
- Drop cards and artwork panels that render uploaded video media

## User Journey

1. Open a thread and find a drop with video media.
2. The video renders inline and loops while muted.
3. When the video is in view, web surfaces autoplay unless autoplay is disabled
   for that context or the user prefers reduced motion.
4. Click or tap the video to pause or resume.
5. Use the always-visible bottom progress strip to see clip progress or seek.
6. Hover the video, or focus a player control with the keyboard, to reveal
   player buttons:
   - `Mute video` / `Unmute video` changes audio state.
   - `Full screen` enters browser fullscreen when supported and not in native app.
   - `Open in new tab` opens the source URL when the browser can render it.
   - `Download media` saves the original video source.

## Edge Cases

- Users with reduced-motion preference do not get automatic playback.
- QuickTime sources that browsers usually download directly hide the open action
  and keep download available.
- Native-app sessions keep the existing play-to-fullscreen behavior.
- If fullscreen is unavailable or denied, the video remains inline and the other
  actions continue to work.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Image Viewer and Scaling](feature-image-viewer-and-scaling.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
