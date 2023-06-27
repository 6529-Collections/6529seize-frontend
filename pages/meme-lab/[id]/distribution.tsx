import Head from "next/head";
import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { MEMELAB_CONTRACT } from "../../../constants";
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

export default function MemeLabDistributionPage(props: any) {
  const pagenameFull = `${props.name} | 6529 SEIZE`;

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/meme-lab/${props.id}/distribution`}
        />
        <meta property="og:title" content={props.name} />
        <meta property="og:image" content={props.image} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta name="twitter:card" content={pagenameFull} />
        <meta name="twitter:image:alt" content={props.name} />
        <meta name="twitter:title" content={props.name} />
        <meta name="twitter:description" content="6529 SEIZE" />
        <meta name="twitter:image" content={props.image} />
      </Head>

      <main className={styles.main}>
        <Header />
        <DistributionComponent
          header="Meme Lab"
          contract={MEMELAB_CONTRACT}
          link="/meme-lab"
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const id = req.query.id;
  const response = await fetchUrl(
    `${process.env.API_ENDPOINT}/api/nfts?contract=${MEMELAB_CONTRACT}&id=${id}`
  );
  let name = `Meme Lab Card #${id} Distribution`;
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
