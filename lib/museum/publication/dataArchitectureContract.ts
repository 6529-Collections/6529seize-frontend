export const MUSEUM_DATA_ARCHITECTURE_STANDARDS = [
  {
    slug: "spectrum",
    title: "Spectrum 5.1: the work of running a collection",
  },
  { slug: "cidoc-crm", title: "CIDOC CRM: a history made of events" },
  { slug: "lido", title: "LIDO: a public catalogue record that can travel" },
  { slug: "premis", title: "PREMIS: keeping a digital artwork usable" },
  { slug: "prov-o", title: "PROV-O: following the evidence" },
  {
    slug: "getty-aat-ulan",
    title: "Getty AAT and ULAN: shared names for art and artists",
  },
  {
    slug: "iiif",
    title: "IIIF: a shared plan for presenting digital objects",
  },
  { slug: "c2pa", title: "C2PA: signed claims about media" },
  { slug: "bagit", title: "BagIt: a package that can be checked on arrival" },
  { slug: "ocfl", title: "OCFL: preserving every version" },
  { slug: "caip-19", title: "CAIP-19: an address for a chain asset" },
] as const;

export type MuseumDataArchitectureStandardSlug =
  (typeof MUSEUM_DATA_ARCHITECTURE_STANDARDS)[number]["slug"];

export const MUSEUM_DATA_ARCHITECTURE_STANDARD_SLUGS =
  MUSEUM_DATA_ARCHITECTURE_STANDARDS.map(({ slug }) => slug);

export const MUSEUM_DATA_ARCHITECTURE_STANDARD_COUNT =
  MUSEUM_DATA_ARCHITECTURE_STANDARDS.length;
