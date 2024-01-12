import { Container, Row, Col } from "react-bootstrap";
import Breadcrumb, { Crumb } from "../../../breadcrumb/Breadcrumb";
import NextGenCollectionHeader from "./NextGenCollectionHeader";
import NextGenCollectionArt from "./NextGenCollectionArt";
import NextGenCollectionDetails from "./NextGenCollectionDetails";
import NextGenCollectionSlideshow from "./NextGenCollectionSlideshow";
import { NextGenCollection } from "../../../../entities/INextgen";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollection(props: Readonly<Props>) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    { display: `#${props.collection.id} - ${props.collection.name}` },
  ];

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
            <Col>
              <NextGenCollectionDetails collection={props.collection} />
            </Col>
          </Row>
        </>
      </Container>
    </>
  );
}
