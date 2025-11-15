import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { ApiXTdhToken } from "@/generated/models/ApiXTdhToken";
import { ApiXTdhTokenGrantor } from "@/generated/models/ApiXTdhTokenGrantor";
import { ApiXTdhTokensPage } from "@/generated/models/ApiXTdhTokensPage";
import { commonApiFetch } from "@/services/api/common-api";
import type {
  XtdhToken,
  XtdhTokenContributor,
  XtdhTokenPage,
} from "@/types/xtdh";

export interface FetchXtdhTokensParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly grantee?: string;
  readonly contract?: string;
  readonly token?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;

export async function fetchXtdhTokens(
  params: FetchXtdhTokensParams = {},
): Promise<XtdhTokenPage> {
  const page = Number.isFinite(params.page) ? Number(params.page) : DEFAULT_PAGE;
  const pageSize =
    Number.isFinite(params.pageSize) && params.pageSize
      ? Number(params.pageSize)
      : DEFAULT_PAGE_SIZE;

  const response = await commonApiFetch<ApiXTdhTokensPage, Record<string, string>>({
    endpoint: "xtdh",
    params: {
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(params.grantee ? { grantee: params.grantee } : {}),
      ...(params.contract ? { contract: params.contract } : {}),
      ...(params.token ? { token: params.token } : {}),
    },
  });

  return {
    page: response.page ?? page,
    hasNextPage: Boolean(response.next),
    tokens: (response.data ?? []).map(mapTokenFromApi),
  };
}

export async function fetchXtdhTokenContributors(
  contract: string,
  token: string,
): Promise<XtdhTokenContributor[]> {
  const data = await commonApiFetch<ApiXTdhTokenGrantor[]>({
    endpoint: `xtdh/contract/${encodeURIComponent(contract)}/token/${encodeURIComponent(token)}/contributors`,
  });

  return (data ?? []).map(mapContributorFromApi);
}

function mapTokenFromApi(token: ApiXTdhToken): XtdhToken {
  return {
    contract: token.contract,
    tokenId: token.token,
    xtdhRate: normalizeNumber(token.xtdh_rate),
    xtdhTotal: normalizeNumber(token.xtdh),
    topGrantor: token.grantor ? mapProfileToGrantor(token.grantor) : undefined,
  };
}

function mapContributorFromApi(
  contributor: ApiXTdhTokenGrantor,
): XtdhTokenContributor {
  return {
    xtdhRate: normalizeNumber(contributor.xtdh_rate),
    xtdhTotal: normalizeNumber(contributor.xtdh),
    grantor: mapProfileToGrantor(contributor.grantor),
  };
}

function mapProfileToGrantor(profile: ApiProfileMin | undefined | null) {
  if (!profile) {
    return undefined;
  }

  return {
    id: profile.id,
    handle: profile.handle ?? undefined,
    avatar: profile.pfp ?? undefined,
  };
}

function normalizeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return value;
}
