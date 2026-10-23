import {
  getAppMetadata,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";
import RememePage from "@/components/rememes/RememePage";
import {
  getRememesRouteLocale,
  getRememeDetailCanonicalPath,
  type RememesSearchParams,
} from "@/components/rememes/rememesRouteParams";
import { formatAddress } from "@/helpers/Helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import styles from "@/styles/Home.module.css";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Rememe } from "@/entities/INFT";
import type { Metadata } from "next";

type RememeDetailSearchParams = Pick<RememesSearchParams, "locale">;

type RememeRouteProps = {
  readonly params: Promise<{ contract: string; id: string }>;
  readonly searchParams?: Promise<RememeDetailSearchParams>;
};

const getNonEmptyText = (
  value: string | null | undefined
): string | undefined => {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : undefined;
};

const getRememeName = (rememe: Rememe): string | undefined => {
  const metadata = rememe.metadata as { name?: unknown };
  return typeof metadata.name === "string"
    ? getNonEmptyText(metadata.name)
    : undefined;
};

async function getRouteLocale(searchParams: RememeRouteProps["searchParams"]) {
  return getRememesRouteLocale(searchParams ? await searchParams : {});
}

export default async function ReMeme({
  params,
  searchParams,
}: RememeRouteProps) {
  const { contract, id } = await params;
  const locale = await getRouteLocale(searchParams);

  return (
    <main className={styles["main"]}>
      <RememePage contract={contract} id={id} locale={locale} />
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: RememeRouteProps): Promise<Metadata> {
  const { contract, id } = await params;
  const locale = await getRouteLocale(searchParams);
  const rememesTitle = t(locale, "rememes.title");
  let name = `${formatAddress(contract)} #${id}`;

  try {
    const headers = await getAppCommonHeaders();
    const response = await commonApiFetch<
      DBResponse<Rememe>,
      { contract: string; id: string }
    >({
      endpoint: "rememes",
      headers,
      params: { contract, id },
    });

    const firstRememe = response?.data?.[0];
    if (firstRememe !== undefined) {
      const rememeName = getRememeName(firstRememe);
      if (rememeName !== undefined) {
        name = rememeName;
      }
    }
  } catch (error) {
    console.error(
      `Failed to load ReMeme metadata for ${contract} #${id}`,
      error
    );
  }

  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: t(locale, "rememes.detail.documentTitle", { name }),
      description: rememesTitle,
      ogImage: getNftSocialCardImagePath({ contract, id }),
      ogImageAlt: `${name} ReMeme social card`,
    }),
    { canonicalPath: getRememeDetailCanonicalPath({ contract, id, locale }) }
  );
}
