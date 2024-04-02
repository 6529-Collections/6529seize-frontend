import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import {
  SharedHead,
  SharedHeadProps,
  getSharedServerSideProps,
} from "../../../components/the-memes/MemeShared";
import { MEMES_CONTRACT } from "../../../constants";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const MemePageComponent = dynamic(
  () => import("../../../components/the-memes/MemePage"),
  {
    ssr: false,
  }
);

export default function MemePage(props: any) {
  const pageProps: SharedHeadProps = props.pageProps;

  return (
    <>
      <SharedHead props={pageProps} contract={MEMES_CONTRACT} />
      <main className={styles.main}>
        <Header />
        <MemePageComponent />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return getSharedServerSideProps(req, MEMES_CONTRACT);
}
