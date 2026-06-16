import styles from "@/styles/Home.module.scss";

import DistributionComponent from "@/components/distribution/Distribution";
import {
  getDistributionRouteLocale,
  type DistributionSearchParams,
} from "@/components/distribution/distributionRouteParams";
import {
  getSharedAppServerSideProps,
  MEME_FOCUS,
} from "@/components/the-memes/MemeShared";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { Metadata } from "next";

type MemeDistributionPageProps = {
  readonly searchParams: Promise<DistributionSearchParams>;
};

type MemeDistributionMetadataProps = MemeDistributionPageProps & {
  readonly params: Promise<{ id: string }>;
};

export default async function MemeDistributionPage({
  searchParams,
}: MemeDistributionPageProps) {
  const locale = getDistributionRouteLocale(await searchParams);

  return (
    <main className={styles["main"]}>
      <DistributionComponent
        header="Meme Lab"
        contract={MEMELAB_CONTRACT}
        link="/meme-lab"
        locale={locale}
      />
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: MemeDistributionMetadataProps): Promise<Metadata> {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const locale = getDistributionRouteLocale(resolvedSearchParams);

  return getSharedAppServerSideProps(
    MEMELAB_CONTRACT,
    id,
    MEME_FOCUS.LIVE,
    true,
    locale
  );
}
