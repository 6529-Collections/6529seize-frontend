import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection } from "../../../../entities/INextgen";
import { useEffect, useState } from "react";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { commonApiFetch } from "../../../../services/api/common-api";
import { STATEMENT_TYPE } from "../../../../helpers/Types";
import Image from "next/image";
import { formatNameForUrl } from "../../nextgen_helpers";

interface Props {
  collection: NextGenCollection;
  link_collections?: NextGenCollection[];
}

export default function NextGenCollectionArtist(props: Readonly<Props>) {
  const [profileHandle, setProfileHandle] = useState<string>("");
  const [pfp, setPfp] = useState<string>("");
  const [bio, setBio] = useState<string>("");

  useEffect(() => {
    commonApiFetch<IProfileAndConsolidations>({
      endpoint: `profiles/${props.collection.artist_address}`,
    }).then((profile) => {
      setProfileHandle(profile.profile?.handle ?? "");
      setPfp(profile.profile?.pfp_url ?? "");
    });
  }, []);

  useEffect(() => {
    commonApiFetch<CicStatement[]>({
      endpoint: `profiles/${props.collection.artist_address}/cic/statements`,
    }).then((statements) => {
      const bioStatement = statements.find(
        (s) => s.statement_type === STATEMENT_TYPE.BIO
      );
      setBio(bioStatement?.statement_value ?? "");
    });
  }, []);

  return (
    <Container className="no-padding">
      <Row>
        <Col
          sm={12}
          md={3}
          className="pt-4 d-flex align-items-center justify-content-center">
          {pfp && (
            <Image
              priority
              loading="eager"
              width={0}
              height={0}
              style={{
                height: "auto",
                width: "100%",
              }}
              src={pfp}
              alt={props.collection.artist}
              className="cursor-pointer"
            />
          )}
        </Col>
        <Col sm={12} md={9} className="pt-4">
          <Container className="no-padding">
            <Row>
              <Col>
                <h3 className="font-color mb-0">{props.collection.artist}</h3>
              </Col>
            </Row>
            {profileHandle && (
              <Row className="pt-3">
                <Col>
                  <a
                    href={
                      profileHandle
                        ? `/${profileHandle}`
                        : `/${props.collection.artist_address}`
                    }>
                    @{profileHandle}
                  </a>
                </Col>
              </Row>
            )}
            {props.link_collections && (
              <Row className="pt-4">
                <Col>
                  Collection{props.link_collections.length > 1 ? "s" : ""}:{" "}
                  {props.link_collections.map((c, index) => (
                    <>
                      {index > 0 && ", "}
                      <a
                        key={`link-collection-${c.id}`}
                        href={`/nextgen/collection/${formatNameForUrl(
                          c.name
                        )}`}>
                        {c.name}
                      </a>
                    </>
                  ))}
                </Col>
              </Row>
            )}
            <Row className="pt-4">
              <Col>{bio}</Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
