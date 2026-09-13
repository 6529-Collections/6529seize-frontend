import type { CmsStudioDesign } from "./presentation";

export const CMS_STUDIO_COLORWAYS = [
  "original",
  "seize",
  "midnight",
  "olive",
  "plum",
  "gallery-white",
  "carbon",
  "clay",
  "white-cube",
  "oxblood",
  "slate",
  "newsprint",
  "acid",
  "cobalt",
  "forest",
  "navy",
  "burgundy",
  "graphite",
] as const;
export type CmsColorwayId = (typeof CMS_STUDIO_COLORWAYS)[number];

interface CmsColorway {
  readonly id: CmsColorwayId;
  readonly name: string;
  readonly swatches: readonly string[];
  /** The authored accent. Rendering derives accessible text-bearing variants. */
  readonly accent: string;
}

interface PaletteSeed {
  readonly name: string;
  readonly paper: string;
  readonly panel: string;
  readonly ink: string;
  readonly muted: string;
  readonly accent: string;
  readonly deep: string;
  readonly soft: string;
  readonly secondary: string;
  readonly poster: string;
  readonly details?: {
    readonly hero?: string;
    readonly mat?: string;
    readonly catalogueMat?: string;
    readonly cataloguePaper?: string;
    readonly bookOne?: string;
    readonly bookTwo?: string;
    readonly bookThree?: string;
    readonly posterTwo?: string;
    readonly posterOneMark?: string;
    readonly posterTwoMark?: string;
  };
}

