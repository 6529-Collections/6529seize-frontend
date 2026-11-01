import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import ValidatorPasswordForm, {
  readGateNotice,
} from "@/components/validator-page/ValidatorPasswordForm";
import {
  hasValidatorAccess,
  sanitizeValidatorNextPath,
  VALIDATOR_ACCESS_COOKIE,
  VALIDATOR_NEXT_PATH_HEADER,
} from "@/lib/validator-page/accessGate";
import { getValidatorMetadata } from "@/lib/validator-page/pageAccess";

// The proxy shows this page in place of any locked page under /validator,
// and tells it which path was asked for.
export default async function ValidatorLockedRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [headerStore, cookieStore, query] = await Promise.all([
    headers(),
    cookies(),
    searchParams,
  ]);
  const nextPath = sanitizeValidatorNextPath(
    headerStore.get(VALIDATOR_NEXT_PATH_HEADER)
  );
  if (hasValidatorAccess(cookieStore.get(VALIDATOR_ACCESS_COOKIE)?.value)) {
    redirect(nextPath);
  }
  return (
    <ValidatorPasswordForm
      nextPath={nextPath}
      notice={readGateNotice(query["gate"])}
    />
  );
}

export const metadata: Metadata = getValidatorMetadata(
  "6529 Validator",
  "The 6529 validator test release."
);
