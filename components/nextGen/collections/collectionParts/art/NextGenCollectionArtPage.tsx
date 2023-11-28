import { Col, Container, Row } from "react-bootstrap";
import { useEffect } from "react";
import { PhaseTimes, AdditionalData, Info } from "../../../nextgen_entities";
import {
  useCollectionPhases,
  useCollectionAdditionalData,
  useCollectionInfo,
  useTokensIndex,
  useSharedState,
} from "../../../nextgen_helpers";
import NextGenCollectionHeader from "../NextGenCollectionHeader";
import Breadcrumb, { Crumb } from "../../../../breadcrumb/Breadcrumb";
import NextGenCollectionArt from "../NextGenCollectionArt";

interface Props {
  collection: number;
}

export default function NextGenCollectionArtPage(props: Readonly<Props>) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
  ];

  const {
    breadcrumbs,
    setBreadcrumbs,
    info,
    setInfo,
    infoSettled,
    setInfoSettled,
    tokenStartIndex,
    setTokenStartIndex,
    phaseTimes,
    setPhaseTimes,
    additionalData,
    setAdditionalData,
    tokenIds,
    setTokenIds,
  } = useSharedState();

  useEffect(() => {
    setBreadcrumbs(crumbs);
  }, []);

  useCollectionInfo(props.collection, (data: Info) => {
    setInfo(data);
    const nameCrumb = data.name
      ? `#${props.collection} - ${data.name}`
      : `Collection #${props.collection}`;
    setBreadcrumbs((b) => [
      ...crumbs,
      { display: nameCrumb, href: `/nextgen/collection/${props.collection}` },
      { display: "Art" },
    ]);
    setInfoSettled(true);
  });

  useCollectionPhases(props.collection, (data: PhaseTimes) => {
    setPhaseTimes(data);
  });

  useCollectionAdditionalData(
    props.collection,
    (data: AdditionalData) => {
      setAdditionalData(data);
    },
    true
  );

  useTokensIndex("min", props.collection, (data: number) => {
    setTokenStartIndex(data);
  });

  useEffect(() => {
    if (tokenStartIndex > 0 && additionalData) {
      setTokenIds(
        Array.from(
          { length: additionalData.circulation_supply },
          (_, i) => tokenStartIndex + i
        )
      );
    }
  }, [tokenStartIndex, additionalData]);

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container className="pt-4 pb-4">
        {phaseTimes && additionalData && infoSettled && info && (
          <>
            <Row>
              <Col>
                <NextGenCollectionHeader
                  collection={props.collection}
                  info={info}
                  phase_times={phaseTimes}
                  additional_data={additionalData}
                  collection_link={true}
                />
              </Col>
            </Row>
            <Row className="pt-4">
              <Col>
                <NextGenCollectionArt
                  collection={props.collection}
                  additional_data={additionalData}
                  token_ids={tokenIds}
                />
              </Col>
            </Row>
          </>
        )}
      </Container>
    </>
  );
}
