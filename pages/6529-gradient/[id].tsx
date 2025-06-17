import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { GRADIENT_CONTRACT } from "../../constants";
import { fetchUrl } from "../../services/6529api";
import { useSetTitle } from "../../contexts/TitleContext";

const GradientPageComponent = dynamic(
  () => import("../../components/6529Gradient/GradientPage"),
  {
    ssr: false,
  }
);

export default function GradientPageIndex(props: { readonly name: string }) {
  const pagenameFull = `${props.name} | 6529.io`;
  useSetTitle(pagenameFull);

  return (
    <main className={styles.main}>
      <GradientPageComponent />
    </main>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const id = req.query.id;
  const response = await fetchUrl(
    `${process.env.API_ENDPOINT}/api/nfts?contract=${GRADIENT_CONTRACT}&id=${id}`
  );
  let name = `Gradient #${id}`;
  let image = `${process.env.BASE_ENDPOINT}/6529io.png`;
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
      metadata: {
        title: name,
        ogImage: image,
        description: "6529 Gradient",
      },
    },
  };
}
