import EtherscanLinkPreview from "@/components/waves/etherscan/EtherscanLinkPreview";
import { isEtherscanUrl } from "@/lib/link-preview/etherscan/parse";

import type { LinkHandler } from "../linkTypes";

export const createEtherscanHandler = (): LinkHandler => ({
  match: isEtherscanUrl,
  render: (href) => <EtherscanLinkPreview href={href} />,
  display: "block",
});
