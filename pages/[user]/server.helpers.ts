import { ENS } from "../../entities/IENS";
import { NFT, NFTLite } from "../../entities/INFT";
import { OwnerLite } from "../../entities/IOwner";
import {
  CicStatement,
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfilesMatterRatingWithRaterLevel,
} from "../../entities/IProfile";
import { Season } from "../../entities/ISeason";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import {
  areEqualAddresses,
  containsEmojis,
  formatAddress,
} from "../../helpers/Helpers";
import { Page } from "../../helpers/Types";
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

export const getCommonUserServerSideProps = async ({
  user,
  headers,
}: {
  user: string;
  headers: Record<string, string>;
}): Promise<CommonUserServerSideProps> => {
  const profile = await commonApiFetch<IProfileAndConsolidations>({
    endpoint: `profiles/${user}`,
    headers: headers,
  });

  const wallet = profile?.profile?.primary_wallet?.toLowerCase() ?? user;
  const ensAndConsolidatedTDH = await getEnsAndConsolidatedTDH(wallet, headers);

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
};

export const userPageNeedsRedirect = ({
  profile,
  req,
  subroute,
}: {
  profile: IProfileAndConsolidations | null;
  req: any;
  subroute: string | null;
}): {
  redirect: {
    permanent: false;
    destination: string;
  };
  props: {};
} | null => {
  if (
    profile?.profile?.normalised_handle &&
    profile.profile?.normalised_handle !== req.query.user.toLowerCase()
  ) {
    const currentQuery = { ...req.query };
    delete currentQuery.user;
    const queryParamsString = new URLSearchParams(currentQuery).toString();
    const destination = subroute
      ? `/${profile.profile.handle}/${subroute}?${queryParamsString}`
      : `/${profile.profile.handle}?${queryParamsString}`;
    return {
      redirect: {
        permanent: false,
        destination,
      },
      props: {},
    };
  }
  return null;
};

export const getUserProfileActivityLogs = async ({
  user,
  headers,
}: {
  user: string;
  headers: Record<string, string>;
}): Promise<Page<ProfileActivityLog>> => {
  return await commonApiFetch<Page<ProfileActivityLog>>({
    endpoint: `profile-logs`,
    params: {
      profile: user,
      page: `1`,
      page_size: `10`,
      log_type: "",
    },
    headers,
  });
};

export const getUserProfileCICRatings = async ({
  user,
  headers,
}: {
  user: string;
  headers: Record<string, string>;
}): Promise<Page<ProfilesMatterRatingWithRaterLevel>> => {
  return await commonApiFetch<Page<ProfilesMatterRatingWithRaterLevel>>({
    endpoint: `profiles/${user}/cic/ratings`,
    params: {
      page: `1`,
      page_size: `10`,
    },
    headers,
  });
};

export const getUserProfileIdentityStatements = async ({
  user,
  headers,
}: {
  user: string;
  headers: Record<string, string>;
}): Promise<CicStatement[]> => {
  return await commonApiFetch<CicStatement[]>({
    endpoint: `profiles/${user}/cic/statements`,
    headers,
  });
};

export const getGradients = async (
  headers: Record<string, string>
): Promise<NFT[]> => {
  const gradients = await commonApiFetch<{ data: NFT[] }>({
    endpoint: "nfts/gradients?&page_size=101&sort=ASC&sort_direction=id",
    headers,
  });
  return gradients.data;
};

export const getMemesLite = async (
  headers: Record<string, string>
): Promise<NFTLite[]> => {
  const memes = await commonApiFetch<{ data: NFTLite[] }>({
    endpoint: "memes_lite",
    headers,
  });
  return memes.data;
};

export const getSeasons = async (
  headers: Record<string, string>
): Promise<Season[]> => {
  const seasons = await commonApiFetch<Season[]>({
    endpoint: "memes_seasons",
    headers,
  });
  return seasons;
};

export const getOwned = async ({
  wallets,
  headers,
}: {
  wallets: string[];
  headers: Record<string, string>;
}): Promise<OwnerLite[]> => {
  if (!wallets.length) {
    return [];
  }
  const baseURL = `owners?wallet=${wallets.join(",")}`;
  let page: number | null = null;
  const allOwned: OwnerLite[] = [];
  do {
    const ownedResponse: {
      data: OwnerLite[];
      page: number;
      next: string | null;
    } = await commonApiFetch<{
      data: OwnerLite[];
      page: number;
      next: string | null;
    }>({
      endpoint: page ? `${baseURL}&page=${page}` : baseURL,
      headers,
    });
    ownedResponse.data.forEach((o) =>
      allOwned.push({
        token_id: o.token_id,
        contract: o.contract,
        balance: o.balance,
      })
    );

    page = ownedResponse.next ? ownedResponse.page + 1 : null;
  } while (page);

  return allOwned.reduce<OwnerLite[]>((acc, curr) => {
    const existing = acc.find(
      (a) =>
        a.token_id === curr.token_id &&
        areEqualAddresses(a.contract, curr.contract)
    );
    if (existing) {
      existing.balance += curr.balance;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);
};

export const getCommonHeaders = (req: any): Record<string, string> => {
  const authCookie = req?.req?.cookies["x-6529-auth"] ?? null;
  const walletAuthCookie = req?.req?.cookies["wallet-auth"] ?? null;
  return {
    ...(authCookie ? { "x-6529-auth": authCookie } : {}),
    ...(walletAuthCookie
      ? { Authorization: `Bearer ${walletAuthCookie}` }
      : {}),
  };
};
