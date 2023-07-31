import styles from "./Rememes.module.scss";
import { Container, Row, Col, Button } from "react-bootstrap";
import Image from "next/image";
import { useState, useEffect } from "react";
import { MEMES_CONTRACT } from "../../constants";
import { NFT } from "../../entities/INFT";
import { fetchAllPages, postData } from "../../services/6529api";
import RememeAddComponent from "./RememeAddComponent";
import { useAccount, useSignMessage } from "wagmi";

export interface AddRememe {
  contract: string;
  token_ids: string[];
  references: number[];
}

export default function RememeAddPage() {
  const accountResolution = useAccount();

  const signMessage = useSignMessage();
  const [memes, setMemes] = useState<NFT[]>([]);
  const [memesLoaded, setMemesLoaded] = useState(false);

  const [addRememe, setAddRememe] = useState<AddRememe>();

  useEffect(() => {
    fetchAllPages(
      `${process.env.API_ENDPOINT}/api/nfts?contract=${MEMES_CONTRACT}`
    ).then((responseNfts: NFT[]) => {
      setMemes(responseNfts.sort((a, b) => a.id - b.id));
      setMemesLoaded(true);
    });
  }, []);

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
                  {signMessage.isError &&
                    !signMessage.isLoading &&
                    `Error: ${signMessage.error?.message.split(".")[0]}`}
                </span>
                <Button
                  className="seize-btn"
                  disabled={!addRememe}
                  onClick={() => {
                    if (addRememe) {
                      signMessage.signMessage({
                        message: JSON.stringify(addRememe),
                        // message: `Adding ReMeme...\n\nContract: ${addRememe.contract}\n\nToken IDs: ${addRememe.tokenIds}\n\nMeme References: ${addRememe.references}`,
                      });
                    }
                  }}>
                  Submit
                </Button>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
