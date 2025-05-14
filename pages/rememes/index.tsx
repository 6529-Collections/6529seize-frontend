import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

interface Props {
  meme_id?: number;
}

const RememesComponent = dynamic(
  () => import("../../components/rememes/Rememes"),
  { ssr: false }
);

export default function ReMemes(props: Readonly<Props>) {
  const { setTitle } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "ReMemes | Collections",
    });
  }, []);

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
