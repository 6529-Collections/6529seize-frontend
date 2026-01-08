"use client";

import NextGenComponent from "@/components/nextGen/collections/NextGen";
import NextgenAboutComponent from "@/components/nextGen/collections/NextGenAbout";
import NextgenArtistsComponent from "@/components/nextGen/collections/NextGenArtists";
import NextgenCollectionsComponent from "@/components/nextGen/collections/NextGenCollections";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";
import { useTitle } from "@/contexts/TitleContext";
import type { NextGenCollection } from "@/entities/INextgen";
import { NextgenView } from "@/enums";
import styles from "@/styles/Home.module.scss";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { getNextGenView } from "./view-utils";

export default function NextGenPageClient({
  featuredCollection,
  initialView,
}: {
  readonly featuredCollection: NextGenCollection;
  readonly initialView?: NextgenView | undefined;
}) {
  const { setTitle } = useTitle();

  const [collection] = useState<NextGenCollection>(featuredCollection);
  const [view, setView] = useState<NextgenView | undefined>(initialView);

  useEffect(() => {
    setTitle("NextGen " + (view ?? ""));
  }, [setTitle, view]);

  const updateView = (newView?: NextgenView) => {
    setView(newView);
    const newPath = newView ? `/nextgen/${newView.toLowerCase()}` : "/nextgen";
    window.history.pushState({ view: newView }, "", newPath);
  };

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        const newView = getNextGenView(e.state.view);
        setView(newView);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <main className={styles["main"]}>
      {collection?.id ? (
        <>
          <NextGenNavigationHeader view={view} setView={updateView} />
          {!view && (
            <NextGenComponent collection={collection} setView={updateView} />
          )}
          {view && (
            <Container fluid className={styles["main"]}>
              <Row className="d-flex align-items-center">
                <Col>
                  <Container className="pb-4">
                    <Row>
                      <Col>
                        {view === NextgenView.COLLECTIONS && (
                          <NextgenCollectionsComponent />
                        )}
                        {view === NextgenView.ARTISTS && (
                          <NextgenArtistsComponent />
                        )}
                        {view === NextgenView.ABOUT && (
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
        <div className={styles["nextGenQuestion"]}>
          <Image
            unoptimized
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
