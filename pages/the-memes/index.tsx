import styles from "../../styles/Home.module.scss";

import { useContext, useEffect } from "react";
import dynamic from "next/dynamic";
import { AuthContext } from "../../components/auth/Auth";

const TheMemesComponent = dynamic(
  () => import("../../components/the-memes/TheMemes"),
  { ssr: false }
);

export default function TheMemesPage() {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "The Memes | Collections",
    });
  }, []);

  return (
    <main className={styles.main}>
      <TheMemesComponent />
    </main>
  );
}

TheMemesPage.metadata = {
  title: "The Memes",
  ogImage: `${process.env.BASE_ENDPOINT}/memes-preview.png`,
  description: "Collections",
  twitterCard: "summary_large_image",
};
