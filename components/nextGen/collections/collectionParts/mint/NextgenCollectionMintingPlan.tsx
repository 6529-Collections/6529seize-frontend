import styles from "./NextGenMint.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import {
  NextGenCollection,
  NextgenAllowlist,
  NextgenAllowlistCollection,
} from "../../../../../entities/INextgen";
import NextGenCollectionHeader from "../NextGenCollectionHeader";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { Time } from "../../../../../helpers/time";
import { getJsonData } from "./NextGenMintWidget";
import { areEqualAddresses } from "../../../../../helpers/Helpers";

interface Props {
  collection: NextGenCollection;
}

export default function NextgenCollectionMintingPlan(props: Readonly<Props>) {
  const [phases, setPhases] = useState<NextgenAllowlistCollection[]>([]);

  const [selectedPhase, setSelectedPhase] =
    useState<NextgenAllowlistCollection>();

  const [allowlist, setAllowlist] = useState<NextgenAllowlist[]>([]);

  function adjustSpots(address: string, keccak: string) {
    const addressEntries = allowlist.filter((al) =>
      areEqualAddresses(al.address, address)
    );
    const index = addressEntries.findIndex((al) => al.keccak === keccak);
    let returnSpots = addressEntries[index].spots;
    if (index > 0) {
      for (let i = 0; i < index; i++) {
        returnSpots -= addressEntries[i].spots;
      }
    }
    return returnSpots;
  }

  useEffect(() => {
    commonApiFetch<NextgenAllowlistCollection[]>({
      endpoint: `nextgen/allowlist_phases/${props.collection.id}`,
    }).then((collections) => {
      setPhases(collections);
    });
  }, []);

  useEffect(() => {
    if (selectedPhase) {
      commonApiFetch<{
        data: NextgenAllowlist[];
      }>({
        endpoint: `nextgen/proofs/${selectedPhase.merkle_root}`,
      }).then((al) => {
        setAllowlist(al.data);
      });
    }
  }, [selectedPhase]);

  return (
    <Container className="pt-4 pb-4">
      <Row className="pb-4">
        <Col>
          <NextGenCollectionHeader collection={props.collection} />
        </Col>
      </Row>
      <Row className="pt-4">
        <Col>
          <h3 className="mb-0">Minting Plan</h3>
        </Col>
      </Row>
      <hr />
      <Row className="pt-3">
        <Col xs={12}>
          <h2>Phases</h2>
        </Col>
        {phases.map((phase) => (
          <Col
            xs={12}
            sm={6}
            md={4}
            key={phase.merkle_root}
            className="pt-2 pb-2 d-flex flex-column">
            <Container className={styles.phaseBox}>
              <Row>
                <a onClick={() => setSelectedPhase(phase)}>
                  <Col>
                    <span className="d-flex align-items-center justify-content-between pb-4">
                      <h4 className="font-color mb-0">{phase.phase}</h4>
                      <span>View Distribution</span>
                    </span>
                    <Table>
                      <tbody>
                        <tr>
                          <td className="d-flex justify-content-center gap-3">
                            <span>
                              <b>Start</b>
                            </span>
                            <span>
                              <b>
                                {Time.seconds(
                                  phase.start_time
                                ).toIsoDateString()}{" "}
                                {Time.seconds(
                                  phase.start_time
                                ).toIsoTimeString()}
                              </b>
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="d-flex justify-content-center gap-3">
                            <span>
                              <b>End</b>
                            </span>
                            <span>
                              <b>
                                {Time.seconds(phase.end_time).toIsoDateString()}{" "}
                                {Time.seconds(phase.end_time).toIsoTimeString()}
                              </b>
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </a>
              </Row>
            </Container>
          </Col>
        ))}
      </Row>
      {selectedPhase && allowlist.length > 0 && (
        <>
          <Row className="pt-4">
            <Col>
              <h4>{selectedPhase.phase} Distribution</h4>
            </Col>
          </Row>
          <Row>
            <Col>
              <Table className={styles.allowlistTable}>
                <thead>
                  <tr>
                    <th>Address</th>
                    <th className="text-center">Spots</th>
                    <th className="text-center">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {allowlist.map((al) => (
                    <tr key={`${al.address}-${al.spots}-${al.info}`}>
                      <td>
                        {al.wallet_display && `${al.wallet_display} - `}
                        {al.address}
                      </td>
                      <td className="text-center">
                        {adjustSpots(al.address, al.keccak)}
                      </td>
                      <td className="d-flex justify-content-center">
                        {getJsonData(al.keccak, al.info)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
