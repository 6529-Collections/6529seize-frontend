import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";

import ValidatorDownloadPage from "@/components/validator-page/ValidatorDownloadPage";
import { detectFromUserAgent } from "@/lib/validator-page/detectSystem";
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
  const [snapshot, requestHeaders] = await Promise.all([
    getReleaseFeedSnapshot(),
    headers(),
  ]);
  return (
    <ValidatorDownloadPage
      snapshot={snapshot}
      platform={detectFromUserAgent(requestHeaders.get("user-agent"))}
    />
  );
}

export const metadata: Metadata = getValidatorMetadata(
  "6529 Validator",
  "Download the 6529 validator test release."
);
