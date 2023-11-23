import NextGenTokenImage from "./NextGenTokenImage";
import { Col, Container, Row } from "react-bootstrap";
import { useState } from "react";
import { useContractRead, useEnsName } from "wagmi";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextgen_contracts";
import {
  extractURI,
  extractField,
  extractAttributes,
} from "../nextgen_helpers";
import { EMPTY_TOKEN_URI, TokenURI } from "../nextgen_entities";

interface Props {
  token_id: number;
  collection: number;
  hide_info?: boolean;
  hide_link?: boolean;
  hide_background?: boolean;
}

export default function NextGenTokenPreview(props: Props) {
  const [owner, setOwner] = useState<`0x${string}`>();
  const [ownerENS, setOwnerENS] = useState<string>();
  const [name, setName] = useState<string>();

  const [tokenUri, setTokenUri] = useState<TokenURI>(EMPTY_TOKEN_URI);

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "tokenURI",
    enabled: props.token_id > 0,
    args: [props.token_id],
    onSettled(data: any, error: any) {
      if (data) {
        if (data.startsWith("data")) {
          const uri = extractURI(data);
          const name = extractField("name", data);
          const description = extractField("description", data);
          const image = extractField("image", data);
          const attrs = extractAttributes(data);
          setTokenUri({
            id: props.token_id,
            collection: props.collection,
            uri: uri.uri,
            data: uri.data,
            name: name,
            image: image,
            description: description,
            attributes: attrs,
          });
        } else {
          setTokenUri({
            id: props.token_id,
            collection: props.collection,
            uri: data,
            name: "",
            description: "",
            attributes: [],
          });
        }
      }
    },
  });

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "ownerOf",
    watch: true,
    args: [props.token_id],
    enabled: props.token_id > 0,
    onSettled(data: any, error: any) {
      if (data) {
        setOwner(data);
      }
    },
  });

  useEnsName({
    address: owner,
    chainId: 1,
    onSettled(data: any, error: any) {
      if (data) {
        setOwnerENS(data);
      }
    },
  });

  function printToken() {
    return (
      <Container className="no-padding pt-3 pb-3">
        <Row>
          <Col className="text-center">
            <NextGenTokenImage
              token={tokenUri}
              preview={true}
              hide_background={props.hide_background}
              show_link={!props.hide_info || !props.hide_link}
              setName={(name) => setName(name)}
            />
          </Col>
        </Row>
        {!props.hide_info && (
          <>
            <Row className="pt-1">
              <Col className="text-center">#{props.token_id}</Col>
            </Row>
            <Row className="pt-1">
              <Col className="text-center">
                {tokenUri ? tokenUri.name : name}
              </Col>
            </Row>
          </>
        )}
      </Container>
    );
  }

  if (props.hide_info) {
    return printToken();
  } else {
    return (
      <a href={`/nextgen/token/${props.token_id}`} className="decoration-none">
        {printToken()}
      </a>
    );
  }
}
