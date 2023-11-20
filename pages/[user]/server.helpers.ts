import { ENS } from "../../entities/IENS";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import { containsEmojis, formatAddress } from "../../helpers/Helpers";
import { commonApiFetch } from "../../services/api/common-api";

export interface CommonUserServerSideProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}

const getEnsAndConsolidatedTDH = async (
  address: string,
  headers: Record<string, string>
): Promise<{
  ens: ENS | null;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}> => {
  const ens = await commonApiFetch<ENS>({
    endpoint: `user/${address}`,
    headers,
  });

  const consolidationKey = ens?.consolidation_key ?? null;
  const consolidatedTDH = consolidationKey
    ? await commonApiFetch<ConsolidatedTDHMetrics>({
      endpoint: `consolidated_owner_metrics/${consolidationKey}`,
      headers,
    })
    : null;

  return {
    ens,
    consolidatedTDH,
  };
};


export const getCommonUserServerSideProps = async ({ user, headers }: { user: string, headers: Record<string, string> }): Promise<CommonUserServerSideProps> => {
  const profile = await commonApiFetch<IProfileAndConsolidations>({
    endpoint: `profiles/${user}`,
    headers: headers,
  });

  const wallet =
    profile?.profile?.primary_wallet?.toLowerCase() ?? user;
  const ensAndConsolidatedTDH = await getEnsAndConsolidatedTDH(
    wallet,
    headers
  );

  const { ens, consolidatedTDH } = ensAndConsolidatedTDH;
  const title = profile?.profile?.handle
    ? profile.profile.handle
    : ens?.display && !containsEmojis(ens.display)
      ? ens.display
      : formatAddress(wallet);

  return {
    profile,
    title,
    consolidatedTDH,
  };
}

export const userPageNeedsRedirect = ({ profile, req, subroute }: { profile: IProfileAndConsolidations | null, req: any, subroute: string | null }): {
  redirect: {
    permanent: false,
    destination: string
  },
  props: {}
} | null => {
  if (
    profile?.profile?.normalised_handle &&
    profile.profile?.normalised_handle !== req.query.user.toLowerCase()
  ) {
    const currentQuery = { ...req.query };
    delete currentQuery.user;
    const queryParamsString = new URLSearchParams(currentQuery).toString();
    const destination = subroute ? `/${profile.profile.normalised_handle}/${subroute}?${queryParamsString}` : `/${profile.profile.normalised_handle}?${queryParamsString}`
    return {
      redirect: {
        permanent: false,
        destination,
      },
      props: {},
    };
  }
  return null
}
