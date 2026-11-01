import type { Metadata } from "next";
import { connection } from "next/server";

import ValidatorDownloadPage from "@/components/validator-page/ValidatorDownloadPage";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";
import { getReleaseFeedSnapshot } from "@/lib/validator-page/releaseFeed";

export default async function ValidatorRoute() {
  await connection();
  const locked = await getLockedView("/validator");
  if (locked) {
    return locked;
  }
  const snapshot = await getReleaseFeedSnapshot();
  return <ValidatorDownloadPage snapshot={snapshot} />;
}

export const metadata: Metadata = getValidatorMetadata(
  "6529 Validator",
  "Download the 6529 validator test release."
);
