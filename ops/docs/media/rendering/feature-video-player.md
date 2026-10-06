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

## Mobile loading and backgrounding

In the Capacitor app and mobile browsers, leaving the app or hiding the browser
tab pauses videos and their loading. Moving a
video outside the viewport also stops buffering; fullscreen video stays active
until fullscreen closes or the app/tab goes into the background. Returning to the
video retains its playback position. Manually started videos stay paused until
you press play again. Ambient autoplay resumes only when the video is visible,
reduced motion permits it, and you have not explicitly paused it.

New videos in the Capacitor app and mobile browsers wait until visible and active before attaching
their source, including videos without a poster. Existing posters stay visible
before playback. Poster-gated videos with a poster
attach their video source when you press play. Ambient videos with posters
wait until visible before loading; videos with manual playback and posters avoid
preloading video data. Duration can remain `—` until playback starts, and starting
or resuming an unloaded video can take longer on a slow connection.

## Wave and DM chat playback

Chat videos start only when you press Play, on desktop, mobile browsers, and
in the app. Opening a chat or scrolling a video into view does not start it.
The video source waits for Play, including videos without a poster. When a
poster is provided it stays visible; otherwise the player shows its empty
frame and Play control. Duration can remain `—` until the video loads.

Starting another chat video pauses the previous one. Scrolling away or hiding
the tab pauses playback; fullscreen stays active while the app/tab is visible.
Returning to the message or tab waits for Play and retains position, mute
choice, and volume, including when the message leaves the render window.
These preferences last while the message remains in the open chat; leaving
the chat or reloading can reset them. Desktop autoplay on NFT and submission
pages follows those pages' existing playback rules.

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
available width and the same 95% usable-screen-height limit as video, except
for stacked homepage images on mobile.

On desktop, homepage images also fit within the height of the adjacent details
section. On mobile, homepage images fill the available width at their natural
aspect ratio, with no reserved blank space above or below. The details follow
directly beneath the image; tall images can extend beyond one screen.
Meme detail images reserve their proportions when dimensions are available,
with a stable fallback frame otherwise. Loading ownership or listing panels
does not vertically recenter a still image against the growing details column.
Wave submission images reserve space for the overlay header and artwork padding.
In these capped layouts, portrait images usually reach the height limit first;
landscape images reach the available width first. Empty space around the artwork
is intentional there, but is not reserved for mobile homepage images.
