import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { getSharedServerSideProps } from "../../../components/the-memes/MemeShared";
import { MEMES_CONTRACT } from "../../../constants";

const MemePageComponent = dynamic(
  () => import("../../../components/the-memes/MemePage"),
  {
    ssr: false,
  }
);

export default function MemePage() {
  return (
    <main className={styles.main}>
      <MemePageComponent />
    </main>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return getSharedServerSideProps(req, MEMES_CONTRACT);
}
