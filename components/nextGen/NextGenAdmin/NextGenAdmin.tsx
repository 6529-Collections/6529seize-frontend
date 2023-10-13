import { Container, Row, Col } from "react-bootstrap";
import { useContractRead } from "wagmi";
import { useState } from "react";
import styles from "./NextGenAdmin.module.scss";
import { useRouter } from "next/router";

enum Focus {
  GLOBAL = "global",
  COLLECTION = "collection",
  ARTIST = "artist",
}

export default function NextGenAdmin() {
  const router = useRouter();

  const [view, setView] = useState<Focus>(
    (router.query.focus as Focus) || Focus.COLLECTION
  );

  function printLeftMenu() {
    return (
      <Container className="no-padding">
        <Row className="pt-2 pb-2">
          <Col
            className={
              view === Focus.GLOBAL ? styles.tabLeftActive : styles.tabLeft
            }
            onClick={() => setView(Focus.GLOBAL)}>
            <b>Global</b>
          </Col>
        </Row>
        <Row className="pt-2 pb-2">
          <Col
            className={
              view === Focus.COLLECTION ? styles.tabLeftActive : styles.tabLeft
            }
            onClick={() => setView(Focus.COLLECTION)}>
            <b>Collection</b>
          </Col>
        </Row>
        <Row className="pt-2 pb-2">
          <Col
            className={
              view === Focus.ARTIST ? styles.tabLeftActive : styles.tabLeft
            }
            onClick={() => setView(Focus.ARTIST)}>
            <b>Artist</b>
          </Col>
        </Row>
      </Container>
    );
  }

  function printGlobal() {
    return (
      <Container className="no-padding">
        <Row>
          <Col>I am global</Col>
        </Row>
      </Container>
    );
  }

  function printCollection() {
    return (
      <Container className="no-padding">
        <Row>
          <Col>I am collection</Col>
        </Row>
      </Container>
    );
  }

  function printArtist() {
    return (
      <Container className="no-padding">
        <Row>
          <Col>I am artist</Col>
        </Row>
      </Container>
    );
  }

  function printContent() {
    switch (view) {
      case Focus.GLOBAL:
        return printGlobal();
      case Focus.COLLECTION:
        return printCollection();
      case Focus.ARTIST:
        return printArtist();
    }
  }

  return (
    <Container>
      <Row className="pt-4">
        <Col>
          <h1>NEXTGEN ADMIN</h1>
        </Col>
      </Row>
      <Row>
        <Col xs={12} sm={3} md={2}>
          {printLeftMenu()}
        </Col>
        <Col xs={12} sm={9} md={10}>
          {printContent()}
        </Col>
      </Row>
    </Container>
  );
}
