import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useSetTitle } from "../contexts/TitleContext";

const Gas = dynamic(() => import("../components/gas-royalties/Gas"), {
  ssr: false,
});

export default function GasPage() {
  useSetTitle("Meme Gas | Tools");

  return (
    <main className={styles.main}>
      <Gas />
    </main>
  );
}

GasPage.metadata = {
  title: "Meme Gas",
  description: "Tools",
};
