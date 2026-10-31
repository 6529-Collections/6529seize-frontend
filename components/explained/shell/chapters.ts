import type { KitKey } from "../i18n";
import type { Maturity } from "../marks/Track";

/**
 * Where 6529 Explained lives (MAP.md §1, §2): the hub, the chapters in build
 * order, and each live chapter's pages, grouped Read, Check and the shelf.
 * TDH stays at /network/tdh; the hub is /explained. A chapter not shipped
 * has no pages and no links: the switcher lists it as coming.
 */
export interface PageLink {
  readonly id: string;
  readonly title: KitKey;
  readonly href: string;
  /** The number in the chapter bar: 1 to 5 for the spine. */
  readonly n?: string;
  /** A page listed before it ships: shown at 55%, never a link. */
  readonly soon?: boolean;
}

export interface ChapterDef {
  readonly id: string;
  readonly title: KitKey;
  /** "01" for a shipped chapter; none until it ships. */
  readonly number?: string;
  readonly href: string | null;
  readonly status: "live" | "coming";
  /** Does the chapter's subject run today? (EXPLAINED.md §3) */
  readonly maturity: Maturity;
  readonly read: readonly PageLink[];
  readonly check: readonly PageLink[];
  readonly shelf: readonly PageLink[];
}

export const HUB_HREF = "/explained";

const TDH: ChapterDef = {
  id: "tdh",
  title: "explained.kit.map.tdh",
  number: "01",
  href: "/network/tdh",
  status: "live",
  maturity: "live",
  read: [
    {
      id: "overview",
      title: "explained.kit.map.tdh.overview",
      href: "/network/tdh",
    },
    {
      id: "how",
      title: "explained.kit.map.tdh.how",
      href: "/network/tdh/how-it-works",
      n: "1",
    },
    {
      id: "wallets",
      title: "explained.kit.map.tdh.wallets",
      href: "/network/tdh/consolidation",
      n: "2",
    },
  ],
  check: [
    {
      id: "check",
      title: "explained.kit.map.tdh.check",
      href: "/network/tdh/verification",
      n: "3",
    },
    {
      id: "sure",
      title: "explained.kit.map.tdh.sure",
      href: "/network/tdh/formal",
      n: "4",
    },
    {
      id: "proofs",
      title: "explained.kit.map.tdh.proofs",
      href: "/network/tdh/proofs",
      n: "5",
    },
  ],
  shelf: [
    {
      id: "spec",
      title: "explained.kit.map.tdh.spec",
      href: "/network/tdh/specification",
    },
    {
      id: "impl",
      title: "explained.kit.map.tdh.impl",
      href: "/network/tdh/implementations",
    },
    {
      id: "design",
      title: "explained.kit.map.tdh.design",
      href: "/network/tdh/consolidation/design",
    },
    {
      id: "versions",
      title: "explained.kit.map.tdh.versions",
      href: "/network/tdh/historic-boosts",
    },
    {
      id: "glossary",
      title: "explained.kit.map.tdh.glossary",
      href: "/network/tdh/glossary",
    },
  ],
};

function coming(id: string, title: KitKey, maturity: Maturity): ChapterDef {
  return {
    id,
    title,
    href: null,
    status: "coming",
    maturity,
    read: [],
    check: [],
    shelf: [],
  };
}

/** The chapters in build order (MAP.md §6). */
export const CHAPTERS: readonly ChapterDef[] = [
  TDH,
  coming("memes", "explained.kit.map.memes", "live"),
  coming("waves", "explained.kit.map.waves", "live"),
  {
    // Coming, with one page live: the hardware guide.
    ...coming("validators", "explained.kit.map.validators", "built"),
    read: [
      {
        id: "hardware",
        title: "explained.kit.map.validators.hardware",
        href: "/explained/validators/hardware",
      },
    ],
  },
  coming("nextgen", "explained.kit.map.nextgen", "live"),
  coming("standing", "explained.kit.map.standing", "live"),
  coming("works", "explained.kit.map.works", "built"),
  coming("network", "explained.kit.map.network", "design"),
];

export function chapterById(id: string): ChapterDef {
  const chapter = CHAPTERS.find((entry) => entry.id === id);
  if (!chapter) {
    throw new Error(`Unknown chapter "${id}"`);
  }
  return chapter;
}

/** Every page of a chapter, spine first, then the shelf. */
export function chapterPages(chapter: ChapterDef): readonly PageLink[] {
  return [...chapter.read, ...chapter.check, ...chapter.shelf];
}
