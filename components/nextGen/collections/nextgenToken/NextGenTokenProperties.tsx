import styles from "../NextGen.module.scss";

import { Col, Container, Row, Table } from "react-bootstrap";
import { NextGenTrait } from "../../../../entities/INextgen";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";

interface Props {
  collection_id: number;
  token_id: number;
}

export default function NextgenTokenProperties(props: Readonly<Props>) {
  const [traits, setTraits] = useState<NextGenTrait[]>([]);

  useEffect(() => {
    commonApiFetch<NextGenTrait[]>({
      endpoint: `nextgen/tokens/${props.token_id}/traits`,
    }).then((response) => {
      setTraits(response);
    });
  }, [props.token_id]);

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h5>Traits</h5>
        </Col>
      </Row>
      <Row>
        <Col>
          <Table bordered={false}>
            <tbody>
              {traits.map((t) => (
                <tr
                  key={`trait-${t.trait.replaceAll(" ", "-")}`}
                  className="decoration-hover-underline cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/nextgen/collection/${props.collection_id}/art?traits=${t.trait}:${t.value}`)
                  }>
                  <td className="pt-1 pb-1">{t.trait}</td>
                  <td className="pt-1 pb-1 d-flex gap-2">
                    <b>{t.value}</b>
                    <span className="font-color-h">
                      {t.value_score}/{t.trait_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}
