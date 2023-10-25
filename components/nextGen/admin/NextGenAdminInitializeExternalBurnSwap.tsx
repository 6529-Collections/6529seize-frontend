import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractWrite } from "wagmi";
import { useEffect, useRef, useState } from "react";
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
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isDivInViewport, scrollToDiv } from "../../../helpers/Helpers";

interface Props {
  close: () => void;
}

export default function NextGenAdminInitializeExternalBurnSwap(props: Props) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.INITIALIZE_EXTERNAL_BURN_SWAP
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

  const [erc721Collection, setErc721Collection] = useState("");
  const [burnCollectionID, setBurnCollectionID] = useState("");
  const [mintCollectionID, setMintCollectionID] = useState("");
  const [tokenMin, setTokenMin] = useState<number>();
  const [tokenMax, setTokenMax] = useState<number>();
  const [burnSwapAddress, setBurnSwapAddress] = useState("");
  const [status, setStatus] = useState<boolean>();

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "initializeExternalBurnOrSwap",
    onError() {
      setSubmitting(false);
      setLoading(false);
    },
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
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
      setLoading(false);
    } else {
      setErrors([]);
      setSubmitting(true);
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
              <Form.Select
                className={`${styles.formInput}`}
                value={burnCollectionID}
                onChange={(e) => {
                  setStatus(undefined);
                  setBurnCollectionID(e.target.value);
                }}>
                <option value="" disabled>
                  Select Collection
                </option>
                {collectionIds.map((id) => (
                  <option key={`burn-collection-id-${id}`} value={id}>
                    {id}
                  </option>
                ))}
              </Form.Select>
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
                type="number"
                placeholder="...min"
                value={tokenMin}
                onChange={(e: any) => setTokenMin(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Max Token Index</Form.Label>
              <Form.Control
                type="number"
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
