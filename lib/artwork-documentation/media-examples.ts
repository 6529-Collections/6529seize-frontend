/** Authored English examples, not artist submissions, uploaded files or AN ALTERATION facts. */
interface MediaExample {
  readonly workTitle: string;
  readonly medium: string;
  readonly text: string;
}

interface MediaGuide {
  readonly workTitle: string;
  readonly medium: string;
  readonly overview: string;
  readonly answers: Readonly<Record<string, string>>;
}

function toolExamples(
  field: string,
  name: string,
  version: string,
  purpose: string
): Record<string, string> {
  return {
    [field]: `${name}, ${version}. ${purpose}`,
    [`${field}.name`]: name,
    [`${field}.version`]: version,
    [`${field}.purpose`]: purpose,
  };
}

function durationExamples(
  seconds: string,
  note: string
): Record<string, string> {
  return {
    duration: `${seconds} seconds. ${note}`,
    "duration.kind": "Fixed duration.",
    "duration.seconds": seconds,
    "duration.note": note,
  };
}

function dimensionExamples(
  width: string,
  height: string
): Record<string, string> {
  return {
    dimensions: `${width} × ${height} pixels, measured in the final artwork file.`,
    "dimensions.width": width,
    "dimensions.height": height,
  };
}

function dependencyExamples({
  name,
  version,
  kind,
  purpose,
  file,
  failure,
}: {
  readonly name: string;
  readonly version: string;
  readonly kind: string;
  readonly purpose: string;
  readonly file: string;
  readonly failure: string;
}): Record<string, string> {
  return {
    dependencies: `${name}, ${version}. ${purpose} I retain the deposited copy with the work. ${failure}`,
    "dependencies.name": name,
    "dependencies.version": version,
    "dependencies.kind": kind,
    "dependencies.purpose": purpose,
    "dependencies.required":
      "Yes. This dependency is needed for the presentation described here.",
    "dependencies.bundled": "Yes. The deposited package contains this version.",
    "dependencies.asset_id": file,
    "dependencies.source": `The work's deposited package: ${file}.`,
    "dependencies.failure_behavior": failure,
  };
}

