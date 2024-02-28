import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { getCommonHeaders } from "../../../helpers/server.helpers";
import { commonApiFetch } from "../../../services/api/common-api";
import { NextGenCollection } from "../../../entities/INextgen";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NextGenNavigationHeader, {
  NextGenView,
} from "../../../components/nextGen/collections/NextGenNavigationHeader";
import Image from "next/image";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

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

const NextgenAboutComponent = dynamic(
  () => import("../../../components/nextGen/collections/NextGenAbout"),
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

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preload" href={collection.banner} as="image" />
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
        {collection?.id ? (
          <>
            <NextGenNavigationHeader view={view} setView={setView} />
            {!view && (
              <NextGenComponent collection={collection} setView={setView} />
            )}
            {view && (
              <Container fluid className={`${styles.main}`}>
                <Row className="d-flex align-items-center">
                  <Col>
                    {view && (
                      <Container className="pb-4">
                        <Row>
                          <Col>
                            {view === NextGenView.COLLECTIONS && (
                              <NextgenCollectionsComponent />
                            )}
                            {view === NextGenView.ARTISTS && (
                              <NextgenArtistsComponent />
                            )}
                            {view === NextGenView.ABOUT && (
                              <NextgenAboutComponent />
                            )}
                          </Col>
                        </Row>
                      </Container>
                    )}
                  </Col>
                </Row>
              </Container>
            )}
          </>
        ) : (
          <div className={`${styles.nextGenQuestion}`}>
            <Image
              width="0"
              height="0"
              style={{ height: "auto", width: "25vw" }}
              src="/question.png"
              alt="questionmark"
            />
          </div>
        )}
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
    nextgenView = getNextGenView(view);
  }

  return {
    props: {
      collection: collection,
      view: nextgenView,
    },
  };
}

function getNextGenView(view: string): NextGenView | null {
  const normalizedView = view.toLowerCase();
  const entries = Object.entries(NextGenView).find(
    ([, value]) => value.toLowerCase() === normalizedView
  );

  return entries ? NextGenView[entries[0] as keyof typeof NextGenView] : null;
}
