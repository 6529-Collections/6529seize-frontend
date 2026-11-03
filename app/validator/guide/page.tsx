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
import { groupReleaseFiles } from "@/lib/validator-page/releaseFiles";

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
  const release = snapshot.releases[0];
  const installers = release ? groupReleaseFiles(release).installers : [];
  const debName = (kind: "deb-x64" | "deb-arm64", fallback: string) =>
    installers.find((item) => item.kind === kind)?.file.name ?? fallback;
  return (
    <ValidatorGuidePage
      platform={detectFromUserAgent(requestHeaders.get("user-agent"))}
      debs={{
        x64: debName("deb-x64", "6529-validator_0.1.0_amd64.deb"),
        arm64: debName("deb-arm64", "6529-validator_0.1.0_arm64.deb"),
      }}
    />
  );
}

export const metadata: Metadata = getValidatorMetadata(
  "Tester guide | 6529 Validator",
  "Set up the 6529 validator in three steps."
);
