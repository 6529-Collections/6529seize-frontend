import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextgen_contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  close: () => void;
}

export default function NextGenAdminUpdateImagesAttributes(props: Props) {
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useContractWrite({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "updateImagesAndAttributes",
    onError() {
      setSubmitting(false);
      setLoading(false);
    },
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];
    if (tokenIds.length === 0) {
      errors.push("At least one token ID is required");
    }
    if (images.length === 0) {
      errors.push("At least one image is required");
    }
    if (attributes.length === 0) {
      errors.push("At least one attribute is required");
    }
    if (
      tokenIds.length !== images.length ||
      tokenIds.length !== attributes.length ||
      images.length !== attributes.length
    ) {
      errors.push(
        "Number of entries for token IDs, images and attributes must all be the same"
      );
    }

    if (errors.length > 0) {
      setErrors(errors);
      setLoading(false);
    } else {
      setErrors([]);
      setSubmitting(true);
    }
  }

  useEffect(() => {
    if (submitting) {
      contractWrite.write({
        args: [tokenIds.map((tId) => parseInt(tId)), images, attributes],
      });
    }
  }, [submitting]);

  useEffect(() => {
    if (contractWrite.isSuccess || contractWrite.isError) {
      setLoading(false);
      setSubmitting(false);
    }
  }, [contractWrite.isSuccess || contractWrite.isError]);

  return (
    <Container className="no-padding">
      <Row className="pt-3">
        <Col className="d-flex align-items-center justify-content-between">
          <h3>
            <b>UPDATE IMAGES AND ATTRIBUTES</b>
          </h3>
          <FontAwesomeIcon
            className={styles.closeIcon}
            icon="times-circle"
            onClick={() => {
              props.close();
            }}></FontAwesomeIcon>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Token IDs</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={tokenIds.join("\n")}
                onChange={(e) => {
                  setTokenIds(e.target.value.split("\n"));
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Images</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={images.join("\n")}
                onChange={(e) => {
                  setImages(e.target.value.split("\n"));
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Attributes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={attributes.join("\n")}
                onChange={(e) => {
                  setAttributes(e.target.value.split("\n"));
                }}
              />
            </Form.Group>
            {!loading && errors.length > 0 && (
              <div className="mb-3">
                <ul>
                  {errors.map((error, index) => (
                    <li key={`error-${index}`} className="text-danger">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              className={`mt-3 mb-3 seize-btn`}
              disabled={submitting || loading}
              onClick={() => {
                setLoading(true);
                submit();
              }}>
              Submit
            </Button>
          </Form>
          <NextGenContractWriteStatus
            isLoading={contractWrite.isLoading}
            hash={contractWrite.data?.hash}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
