import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextgen_contracts";
import {
  useCollectionIndex,
  useCollectionArtist,
  isCollectionArtist,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../collections/NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { areEqualAddresses } from "../../../helpers/Helpers";

interface Props {
  close: () => void;
}

export default function NextGenAdminSignCollection(props: Props) {
  const account = useAccount();

  const collectionIndex = useCollectionIndex();
  const collectionArtists = useCollectionArtist(
    parseInt(collectionIndex.data as string)
  );

  function getCollectionIds() {
    const ids = [];
    if (collectionArtists.data) {
      for (let i = 0; i < collectionArtists.data.length; i++) {
        const artist = collectionArtists.data[i].result;
        if (areEqualAddresses(artist, account.address)) {
          ids.push(i + 1);
        }
      }
    }
    return ids;
  }

  const isArtist = isCollectionArtist(
    account.address as string,
    collectionArtists
  );

  const collectionIds = getCollectionIds();

  const [collectionID, setCollectionID] = useState("");
  const [signature, setSignature] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useContractWrite({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "artistSignature",
    onError() {
      setSubmitting(false);
      setLoading(false);
    },
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];

    if (!collectionID) {
      errors.push("Collection id is required");
    }
    if (!signature) {
      errors.push("Signature is required");
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
        args: [collectionID, signature],
      });
    }
  }, [submitting]);

  useEffect(() => {
    setLoading(false);
    setSubmitting(false);
  }, [contractWrite.isSuccess || contractWrite.isError]);

  return (
    <Container className="no-padding">
      <Row className="pt-3">
        <Col className="d-flex align-items-center justify-content-between">
          <h3>
            <b>SIGN COLLECTION AS ARTIST</b>
          </h3>
          <FontAwesomeIcon
            className={styles.closeIcon}
            icon="times-circle"
            onClick={() => {
              props.close();
            }}></FontAwesomeIcon>
        </Col>
      </Row>
      {isArtist ? (
        <Row className="pt-3">
          <Col>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Collection ID</Form.Label>
                <Form.Select
                  className={`${styles.formInput}`}
                  value={collectionID}
                  onChange={(e) => {
                    setCollectionID(e.target.value);
                  }}>
                  <option value="" disabled>
                    Select Collection
                  </option>
                  {collectionIds.map((id) => (
                    <option key={`collection-id-${id}`} value={id}>
                      {id}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Signature</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="signature..."
                  value={signature}
                  onChange={(e: any) => {
                    setSignature(e.target.value);
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
                onClick={() => submit()}>
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
      ) : (
        <Row className="pt-3">
          <Col>
            <b>ONLY COLLECTION ARTISTS CAN USE THIS SECTION.</b>
          </Col>
        </Row>
      )}
    </Container>
  );
}
