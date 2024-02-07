import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import Breadcrumb, { Crumb } from "../../../breadcrumb/Breadcrumb";
import NextGenCollectionHeader from "./NextGenCollectionHeader";
import NextGenCollectionArt from "./NextGenCollectionArt";
import NextGenCollectionDetails from "./NextGenCollectionDetails";
import NextGenCollectionSlideshow from "./NextGenCollectionSlideshow";
import { NextGenCollection } from "../../../../entities/INextgen";
import { useEffect, useState } from "react";
import NextGenCollectionArtist from "./NextGenCollectionArtist";
import NextGenNavigationHeader from "../NextGenNavigationHeader";
import router from "next/router";
import { formatNameForUrl } from "../../nextgen_helpers";

interface Props {
  collection: NextGenCollection;
  view: ContentView;
}

export enum ContentView {
  ABOUT = "About",
  PROVENANCE = "Provenance",
  DISPLAY_CENTER = "Display Center",
  RARITY = "Rarity",
  OVERVIEW = "Overview",
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
    { display: `${props.collection.name}` },
  ];

  const [view, setView] = useState<ContentView>(props.view);

  useEffect(() => {
    const path = view === ContentView.OVERVIEW ? "/" : `/${view.toLowerCase()}`;
    router.push(
      `/nextgen/collection/${formatNameForUrl(props.collection.name)}${path}`,
      undefined,
      {
        shallow: true,
      }
    );
  }, [view]);

  return (
    <>
      <Breadcrumb breadcrumbs={crumbs} />
      <NextGenNavigationHeader />
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
              {printViewButton(view, ContentView.OVERVIEW, setView)}
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
