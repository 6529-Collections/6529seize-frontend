"use client";

import { useEffect, useState } from "react";
import { FunctionSelectors } from "../nextgen_contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
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
import type { AdditionalData } from "../nextgen_entities";
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

export default function NextGenAdminUpdateRandomizer(props: Readonly<Props>) {
  const account = useSeizeConnectContext();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.ADD_RANDOMIZER
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

  const [collectionID, setCollectionID] = useState("");
  const [randomizerContract, setRandomizerContract] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useCollectionAdditionalData(collectionID, (data: AdditionalData) => {
    if (collectionID) {
      setRandomizerContract(data.randomizer);
    }
  });

  const contractWrite = useCoreContractWrite("addRandomizer", () => {
    setSubmitting(false);
    setLoading(false);
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];
    if (!collectionID) {
      errors.push("Collection ID is required");
    }
    if (!randomizerContract) {
      errors.push("Randomizer Contract is required");
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
        args: [collectionID, randomizerContract],
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
      <NextGenAdminHeadingRow title="Add Randomizer" close={props.close} />
      <Row className="tw-pt-4">
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
              title="Randomizer Contract"
              value={randomizerContract}
              setValue={setRandomizerContract}
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
