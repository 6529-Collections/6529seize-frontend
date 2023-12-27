import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useAccount, useContractRead } from "wagmi";
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
  getCollectionIdsForAddress,
  useMinterContractWrite,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
  NextGenAdminTextFormGroup,
} from "./NextGenAdminShared";

interface Props {
  close: () => void;
}

export default function NextGenAdminSetSplits(props: Readonly<Props>) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_PRIMARY_AND_SECONDARY_SPLITS
  );

  const collectionIndex = useCollectionIndex();

  const collectionIds = getCollectionIdsForAddress(
    (globalAdmin.data as any) === true,
    (functionAdmin.data as any) === true,
    undefined,
    parseInt(collectionIndex?.data as any)
  );

  const [collectionID, setCollectionID] = useState("");
  const [artistPrimary, setArtistPrimary] = useState("");
  const [teamPrimary, setTeamPrimary] = useState("");
  const [artistSecondary, setArtistSecondary] = useState("");
  const [teamSecondary, setTeamSecondary] = useState("");

  useContractRead({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrievePrimarySplits",
    args: [collectionID],
    enabled: !!collectionID,
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as string[];
        setArtistPrimary(d[0]);
        setTeamPrimary(d[1]);
      }
    },
  });

  useContractRead({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveSecondarySplits",
    args: [collectionID],
    enabled: !!collectionID,
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as string[];
        setArtistSecondary(d[0]);
        setTeamSecondary(d[1]);
      }
    },
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useMinterContractWrite(
    "setPrimaryAndSecondarySplits",
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
    if (contractWrite.isSuccess || contractWrite.isError) {
      setLoading(false);
      setSubmitting(false);
    }
  }, [contractWrite.isSuccess || contractWrite.isError]);

  return (
    <Container className="no-padding">
      <NextGenAdminHeadingRow
        close={props.close}
        title="Set Primary and Secondary Splits"
      />
      <Row className="pt-3">
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
              title="Artist Primary Split"
              value={artistPrimary}
              setValue={setArtistPrimary}
            />
            <NextGenAdminTextFormGroup
              title="Team Primary Split"
              value={teamPrimary}
              setValue={setTeamPrimary}
            />
            <NextGenAdminTextFormGroup
              title="Artist Secondary Split"
              value={artistSecondary}
              setValue={setArtistSecondary}
            />
            <NextGenAdminTextFormGroup
              title="Team Secondary Split"
              value={teamSecondary}
              setValue={setTeamSecondary}
            />
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
            hash={contractWrite.data?.hash}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
