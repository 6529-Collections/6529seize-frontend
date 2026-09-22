# Video Player

The custom video player is shared by NFT artwork, homepage drop videos, and
Wave submissions. Videos preserve their proportions and show the complete frame.
On the homepage, The Memes detail page, and Wave submission detail, videos use the available width until
they reach 95% of the usable screen height. This applies in desktop browsers,
mobile browsers, and the mobile app, allowing for the app header, bottom navigation,
and safe areas. Taller videos become narrower and stay centered without cropping.
The height limit stays stable when mobile browser toolbars change visibility.
Fullscreen continues to use the full viewing area. Loading listing, subscription, or ownership panels
does not resize the video. Homepage artwork is vertically centered in its column. The Memes detail keeps its
full-column dark background and centers the capped video inside it. Expanded wave
submissions center video in the available area below the overlay header.
Centering can change the video’s position when its container grows, but not its dimensions.
The timeline and controls stay inside the
video frame, not in the surrounding empty space. When NFT animation dimensions are available,
the player reserves those proportions before video metadata loads. If dimensions
are unavailable, the initial placeholder adjusts when the video becomes known.
Wave submission detail accounts for its overlay header and artwork padding in
the same height limit, and stays within the overlay when it is shorter than the
screen. Compact feed previews retain their smaller viewing areas.

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

## Still artwork sizing

Still images on the homepage, individual Meme pages, and expanded Wave
submissions preserve their proportions without cropping. They fit within the
available width and the same 95% usable-screen-height limit as video.

On desktop, homepage images also fit within the height of the adjacent details
section. On mobile, the image appears above the details and uses its own frame.
Meme detail images reserve their proportions when dimensions are available,
with a stable fallback frame otherwise. Loading ownership or listing panels
does not vertically recenter a still image against the growing details column.
Wave submission images reserve space for the overlay header and artwork padding.
Portrait images usually reach the height limit first; landscape images reach
the available width first. Empty space around the artwork is intentional.
