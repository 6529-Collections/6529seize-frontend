import Image from "next/image";
import { isUrl } from "../../../helpers/Helpers";
import { useEffect, useState } from "react";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CHAIN_NAME,
  NEXTGEN_CORE,
} from "../nextgen_contracts";
import { useContractRead } from "wagmi";
import {
  extractURI,
  extractField,
  extractAttributes,
} from "../nextgen_helpers";
import { IAttribute } from "../../../entities/INFT";
import { goerli } from "wagmi/chains";

export function getTokenName(
  collection: number,
  token_id: number,
  name?: string
) {
  if (name) {
    return name;
  }
  return `Collection ${collection} - #${token_id}`;
}

export function NextGenTokenImage(
  props: Readonly<{
    collection: number;
    token_id: number;
    hide_link?: boolean;
    hide_info?: boolean;
    show_animation?: boolean;
    setName?: (name: string) => void;
    setDescription?: (description: string) => void;
    setMetadata?: (meta: any) => void;
    setAttributes?: (attributes: IAttribute[]) => void;
  }>
) {
  const network = NEXTGEN_CHAIN_ID === goerli.id ? "testnet" : "mainnet";
  const cloudfrontUrl = `https://d3lqz0a4bldqgf.cloudfront.net/nextgen/tokens/images/${NEXTGEN_CHAIN_NAME}-${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}/${props.token_id}.png`;
  const generatorUrl = `https://nextgen-generator.seize.io/${network}/png/${props.token_id}`;

  const [name, setName] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [image, setImage] = useState<string>();
  const [animationUrl, setAnimationUrl] = useState<string>();
  const [attributes, setAttributes] = useState<IAttribute[]>();
  const [onChainData, setOnChainData] = useState<any>();
  const [animationLoaded, setAnimationLoaded] = useState(false);

  useEffect(() => {
    if (props.setName && name) {
      props.setName(name);
    }
  }, [name]);

  useEffect(() => {
    if (props.setDescription && description) {
      props.setDescription(description);
    }
  }, [description]);

  useEffect(() => {
    if (props.setAttributes && attributes) {
      props.setAttributes(attributes);
    }
  }, [attributes]);

  useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "tokenURI",
    watch: true,
    enabled: props.token_id > 0,
    args: [props.token_id],
    onSettled(data: any, error: any) {
      if (data) {
        if (data.startsWith("data")) {
          const uri = extractURI(data);
          setOnChainData(uri);
          setName(extractField("name", data));
          setDescription(extractField("description", data));
          setImage(extractField("image", data));
          setAnimationUrl(extractField("animation_url", data));
          setAttributes(extractAttributes(data));
        } else if (isUrl(data)) {
          fetch(data)
            .then((response) => response.json())
            .then((response) => {
              setName(response.name);
              setDescription(response.description);
              setImage(response.image);
              setAnimationUrl(response.animation_url);
              setAttributes(response.attributes);
            });
        }
        if (props.setMetadata) {
          props.setMetadata(data);
        }
      }
    },
  });

  function getImage(hideOnLoad: boolean = false) {
    return (
      <span className="d-flex flex-column align-items-center">
        <Image
          priority
          loading={"eager"}
          width="0"
          height="0"
          style={{
            height: "auto",
            width: "auto",
            maxHeight: "100%",
            maxWidth: "100%",
            padding: "10px",
          }}
          src={cloudfrontUrl}
          onError={({ currentTarget }) => {
            if (currentTarget.src === cloudfrontUrl) {
              currentTarget.src = generatorUrl;
            }
            if (image) {
              currentTarget.src = image;
            }
          }}
          alt={`NextGen Token #${props.token_id}`}
        />
        {!props.hide_info && (
          <>
            <span className="pt-1 text-center font-smaller font-color-h">
              #{props.token_id}
            </span>
            <span>{getTokenName(props.collection, props.token_id, name)}</span>
          </>
        )}
      </span>
    );
  }

  function getContent() {
    if (props.show_animation && onChainData) {
      return (
        <iframe
          style={{
            width: "100%",
            height: "80vh",
          }}
          srcDoc={onChainData.uri}
          title={`NextGen Token ${props.token_id}`}
        />
      );
    } else if (props.show_animation && animationUrl) {
      return (
        <>
          <iframe
            style={{
              width: "100%",
              height: "80vh",
              visibility: animationLoaded ? "visible" : "hidden",
              position: animationLoaded ? "static" : "absolute",
            }}
            onLoad={() => {
              setAnimationLoaded(true);
            }}
            src={animationUrl}
            title={`NextGen Token ${props.token_id}`}
          />
          {!animationLoaded && getImage(true)}
        </>
      );
    } else {
      return getImage();
    }
  }

  if (props.hide_link) {
    return <span className="unselectable">{getContent()}</span>;
  } else {
    return (
      <a
        href={`/nextgen/token/${props.token_id}`}
        className="decoration-none scale-hover unselectable">
        {getContent()}
      </a>
    );
  }
}
