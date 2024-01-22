import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { getCommonHeaders } from "../../../helpers/server.helpers";
import { commonApiFetch } from "../../../services/api/common-api";
import { NextGenCollection } from "../../../entities/INextgen";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export enum NextGenView {
  COLLECTIONS = "Collections",
  ARTISTS = "Artists",
}

const NextGenComponent = dynamic(
  () => import("../../../components/nextGen/collections/NextGen"),
  { ssr: false }
);

const NextgenCollectionsComponent = dynamic(
  () => import("../../../components/nextGen/collections/NextGenCollections"),
  { ssr: false }
);

const NextgenArtistsComponent = dynamic(
  () => import("../../../components/nextGen/collections/NextGenArtists"),
  { ssr: false }
);

export default function NextGen(props: any) {
  const router = useRouter();
  const collection: NextGenCollection = props.pageProps.collection;
  const [view, setView] = useState<NextGenView | undefined>(
    props.pageProps.view
  );

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  function setCrumbs() {
    const crumbs: Crumb[] = [{ display: "Home", href: "/" }];
    if (view) {
      crumbs.push({ display: "NextGen", href: "/nextgen" });
      crumbs.push({ display: view });
    } else {
      crumbs.push({ display: "NextGen" });
    }
    setBreadcrumbs(crumbs);
  }

  useEffect(() => {
    if (view) {
      router.push(`/nextgen/${view.toLowerCase()}`, undefined, {
        shallow: true,
      });
    } else {
      router.push("/nextgen", undefined, { shallow: true });
    }
    setCrumbs();
  }, [view]);

  const title = view
    ? view + " | NextGen | 6529 SEIZE"
    : "NextGen | 6529 SEIZE";
  const path = view ? `/nextgen/${view.toLowerCase()}` : "/nextgen";

  function printView(v: NextGenView | undefined) {
    let className;
    if (!v) {
      className = view ? "font-color" : "font-color-h";
    } else {
      className = v === view ? "font-color-h" : "font-color";
    }
    const viewHeader = (
      <h4 className={`mb-0 ${className}`}>
        <b>{v ?? "Featured"}</b>
      </h4>
    );
    if (view == v) {
      return viewHeader;
    }
    return (
      <button className="btn-link" onClick={() => setView(v)}>
        {viewHeader}
      </button>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={`${title} | 6529 SEIZE`} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/${path}`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/nextgen.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={`${styles.main}`}>
          <Row className="d-flex align-items-center">
            <Container className="no-padding pt-4">
              <Row>
                <Col
                  xs={12}
                  className="pt-3 pb-3 d-flex align-items-center justify-content-between">
                  <Image
                    priority
                    width="0"
                    height="0"
                    className="cursor-pointer"
                    style={{ width: "400px", maxWidth: "85vw", height: "auto" }}
                    src="/nextgen-logo.png"
                    alt="nextgen"
                    onClick={() => setView(undefined)}
                  />
                  <span className="d-flex gap-4">
                    {printView(undefined)}
                    {printView(NextGenView.COLLECTIONS)}
                    {printView(NextGenView.ARTISTS)}
                  </span>
                </Col>
              </Row>
            </Container>
          </Row>
          <Row className="pb-4">
            <Col>
              {view === NextGenView.COLLECTIONS && (
                <NextgenCollectionsComponent />
              )}
              {view === NextGenView.ARTISTS && <NextgenArtistsComponent />}

              {!view && <NextGenComponent collection={collection} />}
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const headers = getCommonHeaders(req);
  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/featured`,
    headers: headers,
  });

  let view = req.query.view as string;
  let nextgenView: NextGenView | null = null;
  if (view) {
    view = view[0].toLowerCase();
    if (view === NextGenView.COLLECTIONS.toLowerCase()) {
      nextgenView = NextGenView.COLLECTIONS;
    } else if (view == NextGenView.ARTISTS.toLowerCase()) {
      nextgenView = NextGenView.ARTISTS;
    }
  }

  return {
    props: {
      collection: collection,
      view: nextgenView,
    },
  };
}
