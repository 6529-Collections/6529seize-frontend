"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSignMessage } from "wagmi";
import { postData } from "@/services/6529api";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  buildNextgenAdminSignatureMessage,
  isStructuredSignaturesEnabled,
} from "@/services/wallet-signatures/structured-wallet-signatures";
import { FunctionSelectors, NEXTGEN_CHAIN_ID } from "../nextgen_contracts";
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
import styles from "./NextGenAdmin.module.css";
import {
  Button,
  Col,
  Container,
  Form,
  NextGenAdminHeadingRow,
  NextGenAdminStatusFormGroup,
  NextGenAdminTextFormGroup,
  Row,
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
  const signatureMessageRef = useRef<string | null>(null);
  const signedPayloadRef = useRef<ReturnType<
    typeof buildNextgenBurnPayload
  > | null>(null);
  const signerAddressRef = useRef<string | null>(null);

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
    globalAdmin.data === true,
    functionAdmin.data === true,
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
    signatureMessageRef.current = null;
    signedPayloadRef.current = null;
    signerAddressRef.current = null;
    const valid = validate();
    if (valid) {
      const signerAddress = account.address;
      if (!signerAddress) {
        setUploadError("Error: Connect a wallet before signing");
        setLoading(false);
        return;
      }
      const payload = buildNextgenBurnPayload();
      signedPayloadRef.current = payload;
      signerAddressRef.current = signerAddress;
      const signatureMessage = isStructuredSignaturesEnabled()
        ? buildNextgenAdminSignatureMessage({
            address: signerAddress,
            chainId: NEXTGEN_CHAIN_ID,
            payload,
          }).message
        : null;
      signatureMessageRef.current = signatureMessage;
      signMessage.signMessage({
        message: signatureMessage ?? uuid,
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
      const signerAddress = signerAddressRef.current;
      if (!signerAddress) {
        setUploadError("Error: Connect a wallet before signing");
        setLoading(false);
        return;
      }
      const data = {
        wallet: signerAddress,
        signature: signMessage.data,
        ...(signatureMessageRef.current
          ? { signature_message: signatureMessageRef.current }
          : {}),
        ...(signedPayloadRef.current ?? buildNextgenBurnPayload()),
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

  function buildNextgenBurnPayload() {
    return {
      uuid,
      collection_id: Number(mintCollectionID),
      burn_collection: erc721Collection,
      burn_collection_id: Number(burnCollectionID),
      min_token_index: Number(tokenMin),
      max_token_index: Number(tokenMax),
      burn_address: burnSwapAddress,
      status,
    };
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
    <Container className="!tw-p-0">
      <NextGenAdminHeadingRow
        title="Initialize External Burn/Swap"
        close={props.close}
      />
      <Row className="tw-pt-4">
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
            <Form.Group className="tw-mb-4">
              <Form.Label>Mint Collection ID</Form.Label>
              <Form.Select
                className={`${styles["formInput"]}`}
                value={mintCollectionID}
                onChange={(e) => {
                  setStatus(false);
                  setMintCollectionID(e.target.value);
                }}
              >
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
            <Form.Group className="tw-mb-4 tw-flex tw-gap-4">
              <Button
                className="tw-rounded-none tw-border-0 tw-px-5 tw-py-1.5 tw-font-bold disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                disabled={submitting || loading}
                onClick={() => syncDB()}
              >
                Submit
              </Button>
            </Form.Group>
          </Form>
          {uploadError && <div className="tw-text-error">{uploadError}</div>}
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
