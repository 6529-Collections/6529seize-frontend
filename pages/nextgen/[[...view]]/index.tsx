import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { getCommonHeaders } from "../../../helpers/server.helpers";
import { commonApiFetch } from "../../../services/api/common-api";
import { NextGenCollection } from "../../../entities/INextgen";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NextGenNavigationHeader, {
  NextGenView,
} from "../../../components/nextGen/collections/NextGenNavigationHeader";
import Image from "next/image";

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

  useEffect(() => {
    if (view) {
      router.push(`/nextgen/${view.toLowerCase()}`);
    } else {
      router.push("/nextgen");
    }
  }, [view]);

  return (
    <main className={styles.main}>
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
      metadata: {
        title: `${nextgenView ? `${nextgenView} | ` : ""}NextGen`,
        ogImage: collection.image,
        description: "NextGen",
        twitterCard: "summary_large_image",
      },
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
