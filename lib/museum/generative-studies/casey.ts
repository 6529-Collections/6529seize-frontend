import type {
  MuseumGenerativeAxis,
  MuseumGenerativeStage,
  MuseumGenerativeStudy,
} from "./types";

const SOURCE_ROOT = "notes/research/generative-systems/casey-reas";
const CASEY_REAS = "Casey Reas";

const stage = (title: string, description: string): MuseumGenerativeStage => ({
  title,
  description,
});

const axis = (
  id: string,
  label: string,
  description: string,
  values: MuseumGenerativeAxis["values"]
): MuseumGenerativeAxis => ({ id, label, description, values });

const labels = (...items: readonly string[]): MuseumGenerativeAxis["values"] =>
  items.map((label) => ({ label }));

const countedLabels = (
  ...items: readonly (readonly [label: string, count: number])[]
): readonly { readonly label: string; readonly count: number }[] =>
  items.map(([label, count]) => ({ label, count }));

const heldPosition = (
  objectId: string,
  title: string,
  coordinatePairs: readonly (readonly [label: string, value: string])[],
  reading: string
): MuseumGenerativeStudy["heldPositions"][number] => ({
  objectId,
  title,
  coordinates: coordinatePairs.map(([label, value]) => ({ label, value })),
  reading,
});

type CaseyStudyInput = Omit<
  MuseumGenerativeStudy,
  "projectId" | "artistName" | "sourcePaths"
>;

const caseyStudy = (study: CaseyStudyInput): MuseumGenerativeStudy => ({
  projectId: `casey-reas-${study.projectSlug}`,
  projectSlug: study.projectSlug,
  projectTitle: study.projectTitle,
  artistName: CASEY_REAS,
  mapKind: study.mapKind,
  mapLabel: study.mapLabel,
  thesis: study.thesis,
  coverageStatement: study.coverageStatement,
  stages: study.stages,
  axes: study.axes,
  heldPositions: study.heldPositions,
  finding: study.finding,
  caveats: study.caveats,
  sourcePaths: [`${SOURCE_ROOT}/${study.projectSlug}.md`],
  visualization: study.visualization,
});

export const GENERATIVE_STUDY_SHARED_NOTES = [
  "The diagrams are Museum analytical views. They are not the artwork, a replacement for the live work, or newly discovered canonical token states.",
  "Counts describe structure or observed feature prevalence. They do not describe rarity, quality, desirability, price, or rank.",
  "The technical studies are constructed Museum research, not artist-approved accounts or amendments to the accession record.",
  "Official response hashes were reproduced, but the Museum has not yet autonomously preserved exact generator and dependency byte packages. Cross-browser and cross-GPU pixel identity is unproven.",
] as const;

