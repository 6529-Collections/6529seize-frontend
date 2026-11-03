import type { Metadata } from "next";
import { connection } from "next/server";

import ValidatorHardwarePage from "@/components/validator-page/ValidatorHardwarePage";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";

export default async function ValidatorHardwareRoute() {
  await connection();
  const locked = await getLockedView("/validator/hardware");
  if (locked) {
    return locked;
  }
  return <ValidatorHardwarePage />;
}

export const metadata: Metadata = getValidatorMetadata(
  "Hardware | 6529 Validator",
  "What computer the 6529 validator needs: a Mac or PC you already have is enough."
);
