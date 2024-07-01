import styles from "./MessageSignatures.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useVerifyMessage } from "wagmi";
import {
  faCheckCircle,
  faMagnifyingGlass,
  faRotate,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function SignMessage() {
  const [verifyEnabled, setVerifyEnabled] = useState<boolean>(false);
  const [signer, setSigner] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [signature, setSignature] = useState<string>("");

  const [verifyResult, setVerifyResult] = useState<boolean | undefined>(
    undefined
  );

  const [error, setError] = useState<string | undefined>(undefined);

  const verify = useVerifyMessage({
    address: signer as `0x${string}`,
    message: message,
    signature: signature as `0x${string}`,
    query: {
      enabled: verifyEnabled,
    },
  });

  useEffect(() => {
    if (verify.data !== undefined) {
      setVerifyResult(verify.data);
    }
  }, [verify.data]);

  useEffect(() => {
    if (verify.error) {
      setError(verify.error.message);
      setVerifyEnabled(false);
    }
  }, [verify.error]);

  const onVerify = async () => {
    setVerifyEnabled(true);
    setError(undefined);
  };

  const onReset = () => {
    setSigner("");
    setMessage("");
    setSignature("");
    setVerifyEnabled(false);
    setVerifyResult(undefined);
  };

  return (
    <Container className="no-padding pt-4 pb-4">
      <Row>
        <Col
          xs={{ span: 12 }}
          sm={{ span: 12 }}
          md={{ span: 10, offset: 1 }}
          lg={{ span: 8, offset: 2 }}
          className="pt-1 pb-1">
          <Form.Group className="pb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              disabled={verifyResult !== undefined}
              placeholder="0x..."
              type="text"
              value={signer}
              onChange={(e) => setSigner(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="pb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control
              disabled={verifyResult !== undefined}
              as="textarea"
              rows={3}
              value={message}
              placeholder="Message..."
              className={styles.formInput}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Signature</Form.Label>
            <Form.Control
              disabled={verifyResult !== undefined}
              as="textarea"
              rows={3}
              value={signature}
              placeholder="Signature..."
              className={styles.formInput}
              onChange={(e) => setSignature(e.target.value)}
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
          className="d-flex align-items-end gap-2 pt-1 pb-1">
          <button
            onClick={onVerify}
            className="btn btn-block btn-lg btn-primary"
            disabled={
              verify.isFetching ||
              verifyEnabled ||
              !signer ||
              !message ||
              !signature
            }>
            {verify.isFetching ? "Verifying..." : "Verify"}
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              height={14}
              className="ms-2"
            />
          </button>
        </Col>
      </Row>
      {error && (
        <Row className="pt-3">
          <Col
            xs={{ span: 12 }}
            sm={{ span: 12 }}
            md={{ span: 10, offset: 1 }}
            lg={{ span: 8, offset: 2 }}>
            Something went wrong: <br />
            {error}
          </Col>
        </Row>
      )}
      {verifyResult !== undefined && (
        <>
          <Row className="pt-5">
            <Col
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 10, offset: 1 }}
              lg={{ span: 8, offset: 2 }}
              className="d-flex align-items-center justify-content-center gap-2">
              {verifyResult ? (
                <span className="text-success d-flex align-items-center gap-2 font-bolder font-larger">
                  <FontAwesomeIcon icon={faCheckCircle} height={20} />
                  Signature is valid
                </span>
              ) : (
                <span className="text-danger d-flex align-items-center gap-2 font-bolder font-larger">
                  <FontAwesomeIcon icon={faXmarkCircle} height={20} />
                  Signature is invalid
                </span>
              )}
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
                onClick={onReset}
                className="btn btn-lg btn-white"
                disabled={!verifyEnabled && !verify.isFetching}>
                Reset
                <FontAwesomeIcon icon={faRotate} height={14} className="ms-2" />
              </button>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
