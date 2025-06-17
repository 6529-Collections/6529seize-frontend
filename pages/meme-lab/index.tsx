import styles from "../../styles/Home.module.scss";
import { useSetTitle } from "../../contexts/TitleContext";
import dynamic from "next/dynamic";
import { useAuth } from "../../components/auth/Auth";

const MemeLabComponent = dynamic(
  () => import("../../components/memelab/MemeLab"),
  { ssr: false }
);

export default function MemeLab() {
  useSetTitle("Meme Lab | Collections");

  const { connectedProfile } = useAuth();

  return (
    <main className={styles.main}>
      <MemeLabComponent
        wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
      />
    </main>
  );
}

MemeLab.metadata = {
  title: "Meme Lab",
  ogImage: `${process.env.BASE_ENDPOINT}/meme-lab.jpg`,
  description: "Collections",
};
