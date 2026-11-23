import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import ValidatorGuidePage from "@/components/validator-page/ValidatorGuidePage";
import { VALIDATOR_GUIDE_PAGES } from "@/lib/validator-page/content/guidePages";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";

const START = VALIDATOR_GUIDE_PAGES.find((page) => page.slug === "");

export default async function ValidatorGuideRoute() {
  await connection();
  const locked = await getLockedView("/validator/guide");
  if (locked) {
    return locked;
  }
  if (!START) {
    notFound();
  }
  return <ValidatorGuidePage page={START} />;
}

export const metadata: Metadata = getValidatorMetadata(
  "Guide | 6529 Validator",
  START?.description ?? "The 6529 validator's setup guide."
);
