"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useSignTypedData } from "wagmi";
import { v4 as uuidv4 } from "uuid";
import { postData } from "@/services/6529api";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  FunctionSelectors,
  NEXTGEN_ADMIN,
  NEXTGEN_CHAIN_ID,
} from "../nextgen_contracts";
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
import { getPrivilegedActionChallenge } from "@/services/signing/privileged-action-challenge";
import { buildNextGenRegisterBurnCollectionTypedData } from "@/utils/signing/privileged-typed-data";
import { isAddress } from "viem";
import { truncateTextMiddle } from "@/helpers/AllowlistToolHelpers";

interface Props {
  close: () => void;
}

export default function NextGenAdminInitializeExternalBurnSwap(
  props: Readonly<Props>
) {
  const account = useSeizeConnectContext();
  const signTypedData = useSignTypedData();
  const [signingNonce, setSigningNonce] = useState<string>();
  const [signingExpiresAt, setSigningExpiresAt] = useState<number>();

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

  async function syncDB() {
    setLoading(true);
    setUploadError(undefined);
    signTypedData.reset();
    contractWrite.reset();
    setSigningNonce(undefined);
    setSigningExpiresAt(undefined);
    const valid = validate();
    if (valid) {
      try {
        const signerAddress = account.address;
        if (!signerAddress || !isAddress(signerAddress)) {
          throw new Error("Wallet not connected");
        }

        const challenge = await getPrivilegedActionChallenge({
          signerAddress,
        });
        setSigningNonce(challenge.nonce);
        setSigningExpiresAt(challenge.expiresAt);

        const typedData = buildNextGenRegisterBurnCollectionTypedData({
          chainId: NEXTGEN_CHAIN_ID,
          verifyingContract: NEXTGEN_ADMIN[NEXTGEN_CHAIN_ID] as `0x${string}`,
          wallet: signerAddress,
          mintCollectionId: BigInt(mintCollectionID),
          burnCollection: erc721Collection as `0x${string}`,
          burnCollectionId: BigInt(burnCollectionID),
          minTokenIndex: BigInt(tokenMin),
          maxTokenIndex: BigInt(tokenMax),
          burnAddress: burnSwapAddress as `0x${string}`,
          status,
          nonce: challenge.nonce,
          expiresAt: BigInt(challenge.expiresAt),
        });

        const signature = await signTypedData.signTypedDataAsync({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        });

        const requestId = uuidv4();
        const data = {
          wallet: signerAddress,
          signature,
          signature_type: "eip712",
          nonce: challenge.nonce,
          expires_at: challenge.expiresAt,
          server_signature: challenge.serverSignature,
          uuid: requestId,
          collection_id: mintCollectionID,
          burn_collection: erc721Collection,
          burn_collection_id: burnCollectionID,
          min_token_index: tokenMin,
          max_token_index: tokenMax,
          burn_address: burnSwapAddress,
          status: status,
        };

        const response = await postData(
          `${publicEnv.API_ENDPOINT}/api/nextgen/register_burn_collection`,
          data
        );
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
      } catch (e: any) {
        setUploadError(
          `Error: ${e?.message ? String(e.message) : "Unknown error"}`
        );
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }

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
                className={`${styles["formInput"]}`}
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
              Syncing with DB... Sign the request in your wallet
              {signingNonce ? (
                <>
                  {" "}
                  (nonce <code>{truncateTextMiddle(signingNonce, 18)}</code>
                  {signingExpiresAt ? (
                    <>
                      {" "}
                      expires at{" "}
                      {new Date(signingExpiresAt * 1000).toUTCString()}
                    </>
                  ) : null}
                  )
                </>
              ) : null}
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
