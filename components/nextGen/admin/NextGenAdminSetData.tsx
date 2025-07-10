"use client";

import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  useCollectionAdditionalData,
  useCoreContractWrite,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import { FunctionSelectors } from "../nextgen_contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { AdditionalData } from "../nextgen_entities";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
  NextGenAdminTextFormGroup,
} from "./NextGenAdminShared";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";

interface Props {
  close: () => void;
}

export default function NextGenAdminSetData(props: Readonly<Props>) {
  const account = useSeizeConnectContext();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_DATA
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
  const [artistAddress, setArtistAddress] = useState("");
  const [maxPurchases, setMaxPurchases] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [finalSupplyTime, setFinalSupplyTime] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useCollectionAdditionalData(collectionID, (data: AdditionalData) => {
    if (collectionID) {
      setArtistAddress(data.artist_address);
      setMaxPurchases(data.max_purchases.toString());
      setTotalSupply(data.total_supply.toString());
      setFinalSupplyTime(data.final_supply_after_mint.toString());
    }
  });

  const contractWrite = useCoreContractWrite("setCollectionData", () => {
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
      contractWrite.writeContract({
        ...contractWrite.params,
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
      <NextGenAdminHeadingRow title="Set Collection Data" close={props.close} />
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
            <NextGenAdminTextFormGroup
              title="Artist Address"
              value={artistAddress}
              setValue={setArtistAddress}
            />
            <NextGenAdminTextFormGroup
              title="Max # of purchases (public phase)"
              value={maxPurchases}
              setValue={setMaxPurchases}
            />
            <NextGenAdminTextFormGroup
              title="Total Supply of Collection"
              value={totalSupply}
              setValue={setTotalSupply}
            />
            <NextGenAdminTextFormGroup
              title="Time, after minting is completed, to reduce supply - unix epoch time eg. 86400 (seconds in a day)"
              value={finalSupplyTime}
              setValue={setFinalSupplyTime}
            />
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
