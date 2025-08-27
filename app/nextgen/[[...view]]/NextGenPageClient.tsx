"use client";

import NextGenComponent from "@/components/nextGen/collections/NextGen";
import NextgenAboutComponent from "@/components/nextGen/collections/NextGenAbout";
import NextgenArtistsComponent from "@/components/nextGen/collections/NextGenArtists";
import NextgenCollectionsComponent from "@/components/nextGen/collections/NextGenCollections";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import { useTitle } from "@/contexts/TitleContext";
import { NextGenCollection } from "@/entities/INextgen";
import { NextGenView } from "@/enums";
import styles from "@/styles/Home.module.scss";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { getNextGenView } from "./view-utils";

export default function NextGenPageClient({
  featuredCollection,
  initialView,
}: {
  readonly featuredCollection: NextGenCollection;
  readonly initialView?: NextGenView;
}) {
  const router = useRouter();
  const params = useParams<{ view?: string[] }>();
  const { setTitle } = useTitle();

  const [collection] = useState<NextGenCollection>(featuredCollection);
  const [view, setView] = useState<NextGenView | undefined>(initialView);

  useEffect(() => {
    const viewFromUrl = getNextGenView(params?.view?.[0] ?? "") ?? undefined;
    setView(viewFromUrl);
    setTitle("NextGen " + (viewFromUrl ?? ""));
  }, [params?.view]);

  const updateView = (newView?: NextGenView) => {
    const newPath = newView ? `/nextgen/${newView.toLowerCase()}` : "/nextgen";
    router.push(newPath, { scroll: false });
  };

  return (
    <main className={styles.main}>
      {collection?.id ? (
        <>
          <NextGenNavigationHeader view={view} setView={updateView} />
          {!view && (
            <NextGenComponent collection={collection} setView={updateView} />
          )}
          {view && (
            <Container fluid className={styles.main}>
              <Row className="d-flex align-items-center">
                <Col>
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
                </Col>
              </Row>
            </Container>
          )}
        </>
      ) : (
        <div className={styles.nextGenQuestion}>
          <Image
            width={0}
            height={0}
            style={{ height: "auto", width: "25vw" }}
            src="/question.png"
            alt="questionmark"
          />
        </div>
      )}
    </main>
  );
}
