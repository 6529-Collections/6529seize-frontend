import { NextGenCollection } from "@/entities/INextgen";
import { Col, Container, Row } from "react-bootstrap";
import styles from "../NextGen.module.scss";
import NextGenNavigationHeader from "../NextGenNavigationHeader";
import NextGenCollectionArt from "./NextGenCollectionArt";
import NextGenCollectionArtist from "./NextGenCollectionArtist";
import NextGenCollectionDetails from "./NextGenCollectionDetails";
import NextGenCollectionHeader from "./NextGenCollectionHeader";
import NextGenCollectionSlideshow from "./NextGenCollectionSlideshow";

interface Props {
  collection: NextGenCollection;
  view: ContentView;
  setView: (v: ContentView) => void;
}

export enum ContentView {
  ABOUT = "About",
  PROVENANCE = "Provenance",
  DISPLAY_CENTER = "Display Center",
  RARITY = "Rarity",
  OVERVIEW = "Overview",
  TOP_TRAIT_SETS = "Trait Sets",
}

export function printViewButton(
  currentView: ContentView,
  v: ContentView,
  setView: (v: ContentView) => void
) {
  return (
    <button
      onClick={() => setView(v)}
      className={`btn-link decoration-none ${
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

export default function NextGenCollectionComponent(props: Readonly<Props>) {
  return (
    <>
      <NextGenNavigationHeader />
      {props.collection.mint_count > 0 && (
        <NextGenCollectionSlideshow collection={props.collection} />
      )}
      <Container className="pt-3 pb-2">
        <>
          <NextGenCollectionHeader
            collection={props.collection}
            show_links={true}
          />
          <Row className="pt-5">
            <Col className="d-flex gap-4">
              {printViewButton(props.view, ContentView.OVERVIEW, props.setView)}
              {printViewButton(props.view, ContentView.ABOUT, props.setView)}
              {printViewButton(
                props.view,
                ContentView.PROVENANCE,
                props.setView
              )}
              {printViewButton(
                props.view,
                ContentView.TOP_TRAIT_SETS,
                props.setView
              )}
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>
              <NextGenCollectionDetails
                collection={props.collection}
                view={props.view}
              />
            </Col>
          </Row>
          <Row className="pt-4">
            <Col>
              <NextGenCollectionArt
                collection={props.collection}
                show_view_all={true}
              />
            </Col>
          </Row>
        </>
      </Container>
      <Container className="pt-4 pb-4">
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
