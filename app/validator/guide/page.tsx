import type { Metadata } from "next";
import { connection } from "next/server";

import ValidatorDocPage from "@/components/validator-page/ValidatorDocPage";
import { fillBootstrapPeers } from "@/lib/validator-page/bootstrapPeers";
import { VALIDATOR_GUIDE_MARKDOWN } from "@/lib/validator-page/content/guideMarkdown";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";

export default async function ValidatorGuideRoute() {
  await connection();
  const locked = await getLockedView("/validator/guide");
  if (locked) {
    return locked;
  }
  const { markdown, complete } = await fillBootstrapPeers(
    VALIDATOR_GUIDE_MARKDOWN
  );
  return (
    <ValidatorDocPage
      section="guide"
      eyebrow="Tester guide"
      title="Set up the 6529 validator"
      markdown={markdown}
      notice={
        complete
          ? undefined
          : "The sentry addresses could not be loaded. Reload the page in a minute."
      }
      withContents
    />
  );
}

export const metadata: Metadata = getValidatorMetadata(
  "Tester guide | 6529 Validator",
  "Install the 6529 validator, sign the grant and add the peers."
);
