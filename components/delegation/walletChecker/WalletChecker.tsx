import { useEffect, useState } from "react";
import styles from "./WalletChecker.module.scss";
import { Container, Row, Col, Form, Button, Accordion } from "react-bootstrap";
import { useEnsName, useEnsAddress } from "wagmi";
import { isValidEthAddress } from "../../../helpers/Helpers";
import CheckDelegation from "./CheckDelegation";
import CheckConsolidation from "./CheckConsolidation";

interface Props {
  path?: string;
}

export default function WalletCheckerComponent(props: Props) {
  return (
    <Container className="pt-3">
      <Row>
        <Col>
          <CheckDelegation />
        </Col>
      </Row>
    </Container>
  );
}
