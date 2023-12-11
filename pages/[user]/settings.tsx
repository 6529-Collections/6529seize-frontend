import Head from "next/head";
import styles from "../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useContext, useEffect, useState } from "react";
import UserSettingsComponent from "../../components/user/settings/UserSettings";
import { AuthContext } from "../../components/auth/Auth";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { QueryKey } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function UserPageSettings() {
  const { address } = useAccount();
  const { data: connectedProfile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, address?.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${address}`,
      }),
    enabled: !!address,
  });
  const router = useRouter();
  const [user] = useState(
    Array.isArray(router.query.user) ? router.query.user[0] : router.query.user
  );
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [pagenameFull, setPagenameFull] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!connectedProfile?.profile) {
      setPagenameFull(null);
      setTitle(null);
      setUrl(null);
      return;
    }
    const consolidatedWalletsSortedByHighest =
      connectedProfile.consolidation.wallets.sort((a, d) => d.tdh - a.tdh);

    const profileTitle =
      connectedProfile.profile?.handle ??
      consolidatedWalletsSortedByHighest.at(0)?.wallet.ens ??
      consolidatedWalletsSortedByHighest.at(0)?.wallet.address ??
      null;

    setPagenameFull(`${profileTitle} | 6529 SEIZE`);
    setTitle(profileTitle);
    setUrl(profileTitle);
  }, [connectedProfile]);

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={title ?? undefined} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/${url}`}
        />
        <meta property="og:title" content={title ?? undefined} />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
        <meta property="og:description" content="6529 SEIZE" />
      </Head>

      <main className={styles.main}>
        <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
        {router.isReady && user && (
          <UserSettingsComponent user={user} wallets={connectedWallets} />
        )}
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return {
    props: {},
  };
}
