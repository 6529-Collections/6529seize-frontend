"use client";

import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useReadContract } from "wagmi";
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
  useMinterContractWrite,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
} from "./NextGenAdminShared";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

interface Props {
  close: () => void;
}

interface AddressPercentage {
  address: string;
  percentage: string;
}

export default function NextGenAdminAcceptAddressesAndPercentages(
  props: Readonly<Props>
) {
  const account = useSeizeConnectContext();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.ACCEPT_ADDRESSES_AND_PERCENTAGES
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
    collectionAdmin?.data,
    parsedCollectionIndex
  );

  const [collectionID, setCollectionID] = useState("");
  const [primaryStatus, setPrimaryStatus] = useState<boolean>(false);
  const [secondaryStatus, setSecondaryStatus] = useState<boolean>(false);

  const [primary1, setPrimary1] = useState<AddressPercentage>();
  const [primary2, setPrimary2] = useState<AddressPercentage>();
  const [primary3, setPrimary3] = useState<AddressPercentage>();

  const [secondary1, setSecondary1] = useState<AddressPercentage>();
  const [secondary2, setSecondary2] = useState<AddressPercentage>();
  const [secondary3, setSecondary3] = useState<AddressPercentage>();

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const primaryRead = useReadContract({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrievePrimaryAddressesAndPercentages",
    args: [collectionID],
    query: {
      enabled: !!collectionID,
    },
  });

  useEffect(() => {
    const d = primaryRead.data as any[];
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
  }, [primaryRead.data]);

  const secondaryRead = useReadContract({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveSecondaryAddressesAndPercentages",
    args: [collectionID],
    query: {
      enabled: !!collectionID,
    },
  });

  useEffect(() => {
    const d = secondaryRead.data as any[];
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
  }, [secondaryRead.data]);

  const contractWrite = useMinterContractWrite(
    "acceptAddressesAndPercentages",
    () => {
      setSubmitting(false);
      setLoading(false);
    }
  );

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
      contractWrite.writeContract({
        ...contractWrite.params,
        args: [collectionID, primaryStatus, secondaryStatus],
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
        title="Accept Addresses and Percentages"
        close={props.close}
      />
      <Row className="pt-3">
        <Col>
          <Form>
            <NextGenCollectionIdFormGroup
              collection_id={collectionID}
              collection_ids={collectionIds}
              onChange={(id) => {
                setPrimary1(undefined);
                setPrimary2(undefined);
                setPrimary3(undefined);
                setSecondary1(undefined);
                setSecondary2(undefined);
                setSecondary3(undefined);
                setPrimaryStatus(false);
                setSecondaryStatus(false);
                setCollectionID(id);
              }}
            />
            <Form.Group className="mb-3">
              <Form.Label>Primary 1</Form.Label>
              <Row>
                <Col xs={9}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    {...(primary1?.address && { value: primary1.address })}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    {...(primary1?.percentage && { value: primary1.percentage })}
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
                    {...(primary2?.address && { value: primary2.address })}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    {...(primary2?.percentage && { value: primary2.percentage })}
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
                    {...(primary3?.address && { value: primary3.address })}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    {...(primary3?.percentage && { value: primary3.percentage })}
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
                    {...(secondary1?.address && { value: secondary1.address })}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    {...(secondary1?.percentage && { value: secondary1.percentage })}
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
                    {...(secondary2?.address && { value: secondary2.address })}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    {...(secondary2?.percentage && { value: secondary2?.percentage })}
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
                    {...(secondary3?.address && { value: secondary3.address })}
                  />
                </Col>
                <Col xs={3}>
                  <Form.Control
                    type="text"
                    disabled={true}
                    placeholder="Select Collection"
                    {...(secondary3?.percentage && { value: secondary3.percentage })}
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
                  {errors.map((error) => (
                    <li
                      key={`error-${error.replaceAll("", " ")}`}
                      className="text-danger"
                    >
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              className={`mt-3 mb-3 seize-btn`}
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
