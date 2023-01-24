import Head from "next/head";
import styles from "../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { GRADIENT_CONTRACT } from "../../constants";
import { fetchUrl } from "../../services/6529api";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
});

const GradientPageComponent = dynamic(
  () => import("../../components/6529Gradient/GradientPage"),
  {
    ssr: false,
  }
);

export default function GradientPageIndex(props: any) {
  const pagenameFull = `${props.name} | 6529 SEIZE`;

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/the-memes/${props.id}`}
        />
        <meta property="og:title" content={props.name} />
        <meta property="og:image" content={props.image} />
        <meta property="og:description" content="6529 SEIZE" />
      </Head>

      <main className={styles.main}>
        <Header />
        <GradientPageComponent />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const id = req.query.id;
  const response = await fetchUrl(
    `${process.env.API_ENDPOINT}/api/nfts?contract=${GRADIENT_CONTRACT}&id=${id}`
  );
  let name = `#${id}`;
  let image = `${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`;
  if (response && response.data && response.data.length > 0) {
    name = response.data[0].name;
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