const CENTURY = caseyStudy({
  projectSlug: "century",
  projectTitle: "CENTURY",
  mapKind: "sampled_field",
  mapLabel: "Observed edition",
  thesis:
    "Identity persists while adjacency changes: a moving composition remains continuous while its vertical fragments acquire new neighbors.",
  coverageStatement:
    "All 1,000 released metadata records are observed, but the authored generative field is not an exhaustive Cartesian space.",
  stages: [
    stage(
      "Seeded conditions",
      "The token hash fixes palette, oculi, alpha, bands, Janky, background, and the initial cuts."
    ),
    stage(
      "Moving source",
      "Oscillating quadrilaterals and static ellipses compose an off-screen image."
    ),
    stage(
      "Cut and rejoin",
      "Vertical strips sample the image, then permutation and Janky offsets give each fragment new neighbors."
    ),
    stage(
      "Continue the cut",
      "A circular mask restores the figure. Key 1 makes a new partition; key 2 orders the current one."
    ),
  ],
  axes: [
    axis("palette", "Palette", "The selected color family.", [
      ...labels("A", "B", "C", "D"),
    ]),
    axis("bands", "Bands", "The published line quantity.", [
      ...labels("11", "15", "17"),
    ]),
    axis("reordering", "Reordering", "The initial strip condition.", [
      ...labels("Chaos", "Cosmos"),
    ]),
    axis("modifiers", "Modifiers", "Additional fixed token conditions.", [
      ...labels("Oculi", "Alpha", "Janky"),
    ]),
  ],
  heldPositions: [
    heldPosition(
      "6529NM.2026.001.01",
      "CENTURY #31",
      [
        ["Palette", "A"],
        ["Bands", "17"],
        ["Oculi", "Yes"],
        ["Alpha", "No"],
        ["Janky", "No"],
        ["Slices", "16"],
        ["Initial order", "Chaos"],
      ],
      "The dense partition makes the circular field feel pressured by its own internal intervals."
    ),
    heldPosition(
      "6529NM.2026.001.02",
      "CENTURY #724",
      [
        ["Palette", "B"],
        ["Bands", "11"],
        ["Oculi", "Yes"],
        ["Alpha", "No"],
        ["Janky", "Yes"],
        ["Slices", "7"],
        ["Initial order", "Chaos"],
      ],
      "Fewer, displaced fragments make the same operation read as broad interval and rupture."
    ),
    heldPosition(
      "6529NM.2026.001.03",
      "CENTURY #401",
      [
        ["Palette", "C"],
        ["Bands", "15"],
        ["Oculi", "Yes"],
        ["Alpha", "209 published / 209.184 renderer"],
        ["Janky", "No"],
        ["Slices", "10"],
        ["Initial order", "Chaos"],
      ],
      "Translucency lets reordered planes register as shallow depth rather than only division."
    ),
  ],
  finding:
    "Across #31, #724, and #401, the same cut produces compression, rupture, and transparency.",
  caveats: [
    "The three works form a Museum-held comparison, not an artist-designated triptych.",
    "Key 2 orders the current cuts; it does not restore the original partition.",
    "Published Slice Count 0 and Cosmos semantics remain unresolved against runtime behavior.",
  ],
  visualization: {
    kind: "sampled_field",
    design: "century_adjacency_loom",
    dimensions: [
      {
        id: "palette",
        label: "Palette",
        values: labels("A", "B", "C", "D"),
      },
      {
        id: "adjacency",
        label: "Adjacency",
        values: labels("Ordered", "Chaos", "Janky"),
      },
      {
        id: "image",
        label: "Image conditions",
        values: labels("Oculi", "Alpha", "Bands", "Slices"),
      },
    ],
  },
});

