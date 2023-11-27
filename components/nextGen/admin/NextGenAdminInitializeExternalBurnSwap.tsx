import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useSignMessage } from "wagmi";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { FunctionSelectors } from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  getMinterUseContractWrite,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { postData } from "../../../services/6529api";
import { printAdminErrors } from "./NextGenAdmin";

interface Props {
  close: () => void;
}

export default function NextGenAdminInitializeExternalBurnSwap(
  props: Readonly<Props>
) {
  const account = useAccount();
  const signMessage = useSignMessage();
  const uuid = uuidv4();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.INITIALIZE_EXTERNAL_BURN_SWAP
  );
  const collectionIndex = useCollectionIndex();
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parseInt(collectionIndex?.data as string)
  );

  const collectionIds = getCollectionIdsForAddress(
    globalAdmin.data === true,
    functionAdmin.data === true,
    collectionAdmin.data,
    parseInt(collectionIndex?.data as string)
  );

  const [erc721Collection, setErc721Collection] = useState("");
  const [burnCollectionID, setBurnCollectionID] = useState("");
  const [mintCollectionID, setMintCollectionID] = useState("");
  const [tokenMin, setTokenMin] = useState("");
  const [tokenMax, setTokenMax] = useState("");
  const [burnSwapAddress, setBurnSwapAddress] = useState("");
  const [status, setStatus] = useState<boolean>();

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [uploadError, setUploadError] = useState<string>();

  const contractWrite = getMinterUseContractWrite(
    "initializeExternalBurnOrSwap",
    () => {
      setSubmitting(false);
      setLoading(false);
    }
  );

  function syncDB() {
    setLoading(true);
    setUploadError(undefined);
    signMessage.reset();
    contractWrite.reset();
    const valid = validate();
    if (valid) {
      signMessage.signMessage({
        message: uuid,
      });
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (signMessage.isError) {
      setLoading(false);
      setUploadError(`Error: ${signMessage.error?.message.split(".")[0]}`);
    }
  }, [signMessage.isError]);

  useEffect(() => {
    if (signMessage.isSuccess && signMessage.data) {
      const data = {
        wallet: account.address as string,
        signature: signMessage.data,
        uuid: uuid,
        collection_id: mintCollectionID,
        burn_collection: erc721Collection,
        burn_collection_id: burnCollectionID,
        min_token_index: tokenMin,
        max_token_index: tokenMax,
        burn_address: burnSwapAddress,
        status: status,
      };

      postData(
        `${process.env.API_ENDPOINT}/api/nextgen/register_burn_collection`,
        data
      ).then((response) => {
        if (response.status === 200 && response.response) {
          setSubmitting(true);
        } else {
          setUploadError(
            `Error: ${
              response.response.error
                ? response.response.error
                : "Unknown error"
            }`
          );
          setLoading(false);
        }
      });
    }
  }, [signMessage.data]);

  function validate() {
    const errors = [];

    if (!erc721Collection) {
      errors.push("ERC721 Collection is required");
    }
    if (!burnCollectionID) {
      errors.push("Burn Collection ID is required");
    }
    if (!mintCollectionID) {
      errors.push("Mint Collection ID is required");
    }
    if (!tokenMin) {
      errors.push("Token Min is required");
    }
    if (!tokenMax) {
      errors.push("Token Max is required");
    }
    if (!burnSwapAddress) {
      errors.push("Burn Swap Address is required");
    }
    if (status === undefined) {
      errors.push("Status is required");
    }

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    } else {
      setErrors([]);
      return true;
    }
  }

  useEffect(() => {
    if (submitting) {
      contractWrite.write({
        args: [
          erc721Collection,
          burnCollectionID,
          mintCollectionID,
          tokenMin,
          tokenMax,
          burnSwapAddress,
          status,
        ],
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
            <b>INITIALIZE EXTERNAL BURN/SWAP</b>
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
              <Form.Label>ERC721 Collection</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x..."
                value={erc721Collection}
                onChange={(e: any) => setErc721Collection(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Burn Collection ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x..."
                value={burnCollectionID}
                onChange={(e: any) => setBurnCollectionID(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mint Collection ID</Form.Label>
              <Form.Select
                className={`${styles.formInput}`}
                value={mintCollectionID}
                onChange={(e) => {
                  setStatus(undefined);
                  setMintCollectionID(e.target.value);
                }}>
                <option value="" disabled>
                  Select Collection
                </option>
                {collectionIds.map((id) => (
                  <option key={`mint-collection-id-${id}`} value={id}>
                    {id}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Min Token Index</Form.Label>
              <Form.Control
                type="text"
                placeholder="...min"
                value={tokenMin}
                onChange={(e: any) => setTokenMin(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Max Token Index</Form.Label>
              <Form.Control
                type="text"
                placeholder="...max"
                value={tokenMax}
                onChange={(e: any) => setTokenMax(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Burn/Swap Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x..."
                value={burnSwapAddress}
                onChange={(e: any) => setBurnSwapAddress(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Burn Status</Form.Label>
              <span className="d-flex align-items-center gap-3">
                <Form.Check
                  checked={status}
                  type="radio"
                  label="Active"
                  name="statusRadio"
                  onChange={() => {
                    setStatus(true);
                  }}
                />
                <Form.Check
                  checked={status === false}
                  type="radio"
                  label="Inactive"
                  name="statusRadio"
                  onChange={() => {
                    setStatus(false);
                  }}
                />
              </span>
            </Form.Group>
            {!loading && errors.length > 0 && printAdminErrors(errors)}
            <Form.Group className="mb-3 d-flex gap-3">
              <Button
                className="seize-btn"
                disabled={submitting || loading}
                onClick={() => syncDB()}>
                Submit
              </Button>
            </Form.Group>
          </Form>
          {uploadError && <div className="text-danger">{uploadError}</div>}
          {loading && !contractWrite.isLoading && (
            <div>
              Syncing with DB... Sign Message <code>{uuid}</code> in your
              wallet...
            </div>
          )}
          {loading && contractWrite.isLoading && <div>Synced with DB.</div>}
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
