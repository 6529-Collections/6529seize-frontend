"use client";

import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import { useCoreContractWrite } from "../nextgen_helpers";
import { NextGenAdminHeadingRow } from "./NextGenAdminShared";

interface Props {
  close: () => void;
}

export default function NextGenAdminUpdateImagesAttributes(
  props: Readonly<Props>
) {
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useCoreContractWrite(
    "updateImagesAndAttributes",
    () => {
      setSubmitting(false);
      setLoading(false);
    }
  );

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
      contractWrite.writeContract({
        ...contractWrite.params,
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
      <NextGenAdminHeadingRow
        close={props.close}
        title="Update Images and Attributes"
      />
      <Row className="pt-3">
        <Col>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Token IDs {tokenIds.length > 0 && `x${tokenIds.length}`}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={tokenIds.join("\n")}
                onChange={(e) => {
                  if (e.target.value) {
                    setTokenIds(e.target.value.split("\n"));
                  } else {
                    setTokenIds([]);
                  }
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Images {images.length > 0 && `x${images.length}`}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={images.join("\n")}
                onChange={(e) => {
                  if (e.target.value) {
                    setImages(e.target.value.split("\n"));
                  } else {
                    setImages([]);
                  }
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Attributes {attributes.length > 0 && `x${attributes.length}`}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={attributes.join("\n")}
                onChange={(e) => {
                  if (e.target.value) {
                    setAttributes(e.target.value.split("\n"));
                  } else {
                    setAttributes([]);
                  }
                }}
              />
            </Form.Group>
            {!loading && errors.length > 0 && printAdminErrors(errors)}
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
            hash={contractWrite.data}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
