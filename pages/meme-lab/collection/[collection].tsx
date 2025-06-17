import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { useSetTitle } from "../../../contexts/TitleContext";
import { AuthContext, useAuth } from "../../../components/auth/Auth";

const LabCollectionComponent = dynamic(
  () => import("../../../components/memelab/MemeLabCollection"),
  {
    ssr: false,
  }
);

export default function MemeLabIndex(props: any) {
  const { connectedProfile } = useAuth();
  const pagenameFull = `Collection ${props.collection} | Meme Lab`;
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
  let name = `${collection.replaceAll("-", " ")}`;

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