const SEEDS = {
  seize: {
    name: "6529",
    paper: "#131316",
    panel: "#1c1c21",
    ink: "#efeff1",
    muted: "#cecfd4",
    accent: "#3f69fc",
    deep: "#131316",
    soft: "#26272b",
    secondary: "#395fe4",
    poster: "#84adff",
  },
  midnight: {
    name: "Midnight",
    paper: "#101925",
    panel: "#172536",
    ink: "#f0f2f5",
    muted: "#b8c8dc",
    accent: "#9bbcf2",
    deep: "#091323",
    soft: "#22354b",
    secondary: "#c1d2e8",
    poster: "#a4bedc",
  },
  olive: {
    name: "Olive",
    paper: "#edf0df",
    panel: "#e0e6cf",
    ink: "#26301b",
    muted: "#4d583b",
    accent: "#4c602e",
    deep: "#293b24",
    soft: "#cdd9b4",
    secondary: "#c2a566",
    poster: "#e2c992",
  },
  plum: {
    name: "Plum",
    paper: "#f1e9ef",
    panel: "#e6d9e3",
    ink: "#342132",
    muted: "#634560",
    accent: "#72395c",
    deep: "#3b2039",
    soft: "#dcc6d6",
    secondary: "#c696ae",
    poster: "#e9c1af",
  },
  "gallery-white": {
    name: "Gallery white",
    paper: "#fbfaf7",
    panel: "#eeece7",
    ink: "#292623",
    muted: "#645c53",
    accent: "#89603e",
    deep: "#332c26",
    soft: "#e7e1d7",
    secondary: "#b99c7e",
    poster: "#d7b894",
  },
  carbon: {
    name: "Carbon",
    paper: "#171717",
    panel: "#242424",
    ink: "#f2f0eb",
    muted: "#c6c2b9",
    accent: "#ddb992",
    deep: "#0b0b0b",
    soft: "#33312e",
    secondary: "#b59570",
    poster: "#dad3c5",
  },
  clay: {
    name: "Clay",
    paper: "#f0e3d8",
    panel: "#e6d2c1",
    ink: "#372920",
    muted: "#655043",
    accent: "#91492f",
    deep: "#552e25",
    soft: "#d9b9a0",
    secondary: "#b86648",
    poster: "#e2b590",
  },
  "white-cube": {
    name: "White cube",
    paper: "#ffffff",
    panel: "#f0f0ed",
    ink: "#171917",
    muted: "#5a5e58",
    accent: "#303d31",
    deep: "#192019",
    soft: "#e1e5de",
    secondary: "#a9b6a0",
    poster: "#cfddc5",
  },
  oxblood: {
    name: "Oxblood",
    paper: "#211217",
    panel: "#301c23",
    ink: "#f5e9e4",
    muted: "#d5bcb9",
    accent: "#e6a593",
    deep: "#170c10",
    soft: "#462832",
    secondary: "#a76064",
    poster: "#d7ad91",
  },
  slate: {
    name: "Slate",
    paper: "#202930",
    panel: "#2a3740",
    ink: "#f0f2ef",
    muted: "#c4d1d5",
    accent: "#adcbd1",
    deep: "#141e25",
    soft: "#374953",
    secondary: "#94b0b5",
    poster: "#c9bfa6",
  },
  newsprint: {
    name: "Newsprint",
    paper: "#ece8dc",
    panel: "#e0dbce",
    ink: "#22231e",
    muted: "#59594e",
    accent: "#9b3023",
    deep: "#25251e",
    soft: "#cec8b6",
    secondary: "#bd5941",
    poster: "#dec48c",
  },
  acid: {
    name: "Acid",
    paper: "#e6efaa",
    panel: "#d7e78d",
    ink: "#202810",
    muted: "#4c5727",
    accent: "#364b17",
    deep: "#263214",
    soft: "#c9db72",
    secondary: "#acc342",
    poster: "#f4ed96",
  },
  cobalt: {
    name: "Cobalt",
    paper: "#142dac",
    panel: "#203ebd",
    ink: "#ffffff",
    muted: "#e2e8ff",
    accent: "#f4db75",
    deep: "#0c1c76",
    soft: "#2c4bce",
    secondary: "#e4bd58",
    poster: "#f2dc95",
  },
  forest: {
    name: "Forest",
    paper: "#142c24",
    panel: "#1c3b2f",
    ink: "#f0f2df",
    muted: "#c8d8bd",
    accent: "#d3d68b",
    deep: "#0e2019",
    soft: "#294c3a",
    secondary: "#a8b975",
    poster: "#e3d69b",
  },
  navy: {
    name: "Navy",
    paper: "#eff1ed",
    panel: "#e1e6e4",
    ink: "#1f3045",
    muted: "#4f5d6d",
    accent: "#2c5074",
    deep: "#18334c",
    soft: "#ced8dc",
    secondary: "#96b3c5",
    poster: "#d5c494",
  },
  burgundy: {
    name: "Burgundy",
    paper: "#f1e9df",
    panel: "#e7d9cc",
    ink: "#42242c",
    muted: "#6a4b50",
    accent: "#782e43",
    deep: "#4b2030",
    soft: "#d9bfb8",
    secondary: "#b9797c",
    poster: "#dcb990",
  },
  graphite: {
    name: "Graphite",
    paper: "#e9eae6",
    panel: "#dcdfd9",
    ink: "#282f2b",
    muted: "#555f56",
    accent: "#435b4c",
    deep: "#26332c",
    soft: "#cbd2c8",
    secondary: "#92a593",
    poster: "#c2c4a2",
  },
} satisfies Record<Exclude<CmsColorwayId, "original">, PaletteSeed>;

