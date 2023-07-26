import styles from "./Snapshots.module.scss";
import { useEffect, useState } from "react";
import { Form, Button, Col, Container, Row } from "react-bootstrap";
import { Alchemy, Network } from "alchemy-sdk";
import {
  BAYC_CONTRACT,
  CRYPTO_PUNKS_CONTRACT,
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../constants";

interface Props {}

interface NftContractOwnerBalance {
  tokenId: number;
  balance: number;
}
interface NftContractOwner {
  address: string;
  balances: NftContractOwnerBalance[];
}

export default function Snapshots(props: Props) {
  const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(config);

  const [contract, setContract] = useState("");
  const [block, setBlock] = useState(-1);
  const [owners, setOwners] = useState<NftContractOwner[]>();
  const [fetching, setFetching] = useState(false);

  async function getOwners(contract: string, block: number) {
    const options: any = {
      withTokenBalances: true,
    };
    if (block > -1) {
      options.block = block.toString();
    }
    const r = await alchemy.nft
      .getOwnersForContract(contract, options)
      .then((owners) => {
        const myOwners: NftContractOwner[] = [];
        owners.owners.forEach((owner) => {
          const mybalances: NftContractOwnerBalance[] = [];
          owner.tokenBalances.forEach((balance) => {
            const myBalance: NftContractOwnerBalance = {
              tokenId: parseInt(balance.tokenId, 16),
              balance: balance.balance,
            };
            mybalances.push(myBalance);
          });
          const myOwner: NftContractOwner = {
            address: owner.ownerAddress,
            balances: mybalances,
          };
          myOwners.push(myOwner);
        });
        console.log(myOwners);
        setOwners(myOwners);
        setFetching(false);
      });
  }

  useEffect(() => {
    alchemy.core.getBlockNumber().then((block) => {
      setBlock(block);
    });
  }, []);

  return (
    <Container className="pt-5 pb-5">
      <Row>
        <Col xs={12}>MEMES: {MEMES_CONTRACT}</Col>
        <Col xs={12}>GRADIENTS: {GRADIENT_CONTRACT}</Col>
        <Col xs={12}>LAB: {MEMELAB_CONTRACT}</Col>
        <Col xs={12}>CRYPTOPUNKS: {CRYPTO_PUNKS_CONTRACT}</Col>
        <Col xs={12}>BAYC: {BAYC_CONTRACT}</Col>
      </Row>
      <Row className="pt-4">
        <Col>
          <Form
            onChange={() => {
              setOwners(undefined);
            }}>
            <Form.Group as={Row} className="pb-2">
              <Form.Label column sm={12} className="d-flex align-items-center">
                Contract Address
              </Form.Label>
              <Col
                sm={12}
                className="d-flex align-items-center gap-3 flex-wrap">
                <Form.Control
                  className={styles.formInput}
                  type="text"
                  placeholder="0x..."
                  value={contract}
                  onChange={(e) => {
                    setContract(e.target.value);
                  }}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-2">
              <Form.Label column sm={12} className="d-flex align-items-center">
                Block
              </Form.Label>
              <Col
                sm={12}
                className="d-flex align-items-center gap-3 flex-wrap">
                <Form.Control
                  type="number"
                  className={styles.formInput}
                  placeholder={block == -1 ? `fetching latest block...` : ""}
                  value={block == -1 ? "" : block}
                  onChange={(e) => {
                    setBlock(parseInt(e.target.value));
                  }}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pt-4">
              <Col sm={12}>
                <Button
                  disabled={fetching || !contract || !block}
                  className="btn-block"
                  onClick={() => {
                    setFetching(true);
                    getOwners(contract, block);
                  }}>
                  Get it!
                  {fetching && (
                    <div className="d-inline">
                      <div
                        className={`spinner-border ${styles.loader}`}
                        role="status">
                        <span className="sr-only"></span>
                      </div>
                    </div>
                  )}
                </Button>
              </Col>
            </Form.Group>
          </Form>
        </Col>
      </Row>
      {owners && (
        <Row className="pt-5">
          <Col xs={12}>{owners.length}</Col>
          <Col xs={12}>{JSON.stringify(owners)}</Col>
        </Row>
      )}
    </Container>
  );
}
