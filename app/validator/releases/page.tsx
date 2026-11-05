import type { Metadata } from "next";
import { connection } from "next/server";

import ValidatorReleaseHistory from "@/components/validator-page/ValidatorReleaseHistory";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";
import { getReleaseFeedSnapshot } from "@/lib/validator-page/releaseFeed";

export default async function ValidatorReleasesRoute() {
  await connection();
  const locked = await getLockedView("/validator/releases");
  if (locked) {
    return locked;
  }
  const snapshot = await getReleaseFeedSnapshot();
  return <ValidatorReleaseHistory snapshot={snapshot} />;
}

export const metadata: Metadata = getValidatorMetadata(
  "Releases | 6529 Validator",
  "Every 6529 validator test release, with the SHA-256 of each file."
);
