import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
} from "./admin_helpers";
import { NEXTGEN_CORE, NEXTGEN_CHAIN_ID } from "../contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";

export default function NextGenAdminSetCollectionData() {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(account.address as string);
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
  const [maxPurchases, setMaxPurchases] = useState<number>();
  const [totalSupply, setTotalSupply] = useState<number>();
  const [finalSupplyTime, setFinalSupplyTime] = useState<number>();

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWriteConfig = usePrepareContractWrite({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    args: [
      collectionID,
      artistAddress,
      maxPurchases,
      totalSupply,
      finalSupplyTime,
    ],
    functionName: submitting ? "setCollectionData" : "",
    onError(err) {
      alert(err);
      setSubmitting(false);
      setLoading(false);
    },
  });
  const contractWrite = useContractWrite(contractWriteConfig.config);

  function submit() {
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
    if (!totalSupply) {
      errors.push("Total Supply of collection is required");
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
      setSubmitting(true);
    }
  }

  useEffect(() => {
    if (submitting) {
      contractWrite.write?.();
    }
  }, [submitting]);

  useEffect(() => {
    setLoading(false);
    setSubmitting(false);
  }, [contractWrite.isSuccess || contractWrite.isError]);

  return (
    <Container className="no-padding">
      <Row className="pt-3">
        <Col className="text-center">
          <h3>
            <b>SET COLLECTION DATA</b>
          </h3>
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
                type="number"
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
