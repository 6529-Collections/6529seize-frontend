import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useReadContract, useSignMessage } from "wagmi";
import { useEffect, useRef, useState } from "react";
import {
  FunctionSelectors,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "../nextgen_contracts";
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
import { v4 as uuidv4 } from "uuid";
import { NULL_ADDRESS } from "../../../constants";
import { postData } from "../../../services/6529api";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenAdminHeadingRow,
  NextGenAdminStatusFormGroup,
} from "./NextGenAdminShared";

interface Props {
  close: () => void;
}

export default function NextGenAdminInitializeBurn(props: Readonly<Props>) {
  const account = useAccount();
  const signMessage = useSignMessage();
  const uuid = useRef(uuidv4()).current;

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.INITIALIZE_BURN
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

  const [burnCollectionID, setBurnCollectionID] = useState("");
  const [mintCollectionID, setMintCollectionID] = useState("");
  const [status, setStatus] = useState<boolean>(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [uploadError, setUploadError] = useState<string>();

  const burnRead = useReadContract({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "burnToMintCollections",
    args: [burnCollectionID, mintCollectionID],
    query: {
      enabled: !!burnCollectionID && !!mintCollectionID,
    },
  });

  useEffect(() => {
    setStatus(burnRead.data as any);
  }, [burnRead.data]);

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
        burn_collection: NEXTGEN_CORE[NEXTGEN_CHAIN_ID],
        burn_collection_id: burnCollectionID,
        min_token_index: 0,
        max_token_index: 0,
        burn_address: NULL_ADDRESS,
        status: status,
      };

      postData(
        `${process.env.API_ENDPOINT}/api/nextgen/register_burn_collection`,
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

  const contractWrite = useMinterContractWrite("initializeBurn", () => {
    setSubmitting(false);
    setLoading(false);
  });

  function validate() {
    const errors = [];

    if (!burnCollectionID) {
      errors.push("Burn Collection id is required");
    }
    if (!mintCollectionID) {
      errors.push("Mint Collection id is required");
    }
    if (status === undefined) {
      errors.push("Burn Status is required");
    }

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    } else {
      setErrors([]);
      return true;
    }
  }

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
    if (submitting) {
      contractWrite.writeContract({
        ...contractWrite.params,
        args: [burnCollectionID, mintCollectionID, status],
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
      <NextGenAdminHeadingRow title="Initialize Burn" close={props.close} />
      <Row className="pt-3">
        <Col>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Burn Collection ID</Form.Label>
              <Form.Select
                className={`${styles.formInput}`}
                value={burnCollectionID}
                onChange={(e) => {
                  setStatus(false);
                  setBurnCollectionID(e.target.value);
                }}>
                <option value="" disabled>
                  Select Collection
                </option>
                {collectionIds.map((id) => (
                  <option key={`burn-collection-id-${id}`} value={id}>
                    {id}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
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
            <NextGenAdminStatusFormGroup
              title="Burn Status"
              status={status}
              setStatus={setStatus}
            />
            {!loading && errors.length > 0 && printAdminErrors(errors)}
            <Button
              className={`mt-3 mb-3 seize-btn`}
              disabled={submitting || loading}
              onClick={() => syncDB()}>
              Submit
            </Button>
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
