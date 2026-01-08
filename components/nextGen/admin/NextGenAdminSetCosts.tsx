"use client";

import { ANY_COLLECTION } from "@/components/delegation/delegation-constants";
import { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { FunctionSelectors } from "../nextgen_contracts";
import type { MintingDetails } from "../nextgen_entities";
import {
  getCollectionIdsForAddress,
  useCollectionAdmin,
  useCollectionCosts,
  useCollectionIndex,
  useFunctionAdmin,
  useGlobalAdmin,
  useMinterContractWrite,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenAdminHeadingRow,
  NextGenCollectionIdFormGroup,
} from "./NextGenAdminShared";

interface Props {
  close: () => void;
}

export default function NextGenAdminSetCosts(props: Readonly<Props>) {
  const account = useSeizeConnectContext();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_COSTS
  );
  const collectionIndex = useCollectionIndex();
  const parsedCollectionIndex = useParsedCollectionIndex(collectionIndex);
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parsedCollectionIndex
  );

  const collectionIds = getCollectionIdsForAddress(
    (globalAdmin.data as any) === true,
    (functionAdmin.data as any) === true,
    collectionAdmin.data,
    parsedCollectionIndex
  );

  const [collectionID, setCollectionID] = useState("");
  const [collectionStartCost, setCollectionStartCost] = useState("");
  const [collectionEndCost, setCollectionEndCost] = useState("");
  const [rate, setRate] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [salesOption, setSalesOption] = useState("");
  const [delegationAddress, setDelegationAddress] = useState(
    ANY_COLLECTION.contract
  );

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useCollectionCosts(collectionID, (data: MintingDetails) => {
    if (collectionID) {
      setCollectionStartCost(data.mint_cost.toString());
      setCollectionEndCost(data.end_mint_cost.toString());
      setRate(data.rate.toString());
      setTimePeriod(data.time_period.toString());
      setSalesOption(data.sales_option.toString());
      setDelegationAddress(data.del_address);
    }
  });

  const contractWrite = useMinterContractWrite("setCollectionCosts", () => {
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
    if (!collectionStartCost) {
      errors.push("Starting price is required");
    }
    if (!collectionEndCost) {
      errors.push("Ending price is required");
    }
    if (!rate) {
      errors.push("Rate is required");
    }
    if (!timePeriod) {
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
      contractWrite.writeContract({
        ...contractWrite.params,
        args: [
          collectionID,
          collectionStartCost,
          collectionEndCost,
          rate,
          timePeriod,
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
      <NextGenAdminHeadingRow
        close={props.close}
        title="Set Collection Minting Costs"
      />
      <Row className="pt-3">
        <Col>
          <Form>
            <NextGenCollectionIdFormGroup
              collection_id={collectionID}
              collection_ids={collectionIds}
              onChange={(id) => {
                setCollectionID(id);
              }}
            />
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
                value={timePeriod}
                onChange={(e: any) => setTimePeriod(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sales Model</Form.Label>
              <Form.Control
                type="integer"
                placeholder="1. Fixed Price, 2. Exponential/Linear decrease, 3. Periodic Sale"
                value={salesOption}
                onChange={(e: any) => setSalesOption(e.target.value)}
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
            {!loading && errors.length > 0 && printAdminErrors(errors)}
            <Button
              className={`mt-3 mb-3 seize-btn`}
              disabled={submitting || loading}
              onClick={() => submit()}>
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
