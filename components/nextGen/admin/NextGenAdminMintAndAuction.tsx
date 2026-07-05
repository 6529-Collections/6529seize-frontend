"use client";

import { useEffect, useState } from "react";
import { FunctionSelectors } from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  useMinterContractWrite,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import {
  Button,
  Col,
  Container,
  Form,
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
  NextGenAdminTextFormGroup,
  Row,
} from "./NextGenAdminShared";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

interface Props {
  close: () => void;
}

export default function NextGenAdminMintAndAuction(props: Readonly<Props>) {
  const account = useSeizeConnectContext();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.MINT_AND_AUCTION
  );
  const collectionIndex = useCollectionIndex();
  const parsedCollectionIndex = useParsedCollectionIndex(collectionIndex);
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parsedCollectionIndex
  );

  const collectionIds = getCollectionIdsForAddress(
    globalAdmin.data === true,
    functionAdmin.data === true,
    collectionAdmin.data,
    parsedCollectionIndex
  );

  const [recipient, setRecipient] = useState("");
  const [tokenData, setTokenData] = useState("");
  const [salt, setSalt] = useState("");
  const [collectionID, setCollectionID] = useState("");
  const [endTime, setEndTime] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useMinterContractWrite("mintAndAuction", () => {
    setSubmitting(false);
    setLoading(false);
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
      contractWrite.writeContract({
        ...contractWrite.params,
        args: [recipient, tokenData, salt, collectionID, endTime],
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
    <Container className="!tw-p-0">
      <NextGenAdminHeadingRow close={props.close} title="Mint and Auction" />
      <Row className="tw-pt-4">
        <Col>
          <Form>
            <NextGenAdminTextFormGroup
              title="Recipient"
              value={recipient}
              setValue={setRecipient}
            />
            <NextGenAdminTextFormGroup
              title="Token Data"
              value={tokenData}
              setValue={setTokenData}
            />
            <NextGenAdminTextFormGroup
              title="Salt"
              value={salt}
              setValue={setSalt}
            />
            <NextGenCollectionIdFormGroup
              collection_id={collectionID}
              collection_ids={collectionIds}
              onChange={(id) => {
                setCollectionID(id);
              }}
            />
            <NextGenAdminTextFormGroup
              title="Auction End Time"
              value={endTime}
              setValue={setEndTime}
            />
            {!loading && errors.length > 0 && printAdminErrors(errors)}
            <Button
              className={`tw-mb-4 tw-mt-4 tw-rounded-none tw-border-0 tw-px-5 tw-py-1.5 tw-font-bold disabled:tw-cursor-not-allowed disabled:tw-opacity-60`}
              disabled={submitting || loading}
              onClick={() => submit()}
            >
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
