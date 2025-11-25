"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import { useSignMessage } from "wagmi";
import { postData } from "@/services/6529api";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { FunctionSelectors } from "../nextgen_contracts";
import {
  getCollectionIdsForAddress,
  useCollectionAdmin,
  useCollectionIndex,
  useFunctionAdmin,
  useGlobalAdmin,
  useMinterContractWrite,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import styles from "./NextGenAdmin.module.scss";
import {
  NextGenAdminHeadingRow,
  NextGenAdminStatusFormGroup,
  NextGenAdminTextFormGroup,
} from "./NextGenAdminShared";

interface Props {
  close: () => void;
}

export default function NextGenAdminInitializeExternalBurnSwap(
  props: Readonly<Props>
) {
  const account = useSeizeConnectContext();
  const signMessage = useSignMessage();
  const uuid = useRef(uuidv4()).current;

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.INITIALIZE_EXTERNAL_BURN_SWAP
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

  const [erc721Collection, setErc721Collection] = useState("");
  const [burnCollectionID, setBurnCollectionID] = useState("");
  const [mintCollectionID, setMintCollectionID] = useState("");
  const [tokenMin, setTokenMin] = useState("");
  const [tokenMax, setTokenMax] = useState("");
  const [burnSwapAddress, setBurnSwapAddress] = useState("");
  const [status, setStatus] = useState<boolean>(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [uploadError, setUploadError] = useState<string>();

  const contractWrite = useMinterContractWrite(
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
        `${publicEnv.API_ENDPOINT}/api/nextgen/register_burn_collection`,
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
      contractWrite.writeContract({
        ...contractWrite.params,
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
      <NextGenAdminHeadingRow
        title="Initialize External Burn/Swap"
        close={props.close}
      />
      <Row className="pt-3">
        <Col>
          <Form>
            <NextGenAdminTextFormGroup
              title="ERC721 Collection"
              value={erc721Collection}
              setValue={setErc721Collection}
            />
            <NextGenAdminTextFormGroup
              title="Burn Collection ID"
              value={burnCollectionID}
              setValue={setBurnCollectionID}
            />
            <Form.Group className="mb-3">
              <Form.Label>Mint Collection ID</Form.Label>
              <Form.Select
                className={`${styles.formInput}`}
                value={mintCollectionID}
                onChange={(e) => {
                  setStatus(false);
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
            <NextGenAdminTextFormGroup
              title="Min Token Index"
              value={tokenMin}
              setValue={setTokenMin}
            />
            <NextGenAdminTextFormGroup
              title="Max Token Index"
              value={tokenMax}
              setValue={setTokenMax}
            />
            <NextGenAdminTextFormGroup
              title="Burn/Swap Address"
              value={burnSwapAddress}
              setValue={setBurnSwapAddress}
            />
            <NextGenAdminStatusFormGroup
              title="Burn Status"
              status={status}
              setStatus={setStatus}
            />
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
            hash={contractWrite.data}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}