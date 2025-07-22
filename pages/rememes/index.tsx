import styles from "@/styles/Home.module.scss";
import dynamic from "next/dynamic";
import React from "react";
import { useSetTitle } from "../../contexts/TitleContext";

interface Props {
  meme_id?: number;
}

const RememesComponent = dynamic(
  () => import("../../components/rememes/Rememes"),
  { ssr: false }
);

export default function ReMemes(props: Readonly<Props>) {
  useSetTitle("ReMemes | Collections");

  return (
    <main className={styles.main}>
      <RememesComponent />
    </main>
  );
}

ReMemes.metadata = {
  title: "ReMemes",
  description: "Collections",
  ogImage: `${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`,
};
