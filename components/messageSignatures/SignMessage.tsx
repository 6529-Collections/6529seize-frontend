import styles from "./MessageSignatures.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useAccount, useSignMessage } from "wagmi";
import {
  faCopy,
  faRotate,
  faSignature,
} from "@fortawesome/free-solid-svg-icons";
import HeaderUserConnect from "../header/user/HeaderUserConnect";

export default function SignMessage() {
  const account = useAccount();

  const sign = useSignMessage();
  const [message, setMessage] = useState<string>("");
  const [signedMessage, setSignedMessage] = useState<string>("");

  useEffect(() => {
    if (sign.data) {
      setSignedMessage(sign.data);
    }
  }, [sign.data]);

  const onSign = async () => {
    sign.signMessage({ message });
  };

  const onCopy = () => {
    navigator.clipboard.writeText(signedMessage);
  };

  const onReset = () => {
    setMessage("");
    setSignedMessage("");
    sign.reset();
  };

  if (!account.isConnected) {
    return (
      <Container className="no-padding pt-4 pb-4">
        <Row>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 12 }}
            md={{ span: 10, offset: 1 }}
            lg={{ span: 8, offset: 2 }}
            className="d-flex justify-content-center">
            <HeaderUserConnect />
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="no-padding pt-4 pb-4">
      <Row>
        <Col
          xs={{ span: 12 }}
          sm={{ span: 12 }}
          md={{ span: 10, offset: 1 }}
          lg={{ span: 8, offset: 2 }}>
          <Form.Group className="pb-3">
            <Form.Label>Signing with</Form.Label>
            <Form.Control disabled value={account.address} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={message}
              disabled={!!signedMessage}
              placeholder="Type your message here"
              className={styles.formInput}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col
          xs={{ span: 12 }}
          sm={{ span: 12 }}
          md={{ span: 10, offset: 1 }}
          lg={{ span: 8, offset: 2 }}>
          <button
            onClick={onSign}
            className="btn btn-block btn-lg btn-primary"
            disabled={!!signedMessage}>
            Sign
            <FontAwesomeIcon icon={faSignature} height={16} className="ms-2" />
          </button>
        </Col>
      </Row>
      {signedMessage && (
        <>
          <Row className="pt-5">
            <Col
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 10, offset: 1 }}
              lg={{ span: 8, offset: 2 }}>
              <Form.Group>
                <Form.Label>Signed Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={signedMessage}
                  disabled
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="pt-3">
            <Col
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 10, offset: 1 }}
              lg={{ span: 8, offset: 2 }}
              className="d-flex align-items-center justify-content-center gap-2">
              <button
                onClick={onCopy}
                className="btn btn-lg btn-white"
                disabled={!signedMessage}>
                Copy
                <FontAwesomeIcon icon={faCopy} height={16} className="ms-2" />
              </button>
              <button
                onClick={onReset}
                className="btn btn-lg btn-white"
                disabled={!signedMessage}>
                Reset
                <FontAwesomeIcon icon={faRotate} height={16} className="ms-2" />
              </button>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
