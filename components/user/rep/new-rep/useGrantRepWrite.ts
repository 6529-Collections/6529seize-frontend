import { useContext } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { AuthContext } from "@/components/auth/Auth";
import {
  chainRatingBlockedText,
  chainRatingFailureText,
} from "@/components/chain-identity/chainErrorMessage";
import { useChainRatingWriter } from "@/components/chain-identity/useChainRatingWriter";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";

/**
 * How the Grant Rep form saves a REP rating: on the 6529 Network once its
 * flows are on and the switch-on has passed, where the rating carries its
 * own signature, else through 6529.io's API after the site's sign-in. Also
 * the failure toast's text for each way, and the text for a rating the
 * 6529 Network won't take.
 */
export function useGrantRepWrite(profile: ApiIdentity) {
  const locale = useBrowserLocale();
  const { requestAuth } = useContext(AuthContext);
  const chainWrite = useChainRatingWriter();

  return {
    write: async ({
      amount,
      category,
    }: {
      amount: number;
      category: string;
    }) =>
      chainWrite
        ? await chainWrite({ matter: "REP", profile, category, amount })
        : await commonApiPost<{ amount: number; category: string }, void>({
            endpoint: `profiles/${profile.query ?? ""}/rep/rating`,
            body: { amount, category },
          }),
    // On the 6529 Network the rating carries its own signature.
    signIn: async (): Promise<{ success: boolean }> =>
      chainWrite ? { success: true } : await requestAuth(),
    failureToast: (error: unknown, siteMessage: string) =>
      chainWrite
        ? { description: chainRatingFailureText(locale, error) }
        : {
            description: t(locale, "rep.categories.grant.toast.tryAgain"),
            details: getToastErrorDetails(error, siteMessage),
          },
    blockedText: (chainError: unknown) =>
      chainRatingBlockedText(locale, chainError),
  };
}
