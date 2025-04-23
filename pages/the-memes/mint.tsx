import styles from "../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { MEMES_CONTRACT, MEMES_MANIFOLD_PROXY_CONTRACT } from "../../constants";
import { MEMES_MANIFOLD_PROXY_ABI } from "../../abis";
import { NFTWithMemesExtendedData } from "../../entities/INFT";
import { getCommonHeaders } from "../../helpers/server.helpers";
import { commonApiFetch } from "../../services/api/common-api";
import Head from "next/head";
import { Time } from "../../helpers/time";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const ManifoldMinting = dynamic(
  () => import("../../components/manifoldMinting/ManifoldMinting"),
  {
    ssr: false,
  }
);

export default function TheMemesMint(props: any) {
  const { setTitle, title } = useContext(AuthContext);
  const nft: NFTWithMemesExtendedData = props.pageProps.nft;

  const pagename = `Mint The Memes #${nft.id}`;
  const pagenameFull = `${pagename} | 6529.io`;

  useEffect(() => {
    setTitle({
      title: pagenameFull,
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/the-memes/mint`}
        />
        <meta property="og:title" content={pagename} />
        <meta property="og:image" content={nft.image} />
        <meta property="og:description" content="6529.io" />
        <meta name="twitter:card" content={pagenameFull} />
        <meta name="twitter:image:alt" content={pagename} />
        <meta name="twitter:title" content={pagename} />
        <meta name="twitter:description" content="6529.io" />
        <meta name="twitter:image" content={pagename} />
      </Head>
      <main className={styles.main}>
        <ManifoldMinting
          title={`The Memes #${nft.id}`}
          contract={MEMES_CONTRACT}
          proxy={MEMES_MANIFOLD_PROXY_CONTRACT}
          abi={MEMES_MANIFOLD_PROXY_ABI}
          token_id={nft.id}
          mint_date={Time.fromString(nft.mint_date.toString())}
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const headers = getCommonHeaders(req);
  const nft = await commonApiFetch<NFTWithMemesExtendedData>({
    endpoint: `memes_latest`,
    headers: headers,
  }).then(async (responseExtended) => responseExtended);

  return {
    props: {
      nft,
    },
  };
}
