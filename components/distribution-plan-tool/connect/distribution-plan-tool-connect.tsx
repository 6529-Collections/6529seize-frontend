"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isWalletConnectionResolving } from "@/components/auth/authResolution";
import AuthLoadingPlaceholder from "@/components/auth/AuthLoadingPlaceholder";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { isEthereumAddress } from "@/helpers/AllowlistToolHelpers";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import EmmaTitle from "../EmmaTitle";
import { getEmmaReturnPath } from "../emma-route";

export default function DistributionPlanToolConnect({
  returnTo = "/emma/plans",
}: {
  readonly returnTo?: string;
}) {
  const connection = useSeizeConnectContext();
  const { requestAuth } = useAuth();
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const [signingIn, setSigningIn] = useState(false);
  const destination = getEmmaReturnPath(returnTo);
  const { address, hasValidWalletAuth, seizeConnect } = connection;
  const hasAddress = !!address && isEthereumAddress(address);

  useEffect(() => {
    if (hasHydrated && hasValidWalletAuth) router.replace(destination);
  }, [hasHydrated, hasValidWalletAuth, destination, router]);

  const signIn = async () => {
    setSigningIn(true);
    try {
      const { success } = await requestAuth();
      if (success) router.replace(destination);
    } finally {
      setSigningIn(false);
    }
  };

  if (
    !hasHydrated ||
    hasValidWalletAuth ||
    isWalletConnectionResolving(connection)
  ) {
    return <AuthLoadingPlaceholder />;
  }

  return (
    <div className="tw-max-w-2xl tw-space-y-6">
      <EmmaTitle />
      <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white">
        {t(
          DEFAULT_LOCALE,
          hasAddress ? "emma.signInHeading" : "emma.connectHeading"
        )}
      </h2>
      <p className="tw-m-0 tw-text-base tw-leading-relaxed tw-text-iron-300">
        {t(DEFAULT_LOCALE, "emma.connectDescription")}
      </p>
      <p className="tw-m-0 tw-text-base tw-leading-relaxed tw-text-iron-300">
        {t(DEFAULT_LOCALE, "emma.noFee")}
      </p>
      <PrimaryButton
        onClicked={hasAddress ? signIn : seizeConnect}
        disabled={signingIn || connection.seizeConnectOpen}
        loading={signingIn}
      >
        {t(DEFAULT_LOCALE, hasAddress ? "emma.signIn" : "emma.connect")}
      </PrimaryButton>
    </div>
  );
}
