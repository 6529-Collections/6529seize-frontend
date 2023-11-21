import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import {
  NEXTGEN_MINTER,
  NEXTGEN_CHAIN_ID,
  FunctionSelectors,
} from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  retrieveCollectionCosts,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ANY_COLLECTION } from "../../../pages/delegation/[...section]";
import { MintingDetails } from "../nextgen_entities";

interface Props {
  close: () => void;
}

export default function NextGenAdminSetCosts(props: Props) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_COSTS
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
  const [collectionStartCost, setCollectionStartCost] = useState("");
  const [collectionEndCost, setCollectionEndCost] = useState("");
  const [rate, setRate] = useState("");
  const [timeperiod, setTimePeriod] = useState("");
  const [salesOption, setSaleOption] = useState("");
  const [delegationAddress, setDelegationAddress] = useState(
    ANY_COLLECTION.contract
  );

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  retrieveCollectionCosts(collectionID, (data: MintingDetails) => {
    if (collectionID) {
      setCollectionStartCost(data.mint_cost.toString());
      setCollectionEndCost(data.end_mint_cost.toString());
      setRate(data.rate.toString());
      setTimePeriod(data.time_period.toString());
      setSaleOption(data.sales_option.toString());
      setDelegationAddress(data.del_address);
    }
  });

  const contractWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "setCollectionCosts",
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
    if (!collectionStartCost) {
      errors.push("Starting price is required");
    }
    if (!collectionEndCost) {
      errors.push("Ending price is required");
    }
    if (!rate) {
      errors.push("Rate is required");
    }
    if (!timeperiod) {
      errors.push("Time period is required");
    }
    if (!salesOption) {
      errors.push("Sales Model is required");
    }
    if (!delegationAddress) {
      errors.push("Delegation address is required");
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
          collectionStartCost,
          collectionEndCost,
          rate,
          timeperiod,
          salesOption,
          delegationAddress,
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
            <b>SET COLLECTION MINTING COSTS</b>
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
              <Form.Label>Starting Minting Price</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Cost in wei"
                value={collectionStartCost}
                onChange={(e: any) => setCollectionStartCost(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ending Minting Price</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Cost in wei"
                value={collectionEndCost}
                onChange={(e: any) => setCollectionEndCost(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Rate (Applies only for sales models 2 and 3)
              </Form.Label>
              <Form.Control
                type="integer"
                placeholder="either % or in wei"
                value={rate}
                onChange={(e: any) => setRate(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Time Period (Applies only for sales models 2 and 3)
              </Form.Label>
              <Form.Control
                type="integer"
                placeholder="unix epoch time eg. 86400 (seconds in a day)"
                value={timeperiod}
                onChange={(e: any) => setTimePeriod(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sales Model</Form.Label>
              <Form.Control
                type="integer"
                placeholder="1. Fixed Price, 2. Exponential/Linear decrease, 3. Periodic Sale"
                value={salesOption}
                onChange={(e: any) => setSaleOption(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Delegation Address</Form.Label>
              <Form.Control
                type="integer"
                placeholder="0x..."
                value={delegationAddress}
                onChange={(e: any) => setDelegationAddress(e.target.value)}
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
