import styles from "./NextGenAdmin.module.scss";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FunctionSelectors } from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  useCollectionPhases,
  useMinterContractWrite,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { PhaseTimes } from "../nextgen_entities";
import { NULL_MERKLE } from "../../../constants";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
} from "./NextGenAdminShared";
import {
  NextgenAllowlistCollectionType,
  NextgenAllowlistCollection,
} from "../../../entities/INextgen";
import { commonApiFetch } from "../../../services/api/common-api";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
interface Props {
  close: () => void;
}

const MARKLE_ZERO_PATTERN = /^0x0+$/;

export default function NextGenAdminSetPhases(props: Readonly<Props>) {
  const account = useSeizeConnectContext();

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
  const [publicStartTime, setPublicStartTime] = useState("");
  const [publicEndTime, setPublicEndTime] = useState("");
  const [onChainMerkleRoot, setOnChainMerkleRoot] = useState("");
  const [selectedAllowlist, setSelectedAllowlist] =
    useState<NextgenAllowlistCollection>();

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [availableAllowlistCollections, setAvailableAllowlistCollections] =
    useState<NextgenAllowlistCollection[]>([]);

  useEffect(() => {
    if (collectionID) {
      commonApiFetch<NextgenAllowlistCollection[]>({
        endpoint: `nextgen/allowlist_phases/${collectionID}`,
      }).then((collections) => {
        setAvailableAllowlistCollections(collections);
      });
    }
  }, [collectionID]);

  useCollectionPhases(collectionID, (data: PhaseTimes) => {
    if (collectionID) {
      if (MARKLE_ZERO_PATTERN.test(data.merkle_root)) {
        setOnChainMerkleRoot("");
      } else {
        setOnChainMerkleRoot(data.merkle_root);
      }
      setPublicStartTime(data.public_start_time.toString());
      setPublicEndTime(data.public_end_time.toString());
    }
  });

  useEffect(() => {
    if (onChainMerkleRoot && collectionID) {
      const selected = availableAllowlistCollections.find(
        (c) => c.merkle_root === onChainMerkleRoot
      );
      setSelectedAllowlist(selected);
    }
  }, [onChainMerkleRoot, collectionID]);

  function clear() {
    setSelectedAllowlist(undefined);
    setPublicStartTime("");
    setPublicEndTime("");
    setErrors([]);
    contractWrite.reset();
  }

  const contractWrite = useMinterContractWrite("setCollectionPhases", () => {
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
    if (!publicStartTime) {
      errors.push("Public minting time is required");
    }
    if (!publicEndTime) {
      errors.push("Public minting end time is required");
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
          selectedAllowlist?.start_time ?? publicStartTime,
          selectedAllowlist?.end_time ?? publicStartTime,
          publicStartTime,
          publicEndTime,
          selectedAllowlist?.merkle_root ?? NULL_MERKLE,
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
        title="Set Collection Minting Phases"
      />
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
              <Form.Label>Merkle Roots</Form.Label>
              <Form.Select
                className={`${styles.formInput}`}
                value={selectedAllowlist?.merkle_root ?? ""}
                onChange={(e) => {
                  const merkleRoot = e.target.value;
                  const selected = availableAllowlistCollections.find(
                    (c) => c.merkle_root === merkleRoot
                  );
                  setSelectedAllowlist(selected);
                }}>
                <option value="">Null Merkle Root</option>
                {availableAllowlistCollections.map((c) => (
                  <option
                    key={`merkle-collection-${c.merkle_root}`}
                    value={c.merkle_root}>
                    {c.phase} - {c.merkle_root}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {selectedAllowlist && (
              <Form.Group className="mb-3">
                <span className="d-flex align-items-center gap-3">
                  <Form.Check
                    disabled
                    checked={
                      selectedAllowlist?.al_type ===
                      NextgenAllowlistCollectionType.ALLOWLIST
                    }
                    type="radio"
                    label="Allowlist"
                    name="hasAllowlistRadio"
                  />
                  <Form.Check
                    disabled
                    checked={
                      selectedAllowlist?.al_type ===
                      NextgenAllowlistCollectionType.EXTERNAL_BURN
                    }
                    type="radio"
                    label="Burn Allowlist"
                    name="hasAllowlistRadio"
                  />
                </span>
              </Form.Group>
            )}
            {selectedAllowlist && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Allowlist Start Time</Form.Label>
                  <Form.Control
                    disabled
                    type="integer"
                    placeholder="Unix epoch time"
                    value={selectedAllowlist?.start_time}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Allowlist End Time</Form.Label>
                  <Form.Control
                    disabled
                    type="integer"
                    placeholder="Unix epoch time"
                    value={selectedAllowlist?.end_time}
                  />
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Public Minting Start Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={publicStartTime}
                onChange={(e: any) => setPublicStartTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Public Minting End Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={publicEndTime}
                onChange={(e: any) => setPublicEndTime(e.target.value)}
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
