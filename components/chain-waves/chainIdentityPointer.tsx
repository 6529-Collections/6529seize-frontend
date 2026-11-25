import Link from "next/link";
import type { ReactElement } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { isChainIdentityActive } from "@/lib/chain-identity/active";
import { isNoChainIdentity } from "@/lib/chain-waves/signing";

/**
 * For a write that stopped because the wallet has no identity on the 6529
 * Network: the same sentence, with a link to set one up on the identity
 * page once that page takes changes (this build has it and identities have
 * moved). Null otherwise, so the caller keeps its own line.
 */
export function chainIdentityPointer(
  locale: SupportedLocale,
  error: unknown
): ReactElement | null {
  if (!isNoChainIdentity(error) || !isChainIdentityActive()) {
    return null;
  }
  return (
    <>
      {tRich(locale, "chainIdentity.error.noIdentity", {
        link: (
          <Link
            key="link"
            href="/network/identity"
            className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
          >
            {t(locale, "chainIdentity.error.noIdentityLink")}
          </Link>
        ),
      })}
    </>
  );
}
