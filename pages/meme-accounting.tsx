import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "../contexts/TitleContext";

const Royalties = dynamic(
  () => import("../components/gas-royalties/Royalties"),
  {
    ssr: false,
  }
);

export default function MemeAccountingPage() {
  useSetTitle("Meme Accounting | Tools");

  return (
    <main className={styles.main}>
      <Royalties />
    </main>
  );
}

MemeAccountingPage.metadata = {
  title: "Meme Accounting",
  description: "Tools",
};
