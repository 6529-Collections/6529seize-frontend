import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import React from "react";
import { useSetTitle } from "../../contexts/TitleContext";

const AddRememeComponent = dynamic(
  () => import("../../components/rememes/RememeAddPage"),
  { ssr: false }
);

export default function ReMemes() {
  useSetTitle("Add ReMemes | Collections");

  return (
    <main className={styles.main}>
      <AddRememeComponent />
    </main>
  );
}

ReMemes.metadata = {
  title: "ReMemes | Add",
  description: "Collections",
  ogImage: `${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`,
};
