import { NFT, NFTLite } from "../entities/INFT";
import { OwnerLite } from "../entities/IOwner";
import {
  ApiProfileRepRatesState,
  CicStatement,
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfilesMatterRatingWithRaterLevel,
  RatingWithProfileInfoAndLevel,
} from "../entities/IProfile";
import { Season } from "../entities/ISeason";
import { ConsolidatedTDHMetrics } from "../entities/ITDH";
import { areEqualAddresses, containsEmojis, formatAddress } from "./Helpers";
import { Page } from "./Types";
import { commonApiFetch } from "../services/api/common-api";
import jwtDecode from "jwt-decode";
import { ActivityLogParamsConverted } from "../components/profile-activity/ProfileActivityLogs";

export interface CommonUserServerSideProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}

const getConsolidatedTdh = async ({
  consolidationKey,
  headers,
}: {
  consolidationKey: string;
  headers: Record<string, string>;
}): Promise<ConsolidatedTDHMetrics | null> =>
  await commonApiFetch<ConsolidatedTDHMetrics>({
    endpoint: `consolidated_owner_metrics/${consolidationKey}`,
    headers,
  });

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

  const consolidatedTDH = profile?.consolidation?.consolidation_key
    ? await getConsolidatedTdh({
        consolidationKey: profile.consolidation.consolidation_key,
        headers,
      })
    : null;

  const display = profile?.consolidation?.consolidation_display ?? null;

  const wallet = profile?.profile?.primary_wallet?.toLowerCase() ?? user;
  const title = profile?.profile?.handle
    ? profile.profile.handle
    : display && !containsEmojis(display)
    ? display
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

export const getUserProfileActivityLogs = async <T = ProfileActivityLog>({
  headers,
  params,
}: {
  headers: Record<string, string>;
  params: ActivityLogParamsConverted;
}): Promise<Page<T>> => {
  try {
    return await commonApiFetch<Page<T>, ActivityLogParamsConverted>({
      endpoint: `profile-logs`,
      params,
      headers,
    });
  } catch {
    return {
      count: 0,
      page: 1,
      next: false,
      data: [],
    };
  }
};

export const getUserProfileCICRatings = async ({
  user,
  headers,
}: {
  user: string;
  headers: Record<string, string>;
}): Promise<Page<ProfilesMatterRatingWithRaterLevel>> => {
  try {
    return await commonApiFetch<Page<ProfilesMatterRatingWithRaterLevel>>({
      endpoint: `profiles/${user}/cic/ratings`,
      params: {
        page: `1`,
        page_size: `10`,
      },
      headers,
    });
  } catch {
    return {
      count: 0,
      page: 1,
      next: false,
      data: [],
    };
  }
};

export const getUserProfileIdentityStatements = async ({
  user,
  headers,
}: {
  user: string;
  headers: Record<string, string>;
}): Promise<CicStatement[]> => {
  try {
    return await commonApiFetch<CicStatement[]>({
      endpoint: `profiles/${user}/cic/statements`,
      headers,
    });
  } catch {
    return [];
  }
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

export const getProfileRatings = async ({
  user,
  headers,
  signedWallet,
}: {
  user: string;
  headers: Record<string, string>;
  signedWallet: string | null;
}): Promise<{
  readonly ratings: ApiProfileRepRatesState;
  readonly rater: string | null;
}> => {
  const raterProfile = signedWallet
    ? await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${signedWallet}`,
        headers: headers,
      })
    : null;

  const rater = raterProfile?.profile?.handle.toLowerCase() ?? null;

  const params: Record<string, string> = {};
  if (rater) {
    params.rater = rater;
  }

  return {
    ratings: await commonApiFetch<ApiProfileRepRatesState>({
      endpoint: `profiles/${user}/rep/ratings/received`,
      params,
      headers,
    }),
    rater,
  };
};

export const getProfileRatingsByRater = async ({
  user,
  headers,
  given,
  page,
  logType,
  pageSize,
}: {
  readonly user: string;
  readonly headers: Record<string, string>;
  readonly page: number;
  readonly logType: string;
  readonly given: boolean;
  readonly pageSize: number;
}): Promise<Page<RatingWithProfileInfoAndLevel>> => {
  const params: Record<string, string> = {
    page: `${page}`,
    page_size: `${pageSize}`,
    log_type: logType,
  };
  if (given) {
    params.given = "true";
  }

  return await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
    endpoint: `profiles/${user}/rep/ratings/by-rater`,
    params,
    headers,
  });
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

export const getSignedWalletOrNull = (req: any): string | null => {
  const walletAuthCookie = req?.req?.cookies["wallet-auth"] ?? null;
  if (!walletAuthCookie) {
    return null;
  }
  const decodedJwt = jwtDecode<{
    id: string;
    sub: string;
    iat: number;
    exp: number;
  }>(walletAuthCookie);

  return decodedJwt?.sub?.toLowerCase() ?? null;
};
