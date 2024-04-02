import Head from "next/head";
import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { MEMES_CONTRACT, MEMES_MINTING_HREF } from "../../../constants";
import { fetchUrl } from "../../../services/6529api";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import {
  SharedHead,
  getSharedServerSideProps,
} from "../../../components/the-memes/MemeShared";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const DistributionComponent = dynamic(
  () => import("../../../components/distribution/Distribution"),
  {
    ssr: false,
  }
);

export default function MemeDistributionPage(props: any) {
  const pageProps = props.pageProps;
  const pagenameFull = `${pageProps.name} | 6529 SEIZE`;

  return (
    <>
      <SharedHead
        props={pageProps}
        contract={MEMES_CONTRACT}
        isDistribution={true}
      />
      <main className={styles.main}>
        <Header />
        <DistributionComponent
          header="The Memes"
          contract={MEMES_CONTRACT}
          link="/the-memes"
          minting_link={MEMES_MINTING_HREF}
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return getSharedServerSideProps(req, MEMES_CONTRACT);
}
