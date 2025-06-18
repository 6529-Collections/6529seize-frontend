import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "../../../contexts/TitleContext";
import { useAuth } from "../../../components/auth/Auth";
import { useRouter } from "next/router";

const LabCollectionComponent = dynamic(
  () => import("../../../components/memelab/MemeLabCollection"),
  {
    ssr: false,
  }
);

export default function MemeLabIndex(props: {
  readonly collection: string;
  readonly name: string;
}) {
  const { connectedProfile } = useAuth();

  const pagenameFull = `Collection ${props.name} | Meme Lab`;
  useSetTitle(pagenameFull);

  return (
    <main className={styles.main}>
      <LabCollectionComponent
        wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
      />
    </main>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const collection = req.query.collection;
  const name = `${collection.replaceAll("-", " ")}`;

  return {
    props: {
      collection: collection,
      name: name,
      metadata: {
        title: name,
        description: "Meme Lab",
      },
    },
  };
}
