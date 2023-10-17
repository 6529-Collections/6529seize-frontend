import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import {
  FunctionSelectors,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_MINTER,
} from "../contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  getCollectionIdsForAddress,
} from "./admin_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  close: () => void;
}

export default function NextGenAdminSetSplits(props: Props) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_PRIMARY_AND_SECONDARY_SPLITS
  );

  const collectionIndex = useCollectionIndex();

  const collectionIds = getCollectionIdsForAddress(
    globalAdmin.data === true,
    functionAdmin.data === true,
    undefined,
    parseInt(collectionIndex.data as string)
  );

  const [collectionID, setCollectionID] = useState("");
  const [artistPrimary, setArtistPrimary] = useState<number>();
  const [teamPrimary, setTeamPrimary] = useState<number>();
  const [artistSecondary, setArtistSecondary] = useState<number>();
  const [teamSecondary, setTeamSecondary] = useState<number>();

  useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrievePrimarySplits",
    args: [collectionID],
    enabled: !!collectionID,
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as string[];
        setArtistPrimary(parseInt(d[0]));
        setTeamPrimary(parseInt(d[1]));
      }
    },
  });

  useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveSecondarySplits",
    args: [collectionID],
    enabled: !!collectionID,
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as string[];
        setArtistSecondary(parseInt(d[0]));
        setTeamSecondary(parseInt(d[1]));
      }
    },
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "setPrimaryAndSecondarySplits",
    onError() {
      setSubmitting(false);
      setLoading(false);
    },
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];

    if (!collectionID) {
      errors.push("Collection id is required");
    }
    if (!artistPrimary) {
      errors.push("Artist primary split is required");
    }
    if (!teamPrimary) {
      errors.push("Team primary split is required");
    }
    if (!artistSecondary) {
      errors.push("Artist secondary split is required");
    }
    if (!teamSecondary) {
      errors.push("Team secondary split is required");
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
      contractWrite.write({
        args: [
          collectionID,
          artistPrimary,
          teamPrimary,
          artistSecondary,
          teamSecondary,
        ],
      });
    }
  }, [submitting]);

  useEffect(() => {
    setLoading(false);
    setSubmitting(false);
  }, [contractWrite.isSuccess || contractWrite.isError]);

  return (
    <Container className="no-padding">
      <Row className="pt-3">
        <Col className="d-flex align-items-center justify-content-between">
          <h3>
            <b>SET PRIMARY AND SECONDARY SPLITS</b>
          </h3>
          <FontAwesomeIcon
            className={styles.closeIcon}
            icon="times-circle"
            onClick={() => {
              props.close();
            }}></FontAwesomeIcon>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Collection ID</Form.Label>
              <Form.Select
                className={`${styles.formInput}`}
                value={collectionID}
                onChange={(e) => {
                  setCollectionID(e.target.value);
                }}>
                <option value="" disabled>
                  Select Collection
                </option>
                {collectionIds.map((id) => (
                  <option key={`collection-id-${id}`} value={id}>
                    {id}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Artist Primary Split</Form.Label>
              <Form.Control
                type="number"
                placeholder="%"
                value={artistPrimary}
                onChange={(e: any) =>
                  setArtistPrimary(parseInt(e.target.value))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Team Primary Split</Form.Label>
              <Form.Control
                type="number"
                placeholder="%"
                value={teamPrimary}
                onChange={(e: any) => setTeamPrimary(parseInt(e.target.value))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Artist Secondary Split</Form.Label>
              <Form.Control
                type="number"
                placeholder="%"
                value={artistSecondary}
                onChange={(e: any) =>
                  setArtistSecondary(parseInt(e.target.value))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Team Secondary Split</Form.Label>
              <Form.Control
                type="number"
                placeholder="%"
                value={teamSecondary}
                onChange={(e: any) =>
                  setTeamSecondary(parseInt(e.target.value))
                }
              />
            </Form.Group>
            {!loading && errors.length > 0 && (
              <div className="mb-3">
                <ul>
                  {errors.map((error, index) => (
                    <li key={`error-${index}`} className="text-danger">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              className={`mt-3 mb-3 seize-btn`}
              disabled={submitting || loading}
              onClick={() => submit()}>
              Submit
            </Button>
          </Form>
          <NextGenContractWriteStatus
            isLoading={contractWrite.isLoading}
            hash={contractWrite.data?.hash}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
