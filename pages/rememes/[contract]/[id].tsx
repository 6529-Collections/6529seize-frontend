import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { fetchUrl } from "../../../services/6529api";
import { formatAddress } from "../../../helpers/Helpers";
import { useEffect } from "react";
import { useTitle } from "../../../contexts/TitleContext";

const RememePageComponent = dynamic(
  () => import("../../../components/rememes/RememePage"),
  { ssr: false }
);

export default function ReMeme(props: any) {
  const { setTitle } = useTitle();
  const pageProps = props.pageProps;
  
  useEffect(() => {
    setTitle(`${pageProps.name} | ReMemes | 6529.io`);
  }, [pageProps.name, setTitle]);

  return (
    <main className={styles.main}>
      <RememePageComponent contract={pageProps.contract} id={pageProps.id} />
    </main>
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
      metadata: {
        title: name,
        ogImage: image ?? `${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`,
        description: `ReMemes`,
        twitterCard: "summary_large_image",
      },
    },
  };
}