const ORIGINALS: Record<CmsStudioDesign, PaletteSeed> = {
  "personal-v2": {
    name: "Original",
    paper: "#f4f5f7",
    panel: "#e5eafe",
    ink: "#17243d",
    muted: "#505c72",
    accent: "#183ddd",
    deep: "#183ddd",
    soft: "#ffdcd3",
    secondary: "#ff806b",
    poster: "#e3a454",
    details: {
      hero: "#ffffff",
      catalogueMat: "#ed927c",
      cataloguePaper: "#fffaf0",
      bookOne: "#e3a454",
      bookTwo: "#284a3d",
      bookThree: "#6b6e96",
    },
  },
  "artist-v2": {
    ...SEEDS["gallery-white"],
    name: "Original",
    paper: "#f5f3ed",
    panel: "#ecebe3",
    accent: "#566747",
    details: { mat: "#ecebe3" },
  },
  "collector-v2": {
    ...SEEDS.carbon,
    name: "Original",
    paper: "#111214",
    panel: "#191c19",
    ink: "#f3f1ed",
    muted: "#b8bbb5",
    accent: "#c3ed91",
    deep: "#090b09",
    details: { mat: "#090b09" },
  },
  "meme-v2": {
    name: "Original",
    paper: "#ddb581",
    panel: "#efd3ac",
    ink: "#11110f",
    muted: "#4d4539",
    accent: "#82d9d9",
    deep: "#007076",
    soft: "#e6c496",
    secondary: "#a55635",
    poster: "#f4d771",
  },
  "organization-v2": {
    name: "Original",
    paper: "#f44b24",
    panel: "#fff9ec",
    ink: "#251d19",
    muted: "#442e21",
    accent: "#f44b24",
    deep: "#251d19",
    soft: "#fff0d3",
    secondary: "#f9d968",
    poster: "#f9d968",
    details: {
      posterTwo: "#29362a",
      posterOneMark: "#f44b24",
      posterTwoMark: "#b5c99c",
    },
  },
  "fund-v2": {
    name: "Original",
    paper: "#f2f3eb",
    panel: "#e4e9dc",
    ink: "#17392a",
    muted: "#536956",
    accent: "#17392a",
    deep: "#193e2c",
    soft: "#d9e1cb",
    secondary: "#b5c597",
    poster: "#d4c7a2",
    details: { mat: "#e2e6d9" },
  },
};

function seedFor(design: CmsStudioDesign, id: CmsColorwayId): PaletteSeed {
  return id === "original" ? ORIGINALS[design] : SEEDS[id];
}

const DEFINITIONS = new Map<CmsStudioDesign, readonly CmsColorway[]>();
const RESOLVED = new Map<string, CmsColorwayVariables>();
const RESOLVED_CACHE_LIMIT = 128;

/** All colourways are shared; Original retains each design's colour family. */
export function getCmsColorways(
  design: CmsStudioDesign
): readonly CmsColorway[] {
  const previous = DEFINITIONS.get(design);
  if (previous) return previous;
  const definitions = CMS_STUDIO_COLORWAYS.map((id) => {
    const seed = seedFor(design, id);
    const variables = resolveCmsColorway(design, id)!;
    return Object.freeze({
      id,
      name: seed.name,
      accent: seed.accent,
      swatches: Object.freeze([
        variables["--cms-colorway-paper"],
        variables["--cms-colorway-ink"],
        variables["--cms-colorway-accent"],
        variables["--cms-colorway-secondary-panel"],
      ]),
    });
  });
  DEFINITIONS.set(design, Object.freeze(definitions));
  return definitions;
}

function rgb(hex: string): number[] {
  return [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16)
  );
}

function luminance(hex: string): number {
  return rgb(hex).reduce((total, channel, index) => {
    const value = channel / 255;
    const linear =
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return total + linear * ([0.2126, 0.7152, 0.0722][index] ?? 0);
  }, 0);
}

