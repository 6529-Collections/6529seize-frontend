import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { fetchUrl } from "../../../services/6529api";
import { parseIpfsUrl } from "../../../helpers/Helpers";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const RememePageComponent = dynamic(
  () => import("../../../components/rememes/RememePage"),
  { ssr: false }
);

interface Props {
  contract: string;
  id: string;
  name: string;
  image: string;
}

export default function ReMeme(props: Props) {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "ReMemes", href: "/rememes" },
    { display: props.name },
  ]);

  return (
    <>
      <Head>
        <title>{`${props.name} | ReMemes | 6529 SEIZE`}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content={`${props.name} | ReMemes | 6529 SEIZE`}
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/rememes/${props.contract}/${props.id}`}
        />
        <meta
          property="og:title"
          content={`${props.name} | ReMemes | 6529 SEIZE`}
        />
        <meta
          property="og:description"
          content={`${props.name} | ReMemes | 6529 SEIZE`}
        />
        <meta property="og:image" content={parseIpfsUrl(props.image)} />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <RememePageComponent contract={props.contract} id={props.id} />
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
  let name = `Rememe #${id} from contract ${contract}`;
  let image = `${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`;
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