const PRE_PROCESS = caseyStudy({
  projectSlug: "pre-process",
  projectTitle: "Pre-Process",
  mapKind: "exhaustive_lattice",
  mapLabel: "Complete 120-position lattice",
  thesis:
    "Pre-Process fixes 120 starting coordinates, then lets time and collision make each run diverge. Eight surfaces decide what remains visible.",
  coverageStatement:
    "Exactly one token occupies each cell of the 8 × 3 × 5 = 120 lattice; the source invocation mapping and complete snapshot agree.",
  stages: [
    stage(
      "120 coordinates",
      "Each invocation occupies one Surface × Origin × Growth position."
    ),
    stage(
      "Seeded population",
      "The hash prepares 100 cells with positions, headings, and radii; one enters every ten frames."
    ),
    stage(
      "Collision over time",
      "Movement, clamping, easing, and index-ordered collisions make a fixed start become a performance."
    ),
    stage(
      "Eight surfaces",
      "Each surface reveals bodies, fading contact memory, or persistent framebuffer history in a different way."
    ),
  ],
  axes: [
    axis(
      "surface",
      "Surface",
      "Eight regimes determine what is drawn and what the image remembers.",
      Array.from({ length: 8 }, (_, index) => ({ label: `${index + 1}` }))
    ),
    axis("origin", "Origin", "Where the population begins.", [
      ...labels("1 · Center", "2 · Horizontal line", "3 · Random positions"),
    ]),
    axis("growth", "Growth", "How cell radius changes across the population.", [
      ...labels(
        "1 · Small → large",
        "2 · Large → small",
        "3 · All small",
        "4 · All large",
        "5 · Nonlinear small → large"
      ),
    ]),
  ],
  heldPositions: [
    heldPosition(
      "6529NM.2026.001.04",
      "Pre-Process #63",
      [
        ["Surface", "8"],
        ["Origin", "1 · Center"],
        ["Growth", "4 · All large"],
        ["Invocation", "63"],
      ],
      "Extreme center-born overlap accumulates as contact evidence; the dark registers are an outcome, not the starting origin."
    ),
  ],
  finding:
    "#63 makes collision legible as memory. Its darkness is not a backdrop imposed on the system; it is a history produced by the system.",
  caveats: [
    "Surface selectors create session views, not new token traits or eight different physical systems.",
    "Reset preserves global frameCount, so the admission phase can differ.",
    "The first-press pause latch still requires exact-runtime confirmation.",
  ],
  visualization: {
    kind: "exhaustive_lattice",
    design: "pre_process_collision_lattice",
    rows: Array.from({ length: 8 }, (_, index) => `Surface ${index + 1}`),
    columns: [
      {
        group: "Origin 1 · Center",
        values: ["Growth 1", "Growth 2", "Growth 3", "Growth 4", "Growth 5"],
      },
      {
        group: "Origin 2 · Line",
        values: ["Growth 1", "Growth 2", "Growth 3", "Growth 4", "Growth 5"],
      },
      {
        group: "Origin 3 · Random",
        values: ["Growth 1", "Growth 2", "Growth 3", "Growth 4", "Growth 5"],
      },
    ],
    selected: { rowIndex: 7, columnGroupIndex: 0, valueIndex: 3 },
  },
});

const PHOTOTAXIS = caseyStudy({
  projectSlug: "phototaxis",
  projectTitle: "Phototaxis",
  mapKind: "dynamic_state",
  mapLabel: "Causal state model",
  thesis:
    "The visible image is delayed evidence of behavior: sensing becomes steering, steering becomes motion, motion becomes brightness, and duration becomes graphic density.",
  coverageStatement:
    "The complete 1,000-token metadata edition is observed, but runtime trajectories are open state histories rather than exhaustively mapped outputs.",
  stages: [
    stage(
      "Hidden lights",
      "The hash fixes lights, population, speed, facade, and the machines' initial positions."
    ),
    stage(
      "Paired sensors",
      "Each machine measures its distance to every active light through a linear or nonlinear response."
    ),
    stage(
      "Crossed wiring",
      "One of four source equations converts the measurements into speed and heading, with seeded variation."
    ),
    stage(
      "Deposited trace",
      "Speed becomes brightness; each movement writes onto an uncleared canvas until the documented 1,000-frame stop."
    ),
  ],
  axes: [
    axis("body", "Body", "Fixed physical and population conditions.", [
      ...labels("Size", "Speed", "Population", "Magnification"),
    ]),
    axis("sensing", "Sensing", "Conditions connecting machines to light.", [
      ...labels("Lights", "Sensors", "Alignment"),
    ]),
    axis(
      "appearance",
      "Appearance",
      "The visual facade applied to the accumulated behavior.",
      labels("Facade")
    ),
  ],
  heldPositions: [
    heldPosition(
      "6529NM.2026.001.05",
      "Phototaxis #308",
      [
        ["Size", "Base"],
        ["Speed", "Lively · maximum 12"],
        ["Lights", "3"],
        ["Facade", "Atomic A"],
        ["Sensors", "Nonlinear"],
        ["Alignment", "Neutral"],
        ["Population", "Assemblage · 200 machines"],
        ["Magnification", "0.66"],
      ],
      "Its visible knot is an archive of sensing and steering, but the deposited marks do not expose those causes unaided."
    ),
  ],
  finding:
    "#308's knots compress the history of three invisible lights. The trace records sensing while keeping its causes out of view.",
  caveats: [
    "The relation between the reconstructed lights and particular knots in the trace is a hypothesis awaiting trace attribution.",
    "The four source constants should not be assigned named Braitenberg behaviors without primary confirmation.",
    "Pressing L while paused advances one full frame. Out-of-bounds paths are source behavior, not symbolic intent.",
    "Art Blocks dates the edition to 2021; the artist’s current NFT register says 2022.",
  ],
  visualization: {
    kind: "dynamic_state",
    design: "phototaxis_causal_trace",
    stateLabels: [
      "Hidden lights",
      "Paired sensors",
      "Wiring",
      "Steering",
      "Motion",
      "Brightness",
      "Accumulated trace",
    ],
    lights: [
      { x: 170, y: 344 },
      { x: -94, y: 466 },
      { x: -1, y: -306 },
    ],
  },
});

