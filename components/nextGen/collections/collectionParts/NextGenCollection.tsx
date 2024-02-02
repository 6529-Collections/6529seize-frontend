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
  ABOUT = "About",
  PROVENANCE = "Provenance",
  RENDER_CENTER = "Render Center",
  RARITY = "Rarity",
}

export function printViewButton(
  currentView: ContentView,
  v: ContentView,
  setView: (v: ContentView) => void
) {
  return (
    <button
      onClick={() => setView(v)}
      className={`btn-link ${
        v === currentView ? styles.nextgenTokenDetailsLinkSelected : ""
      }`}>
      <h4
        className={
          v === currentView ? "font-color" : "font-color-h cursor-pointer"
        }>
        {v}
      </h4>
    </button>
  );
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
          <NextGenCollectionHeader
            collection={props.collection}
            showDistributionLink={true}
          />
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
              {printViewButton(view, ContentView.ABOUT, setView)}
              {printViewButton(view, ContentView.PROVENANCE, setView)}
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
