import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { AuthContext } from "../components/auth/Auth";
import { useContext, useEffect } from "react";

const Gas = dynamic(() => import("../components/gas-royalties/Gas"), {
  ssr: false,
});

export default function GasPage() {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Meme Gas | Tools",
    });
  }, []);

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