/** Each entry describes a distinct fictional work. Display an illustrative-example attribution. */
const MEDIA_EXAMPLE_GUIDES: Readonly<Record<string, MediaGuide>> = {
  photography: {
    workTitle: "AFTER THE RAIN",
    medium: "Photography",
    overview:
      "I photographed an empty bus shelter just after the rain stopped. Water on the glass carries the brighter street across the shaded interior. The finished image comes from one exposure; the changes made afterwards concern tone, colour and the edges of the frame.",
    answers: {
      capture_process:
        "I returned to the shelter in the early evening, when the shop windows opposite had begun to light up. I worked from the pavement with a tripod. Nothing inside the shelter was moved, and I waited until the seats and the reflection were clear of people.",
      ...toolExamples(
        "equipment",
        "Canon EOS R5 and RF 50mm F1.8 STM lens",
        "Camera firmware 2.0.0",
        "I used the tripod to keep the frame steady while retaining detail in the darker glass."
      ),
      source_asset_ids:
        "AFTER-THE-RAIN_CAPTURE.dng and AFTER-THE-RAIN_EDIT.psd. The capture records the exposure; the layered file records my subsequent adjustments.",
      editing:
        "I adjusted white balance, brought back detail in the illuminated shopfront and removed two sensor-dust marks. I did not remove objects or combine exposures. The final crop removes a small strip of pavement from the lower edge.",
      composite: "No. The finished photograph comes from a single exposure.",
      ...dimensionExamples("6000", "4000"),
      color_space: "Adobe RGB (1998), embedded in the final TIFF.",
      bit_depth: "16 bits per channel.",
      master_asset_ids:
        "AFTER-THE-RAIN_MASTER.tif. This flattened file records the complete final crop and colour rendering, without output sharpening.",
      print_instructions:
        "Print the image at 60 × 40 cm on the baryta paper identified in my proofing notes. Compare the print with the signed reference proof after drying. The shelter should remain darker than the street; opening the shadows until every surface is equally clear changes the photograph.",
      proof_asset_ids:
        "AFTER-THE-RAIN_PROOF-NOTES.pdf and AFTER-THE-RAIN_REFERENCE-PRINT.jpg. The latter documents the reference print; it does not replace the print as a colour reference.",
      crop_and_color_intent:
        "Retain the complete 3:2 frame. The blue-green glass and the warmer reflection should remain distinct. Avoid sharpening that turns the rain marks into the dominant texture.",
    },
  },
  digital_art: {
    workTitle: "SOFT REGISTER",
    medium: "Digital painting, illustration & collage",
    overview:
      "I built this image from drawn vector forms and a scan of paper I had rubbed with graphite. The clean edges and the uneven ground need to remain legible together; neither is a background effect.",
    answers: {
      process:
        "I drew the repeated shapes as vectors, then placed them over my graphite rubbing. I adjusted each overlap separately. The slight differences between the repeated shapes are deliberate; I did not use a single pattern tile.",
      ...toolExamples(
        "tools",
        "Krita",
        "5.2.2",
        "I used it to assemble the scanned ground, paint the transitions and prepare the final raster image."
      ),
      form: "Mixed raster and vector.",
      source_asset_ids:
        "SOFT-REGISTER_WORKING.kra, SOFT-REGISTER_FORMS.svg and SOFT-REGISTER_PAPER.tif.",
      contributing_material:
        "The paper scan and all drawn forms are my own. The scan records a graphite rubbing made for this work; no stock textures or third-party images are incorporated.",
      layers:
        "The working file keeps the paper, drawn forms and painted transitions on separate named layers. The flattened master fixes their final appearance. Reordering the layers is not an alternative presentation of the work.",
      typography:
        "There is no text in the image. Marks that resemble letters belong to the drawn forms.",
      color_space: "sRGB IEC61966-2.1, embedded in the master PNG.",
      transparency:
        "The master is opaque. The pale ground is part of the image and should not become transparent or be replaced by a display background.",
      scaling_and_crop:
        "Show the complete square composition. Scale proportionally without cropping. At small sizes the graphite will become less distinct; do not increase its contrast to compensate.",
      master_asset_ids:
        "SOFT-REGISTER_MASTER.png. Use this flattened image as the appearance reference when reopening the working file in another application.",
      ...dependencyExamples({
        name: "SOFT REGISTER paper texture",
        version: "Final scan, 2026",
        kind: "Data",
        purpose:
          "The paper texture is part of the editable source composition.",
        file: "SOFT-REGISTER_PAPER.tif",
        failure:
          "If the texture is unavailable, use the flattened master for display; do not substitute another paper scan.",
      }),
    },
  },
  video: {
    workTitle: "HOLDING LIGHT",
    medium: "Video, animation & motion",
    overview:
      "A drawn patch of light moves slowly across an empty room. I wanted the small changes in its edge to register before the movement of the whole shape. The pauses and the sound are part of that pace.",
    answers: {
      process:
        "I drew the frames individually and assembled them with a stereo recording of the room. I retained small differences in the line instead of smoothing the movement between drawings.",
      ...durationExamples(
        "120",
        "The final two seconds of black and silence are included in the file and belong to the work."
      ),
      frame_rate: "24 frames per second, constant frame rate.",
      ...dimensionExamples("1920", "1080"),
      codec: "Apple ProRes 422 HQ for the preservation master.",
      container: "QuickTime MOV.",
      color_and_hdr:
        "Rec. 709, standard dynamic range. The darkest wall should remain visible against the black interval. HDR conversion is not part of the intended presentation.",
      audio_tracks:
        "One stereo mix, embedded in the master. Left and right follow the room as seen on screen. There is no dialogue.",
      playback:
        "Play the complete file at 24 frames per second with its embedded stereo mix. Retain the full 16:9 frame. Disable motion interpolation and automatic contrast enhancement.",
      looping:
        "Return directly from the end of the file to the beginning. The two-second interval is already included; do not add a player pause or crossfade.",
      synchronization:
        "Picture and sound begin together and remain synchronized throughout the file. The faint knock near the middle should coincide with the light reaching the doorframe.",
      caption_asset_ids:
        "HOLDING-LIGHT_CAPTIONS.vtt. The captions identify the few significant sounds for a viewer who cannot hear the soundtrack.",
      master_asset_ids: "HOLDING-LIGHT_MASTER.mov.",
      source_asset_ids:
        "HOLDING-LIGHT_FRAMES.zip and HOLDING-LIGHT_SOUND.wav. The frame archive preserves the original drawings in sequence.",
      acceptable_transcoding:
        "A display copy may use another codec if frame count, timing, colour and stereo placement remain unchanged. Compare the result with the master, especially the slow movement and the dark wall. Do not convert to a different frame rate.",
    },
  },
  audio: {
    workTitle: "ROOM TONE",
    medium: "Audio, sound & music",
    overview:
      "The work brings recordings from four corners of one room into a single listening space. Low sustained tones slowly alter the apparent distance between them. A listener should be able to remain still and hear the room change around them.",
    answers: {
      process:
        "I recorded each corner separately, then placed those recordings against sustained electronic tones. I edited the entrances by listening from the centre of the speaker arrangement. The apparent movement comes from changes between the channels, not from a rotating sound effect.",
      ...durationExamples(
        "185.5",
        "This includes the final decay. Let it finish before restarting."
      ),
      sample_rate_hz: "48000 Hz.",
      bit_depth: "24-bit PCM.",
      channels: "4 discrete channels.",
      spatial_layout:
        "Place four matched speakers at the corners of a square around the listening position. Channel order is front left, front right, rear right, rear left, as shown in the placement drawing.",
      codec: "Uncompressed linear PCM.",
      container: "WAV.",
      playback:
        "Play the four channels together through separate speakers. The centre of the arrangement is the reference listening position, but visitors may move within it. A stereo fold-down is an access version and should be identified as such.",
      level:
        "Set the level so that the quiet room recordings remain audible without making the sustained tones overwhelming. Use the calibration passage and level notes deposited with the mix; do not apply automatic normalization or compression.",
      sequencing_and_looping:
        "Play the complete sequence once, allowing the final decay to end. If presented continuously, leave the ten-second interval specified in the installation notes between plays. Do not crossfade the end into the beginning.",
      master_asset_ids: "ROOM-TONE_MASTER_4CH.wav.",
      stem_asset_ids:
        "ROOM-TONE_RECORDINGS_4CH.wav and ROOM-TONE_TONES_4CH.wav. These synchronized stems are retained for preservation, not for a visitor-controlled remix.",
      source_asset_ids:
        "ROOM-TONE_FIELD-RECORDINGS.zip and ROOM-TONE_SESSION.zip. The session notes identify the channel order and the edits used in the final mix.",
    },
  },
  html: {
    workTitle: "A SMALL WEATHER",
    medium: "HTML & web",
    overview:
      "The browser opens onto a field of slowly changing marks. Moving the pointer does not control the weather; it reveals the time spent in one place. The work needs no live weather feed or account.",
    answers: {
      entry_document: "index.html",
      package_asset_ids:
        "A-SMALL-WEATHER_WEB.zip. The archive contains the entry page and every file needed by the work.",
      asset_tree:
        "index.html opens app.js and style.css. The assets folder contains the drawn glyphs and reference textures. Keep these relative paths intact when unpacking the deposited archive.",
      ...dependencyExamples({
        name: "A SMALL WEATHER glyph set",
        version: "1.0",
        kind: "Font",
        purpose:
          "My drawn glyphs determine the shape and spacing of the changing marks.",
        file: "assets/glyphs.svg",
        failure:
          "If the glyph file cannot be loaded, show the included explanatory fallback instead of replacing the marks with a system font.",
      }),
      browser_requirements:
        "The deposited version uses WebGL 2. It includes a fallback message for a browser that cannot create that rendering context. The reference capture records the intended behaviour in the browser version listed in my environment notes.",
      viewport_behavior:
        "The field expands to the available viewport. Marks retain their proportions, while their number changes with the area. Keep the short introductory line visible; it should not be cropped on a narrow screen.",
      input_methods:
        "Pointer or touch reveals a local trail. Keyboard users move the same focus point with the arrow keys. Neither input method changes the underlying sequence.",
      network_behavior:
        "After the deposited package loads, it makes no external requests. It uses no wallet connection, remote API, analytics service or live data feed.",
      offline_behavior:
        "The work runs offline when the unpacked package is served by a local static server. The entry page should not be opened directly as a file URL because the browser may block its module imports.",
      storage_behavior:
        "The current trail remains in memory for the session. No participant information is saved to local storage or sent elsewhere. Reloading starts a new trail.",
      reference_asset_ids:
        "A-SMALL-WEATHER_REFERENCE.mp4 and A-SMALL-WEATHER_VIEWPORTS.pdf. These show a complete cycle and the intended layouts at three viewport sizes.",
      accessibility:
        "The introductory text and controls are available to assistive technology. Keyboard and touch provide the same local trail. Reduced-motion mode slows the field without changing the order of its states; its appearance is shown in the access reference capture.",
    },
  },
  generative: {
    workTitle: "MEASURE OF A FIELD",
    medium: "Generative & software",
    overview:
      "A seeded arrangement of lines develops across a fixed field. Each seed establishes the geometry; the drawing gradually makes that arrangement visible. I distinguish the variation between seeds from changes introduced by a different runtime.",
    answers: {
      process:
        "I wrote a set of rules for spacing and bending the lines, then compared many seeds while revising the permitted range. I retained seeds that produced awkward gaps as well as dense fields. Those differences belong to the work.",
      source_asset_ids:
        "MEASURE-OF-A-FIELD_SOURCE.zip. It contains the source, the locked dependency versions, the build instructions and the reference seed set.",
      build_instructions:
        "Use the package and lockfile together, following BUILD.md. The build produces the deposited viewer directory. Preserve the tool versions recorded there and compare the output against the reference seeds before treating a later build as equivalent.",
      runtime:
        "The archived JavaScript module runs in the deposited browser viewer. The environment notes identify the browser and build used for the approved reference captures.",
      ...dependencyExamples({
        name: "Field seeded-number module",
        version: "1.0",
        kind: "Library",
        purpose:
          "This module supplies the ordered pseudorandom numbers used to construct each field.",
        file: "vendor/field-rng.js",
        failure:
          "Without this exact sequence the geometry may change. Stop with an explanatory message instead of falling back to another random-number generator.",
      }),
      parameters:
        "The seed is the variable input. Canvas proportion, line-count range and stroke rules are fixed in the deposited release. The viewer's scale control changes display size only; it does not regenerate the field.",
      randomness:
        "Seeded. The viewer converts the supplied token-hash string into the initial state using the conversion recorded in SEEDS.md. The archived number generator determines every subsequent draw.",
      "randomness.kind": "Seeded.",
      "randomness.account":
        "The same token-hash string must produce the same line geometry. The conversion and generator are deposited with the source so that a later implementation can reproduce their sequence.",
      state:
        "The viewer holds the current drawing progress in memory. Restarting clears that progress and draws the same seeded field again. There is no saved participant state.",
      chain_and_data_inputs:
        "The viewer accepts a token-hash string as an input. It does not query a chain or verify ownership. The reference seed set records the strings used for the deposited captures.",
      reference_asset_ids:
        "MEASURE-OF-A-FIELD_SEEDS.json and MEASURE-OF-A-FIELD_REFERENCES.zip. Each capture is named for its seed and drawing checkpoint.",
      permissible_variation:
        "The time taken to draw a field may vary with the device. Its geometry, stroke relationships and final composition for a given seed must remain the same. A faster device should not produce a denser field.",
      reexecution_criteria:
        "Render the deposited reference seeds at the checkpoints specified in SEEDS.md. Compare geometry and final composition with the corresponding images, and retain the runtime details with that comparison. A different-looking field from the same seed needs review.",
    },
  },
  interactive: {
    workTitle: "ANOTHER READING",
    medium: "Interactive work, games & participation",
    overview:
      "A short phrase follows a point that the reader can move. The sentence remains the same, but its route changes how it is encountered. There is no score or correct arrangement.",
    answers: {
      interaction_rules:
        "Dragging the point bends the path followed by the phrase. The words keep their order while moving along that path. Releasing the point leaves the new path in place; the text continues to circulate.",
      controls:
        "Drag the point with a pointer or touch. With the keyboard, focus the point and use the arrow keys. The reset control returns to the opening arrangement.",
      duration:
        "Variable. The text continues until the reader leaves; a session has no prescribed ending.",
      "duration.kind": "Variable duration.",
      "duration.seconds":
        "For a fixed presentation, I would record its actual duration here. ANOTHER READING has no fixed number of seconds.",
      "duration.note":
        "A reader may stay for one circuit of the phrase or continue changing its route. Neither completes the work more fully.",
      state_and_reset:
        "The current path remains in memory during the session. Resetting or reloading restores the opening arrangement. Previous readers' paths are not retained.",
      participation:
        "One person controls a session at a time. Other visitors may watch, but there is no shared network state. A museum presentation should make the control point reachable from a seated position.",
      network_behavior:
        "No network connection is needed after the work has loaded. Inputs remain on the local device.",
      failure_modes:
        "If pointer input is unavailable, keyboard control remains usable. If the text cannot be rendered, show the explanatory fallback. Do not replace the phrase with an image of a previous session and describe it as interactive.",
      essential_interactions:
        "Moving the point must change the path continuously, without jumps between preset arrangements. Word order and readable spacing must survive the movement.",
      optional_interactions:
        "The small change in the point's colour on focus helps someone find the control. Its precise hue may change for contrast, provided focus remains clearly visible.",
      reference_asset_ids:
        "ANOTHER-READING_POINTER.mp4 and ANOTHER-READING_KEYBOARD.mp4. The captures show equivalent paths made with the two input methods.",
      accessibility:
        "The complete phrase is also available as text. Keyboard control uses the same point and path as pointer input. Reduced-motion mode lets a reader advance the phrase deliberately while retaining its order and changing route.",
    },
  },
  spatial: {
    workTitle: "WITHIN REACH",
    medium: "3D, spatial, AR & VR",
    overview:
      "Translucent forms occupy a room whose scale is close to that of the body. Moving between them changes which surfaces can be seen together. The work depends on that relation of distance and overlap more than on a particular headset.",
    answers: {
      scene_description:
        "Six translucent forms stand within a three-metre square. Their heights vary, but each is narrow enough to move around. The opening view leaves a clear route into the group rather than presenting it as a sculpture seen from outside.",
      model_asset_ids:
        "WITHIN-REACH_SCENE.gltf and its accompanying binary data, retained together in WITHIN-REACH_SCENE.zip.",
      texture_asset_ids:
        "WITHIN-REACH_TEXTURES.zip. The filenames and colour-space notes correspond to the materials in the deposited scene.",
      units_and_coordinates:
        "Metres. Y is up; the origin is at the centre of the floor. The scale recorded in the scene is the intended bodily scale and should not be changed to fill a room automatically.",
      materials:
        "The forms use translucent, softly rough surfaces. They should overlap without becoming clear glass or opaque blocks. Compare the pale edges and the visibility of a second form through the first with the reference captures.",
      rigging_and_animation:
        "There is no rigging or object animation. Apparent movement comes from the visitor's changing position. Do not add idle movement to make the scene appear more active.",
      camera_and_lighting:
        "Use the deposited soft overhead light and neutral surround. The initial camera faces the opening between the two lowest forms. Automatic exposure should not make the forms brighter as a visitor moves closer.",
      engine_and_runtime:
        "The deposited glTF scene is presented by the accompanying PBR viewer. Its environment notes identify the renderer version and settings used for the reference captures.",
      devices_and_controllers:
        "The primary presentation uses a six-degree-of-freedom headset. A seated navigation mode preserves the same metre scale and routes. A desktop view may provide access to the scene, but should be identified as an alternative presentation.",
      spatial_audio:
        "There is no sound in this work. Headset interface sounds are not part of the scene and should be disabled where practical.",
      reference_asset_ids:
        "WITHIN-REACH_WALKTHROUGH.mp4, WITHIN-REACH_VIEWS.zip and WITHIN-REACH_LAYOUT.pdf.",
      ...dependencyExamples({
        name: "WITHIN REACH viewer",
        version: "1.0",
        kind: "Runtime",
        purpose:
          "The viewer interprets the scene's translucent materials and preserves metre scale.",
        file: "WITHIN-REACH_VIEWER.zip",
        failure:
          "If the required transparency behaviour is unavailable, show the access reference with an explanation. Do not silently replace the material with an opaque one.",
      }),
    },
  },
  text: {
    workTitle: "THE DOOR",
    medium: "Text, poetry & publications",
    overview:
      "The work consists of two sentences on two lines. Their unequal lengths and the space around them matter to the reading. The visual presentation and an accessible text version carry the same words.",
    answers: {
      authoritative_text:
        "The door remembers every hand.\nThe wall remembers none.",
      source_asset_ids:
        "THE-DOOR_TEXT.txt, THE-DOOR_LAYOUT.svg and THE-DOOR_REFERENCE.pdf. The text file preserves the words; the layout records their intended placement.",
      languages: "English (en).",
      typography:
        "Use my deposited letterforms and spacing. The letters are plain and close to ordinary handwriting; a decorative substitute changes the voice of the work. The reference layout records line spacing and letter size.",
      layout:
        "Keep the two lines left aligned within the central field. Leave the shorter second line at its natural length. Do not centre each line separately or stretch the words to fill the width.",
      reading_order:
        "Read the upper line first, then the lower line. The period at the end of each sentence is intentional.",
      pagination:
        "A single page. Do not divide the two sentences between pages or screens.",
      embedded_media_asset_ids:
        "There is no embedded image, sound or video in this work. The reference PDF documents the text's presentation.",
      presentation: "Fixed layout.",
      accessible_text:
        "The door remembers every hand.\nThe wall remembers none.",
      ...dependencyExamples({
        name: "THE DOOR letterforms",
        version: "Final set, 2026",
        kind: "Font",
        purpose:
          "These original outlined letterforms establish the visual voice and spacing of the work.",
        file: "THE-DOOR_LETTERFORMS.svg",
        failure:
          "If the original presentation cannot be rendered, provide the accessible text with an explanation. A replacement typeface requires review.",
      }),
    },
  },
  installation: {
    workTitle: "BETWEEN SIGHT AND SOUND",
    medium: "Installation, performance & mixed media",
    overview:
      "A photographic print faces a speaker across an otherwise empty space. The image stays still while a short sound sequence changes the apparent distance to it. The work is the arrangement and the encounter between these elements.",
    answers: {
      account:
        "I place a photograph of an empty passage opposite a single speaker. The sound was recorded elsewhere. I want the viewer to notice the space between the two before deciding whether they describe the same place.",
      component_ids:
        "The photographic image, its reference print and the mono sound sequence, each identified in the Components section. The loudspeaker and playback device are supporting hardware.",
      installation_instructions:
        "Hang the 60 × 40 cm print with its centre at 150 cm. Place the speaker three metres opposite it, facing the print. Keep the route between them clear. Use the installation drawing to establish their alignment before adjusting the listening level.",
      ...toolExamples(
        "hardware",
        "Full-range loudspeaker and local audio player",
        "Models recorded for each realization",
        "The speaker presents the mono sequence without added spatial effects; the player preserves its timing and the interval between plays."
      ),
      site_conditions:
        "Use a quiet interior with enough space to stand between the print and speaker. Avoid direct daylight on the print and audible sound from an adjacent work. Record any departure from the reference layout as part of that realization.",
      ordering_and_synchronization:
        "The print remains visible throughout. Play the mono sequence once, followed by the interval specified in the sound notes. There is no lighting change at the start or end, and visitors do not trigger playback.",
      replacement_constraints:
        "The player and speaker may be replaced with equivalents that preserve the documented timing, frequency range and placement. Keep the photographic image and sound sequence unchanged. A different print size or stereo presentation requires review.",
      realization_account:
        "For the studio reference realization, I placed the speaker three metres from the print in an otherwise empty room. The installation photographs show the alignment and the listening position. This records that realization; it does not claim a later museum installation has occurred.",
      reference_asset_ids:
        "BETWEEN-SIGHT-AND-SOUND_LAYOUT.pdf, BETWEEN-SIGHT-AND-SOUND_STUDIO-VIEWS.zip and BETWEEN-SIGHT-AND-SOUND_REFERENCE.mp4.",
      ...dependencyExamples({
        name: "BETWEEN SIGHT AND SOUND playback sequence",
        version: "Final sequence, 2026",
        kind: "Data",
        purpose:
          "The sequence preserves the complete sound file and the intended interval between plays.",
        file: "BETWEEN-SIGHT-AND-SOUND_PLAYBACK.json",
        failure:
          "If automatic sequencing fails, stop playback until the timing can be restored; do not substitute continuous looping.",
      }),
    },
  },
};

/** Exact field lookup; array indices are ignored, but unknown fields never receive a generic answer. */
export function lookupMediaExample(
  moduleId: string,
  fieldId: string
): MediaExample | undefined {
  if (moduleId !== "process") return undefined;
  const path = fieldId
    .replace(/^process\./, "")
    .replace(/\[\d*\]/g, "")
    .split(".")
    .filter((part) => !/^\d+$/.test(part));
  const mediaId = path.shift()?.replace(/^media_/, "");
  if (!mediaId || !Object.hasOwn(MEDIA_EXAMPLE_GUIDES, mediaId))
    return undefined;
  const guide = MEDIA_EXAMPLE_GUIDES[mediaId];
  if (!guide) return undefined;
  const key = path.join(".");
  if (key && !Object.hasOwn(guide.answers, key)) return undefined;
  const text = key ? guide.answers[key] : guide.overview;
  return text
    ? { workTitle: guide.workTitle, medium: guide.medium, text }
    : undefined;
}
