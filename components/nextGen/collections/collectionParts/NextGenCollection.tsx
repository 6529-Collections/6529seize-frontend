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
  TOP_TRAIT_SETS = "Trait Sets",
}

export function getContentViewKeyByValue(value: string): string {
  for (const [key, val] of Object.entries(ContentView)) {
    if (val === value) {
      return key;
    }
  }
  return ContentView.OVERVIEW;
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

export default function NextGenCollectionComponent(props: Readonly<Props>) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    { display: `${props.collection.name}` },
  ];

  const [view, setView] = useState<ContentView>(props.view);

  useEffect(() => {
    let path =
      view === ContentView.OVERVIEW
        ? "/"
        : `/${getContentViewKeyByValue(view).toLowerCase()}`;
    path = path.replaceAll(" ", "-").replaceAll("_", "-");
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
              {printViewButton(view, ContentView.OVERVIEW, setView)}
              {printViewButton(view, ContentView.ABOUT, setView)}
              {printViewButton(view, ContentView.PROVENANCE, setView)}
              {printViewButton(view, ContentView.TOP_TRAIT_SETS, setView)}
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>
              <NextGenCollectionDetails
                collection={props.collection}
                view={view}
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
