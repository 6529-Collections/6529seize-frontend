import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  retrieveCollectionAdditionalData,
  getCoreUseContractWrite,
} from "../nextgen_helpers";
import { FunctionSelectors } from "../nextgen_contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AdditionalData } from "../nextgen_entities";
import { printAdminErrors } from "./NextGenAdmin";

interface Props {
  close: () => void;
}

export default function NextGenAdminSetData(props: Readonly<Props>) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_DATA
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

  const [collectionID, setCollectionID] = useState("");
  const [artistAddress, setArtistAddress] = useState("");
  const [maxPurchases, setMaxPurchases] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [finalSupplyTime, setFinalSupplyTime] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  retrieveCollectionAdditionalData(collectionID, (data: AdditionalData) => {
    if (collectionID) {
      setArtistAddress(data.artist_address);
      setMaxPurchases(data.max_purchases.toString());
      setTotalSupply(data.total_supply.toString());
      setFinalSupplyTime(data.final_supply_after_mint.toString());
    }
  });

  const contractWrite = getCoreUseContractWrite("setCollectionData", () => {
    setSubmitting(false);
    setLoading(false);
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];

    if (!collectionID) {
      errors.push("Collection id is required");
    }
    if (!artistAddress) {
      errors.push("Artist ETH Address is required");
    }
    if (!maxPurchases) {
      errors.push("Max # of purchases during public mint is required");
    }
    if (!totalSupply || parseInt(totalSupply) < 1) {
      errors.push("Total Supply of collection must be greater than 0");
    }
    if (!finalSupplyTime) {
      errors.push(
        "The time to reduce the supply, after minting is completed, is required"
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
        args: [
          collectionID,
          artistAddress,
          maxPurchases,
          totalSupply,
          finalSupplyTime,
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
            <b>SET COLLECTION DATA</b>
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
              <Form.Label>Artist Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x33FD426905F149f8376e227d0C9D3340AaD17aF1"
                value={artistAddress}
                onChange={(e: any) => setArtistAddress(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Max # of purchases (public phase)</Form.Label>
              <Form.Control
                type="text"
                placeholder="...max #"
                value={maxPurchases}
                onChange={(e: any) => setMaxPurchases(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Total Supply of Collection</Form.Label>
              <Form.Control
                type="text"
                placeholder="1000, 1500, ..."
                value={totalSupply}
                onChange={(e: any) => setTotalSupply(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Time, after minting is completed, to reduce supply
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="unix epoch time eg. 86400 (seconds in a day)"
                value={finalSupplyTime}
                onChange={(e: any) => setFinalSupplyTime(e.target.value)}
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
            hash={contractWrite.data?.hash}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
