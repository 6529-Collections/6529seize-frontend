import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import {
  FunctionSelectors,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_MINTER,
} from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../collections/NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  close: () => void;
}

interface AddressPercentage {
  address: string;
  percentage: string;
}

export default function NextGenAdminAcceptAddressesAndPercentages(
  props: Props
) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.ACCEPT_ADDRESSES_AND_PERCENTAGES
  );
  const collectionIndex = useCollectionIndex();
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parseInt(collectionIndex.data as string)
  );

  const collectionIds = getCollectionIdsForAddress(
    globalAdmin.data === true,
    functionAdmin.data === true,
    collectionAdmin.data,
    parseInt(collectionIndex.data as string)
  );

  const [collectionID, setCollectionID] = useState("");
  const [primaryStatus, setPrimaryStatus] = useState<boolean>();
  const [secondaryStatus, setSecondaryStatus] = useState<boolean>();

  const [primary1, setPrimary1] = useState<AddressPercentage>();
  const [primary2, setPrimary2] = useState<AddressPercentage>();
  const [primary3, setPrimary3] = useState<AddressPercentage>();

  const [secondary1, setSecondary1] = useState<AddressPercentage>();
  const [secondary2, setSecondary2] = useState<AddressPercentage>();
  const [secondary3, setSecondary3] = useState<AddressPercentage>();

  const [
    secondaryAddressesAndPercentages,
    setSecondaryAddressesAndPercentages,
  ] = useState<AddressPercentage[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrievePrimaryAddressesAndPercentages",
    args: [collectionID],
    enabled: !!collectionID,
    onSettled(data: any, error: any) {
      const d = data as any[];
      setPrimary1({
        address: d[0],
        percentage: `${d[3]} %`,
      });
      setPrimary2({
        address: d[1],
        percentage: `${d[4]} %`,
      });
      setPrimary3({
        address: d[2],
        percentage: `${d[5]} %`,
      });
      setPrimaryStatus(d[6]);
    },
  });

  useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveSecondaryAddressesAndPercentages",
    args: [collectionID],
    enabled: !!collectionID,
    onSettled(data: any, error: any) {
      const d = data as any[];
      setSecondary1({
        address: d[0],
        percentage: `${d[3]} %`,
      });
      setSecondary2({
        address: d[1],
        percentage: `${d[4]} %`,
      });
      setSecondary3({
        address: d[2],
        percentage: `${d[5]} %`,
      });
      setSecondaryStatus(d[6]);
    },
  });

  const contractWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "acceptAddressesAndPercentages",
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
    if (primaryStatus === undefined) {
      errors.push("Primary Addresses Status is required");
    }
    if (secondaryStatus === undefined) {
      errors.push("Secondary Addresses Status is required");
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
        args: [collectionID, primaryStatus, secondaryStatus],
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
            <b>ACCEPT ADDRESSES AND PERCENTAGES</b>
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
                  setPrimary1(undefined);
                  setPrimary2(undefined);
                  setPrimary3(undefined);
                  setSecondary1(undefined);
                  setSecondary2(undefined);
                  setSecondary3(undefined);
                  setPrimaryStatus(undefined);
                  setSecondaryStatus(undefined);
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
              <Form.Label>Primary 1</Form.Label>
              <Row>
                <Col xs={9}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={primary1?.address}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={primary1?.percentage}
                  />
                </Col>
              </Row>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Primary 2</Form.Label>
              <Row>
                <Col xs={9}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={primary2?.address}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={primary2?.percentage}
                  />
                </Col>
              </Row>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Primary 3</Form.Label>
              <Row>
                <Col xs={9}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={primary3?.address}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={primary3?.percentage}
                  />
                </Col>
              </Row>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Secondary 1</Form.Label>
              <Row>
                <Col xs={9}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={secondary1?.address}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={secondary1?.percentage}
                  />
                </Col>
              </Row>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Secondary 2</Form.Label>
              <Row>
                <Col xs={9}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={secondary2?.address}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={secondary2?.percentage}
                  />
                </Col>
              </Row>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Secondary 3</Form.Label>
              <Row>
                <Col xs={9}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={secondary3?.address}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    value={secondary3?.percentage}
                  />
                </Col>
              </Row>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Primary Addresses Status</Form.Label>
              <span className="d-flex align-items-center gap-3">
                <Form.Check
                  checked={primaryStatus}
                  type="radio"
                  label="Accept"
                  name="primaryRadio"
                  onChange={() => {
                    setPrimaryStatus(true);
                  }}
                />
                <Form.Check
                  checked={primaryStatus === false}
                  type="radio"
                  label="Reject"
                  name="primaryRadio"
                  onChange={() => {
                    setPrimaryStatus(false);
                  }}
                />
              </span>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Secondary Addresses Status</Form.Label>
              <span className="d-flex align-items-center gap-3">
                <Form.Check
                  checked={secondaryStatus}
                  type="radio"
                  label="Accept"
                  name="secondaryRadio"
                  onChange={() => {
                    setSecondaryStatus(true);
                  }}
                />
                <Form.Check
                  checked={secondaryStatus === false}
                  type="radio"
                  label="Reject"
                  name="secondaryRadio"
                  onChange={() => {
                    setSecondaryStatus(false);
                  }}
                />
              </span>
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
