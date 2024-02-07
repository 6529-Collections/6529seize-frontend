import { Col, Container, Row } from "react-bootstrap";
import NextGenCollectionHeader from "../NextGenCollectionHeader";
import Breadcrumb, { Crumb } from "../../../../breadcrumb/Breadcrumb";
import NextGenCollectionArt from "../NextGenCollectionArt";
import { NextGenCollection } from "../../../../../entities/INextgen";
import { formatNameForUrl } from "../../../nextgen_helpers";
import NextGenNavigationHeader from "../../NextGenNavigationHeader";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionArtPage(props: Readonly<Props>) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    {
      display: `${props.collection.name}`,
      href: `/nextgen/collection/${formatNameForUrl(props.collection.name)}`,
    },
    { display: "Art" },
  ];

  return (
    <>
      <Breadcrumb breadcrumbs={crumbs} />
      <NextGenNavigationHeader />
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            <NextGenCollectionHeader
              collection={props.collection}
              collection_link={true}
            />
          </Col>
        </Row>
        <Row className="pt-4">
          <Col>
            <NextGenCollectionArt collection={props.collection} />
          </Col>
        </Row>
      </Container>
    </>
  );
}
