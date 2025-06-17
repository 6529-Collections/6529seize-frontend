import styles from "../../styles/Home.module.scss";

import React from "react";
import dynamic from "next/dynamic";
import { useSetTitle } from "../../contexts/TitleContext";

const TheMemesComponent = dynamic(
  () => import("../../components/the-memes/TheMemes"),
  { ssr: false }
);

export default function TheMemesPage() {
  useSetTitle("The Memes | Collections");

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
