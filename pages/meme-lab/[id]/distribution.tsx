import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { MEMELAB_CONTRACT } from "../../../constants";
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

export default function MemeLabDistributionPage(props: any) {
  const pageProps = props.pageProps;

  return (
    <>
      <SharedHead
        props={pageProps}
        contract={MEMELAB_CONTRACT}
        isDistribution={true}
      />
      <main className={styles.main}>
        <Header />
        <DistributionComponent
          header="Meme Lab"
          contract={MEMELAB_CONTRACT}
          link="/meme-lab"
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return getSharedServerSideProps(req, MEMELAB_CONTRACT);
}
