import type { Metadata } from "next";

import ValidatorAuthorizePage from "@/components/validator-page/authorize/ValidatorAuthorizePage";
import { getValidatorMetadata } from "@/lib/validator-page/pageAccess";

// Public, unlike the other pages under /validator: a validator's QR code
// opens it on a phone that has never seen the page password. The code
// travels after #, so the server never sees it.
export default function ValidatorAuthorizeRoute() {
  return <ValidatorAuthorizePage />;
}

export const metadata: Metadata = getValidatorMetadata(
  "Authorize your validator | 6529 Validator",
  "Sign a 6529 validator's authorization with your wallet."
);
