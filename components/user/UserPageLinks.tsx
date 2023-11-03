import { Col } from "react-bootstrap";
import styles from "./UserPage.module.scss";
import Tippy from "@tippyjs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useState } from "react";
import { IProfileAndConsolidations } from "../../entities/IProfile";

export default function UserPageLinks({
  user,
  userAddress,
  activeAddress,
  profile,
}: {
  user: string;
  userAddress: string;
  activeAddress: string | null;
  profile: IProfileAndConsolidations;
}) {
  const [ownerLinkCopied, setIsOwnerLinkCopied] = useState(false);
  const copyOwnerLink = () => {
    if (!navigator.clipboard) {
      return;
    }
    if (ownerLinkCopied) {
      return;
    }
    let oLink = process.env.BASE_ENDPOINT
      ? process.env.BASE_ENDPOINT
      : "https://seize.io";

    if (profile.profile?.handle) {
      oLink += `/${profile.profile.handle}`;
    } else {
      oLink += `/${user}`;
    }

    if (activeAddress) {
      const activeAddressEns = profile.consolidation.wallets.find(
        (w) => w.wallet.address.toLowerCase() === activeAddress.toLowerCase()
      )?.wallet.ens;
      oLink += `?address=${activeAddressEns ?? activeAddress}`;
    }
    navigator.clipboard.writeText(oLink);
    setIsOwnerLinkCopied(true);
    setTimeout(() => {
      setIsOwnerLinkCopied(false);
    }, 1000);
  };

  return (
    <Col xs={12} sm={6} className={`pt-2 pb-2 ${styles.linksContainer}`}>
      <Tippy
        content={ownerLinkCopied ? "Copied" : "Copy"}
        placement={"top"}
        theme={"light"}
        hideOnClick={false}
      >
        <span className="cursor-pointer" onClick={copyOwnerLink}>
          <FontAwesomeIcon
            icon="link"
            height={40}
            className={styles.marketplace}
          />
        </span>
      </Tippy>
      <Tippy
        content="Open"
        placement={"top"}
        theme={"light"}
        hideOnClick={false}
      >
        <a
          href={`https://opensea.io/${userAddress}`}
          target="_blank"
          rel="noreferrer"
        >
          <Image
            className={styles.marketplace}
            src="/opensea.png"
            alt="opensea"
            width={40}
            height={40}
          />
        </a>
      </Tippy>
      <Tippy
        content="Open"
        placement={"top"}
        theme={"light"}
        hideOnClick={false}
      >
        <a
          href={`https://x2y2.io/user/${userAddress}`}
          target="_blank"
          rel="noreferrer"
        >
          <Image
            className={styles.marketplace}
            src="/x2y2.png"
            alt="x2y2"
            width={40}
            height={40}
          />
        </a>
      </Tippy>
      {profile.profile?.website && (
        <Tippy
          content="Open"
          placement={"top"}
          theme={"light"}
          hideOnClick={false}
        >
          <a href={profile.profile.website} target="_blank" rel="noreferrer">
            <FontAwesomeIcon icon="globe" className={styles.marketplace} />
          </a>
        </Tippy>
      )}
    </Col>
  );
}
