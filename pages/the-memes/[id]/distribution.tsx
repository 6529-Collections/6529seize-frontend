import Head from "next/head";
import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { MEMES_CONTRACT, MEMES_MINTING_HREF } from "../../../constants";
import { fetchUrl } from "../../../services/6529api";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const DistributionComponent = dynamic(
  () => import("../../../components/distribution/Distribution"),
  {
    ssr: false,
  }
);

export default function MemeDistributionPage(props: any) {
  const pageProps = props.pageProps;
  const pagenameFull = `${pageProps.name} | 6529 SEIZE`;

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/the-memes/${pageProps.id}/distribution`}
        />
        <meta property="og:title" content={pageProps.name} />
        <meta property="og:image" content={pageProps.image} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta name="twitter:card" content={pagenameFull} />
        <meta name="twitter:image:alt" content={pageProps.name} />
        <meta name="twitter:title" content={pageProps.name} />
        <meta name="twitter:description" content="6529 SEIZE" />
        <meta name="twitter:image" content={pageProps.image} />
      </Head>

      <main className={styles.main}>
        <Header />
        <DistributionComponent
          header="The Memes"
          contract={MEMES_CONTRACT}
          link="/the-memes"
          minting_link={MEMES_MINTING_HREF}
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const id = req.query.id;
  const response = await fetchUrl(
    `${process.env.API_ENDPOINT}/api/nfts?contract=${MEMES_CONTRACT}&id=${id}`
  );
  let name = `Meme Card #${id} Distribution`;
  let image = `${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`;
  if (response && response.data && response.data.length > 0) {
    name = `${response.data[0].name} | ${name}`;
    image = response.data[0].thumbnail
      ? response.data[0].thumbnail
      : response.data[0].image
      ? response.data[0].image
      : image;
  }
  return {
    props: {
      id: id,
      name: name,
      image: image,
    },
  };
}
