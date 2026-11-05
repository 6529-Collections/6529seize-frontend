import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";

import ValidatorGuidePage from "@/components/validator-page/ValidatorGuidePage";
import { detectFromUserAgent } from "@/lib/validator-page/detectSystem";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";
import { getReleaseFeedSnapshot } from "@/lib/validator-page/releaseFeed";
import { getDebNames } from "@/lib/validator-page/releaseFiles";

export default async function ValidatorGuideRoute() {
  await connection();
  const locked = await getLockedView("/validator/guide");
  if (locked) {
    return locked;
  }
  const [snapshot, requestHeaders] = await Promise.all([
    getReleaseFeedSnapshot(),
    headers(),
  ]);
  return (
    <ValidatorGuidePage
      platform={detectFromUserAgent(requestHeaders.get("user-agent"))}
      debs={getDebNames(snapshot.releases[0])}
    />
  );
}

export const metadata: Metadata = getValidatorMetadata(
  "Tester guide | 6529 Validator",
  "Set up the 6529 validator in three steps."
);
