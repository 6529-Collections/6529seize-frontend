# Video layout fixture

`portrait.mp4` is a synthetic 64 × 96 solid-gray H.264 video, 20 frames at 10 fps, generated with AVFoundation. It contains no external artwork or audio. The wave geometry tests serve these committed bytes through a browser-context route in the local composer sandbox; they require no staging wave, account, or media host.

# GIF animation fixture

`animation.gif` is a synthetic 16 × 16 red/blue two-frame GIF with 100/200 ms
delays and infinite looping, generated with Sharp. It contains no user artwork.
The wave image preview test serves it only after an explicit original-playback
action and checks both the requested URL and changing rendered frames.
