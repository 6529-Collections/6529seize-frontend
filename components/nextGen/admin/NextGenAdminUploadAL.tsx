"use client";

import { publicEnv } from "@/config/env";
import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useSignTypedData } from "wagmi";
import { v4 as uuidv4 } from "uuid";
import { postFormData } from "@/services/6529api";
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
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenAdminHeadingRow,
  NextGenCollectionIdFormGroup,
} from "./NextGenAdminShared";
import { getPrivilegedActionChallenge } from "@/services/signing/privileged-action-challenge";
import { buildNextGenCreateAllowlistTypedData } from "@/utils/signing/privileged-typed-data";
import { truncateTextMiddle } from "@/helpers/AllowlistToolHelpers";
import { isAddress } from "viem";
interface Props {
  close: () => void;
}

enum Type {
  ALLOWLIST = "allowlist",
  NO_ALLOWLIST = "no_allowlist",
  EXTERNAL_BURN = "external_burn",
}

export default function NextGenAdminUploadAL(props: Readonly<Props>) {
  const account = useSeizeConnectContext();
  const signTypedData = useSignTypedData();
  const [signingNonce, setSigningNonce] = useState<string>();
  const [signingExpiresAt, setSigningExpiresAt] = useState<number>();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_PHASES
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
  const [allowlistFile, setAllowlistFile] = useState<any>();
  const [allowlistStartTime, setAllowlistStartTime] = useState("");
  const [allowlistEndTime, setAllowlistEndTime] = useState("");
  const [phaseName, setPhaseName] = useState("");
  const [mintPrice, setMintPrice] = useState("");

  const [type, setType] = useState(Type.ALLOWLIST);

  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  function clear() {
    setUploadSuccess(false);
    setAllowlistFile(undefined);
    setUploadError("");
    setAllowlistStartTime("");
    setAllowlistEndTime("");
    setErrors([]);
    setSigningNonce(undefined);
    setSigningExpiresAt(undefined);
  }

  async function uploadFile() {
    setUploadError(undefined);
    signTypedData.reset();
    setUploading(true);

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

      const typedData = buildNextGenCreateAllowlistTypedData({
        chainId: NEXTGEN_CHAIN_ID,
        verifyingContract: NEXTGEN_ADMIN[NEXTGEN_CHAIN_ID] as `0x${string}`,
        wallet: signerAddress,
        collectionId: BigInt(collectionID),
        allowlistType: type,
        phase: phaseName,
        startTime: BigInt(allowlistStartTime),
        endTime: BigInt(allowlistEndTime),
        mintPrice,
        nonce: challenge.nonce,
        expiresAt: BigInt(challenge.expiresAt),
      });

      const signature = await signTypedData.signTypedDataAsync({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      const formData = new FormData();
      formData.append("allowlist", allowlistFile);
      const requestId = uuidv4();
      formData.append(
        "nextgen",
        JSON.stringify({
          collection_id: collectionID,
          wallet: signerAddress,
          signature,
          signature_type: "eip712",
          nonce: challenge.nonce,
          expires_at: challenge.expiresAt,
          server_signature: challenge.serverSignature,
          uuid: requestId,
          al_type: type,
          phase: phaseName,
          start_time: Number(allowlistStartTime),
          end_time: Number(allowlistEndTime),
          mint_price: Number(mintPrice),
        })
      );

      const response = await postFormData(
        `${publicEnv.API_ENDPOINT}/api/nextgen/create_allowlist`,
        formData
      );
      if (response.status === 200 && response.response.merkle_root) {
        setUploadSuccess(true);
      } else {
        setUploadError(
          `Error: ${
            response.response.error ? response.response.error : "Unknown error"
          }`
        );
      }
    } catch (e: any) {
      setUploadError(`Error: ${e?.message ? String(e.message) : "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Container className="no-padding">
      <NextGenAdminHeadingRow close={props.close} title="UPLOAD ALLOWLIST" />
      <Row className="pt-3">
        <Col>
          <Form>
            <NextGenCollectionIdFormGroup
              collection_id={collectionID}
              collection_ids={collectionIds}
              onChange={(id) => {
                clear();
                setCollectionID(id);
              }}
            />
            <Form.Group className="mb-3">
              <span className="d-flex align-items-center gap-3">
                <Form.Check
                  checked={type == Type.ALLOWLIST}
                  type="radio"
                  label="Allowlist"
                  name="hasAllowlistRadio"
                  onChange={() => {
                    setType(Type.ALLOWLIST);
                  }}
                />
                <Form.Check
                  checked={type === Type.EXTERNAL_BURN}
                  type="radio"
                  label="Burn Allowlist"
                  name="hasAllowlistRadio"
                  onChange={() => {
                    setType(Type.EXTERNAL_BURN);
                  }}
                />
              </span>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phase</Form.Label>
              <Form.Control
                type="string"
                placeholder="...Phase name"
                value={phaseName}
                onChange={(e: any) => setPhaseName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="file"
                accept={".csv"}
                value={allowlistFile ? allowlistFile.fileName : ""}
                onChange={(e: any) => {
                  if (e.target.files) {
                    const f = e.target.files[0];
                    setAllowlistFile(f);
                  }
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Allowlist Start Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={allowlistStartTime}
                onChange={(e: any) => setAllowlistStartTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Allowlist end Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={allowlistEndTime}
                onChange={(e: any) => setAllowlistEndTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mint Price (ETH)</Form.Label>
              <Form.Control
                type="integer"
                placeholder="...0.06529"
                value={mintPrice}
                onChange={(e: any) => setMintPrice(e.target.value)}
              />
            </Form.Group>
            {!uploading && errors.length > 0 && printAdminErrors(errors)}
            <div className="d-flex align-items-center mt-4 gap-3">
              <Button
                className="seize-btn"
                disabled={
                  !collectionID ||
                  !allowlistFile ||
                  !allowlistStartTime ||
                  !allowlistEndTime ||
                  !phaseName ||
                  !mintPrice ||
                  uploading ||
                  uploadSuccess
                }
                onClick={() => uploadFile()}
              >
                Upload
              </Button>
              {uploading && (
                <span>
                  Uploading... Sign the allowlist upload request in your wallet
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
                </span>
              )}
              {uploadSuccess && <span className="text-success">Uploaded</span>}
              {!uploading && uploadError && (
                <span className="text-danger">{uploadError}</span>
              )}
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
