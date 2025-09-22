import type { PepeKind } from "@/components/waves/pepe/PepeCard";

type PepeCardComponent = typeof import("@/components/waves/pepe/PepeCard").default;

const getPepeCard = (): PepeCardComponent => {
  const module = require("@/components/waves/pepe/PepeCard");
  return module.default as PepeCardComponent;
};

export type PepeLinkResult = {
  readonly kind: PepeKind;
  readonly slug: string;
  readonly href: string;
};

const PEPE_DOMAIN = "pepe.wtf";

export const isPepeHost = (host: string): boolean => {
  const normalized = host.replace(/^www\./i, "").toLowerCase();
  return normalized === PEPE_DOMAIN;
};

export const parsePepeLink = (href: string): PepeLinkResult | null => {
  try {
    const url = new URL(href);
    if (!isPepeHost(url.hostname)) {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 2) {
      return null;
    }

    const [prefix, slug] = segments;
    if (!slug) {
      return null;
    }

    if (prefix === "asset") {
      return { kind: "asset", slug, href };
    }

    if (prefix === "collection") {
      return { kind: "collection", slug, href };
    }

    if (prefix === "artists") {
      return { kind: "artist", slug, href };
    }

    if (prefix === "sets") {
      return { kind: "set", slug, href };
    }

    return null;
  } catch {
    return null;
  }
};

export const renderPepeLink = (result: PepeLinkResult) => {
  const PepeCard = getPepeCard();
  return <PepeCard kind={result.kind} slug={result.slug} href={result.href} />;
};
