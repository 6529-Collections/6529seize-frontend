import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection } from "../../../../entities/INextgen";
import { useEffect, useState } from "react";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { commonApiFetch } from "../../../../services/api/common-api";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "../../../../helpers/Types";
import Image from "next/image";
import SocialStatementIcon from "../../../user/utils/icons/SocialStatementIcon";

interface Props {
  collection: NextGenCollection;
}

function formatCiCTitle(s: string) {
  return s
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function NextGenCollectionArtist(props: Readonly<Props>) {
  const [profileHandle, setProfileHandle] = useState<string>("");
  const [pfp, setPfp] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [cicStatements, setCicStatements] = useState<CicStatement[]>([]);

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
      setCicStatements(
        statements.filter((s) =>
          [
            STATEMENT_GROUP.SOCIAL_MEDIA_ACCOUNT,
            STATEMENT_GROUP.NFT_ACCOUNTS,
            STATEMENT_GROUP,
          ].includes(s.statement_group)
        )
      );
    });
  }, []);

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h4>About the Artist</h4>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col
          sm={12}
          md={6}
          className="d-flex align-items-center justify-content-center">
          <Image
            width={0}
            height={0}
            style={{
              height: "auto",
              width: "auto",
              maxHeight: "400px",
              maxWidth: "100%",
            }}
            src={pfp}
            alt={props.collection.artist}
            className="cursor-pointer"
          />
        </Col>
        <Col sm={12} md={5}>
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
                    }
                    target="_blank"
                    rel="noreferrer">
                    @{profileHandle}
                  </a>
                </Col>
              </Row>
            )}
            {cicStatements.length > 0 && (
              <Row className="pt-3">
                <Col className="d-flex align-items-center gap-2">
                  {cicStatements.map((s) => (
                    <div
                      key={`cic-${s.statement_type}-${s.statement_value}`}
                      className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-8 tw-w-8 tw-text-iron-100">
                      <a
                        title={formatCiCTitle(s.statement_type)}
                        href={s.statement_value}
                        target="_blank"
                        rel="noreferrer">
                        <SocialStatementIcon statementType={s.statement_type} />
                      </a>
                    </div>
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
