import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactElement } from "react";

import { getAppMetadata } from "@/components/providers/metadata";
import ValidatorPasswordForm from "@/components/validator-page/ValidatorPasswordForm";
import { hasValidatorAccess, VALIDATOR_ACCESS_COOKIE } from "./accessGate";

/**
 * The second check behind the proxy's: a page under /validator renders the
 * password form instead of itself when the visitor has no access.
 */
export async function getLockedView(
  nextPath: string
): Promise<ReactElement | null> {
  const cookieStore = await cookies();
  if (hasValidatorAccess(cookieStore.get(VALIDATOR_ACCESS_COOKIE)?.value)) {
    return null;
  }
  return <ValidatorPasswordForm nextPath={nextPath} notice={null} />;
}

/** Every page under /validator stays out of search engines. */
export function getValidatorMetadata(
  title: string,
  description: string
): Metadata {
  return getAppMetadata(
    { title, description },
    { robots: { index: false, follow: false, nocache: true } }
  );
}
