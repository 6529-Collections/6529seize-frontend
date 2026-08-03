export const MUSEUM_CONTRIBUTOR_GUIDE_PATH = "CONTRIBUTING.md" as const;
export const MUSEUM_RIGHTS_GUIDE_PATH = "RIGHTS.md" as const;
export const MUSEUM_OPEN_STATEMENT_PATH = "docs/open-museum.md" as const;
export const MUSEUM_ONCHAIN_TRANSITION_PATH =
  "docs/onchain-transition.md" as const;

export const MUSEUM_OPEN_PUBLICATION_PATHS = [
  MUSEUM_CONTRIBUTOR_GUIDE_PATH,
  MUSEUM_OPEN_STATEMENT_PATH,
  MUSEUM_ONCHAIN_TRANSITION_PATH,
] as const;

export const MUSEUM_TECHNICAL_DESIGN_PATHS = [
  "docs/onchain-design.md",
  "docs/external-works-registry.md",
  "specs/onchain/contract-migration-v1.md",
] as const;
