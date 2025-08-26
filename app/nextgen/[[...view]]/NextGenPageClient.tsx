"use client";

import styles from "@/styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { NextGenCollection } from "@/entities/INextgen";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import NextGenNavigationHeader, { NextGenView } from "@/components/nextGen/collections/NextGenNavigationHeader";
import Image from "next/image";
import { useTitle } from "@/contexts/TitleContext";
import { commonApiFetch } from "@/services/api/common-api";
import NextGenComponent from "@/components/nextGen/collections/NextGen";
import NextgenCollectionsComponent from "@/components/nextGen/collections/NextGenCollections";
import NextgenArtistsComponent from "@/components/nextGen/collections/NextGenArtists";
import NextgenAboutComponent from "@/components/nextGen/collections/NextGenAbout";
import { getNextGenView } from "./view-utils";

export default function NextGenPageClient() {
  const router = useRouter();
  const params = useParams<{ view?: string[] }>() as { view?: string[] };
  const { setTitle } = useTitle();

  const [collection, setCollection] = useState<NextGenCollection | null>(null);
  const [view, setView] = useState<NextGenView | undefined>(undefined);

  useEffect(() => {
    commonApiFetch<NextGenCollection>({ endpoint: "nextgen/featured" }).then(setCollection);
  }, []);

  useEffect(() => {
    const viewFromUrl = getNextGenView(params.view?.[0] ?? "");
    setView(viewFromUrl ?? undefined);
    setTitle("NextGen " + (viewFromUrl ?? ""));
  }, [params, setTitle]);

  const updateView = (newView?: NextGenView) => {
    const newPath = newView ? `/nextgen/${newView.toLowerCase()}` : "/nextgen";
    router.push(newPath);
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
                        {view === NextGenView.COLLECTIONS && <NextgenCollectionsComponent />}
                        {view === NextGenView.ARTISTS && <NextgenArtistsComponent />}
                        {view === NextGenView.ABOUT && <NextgenAboutComponent />}
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
