# Video Player

The custom video player is shared by NFT artwork, homepage drop videos, and
Wave submissions. Videos preserve their proportions and show the complete frame.
On the homepage, Next Drop and Latest Drop videos fill the available width on
mobile and desktop, using their aspect ratio for height. The Memes detail video
follows the same sizing rule. Loading listing, subscription, or ownership panels
does not resize or recenter the video. The timeline and controls stay inside the
video frame, not in the surrounding empty space. When NFT animation dimensions are available,
the player reserves those proportions before video metadata loads. If dimensions
are unavailable, the initial placeholder adjusts when the video becomes known.
The submission detail view has a larger viewing area; the video fits within it
without cropping. Compact feed previews retain their smaller viewing areas.

## Playback and time

- The bottom-left capsule contains play/pause and elapsed time / total duration,
  such as `0:06 / 0:10`.
- Pausing switches the capsule icon to play without moving the time. A larger
  play button also appears in the center; either play button resumes playback.
- Before metadata loads, the total duration is shown as `—` and seeking is
  disabled. Once available, the duration is visible even before playback.
- Videos of an hour or longer include hours in both clock values.
- The existing circular mute and fullscreen buttons remain on the right.
  Open and download actions appear on surfaces that provide them.

## Seeking

The timeline sits above the control row. Drag its small circular handle or
select a point on the track. The interaction area is taller than the visible
line, and the handle grows slightly on hover, focus, or while dragging.
The displayed time updates as you seek. Keyboard users can focus the timeline
and use the native slider keys, including arrow keys and Home/End.

## Control visibility

Move the pointer over the video, focus it with the keyboard, or tap to reveal
controls. Controls remain visible while paused, focused, or scrubbing and fade
after inactivity during playback. When hidden, controls do not intercept taps
or remain in the keyboard tab order. The time has a dark capsule background;
there is no broad dark gradient covering the artwork.

Browser-native players, including native fullscreen on devices that require
it, retain the browser's own controls. Control-free previews do not gain controls.

## Related

- [Media Rendering](README.md)
- [Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
