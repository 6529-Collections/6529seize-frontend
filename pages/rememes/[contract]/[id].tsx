import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { fetchUrl } from "../../../services/6529api";
import { formatAddress, parseIpfsUrl } from "../../../helpers/Helpers";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../components/auth/Auth";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const RememePageComponent = dynamic(
  () => import("../../../components/rememes/RememePage"),
  { ssr: false }
);

export default function ReMeme(props: any) {
  const { setTitle, title } = useContext(AuthContext);
  const pageProps = props.pageProps;
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "ReMemes", href: "/rememes" },
    { display: pageProps.name },
  ]);

  useEffect(() => {
    setTitle({
      title: `${pageProps.name} | ReMemes | 6529.io`,
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content={`${pageProps.name} | ReMemes | 6529.io`}
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/rememes/${pageProps.contract}/${pageProps.id}`}
        />
        <meta
          property="og:title"
          content={`${pageProps.name} | ReMemes | 6529.io`}
        />
        <meta
          property="og:description"
          content={`${pageProps.name} | ReMemes | 6529.io`}
        />
        <meta property="og:image" content={parseIpfsUrl(pageProps.image)} />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <RememePageComponent contract={pageProps.contract} id={pageProps.id} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const contract = req.query.contract;
  const id = req.query.id;

  const response = await fetchUrl(
    `${process.env.API_ENDPOINT}/api/rememes?contract=${contract}&id=${id}`
  );

  let name = `${formatAddress(contract)} #${id}`;

  let image = `${process.env.BASE_ENDPOINT}/6529io.png`;
  if (response && response.data && response.data.length > 0) {
    if (response.data[0].metadata?.name) {
      name = response.data[0].metadata.name;
    }
    if (response.data[0].image) {
      image = response.data[0].image;
    }
  }
  return {
    props: {
      contract: contract,
      id: id,
      name: name,
      image: image,
    },
  };
}
