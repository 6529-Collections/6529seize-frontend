import type { MuseumPublicDocument } from "./types";

export const MUSEUM_CONTRIBUTOR_GUIDE_PATH = "CONTRIBUTING.md" as const;
export const MUSEUM_RIGHTS_GUIDE_PATH = "RIGHTS.md" as const;
export const MUSEUM_OPEN_STATEMENT_PATH = "docs/open-museum.md" as const;
export const MUSEUM_ONCHAIN_TRANSITION_PATH =
  "docs/onchain-transition.md" as const;

export const MUSEUM_TECHNICAL_DESIGN_PATHS = [
  "docs/onchain-design.md",
  "docs/external-works-registry.md",
  "specs/onchain/contract-migration-v1.md",
] as const;

const EMBEDDED_STATEMENT_FRONT_MATTER = {
  [MUSEUM_OPEN_STATEMENT_PATH]: {
    title: "The record outlives the interface",
    status:
      "Status: working public operating statement; not an adopted governance policy",
  },
  [MUSEUM_ONCHAIN_TRANSITION_PATH]: {
    title: "From public repository to on-chain Museum record",
    status:
      "Status: working public migration statement. Contract design is in progress; audit, deployment, activation, and record migration remain pending.",
  },
} as const;

function embeddedStatementContract(sourcePath: string) {
  if (sourcePath === MUSEUM_OPEN_STATEMENT_PATH) {
    return EMBEDDED_STATEMENT_FRONT_MATTER[MUSEUM_OPEN_STATEMENT_PATH];
  }
  if (sourcePath === MUSEUM_ONCHAIN_TRANSITION_PATH) {
    return EMBEDDED_STATEMENT_FRONT_MATTER[MUSEUM_ONCHAIN_TRANSITION_PATH];
  }
  return null;
}

export function withoutEmbeddedStatementFrontMatter(
  document: MuseumPublicDocument
): string {
  const contract = embeddedStatementContract(document.sourcePath);
  if (contract === null) {
    return document.markdown;
  }

  const lines = document.markdown.replace(/^\uFEFF/u, "").split(/\r?\n/u);
  if (lines.at(0)?.trim() !== `# ${contract.title}`) {
    return document.markdown;
  }
  lines.shift();
  while (lines.at(0)?.trim() === "") {
    lines.shift();
  }

  const statusLines: string[] = [];
  while ((lines.at(0)?.trim().length ?? 0) > 0) {
    statusLines.push(lines.shift()!.trim());
  }
  if (statusLines.join(" ") !== contract.status) {
    return document.markdown;
  }
  while (lines.at(0)?.trim() === "") {
    lines.shift();
  }
  return lines.join("\n");
}