const EMPTY_ROOMS = caseyStudy({
  projectSlug: "923-empty-rooms",
  projectTitle: "923 EMPTY ROOMS",
  mapKind: "finite_combinatorial",
  mapLabel: "Complete 923-node grammar",
  thesis:
    "The code names every permitted combination. It cannot predict the room those forms will make.",
  coverageStatement:
    "Indices 1–923 map exactly once to every non-empty multiset of size one through six drawn from six forms. Exceptional invocation 0 sits outside that field.",
  stages: [
    stage("555536", "The invocation resolves to a six-digit table code."),
    stage(
      "Six forms",
      "Its digits select Sun, Shard, Cargo, Hive, Pyramid, and Moon instances."
    ),
    stage(
      "RGB depth",
      "Moving, multiply-blended forms separate into color channels whose intensity becomes spatial depth."
    ),
    stage(
      "The room",
      "Sampled pixels become short lines; rotated orthographic projection makes the field available as architecture."
    ),
  ],
  axes: [
    axis("size", "Multiset size", "The number of selected form instances.", [
      ...countedLabels(
        ["1 form", 6],
        ["2 forms", 21],
        ["3 forms", 56],
        ["4 forms", 126],
        ["5 forms", 252],
        ["6 forms", 462]
      ),
    ]),
    axis(
      "forms",
      "Form counts",
      "A coordinate inside a size group counts each of the six forms.",
      labels("Sun", "Shard", "Cargo", "Hive", "Pyramid", "Moon")
    ),
  ],
  heldPositions: [
    heldPosition(
      "6529NM.2026.001.06",
      "923 EMPTY ROOMS #713",
      [
        ["Invocation", "713"],
        ["Code", "555536"],
        ["Group", "6 forms · 462 possible multisets"],
        [
          "Count vector",
          "Sun 0 · Shard 0 · Cargo 1 · Hive 0 · Pyramid 4 · Moon 1",
        ],
        ["Initial presentation", "CDMX · green channel"],
        ["Depth", "−255…+255"],
      ],
      "The compositional code is fully decodable even as the moving, green, line-built room remains irreducible to that code."
    ),
  ],
  finding:
    "#713 can be decoded completely while its room cannot be exhausted by that decoding. Enumeration closes the grammar, not the experience.",
  caveats: [
    "The 923-node proof remains provisional until its trace is retained and independently reviewed.",
    "Invocation 0 dispatches no implemented form but still renders gradient and line field; it is not described here as the literally empty room.",
    "City presets are presentation structures, not cultural essences. The CDMX depth override applies to invocation 617, not #713.",
    "P saves an image; it does not pause the work.",
  ],
  visualization: {
    kind: "finite_combinatorial",
    design: "empty_rooms_amphitheater",
    groups: countedLabels(
      ["1 form", 6],
      ["2 forms", 21],
      ["3 forms", 56],
      ["4 forms", 126],
      ["5 forms", 252],
      ["6 forms", 462]
    ),
    selectedGroupIndex: 5,
    selectedCode: "555536",
    formCounts: countedLabels(
      ["Sun", 0],
      ["Shard", 0],
      ["Cargo", 1],
      ["Hive", 0],
      ["Pyramid", 4],
      ["Moon", 1]
    ),
  },
});

