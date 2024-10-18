import { NFT, NFTLite } from "../entities/INFT";
import {
  ApiProfileRepRatesState,
  CicStatement,
  IProfileAndConsolidations,
  ProfileActivityLog,
  RateMatter,
  RatingWithProfileInfoAndLevel,
} from "../entities/IProfile";
import { Season } from "../entities/ISeason";
import { ConsolidatedTDHMetrics } from "../entities/ITDH";
import { Page } from "./Types";
import { commonApiFetch } from "../services/api/common-api";
import { jwtDecode } from "jwt-decode";
import { ActivityLogParamsConverted } from "../components/profile-activity/ProfileActivityLogs";
import {
  ProfileRatersParams,
  ProfileRatersParamsOrderBy,
} from "../components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { SortDirection } from "../entities/ISort";
import { ApiProfileProxy } from "../generated/models/ApiProfileProxy";
import { ApiWave } from "../generated/models/ApiWave";
import { ApiWaveDropsFeed } from "../generated/models/ApiWaveDropsFeed";
import { WAVE_DROPS_PARAMS } from "../components/react-query-wrapper/utils/query-utils";

export interface CommonUserServerSideProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}

export const getUserProfile = async ({
  user,
  headers,
}: {
  user: string;
  headers: Record<string, string>;
}): Promise<IProfileAndConsolidations> => {
  return await commonApiFetch<IProfileAndConsolidations>({
    endpoint: `profiles/${user}`,
    headers: headers,
  });
};

export const getProxyById = async ({
  proxyId,
  headers,
}: {
  proxyId: string;
  headers: Record<string, string>;
}): Promise<ApiProfileProxy> => {
  return await commonApiFetch<ApiProfileProxy>({
    endpoint: `proxies/${proxyId}`,
    headers: headers,
  });
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

  const rater = raterProfile?.input_identity.toLowerCase() ?? null;

  const params: Record<string, string> = {};
  if (rater) {
    params.rater = rater;
  }

  try {
    return {
      ratings: await commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${user}/rep/ratings/received`,
        params,
        headers,
      }),
      rater,
    };
  } catch {
    return {
      ratings: {
        total_rep_rating: 0,
        total_rep_rating_by_rater: null,
        rep_rates_left_for_rater: null,
        number_of_raters: 0,
        rating_stats: [],
      },
      rater,
    };
  }
};

export const getInitialRatersParams = ({
  handleOrWallet,
  given,
  matter,
}: {
  handleOrWallet: string;
  given: boolean;
  matter: RateMatter;
}): ProfileRatersParams => ({
  page: 1,
  pageSize: 7,
  given,
  matter,
  order: SortDirection.DESC,
  orderBy: ProfileRatersParamsOrderBy.RATING,
  handleOrWallet,
});

export const getProfileRatingsByRater = async ({
  params,
  headers,
}: {
  readonly params: ProfileRatersParams;
  readonly headers: Record<string, string>;
}): Promise<Page<RatingWithProfileInfoAndLevel>> => {
  const { page, pageSize, given, matter, order, orderBy, handleOrWallet } =
    params;

  try {
    return await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
      endpoint: `profiles/${handleOrWallet}/${matter.toLowerCase()}/ratings/by-rater`,
      params: {
        page: `${page}`,
        page_size: `${pageSize}`,
        order: order.toLowerCase(),
        order_by: orderBy.toLowerCase(),
        given: given ? "true" : "false",
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

export const getWave = async ({
  waveId,
  headers,
}: {
  waveId: string;
  readonly headers: Record<string, string>;
}) => {
  return await commonApiFetch<ApiWave>({
    endpoint: `waves/${waveId}`,
    headers,
  });
};

export const getWavesOverview = async ({
  headers,
  limit,
  offset,
  type,
  onlyWavesFollowedByAuthenticatedUser,
}: {
  readonly headers: Record<string, string>;
  readonly limit: number;
  readonly offset: number;
  readonly type: string;
  readonly onlyWavesFollowedByAuthenticatedUser: boolean;
}): Promise<ApiWave[]> => {
  const queryParams: Record<string, string> = {
    limit: `${limit}`,
    offset: `${offset}`,
    type: type,
    only_waves_followed_by_authenticated_user:
      onlyWavesFollowedByAuthenticatedUser.toString(),
  };

  return await commonApiFetch<ApiWave[]>({
    endpoint: `waves-overview`,
    params: queryParams,
    headers,
  });
};

export const getWaveDrops = async ({
  waveId,
  headers,
}: {
  readonly waveId: string;
  readonly headers: Record<string, string>;
}): Promise<ApiWaveDropsFeed> => {
  const params: Record<string, string> = {
    limit: WAVE_DROPS_PARAMS.limit.toString(),
  };

  const results = await commonApiFetch<ApiWaveDropsFeed>({
    endpoint: `waves/${waveId}/drops`,
    params,
    headers,
  });

  return results;
};

export const getCommonHeaders = (req: any): Record<string, string> => {
  const authCookie = req?.req.cookies["x-6529-auth"] ?? null;
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
