import styles from "./Rememes.module.scss";
import { Container, Row, Col, Button } from "react-bootstrap";
import Image from "next/image";
import { useState, useEffect } from "react";
import { MEMES_CONTRACT, OPENSEA_STORE_FRONT_CONTRACT } from "../../constants";
import { NFT } from "../../entities/INFT";
import { fetchAllPages, fetchUrl, postData } from "../../services/6529api";
import RememeAddComponent from "./RememeAddComponent";
import { useAccount, useSignMessage } from "wagmi";
import { useWeb3Modal } from "@web3modal/react";
import { DBResponse } from "../../entities/IDBResponse";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import { areEqualAddresses, numberWithCommas } from "../../helpers/Helpers";

export const TDH_THRESHOLD = 1;
export const MOD_TDH_THRESHOLD = 100000;

export default function RememeAddPage() {
  const accountResolution = useAccount();
  const web3modal = useWeb3Modal();

  const signMessage = useSignMessage();
  const [memes, setMemes] = useState<NFT[]>([]);
  const [memesLoaded, setMemesLoaded] = useState(false);
  const [userTDH, setUserTDH] = useState<ConsolidatedTDHMetrics>();

  const [addRememe, setAddRememe] = useState<any>();
  const [verificationErrors, setVerificationErrors] = useState<string[]>([]);
  const [signErrors, setSignErrors] = useState<string[]>([]);

  useEffect(() => {
    if (addRememe && userTDH) {
      const errors: string[] = [];
      if (TDH_THRESHOLD > userTDH.boosted_tdh) {
        errors.push(
          `Error: You need at least ${numberWithCommas(
            TDH_THRESHOLD
          )} TDH before you can add Rememes`
        );
      }
      if (
        !areEqualAddresses(
          addRememe.contract.address,
          OPENSEA_STORE_FRONT_CONTRACT
        ) &&
        !areEqualAddresses(
          addRememe.contract.contractDeployer,
          accountResolution.address
        ) &&
        MOD_TDH_THRESHOLD > userTDH.boosted_tdh
      ) {
        errors.push(
          `Error: You need at least ${numberWithCommas(
            MOD_TDH_THRESHOLD
          )} TDH before you can add Rememes for which you are not deployer`
        );
      }
      setVerificationErrors(errors);
    }
  }, [addRememe, userTDH]);

  useEffect(() => {
    if (signMessage.isError) {
      setSignErrors([`Error: ${signMessage.error?.message.split(".")[0]}`]);
    }
  }, [signMessage.isError]);

  useEffect(() => {
    fetchAllPages(
      `${process.env.API_ENDPOINT}/api/nfts?contract=${MEMES_CONTRACT}`
    ).then((responseNfts: NFT[]) => {
      setMemes(responseNfts.sort((a, b) => a.id - b.id));
      setMemesLoaded(true);
    });
  }, []);

  useEffect(() => {
    async function fetchTdh() {
      const url = `${process.env.API_ENDPOINT}/api/consolidated_owner_metrics/?wallet=${accountResolution.address}`;
      return fetchUrl(url).then((response: DBResponse) => {
        if (response && response.data.length == 1) {
          setUserTDH(response.data[0]);
        }
      });
    }

    if (accountResolution.isConnected) {
      fetchTdh();
    }
  }, [accountResolution.isConnected]);

  useEffect(() => {
    if (signMessage.isSuccess && signMessage.data) {
      postData(`${process.env.API_ENDPOINT}/api/rememes/add`, {
        address: accountResolution.address,
        signature: signMessage.data,
        rememe: addRememe,
      }).then((response) => {
        console.log(response);
      });
    }
  }, [signMessage.data]);

  return (
    <Container fluid className={styles.mainContainer}>
      <Row className="pb-5">
        <Col>
          <Container className="pt-4">
            <Row className="pt-2 pb-2">
              <Col sm={12} md={4} className="d-flex align-items-center gap-2">
                <Image
                  loading={"eager"}
                  width="0"
                  height="0"
                  style={{ width: "250px", height: "auto" }}
                  src="/re-memes.png"
                  alt="re-memes"
                />
              </Col>
            </Row>
            <Row className="pt-4">
              <Col>
                <Container>
                  <Row className="pt-2 pb-4">
                    <Col className="no-padding">
                      <RememeAddComponent
                        memes={memes}
                        verifiedRememe={(r) => {
                          setAddRememe(r);
                          setVerificationErrors([]);
                          setSignErrors([]);
                          signMessage.reset();
                        }}
                      />
                    </Col>
                  </Row>
                </Container>
              </Col>
            </Row>
            <Row className="pt-2">
              <Col className="d-flex justify-content-between align-items-center">
                <span>
                  {verificationErrors.length > 0 && (
                    <ul>
                      {verificationErrors.map((ve, index) => (
                        <li key={`ve-${index}`}>{ve}</li>
                      ))}
                    </ul>
                  )}
                  {signErrors.length > 0 && (
                    <ul>
                      {signErrors.map((se, index) => (
                        <li key={`se-${index}`}>{se}</li>
                      ))}
                    </ul>
                  )}
                </span>
                {accountResolution.isConnected ? (
                  <Button
                    className="seize-btn"
                    disabled={
                      !addRememe ||
                      !addRememe.valid ||
                      !userTDH ||
                      verificationErrors.length > 0
                    }
                    onClick={() => {
                      if (addRememe) {
                        signMessage.signMessage({
                          message: JSON.stringify(addRememe),
                        });
                      }
                    }}>
                    Add Rememe
                  </Button>
                ) : (
                  <Button
                    className="seize-btn btn-white"
                    disabled={web3modal.isOpen}
                    onClick={() => web3modal.open()}>
                    {web3modal.isOpen ? `Connecting...` : `Connect Wallet`}
                  </Button>
                )}
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