const COSMOS = caseyStudy({
  projectSlug: "ex-nihilo-cosmos",
  projectTitle: "Ex Nihilo (Cosmos)",
  mapKind: "sampled_field",
  mapLabel: "All 256 realized initial states",
  thesis:
    "A dodecahedron survives as edge, afterimage, depth map, and displaced line—recognizable even as the image keeps changing.",
  coverageStatement:
    "The map contains all 256 realized initial states, not an exhaustive possibility space; frame evolution and session continuations form a second open state axis.",
  stages: [
    stage(
      "Dodecahedral edges",
      "Hash-seeded conditions place, rotate, size, and color one to three golden-ratio solids."
    ),
    stage(
      "Current frame",
      "Colored edges draw additively into a buffer cleared every frame."
    ),
    stage(
      "Accumulated memory",
      "Each current frame enters an uncleared temporal buffer, making motion persist as an afterimage."
    ),
    stage(
      "Displaced channels",
      "Red, green, and blue memory becomes depth and then offset line fields. Spacebar can begin another Still Life."
    ),
  ],
  axes: [
    axis("cosmos", "Cosmos count", "The number of dodecahedral edge systems.", [
      ...countedLabels(["1", 87], ["2", 91], ["3", 78]),
    ]),
    axis(
      "display",
      "Display",
      "The channels made visible in the initial state.",
      countedLabels(
        ["RGB", 159],
        ["White", 81],
        ["Red", 4],
        ["Green", 7],
        ["Blue", 5]
      )
    ),
    axis("chunk", "Published CHUNK", "The published sampling interval.", [
      ...countedLabels(["1", 147], ["3", 79], ["5", 19], ["7", 9], ["10", 2]),
    ]),
  ],
  heldPositions: [
    heldPosition(
      "6529NM.2026.001.07",
      "Ex Nihilo (Cosmos) #248",
      [
        ["Cosmos", "3"],
        ["Display", "White"],
        ["Published CHUNK", "3"],
        ["Runtime metaCHUNK", "4"],
        ["Published channels", "RGB false · FFFFFF true · R/G/B false"],
      ],
      "Three colored dodecahedral edge systems become temporal memory and then three offset white line fields."
    ),
  ],
  finding:
    "#248 makes a solid legible only through fragmentation. Ideal geometry persists by becoming edge, memory, depth, and displaced line.",
  caveats: [
    "The measured public CHUNK-to-runtime metaCHUNK mapping is branch-sensitive; its feature-script rationale remains unresolved.",
    "Never repeats is an artist and platform statement, not an unbounded proof.",
    "Spacebar states are continuing manifestations, not new tokens or automatically canonical states.",
    "Pause freezes rotation while feedback continues. Published uppercase R/B differs from implemented lowercase r/b.",
  ],
  visualization: {
    kind: "sampled_field",
    design: "cosmos_state_atlas",
    dimensions: [
      {
        id: "cosmos",
        label: "Cosmos count",
        values: countedLabels(["1", 87], ["2", 91], ["3", 78]),
      },
      {
        id: "display",
        label: "Display",
        values: countedLabels(
          ["RGB", 159],
          ["White", 81],
          ["Red", 4],
          ["Green", 7],
          ["Blue", 5]
        ),
      },
      {
        id: "chunk",
        label: "Published CHUNK",
        values: countedLabels(
          ["1", 147],
          ["3", 79],
          ["5", 19],
          ["7", 9],
          ["10", 2]
        ),
      },
    ],
  },
});

export const CASEY_GENERATIVE_STUDIES = [
  CENTURY,
  PRE_PROCESS,
  PHOTOTAXIS,
  EMPTY_ROOMS,
  COSMOS,
] as const satisfies readonly MuseumGenerativeStudy[];