function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function mix(first: string, second: string, amount: number): string {
  const target = rgb(second);
  return `#${rgb(first)
    .map((value, index) =>
      Math.round(value + ((target[index] ?? 0) - value) * amount)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

/** Find the closest tint/shade satisfying every surface, using finite RGB output. */
function legible(
  color: string,
  backgrounds: readonly string[],
  minimum = 7
): string {
  const fits = (candidate: string) =>
    backgrounds.every(
      (background) => contrast(candidate, background) >= minimum
    );
  if (fits(color)) return color;
  for (let step = 1; step <= 100; step += 1) {
    for (const end of ["#000000", "#ffffff"]) {
      const candidate = mix(color, end, step / 100);
      if (fits(candidate)) return candidate;
    }
  }
  // Seed surfaces share a light/dark family. This endpoint is also deterministic
  // for a defensive caller supplying an accent unrelated to that family.
  return backgrounds.reduce(
    (total, background) => total + luminance(background),
    0
  ) /
    backgrounds.length >
    0.18
    ? "#000000"
    : "#ffffff";
}

function textSurface(background: string) {
  const ink =
    contrast(background, "#ffffff") >= contrast(background, "#000000")
      ? "#ffffff"
      : "#000000";
  return { background: legible(background, [ink]), ink };
}

function resolveVariables(authored: PaletteSeed, accent: string) {
  const seed = {
    ...authored,
    paper: textSurface(authored.paper).background,
    panel: textSurface(authored.panel).background,
    soft: textSurface(authored.soft).background,
  };
  const surfaces = [seed.paper, seed.panel, seed.soft];
  const ink = legible(seed.ink, surfaces);
  const muted = legible(seed.muted, surfaces);
  const line = legible(seed.muted, surfaces, 3.1);
  // The app's primary-300 is an existing AAA-compatible blue/black pair.
  // Keep primary-500 as authored data rather than replacing a user's accent.
  const active = textSurface(
    seed.name === "6529" && accent === seed.accent ? "#84adff" : accent
  );
  const header = textSurface(seed.deep);
  const secondary = textSurface(seed.secondary);
  const poster = textSurface(seed.poster);
  const posterTwo = textSurface(seed.details?.posterTwo ?? seed.secondary);
  const mat = textSurface(seed.details?.mat ?? seed.soft).background;
  const hero = textSurface(seed.details?.hero ?? seed.panel).background;
  const editor = textSurface(seed.deep);
  const catalogueMat = textSurface(
    seed.details?.catalogueMat ?? seed.soft
  ).background;
  const cataloguePaper = textSurface(
    seed.details?.cataloguePaper ?? seed.paper
  ).background;
  const catalogueSurfaces = [cataloguePaper, catalogueMat];
  const catalogueInk = legible(seed.ink, catalogueSurfaces);
  const catalogueMuted = legible(seed.muted, catalogueSurfaces);
  const bookOne = textSurface(seed.details?.bookOne ?? seed.poster);
  const bookTwo = textSurface(seed.details?.bookTwo ?? seed.deep);
  const bookThree = textSurface(seed.details?.bookThree ?? seed.secondary);
  const shadow = `${ink}18`;
  return {
    "--cms-colorway-paper": seed.paper,
    "--cms-colorway-ink": ink,
    "--cms-colorway-muted": muted,
    "--cms-colorway-line": line,
    "--cms-colorway-panel": seed.panel,
    "--cms-colorway-panel-ink": ink,
    "--cms-colorway-panel-muted": muted,
    "--cms-colorway-panel-line": line,
    "--cms-colorway-panel-focus": ink,
    "--cms-colorway-panel-shadow": ink,
    "--cms-colorway-accent": active.background,
    "--cms-colorway-accent-ink": active.ink,
    "--cms-colorway-accent-text": legible(accent, surfaces),
    "--cms-colorway-focus": ink,
    "--cms-colorway-editor-ink": editor.ink,
    "--cms-colorway-editor-bg": editor.background,
    "--cms-colorway-editor-line": legible(seed.muted, [editor.background], 3.1),
    "--cms-colorway-shadow": shadow,
    "--cms-colorway-mat": mat,
    "--cms-colorway-mat-ink": legible(seed.ink, [mat]),
    "--cms-colorway-mat-muted": legible(seed.muted, [mat]),
    "--cms-colorway-mat-focus": legible(seed.ink, [mat]),
    "--cms-colorway-hero-panel": hero,
    "--cms-colorway-hero-ink": legible(seed.ink, [hero]),
    "--cms-colorway-hero-muted": legible(seed.muted, [hero]),
    "--cms-colorway-hero-line": legible(seed.muted, [hero], 3.1),
    "--cms-colorway-card-alt": seed.soft,
    "--cms-colorway-card-alt-ink": ink,
    "--cms-colorway-secondary-panel": secondary.background,
    "--cms-colorway-secondary-ink": secondary.ink,
    "--cms-colorway-poster": header.background,
    "--cms-colorway-poster-ink": header.ink,
    "--cms-colorway-poster-one": poster.background,
    "--cms-colorway-poster-one-ink": poster.ink,
    "--cms-colorway-poster-one-mark": legible(
      seed.details?.posterOneMark ?? seed.accent,
      [poster.background],
      3.1
    ),
    "--cms-colorway-poster-two": posterTwo.background,
    "--cms-colorway-poster-two-ink": posterTwo.ink,
    "--cms-colorway-poster-two-mark": legible(
      seed.details?.posterTwoMark ?? seed.deep,
      [posterTwo.background],
      3.1
    ),
    "--cms-colorway-header": header.background,
    "--cms-colorway-header-ink": header.ink,
    "--cms-colorway-header-line": legible(seed.muted, [header.background], 3.1),
    "--cms-colorway-header-mark": legible(seed.muted, [header.background], 3.1),
    "--cms-colorway-mockup-mat": active.background,
    "--cms-colorway-mockup-mat-ink": active.ink,
    "--cms-colorway-mockup-window-border": line,
    "--cms-colorway-mockup-window": seed.paper,
    "--cms-colorway-mockup-window-ink": ink,
    "--cms-colorway-mockup-shadow": shadow,
    "--cms-colorway-mockup-line": line,
    "--cms-colorway-mockup-muted": muted,
    "--cms-colorway-mockup-rail": seed.panel,
    "--cms-colorway-mockup-rail-ink": muted,
    "--cms-colorway-mockup-active": seed.soft,
    "--cms-colorway-mockup-active-ink": legible(accent, surfaces),
    "--cms-colorway-mockup-dot-one": legible(accent, [seed.panel], 3.1),
    "--cms-colorway-mockup-dot-two": legible(seed.secondary, [seed.panel], 3.1),
    "--cms-colorway-mockup-dot-three": legible(seed.deep, [seed.panel], 3.1),
    "--cms-colorway-mockup-subtle": muted,
    "--cms-colorway-mockup-row-line": line,
    "--cms-colorway-mockup-status": seed.soft,
    "--cms-colorway-mockup-status-ink": ink,
    "--cms-colorway-mockup-status-alt": seed.panel,
    "--cms-colorway-mockup-status-alt-ink": ink,
    "--cms-colorway-catalogue-mat": catalogueMat,
    "--cms-colorway-catalogue-mat-ink": catalogueInk,
    "--cms-colorway-catalogue-ink": catalogueInk,
    "--cms-colorway-catalogue-paper": cataloguePaper,
    "--cms-colorway-catalogue-shadow": shadow,
    "--cms-colorway-catalogue-line": legible(
      seed.muted,
      catalogueSurfaces,
      3.1
    ),
    "--cms-colorway-catalogue-muted": catalogueMuted,
    "--cms-colorway-catalogue-heading": catalogueInk,
    "--cms-colorway-catalogue-description": catalogueMuted,
    "--cms-colorway-book-spine": shadow,
    "--cms-colorway-book-one": bookOne.background,
    "--cms-colorway-book-one-ink": bookOne.ink,
    "--cms-colorway-book-shadow": shadow,
    "--cms-colorway-book-two": bookTwo.background,
    "--cms-colorway-book-two-ink": bookTwo.ink,
    "--cms-colorway-book-three": bookThree.background,
    "--cms-colorway-book-three-ink": bookThree.ink,
    "--cms-colorway-catalogue-note": catalogueMuted,
  } as const;
}

export type CmsColorwayVariables = Readonly<
  ReturnType<typeof resolveVariables>
>;

/** Only a recognized, explicit token opts into the new colour system. */
export function resolveCmsColorway(
  design: CmsStudioDesign,
  id: string | undefined,
  accentOverride?: string
): CmsColorwayVariables | null {
  const choice = CMS_STUDIO_COLORWAYS.find((value) => value === id);
  if (!choice) return null;
  const seed = seedFor(design, choice);
  const accent =
    accentOverride !== undefined && /^#[0-9a-f]{6}$/i.test(accentOverride)
      ? accentOverride.toLowerCase()
      : seed.accent;
  const key = `${design}:${choice}:${accent}`;
  const previous = RESOLVED.get(key);
  if (previous) return previous;
  const variables = Object.freeze(resolveVariables(seed, accent));
  if (RESOLVED.size >= RESOLVED_CACHE_LIMIT) {
    const oldest = RESOLVED.keys().next().value;
    if (oldest !== undefined) RESOLVED.delete(oldest);
  }
  RESOLVED.set(key, variables);
  return variables;
}
