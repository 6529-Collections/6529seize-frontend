import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../components/auth/Auth";

const Royalties = dynamic(
  () => import("../components/gas-royalties/Royalties"),
  {
    ssr: false,
  }
);

export default function MemeAccountingPage() {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Meme Accounting | Tools",
    });
  }, []);

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
