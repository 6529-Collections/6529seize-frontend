import styles from "../../../styles/Home.module.scss";

import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import {
  SharedHead,
  getSharedServerSideProps,
} from "../../../components/the-memes/MemeShared";
import {
  MEMES_CONTRACT,
  MEMES_MANIFOLD_PROXY_CONTRACT,
} from "../../../constants";
import { MEMES_MANIFOLD_PROXY_ABI } from "../../../abis";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const ManifoldMinting = dynamic(
  () => import("../../../components/manifoldMinting/ManifoldMinting"),
  {
    ssr: false,
  }
);

export default function TheMemesMint(props: any) {
  const pageProps = props.pageProps;

  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "The Memes", href: "/the-memes" },
    { display: `Card ${pageProps.id}`, href: `/the-memes/${pageProps.id}` },
    { display: `Mint` },
  ];

  return (
    <>
      <SharedHead
        props={pageProps}
        contract={MEMES_CONTRACT}
        isDistribution={true}
      />
      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <ManifoldMinting
          title={`The Memes #${pageProps.id}`}
          // contract={MEMES_CONTRACT}
          contract="0xb491971ba9d757d1b16feba1a019b60d6b74dc20"
          proxy={MEMES_MANIFOLD_PROXY_CONTRACT}
          abi={MEMES_MANIFOLD_PROXY_ABI}
          // token_id={pageProps.id}
          token_id={1}
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return getSharedServerSideProps(req, MEMES_CONTRACT);
}
