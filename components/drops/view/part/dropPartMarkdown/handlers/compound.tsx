import CompoundPreview from "@/components/waves/CompoundPreview";

import type { LinkHandler } from "../linkTypes";

const isCompoundLink = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (url.port === "" || url.port === "443") &&
      hostname === "app.compound.finance"
    );
  } catch {
    return false;
  }
};

export const createCompoundHandler = (): LinkHandler => ({
  match: isCompoundLink,
  render: (href) => <CompoundPreview href={href} />,
  display: "block",
});
