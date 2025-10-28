import EnsLinkPreview from "@/components/waves/ens/EnsLinkPreview";
import { detectEnsTarget } from "@/lib/ens/detect";

import type { LinkHandler } from "../linkTypes";

const isEnsLink = (href: string): boolean => {
  return Boolean(detectEnsTarget(href));
};

export const createEnsHandler = (): LinkHandler => ({
  match: isEnsLink,
  render: (href) => <EnsLinkPreview href={href} />,
  display: "block",
});
