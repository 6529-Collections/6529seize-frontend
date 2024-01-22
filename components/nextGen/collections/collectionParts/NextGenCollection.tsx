import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import Breadcrumb, { Crumb } from "../../../breadcrumb/Breadcrumb";
import NextGenCollectionHeader from "./NextGenCollectionHeader";
import NextGenCollectionArt from "./NextGenCollectionArt";
import NextGenCollectionDetails from "./NextGenCollectionDetails";
import NextGenCollectionSlideshow from "./NextGenCollectionSlideshow";
import { NextGenCollection } from "../../../../entities/INextgen";
import { useState } from "react";
import NextGenCollectionArtist from "./NextGenCollectionArtist";

interface Props {
  collection: NextGenCollection;
}

export enum ContentView {
  ABOUT,
  PROVENANCE,
}

export default function NextGenCollection(props: Readonly<Props>) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    { display: `#${props.collection.id} - ${props.collection.name}` },
  ];

  const [view, setView] = useState<ContentView>(ContentView.ABOUT);

  return (
    <>
      <Breadcrumb breadcrumbs={crumbs} />
      <NextGenCollectionSlideshow collection={props.collection} />
      <Container className="pt-3 pb-2">
        <>
          <NextGenCollectionHeader collection={props.collection} />
          <Row className="pt-5">
            <Col>
              <NextGenCollectionArt
                collection={props.collection}
                show_view_all={true}
              />
            </Col>
          </Row>
          <Row className="pt-5">
            <Col className="d-flex gap-4">
              <a
                onClick={() => setView(ContentView.ABOUT)}
                className={
                  view === ContentView.ABOUT
                    ? styles.nextgenTokenDetailsLinkSelected
                    : ""
                }>
                <h4
                  className={
                    view === ContentView.ABOUT
                      ? "font-color"
                      : "font-color-h cursor-pointer"
                  }>
                  About
                </h4>
              </a>
              <a
                onClick={() => setView(ContentView.PROVENANCE)}
                className={
                  view === ContentView.PROVENANCE
                    ? styles.nextgenTokenDetailsLinkSelected
                    : ""
                }>
                <h4
                  className={
                    view === ContentView.PROVENANCE
                      ? "font-color"
                      : "font-color-h cursor-pointer"
                  }>
                  Provenance
                </h4>
              </a>
            </Col>
          </Row>
          <Row className="pt-4 pb-4">
            <Col>
              <NextGenCollectionDetails
                collection={props.collection}
                view={view}
              />
            </Col>
          </Row>
        </>
      </Container>
      <Container className="pt-2 pb-4">
        <Row>
          <Col>
            <h4>About the Artist</h4>
          </Col>
        </Row>
        <Row>
          <Col>
            <NextGenCollectionArtist collection={props.collection} />
          </Col>
        </Row>
      </Container>
    </>
  );
}
