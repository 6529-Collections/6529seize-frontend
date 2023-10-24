import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import {
  FunctionSelectors,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_MINTER,
} from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../collections/NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  close: () => void;
}

export default function NextGenAdminMintAndAuction(props: Props) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.MINT_AND_AUCTION
  );
  const collectionIndex = useCollectionIndex();
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parseInt(collectionIndex.data as string)
  );

  const collectionIds = getCollectionIdsForAddress(
    globalAdmin.data === true,
    functionAdmin.data === true,
    collectionAdmin.data,
    parseInt(collectionIndex.data as string)
  );

  const [recipient, setRecipient] = useState("");
  const [tokenData, setTokenData] = useState("");
  const [salt, setSalt] = useState<number>();
  const [collectionID, setCollectionID] = useState("");
  const [endTime, setEndTime] = useState<number>();

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "mintAndAuction",
    onError() {
      setSubmitting(false);
      setLoading(false);
    },
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];

    if (!recipient) {
      errors.push("Recipient is required");
    }
    if (!tokenData) {
      errors.push("Token data is required");
    }
    if (!salt) {
      errors.push("Salt is required");
    }
    if (!collectionID) {
      errors.push("Collection id is required");
    }
    if (!endTime) {
      errors.push("End time is required");
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
        args: [recipient, tokenData, salt, collectionID, endTime],
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
            <b>MINT AND AUCTION</b>
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
              <Form.Label>Recipient</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e: any) => setRecipient(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Token Data</Form.Label>
              <Form.Control
                type="text"
                placeholder="...token data"
                value={tokenData}
                onChange={(e: any) => setTokenData(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Salt</Form.Label>
              <Form.Control
                type="number"
                placeholder="...salt"
                value={salt}
                onChange={(e: any) => setSalt(e.target.value)}
              />
            </Form.Group>
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
              <Form.Label>Auction End Time</Form.Label>
              <Form.Control
                type="number"
                placeholder="unix epoch time"
                value={endTime}
                onChange={(e: any) => setEndTime(e.target.value)}
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
    </Container>
  );
}
